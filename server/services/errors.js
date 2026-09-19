const mongoose = require('mongoose')

function fail(status, message) {
	const error = new Error(message)
	error.status = status
	throw error
}

function objectId(value) {
	if (typeof value !== 'string' || !/^[a-f\d]{24}$/i.test(value)) fail(400, 'Invalid ID')
	return new mongoose.Types.ObjectId(value)
}

// Controllers return useful errors without leaking credentials or database details.
const endpoint = (handler) => async (req, res) => {
	try {
		await handler(req, res)
	} catch (error) {
		const status =
			error.status ||
			(error.code === 11000
				? 409
				: error.name === 'ValidationError' || error.name === 'CastError'
				? 400
				: 500)
		if (status >= 500) console.error('Booking/payment request failed:', error.name)
		res
			.status(status)
			.json({
				success: false,
				message:
					error.code === 11000
						? 'This request is already being processed; please retry'
						: status >= 500
						? 'Unable to complete the request. Please try again.'
						: error.message
			})
	}
}

module.exports = { fail, objectId, endpoint }
