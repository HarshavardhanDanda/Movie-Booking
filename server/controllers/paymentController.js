const payments = require('../services/paymentService')
const { endpoint } = require('../services/errors')

exports.order = endpoint(async (req, res) => {
	res.json({ success: true, data: await payments.createOrder(req.body.bookingId, req.user._id) })
})
exports.verify = endpoint(async (req, res) => {
	res.json({ success: true, data: await payments.verify(req.user._id, req.body) })
})
