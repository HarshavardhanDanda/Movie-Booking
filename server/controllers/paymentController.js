const payments = require('../services/paymentService')
const email = require('../services/emailService')
const Booking = require('../models/Booking')
const { endpoint } = require('../services/errors')

exports.order = endpoint(async (req, res) => {
	res.json({ success: true, data: await payments.createOrder(req.body.bookingId, req.user._id) })
})
exports.verify = endpoint(async (req, res) => {
	const result = await payments.verify(req.user._id, req.body)
	if (result.booking.status === 'confirmed') {
		try {
			await email.sendConfirmation(result.booking._id)
			result.booking = await Booking.findById(result.booking._id) || result.booking
		} catch {
			// Payment confirmation still succeeds if email or its status update fails.
			console.error('Unable to update confirmation email status')
		}
	}
	res.json({ success: true, data: result })
})
