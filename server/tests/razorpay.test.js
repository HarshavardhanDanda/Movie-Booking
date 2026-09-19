const { test } = require('node:test')
const assert = require('node:assert/strict')
const crypto = require('node:crypto')
const gateway = require('../services/razorpayService')

test('Razorpay REST requests use server credentials, stored amounts', async (t) => {
	process.env.RAZORPAY_KEY_ID = 'rzp_test_example'
	process.env.RAZORPAY_KEY_SECRET = 'test-secret'
	const requests = []
	t.mock.method(global, 'fetch', async (url, options) => {
		requests.push({ url, ...options })
		return { ok: true, json: async () => ({ id: 'test' }) }
	})
	await gateway.createOrder({ _id: 'booking1', reference: 'receipt1', totalAmount: 15000, currency: 'INR' })
	assert.equal(requests[0].url, 'https://api.razorpay.com/v1/orders')
	assert.equal(
		requests[0].headers.Authorization,
		`Basic ${Buffer.from('rzp_test_example:test-secret').toString('base64')}`
	)
	assert.deepEqual(JSON.parse(requests[0].body), {
		amount: 15000,
		currency: 'INR',
		receipt: 'receipt1',
		notes: { bookingId: 'booking1' }
	})
})

test('provider errors do not leak provider response bodies', async (t) => {
	t.mock.method(global, 'fetch', async () => ({ ok: false }))
	await assert.rejects(gateway.fetchPayment('pay_example'), {
		status: 502,
		message: 'Payment provider request failed'
	})
})

test('signature verification rejects malformed signatures and changed bytes', () => {
	const body = Buffer.from('{ "event": "payment.captured" }')
	const secret = 'test-secret'
	const signature = crypto.createHmac('sha256', secret).update(body).digest('hex')
	assert.equal(gateway.validSignature(body, signature, secret), true)
	assert.equal(gateway.validSignature(Buffer.from('{}'), signature, secret), false)
	for (const invalid of [undefined, '', 'not-hex', '0'.repeat(63)]) {
		assert.equal(gateway.validSignature(body, invalid, secret), false)
	}
})
