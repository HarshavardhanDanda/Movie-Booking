const mongoose = require('mongoose')
const Booking = require('../models/Booking')
const Payment = require('../models/Payment')
const Showtime = require('../models/Showtime')
const bookings = require('./bookingService')
const gateway = require('./razorpayService')
const { fail } = require('./errors')

async function createOrder(id, userId) {
	const { keyId } = gateway.credentials()
	let booking = await bookings.owned(id, userId)
	if (booking.status !== 'pending' || booking.expiresAt <= new Date())
		fail(409, 'Your seat reservation has expired')
	if (!booking.razorpayOrderId) {
		const order = await gateway.createOrder(booking)
		// Only the saved order is sent to Checkout, including on a double click.
		await Booking.updateOne(
			{ _id: booking._id, razorpayOrderId: { $exists: false } },
			{ $set: { razorpayOrderId: order.id } }
		)
		booking = await Booking.findById(booking._id)
	}
	return {
		bookingId: booking._id,
		keyId,
		orderId: booking.razorpayOrderId,
		amount: booking.totalAmount,
		currency: booking.currency,
		expiresAt: booking.expiresAt
	}
}

async function verify(userId, input) {
	const booking = await bookings.owned(input.bookingId, userId)
	if (
		!booking.razorpayOrderId ||
		input.razorpay_order_id !== booking.razorpayOrderId ||
		typeof input.razorpay_payment_id !== 'string' ||
		!/^pay_\w+$/.test(input.razorpay_payment_id)
	)
		fail(400, 'Invalid payment details')
	const { secret } = gateway.credentials()
	if (
		!gateway.validSignature(
			booking.razorpayOrderId + '|' + input.razorpay_payment_id,
			input.razorpay_signature,
			secret
		)
	)
		fail(400, 'Invalid payment signature')

	// The browser response alone is not proof of payment.
	const remote = await gateway.fetchPayment(input.razorpay_payment_id)
	if (
		remote.id !== input.razorpay_payment_id ||
		remote.order_id !== booking.razorpayOrderId ||
		remote.amount !== booking.totalAmount ||
		remote.currency !== booking.currency
	)
		fail(409, 'Payment does not match this booking')
	if (remote.status !== 'captured' || remote.amount_refunded)
		fail(409, 'Payment is not captured yet. Please check again shortly.')

	let result
	await mongoose.connection.transaction(async (session) => {
		const current = await Booking.findById(booking._id).session(session)
		// Repeated verification returns the same ticket instead of booking twice.
		const recordedPayment = await Payment.findOne({ booking: current._id }).session(session)
		if (current.status === 'confirmed' || (current.status === 'cancelled' && recordedPayment)) {
			result = { booking: current, payment: recordedPayment }
			return
		}
		const payment = new Payment({
			booking: current._id,
			razorpayOrderId: remote.order_id,
			razorpayPaymentId: remote.id,
			amount: remote.amount,
			currency: remote.currency,
			status: 'captured',
			verifiedAt: new Date()
		})
		const now = new Date()
		let reserved = false
		if (current.status === 'pending' && current.expiresAt > now) {
			const update = await Showtime.updateOne(
				{
					...bookings.availableFilter(current.showtime, current.seats, now, current._id),
					holds: { $elemMatch: { booking: current._id, expiresAt: { $gt: now } } }
				},
				{
					$push: {
						seats: {
							$each: current.seats.map((seat) => ({
								...bookings.seatParts(seat),
								user: current.user,
								booking: current._id
							}))
						}
					},
					$pull: { holds: { booking: current._id } }
				},
				{ session }
			)
			reserved = !!update.modifiedCount
		}
		current.status = reserved ? 'confirmed' : 'cancelled'
		if (reserved) current.confirmedAt = now
		// Keep the payment record if the reservation expired. Refunds are manual.
		await payment.save({ session })
		await current.save({ session })
		result = { booking: current, payment }
	})
	return result
}

module.exports = { createOrder, verify }
