const { test } = require('node:test')
const assert = require('node:assert/strict')
const crypto = require('node:crypto')
const mongoose = require('mongoose')
const { MongoMemoryReplSet } = require('mongodb-memory-server')
const Booking = require('../models/Booking')
const Payment = require('../models/Payment')
const Theatre = require('../models/Theatre')
const Screen = require('../models/Screen')
const Movie = require('../models/Movie')
const Showtime = require('../models/Showtime')
const bookings = require('../services/bookingService')
const payments = require('../services/paymentService')
const gateway = require('../services/razorpayService')

test('simple checkout: prices, seat conflicts and payment verification', { timeout: 120000 }, async (t) => {
	process.env.RAZORPAY_KEY_ID = 'rzp_test_example'
	process.env.RAZORPAY_KEY_SECRET = 'test-secret'
	const replica = await MongoMemoryReplSet.create({ replSet: { count: 1 }, binary: { version: '7.0.14' } })
	t.after(async () => {
		await mongoose.disconnect()
		await replica.stop()
	})
	await mongoose.connect(replica.getUri())
	await Promise.all([Booking.init(), Payment.init()])
	const theatre = await Theatre.create({ name: 'Test Theatre' })
	const screen = await Screen.create({ theatre: theatre._id, number: 1, seatPlan: { row: 'C', column: 10 } })
	const movie = await Movie.create({ name: 'Test Movie', length: 120, img: 'poster.jpg' })
	const showtime = await Showtime.create({
		screen: screen._id,
		movie: movie._id,
		ticketPrice: 15000,
		isRelease: true,
		showtime: new Date(Date.now() + 86400000)
	})
	const user = new mongoose.Types.ObjectId()
	const booking = await bookings.create(
		user,
		{ showtime: showtime.id, seats: ['A1'], totalAmount: 1 },
		crypto.randomUUID()
	)
	assert.equal(booking.totalAmount, 15000)
	await assert.rejects(bookings.create(user, { showtime: showtime.id, seats: ['A1'] }, crypto.randomUUID()), {
		status: 409
	})
	await assert.rejects(bookings.owned(booking.id, new mongoose.Types.ObjectId()), { status: 404 })
	t.mock.method(gateway, 'createOrder', async () => ({ id: 'order_example' }))
	const order = await payments.createOrder(booking.id, user)
	assert.equal(order.amount, 15000)
	assert.equal((await payments.createOrder(booking.id, user)).orderId, order.orderId)
	const input = {
		bookingId: booking.id,
		razorpay_order_id: order.orderId,
		razorpay_payment_id: 'pay_example',
		razorpay_signature: 'bad'
	}
	await assert.rejects(payments.verify(user, input), { status: 400 })
	input.razorpay_signature = crypto
		.createHmac('sha256', 'test-secret')
		.update(order.orderId + '|pay_example')
		.digest('hex')
	const remote = {
		id: 'pay_example',
		order_id: order.orderId,
		amount: 1,
		currency: 'INR',
		status: 'captured',
		amount_refunded: 0
	}
	t.mock.method(gateway, 'fetchPayment', async () => remote)
	await assert.rejects(payments.verify(user, input), { status: 409 })
	remote.amount = 15000
	remote.status = 'authorized'
	await assert.rejects(payments.verify(user, input), { status: 409 })
	remote.status = 'captured'
	assert.equal((await payments.verify(user, input)).booking.status, 'confirmed')
	assert.equal((await payments.verify(user, input)).booking.status, 'confirmed')
	assert.equal(await Payment.countDocuments(), 1)
	assert.equal((await Showtime.findById(showtime.id)).seats.length, 1)
	assert.equal(typeof payments.reconcile, 'undefined')
	assert.equal(typeof gateway.refund, 'undefined')
})
