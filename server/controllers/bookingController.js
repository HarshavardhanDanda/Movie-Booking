const Booking = require('../models/Booking')
const Payment = require('../models/Payment')
const bookings = require('../services/bookingService')
const { endpoint } = require('../services/errors')

exports.create = endpoint(async (req, res) => {
	const booking = await bookings.create(req.user._id, req.body, req.get('Idempotency-Key'))
	res.status(201).json({ success: true, data: booking })
})
exports.get = endpoint(async (req, res) => {
	await bookings.expire()
	const booking = await bookings.owned(req.params.id, req.user._id)
	const payments = await Payment.find({ booking: booking._id }).sort({ createdAt: -1 })
	res.json({ success: true, data: { booking, payments } })
})
exports.my = endpoint(async (req, res) => {
	await bookings.expire()
	const page = Math.max(1, parseInt(req.query.page, 10) || 1)
	const data = await Booking.find({ user: req.user._id })
		.sort({ createdAt: -1 })
		.skip((page - 1) * 20)
		.limit(20)
	res.json({ success: true, data, page })
})
