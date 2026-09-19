const crypto = require('node:crypto')
const { fail } = require('./errors')

function credentials() {
	const keyId = process.env.RAZORPAY_KEY_ID
	const secret = process.env.RAZORPAY_KEY_SECRET
	if (!keyId || !secret) fail(503, 'Payments are not configured')
	return { keyId, secret }
}

function validSignature(body, signature, secret) {
	if (!secret || typeof signature !== 'string' || !/^[a-f\d]{64}$/i.test(signature)) return false
	const expected = crypto.createHmac('sha256', secret).update(body).digest()
	return crypto.timingSafeEqual(expected, Buffer.from(signature, 'hex'))
}

async function request(path, method = 'GET', body, headers = {}) {
	const { keyId, secret } = credentials()
	// Only our fixed Razorpay API host is used. Secrets never go to the browser.
	const response = await fetch(`https://api.razorpay.com/v1${path}`, {
		method,
		signal: AbortSignal.timeout(15000),
		headers: {
			Authorization: `Basic ${Buffer.from(`${keyId}:${secret}`).toString('base64')}`,
			'Content-Type': 'application/json',
			...headers
		},
		body: body === undefined ? undefined : JSON.stringify(body)
	})
	if (!response.ok) fail(502, 'Payment provider request failed')
	return response.json()
}

module.exports = {
	credentials,
	validSignature,
	createOrder: (booking) =>
		request('/orders', 'POST', {
			amount: booking.totalAmount,
			currency: booking.currency,
			receipt: booking.reference,
			notes: { bookingId: String(booking._id) }
		}),
	fetchPayment: (id) => request('/payments/' + encodeURIComponent(id))
}
