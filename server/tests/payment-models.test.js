const { test } = require('node:test')
const assert = require('node:assert/strict')
const mongoose = require('mongoose')
const Booking = require('../models/Booking')
const Payment = require('../models/Payment')
const Showtime = require('../models/Showtime')

function booking(overrides = {}) {
	return new Booking({
		user: new mongoose.Types.ObjectId(),
		showtime: new mongoose.Types.ObjectId(),
		snapshot: { movieName: 'Movie', theatreName: 'Theatre', screenNumber: 1, startsAt: new Date() },
		seats: ['A1', 'A2'],
		unitPrice: 15000,
		totalAmount: 30000,
		...overrides
	})
}

test('booking stores price and ticket snapshot with a five-minute expiry', async () => {
	const start = Date.now()
	const doc = booking()
	await doc.validate()
	assert.equal(doc.status, 'pending')
	assert.equal(doc.currency, 'INR')
	assert.ok(doc.reference)
	assert.ok(doc.expiresAt.getTime() >= start + 300000)
	assert.ok(doc.expiresAt.getTime() <= Date.now() + 300000)
	assert.equal(doc.snapshot.movieName, 'Movie')
})

test('booking rejects empty, duplicate, malformed seats and inconsistent pricing', async () => {
	for (const overrides of [
		{ seats: [] },
		{ seats: null },
		{ seats: ['A1', 'A1'] },
		{ seats: ['A0', 'A2'] },
		{ unitPrice: 1.5, totalAmount: 3 },
		{ totalAmount: 15000 },
		{ snapshot: {} },
		{ currency: 'USD' }
	]) {
		await assert.rejects(booking(overrides).validate(), { name: 'ValidationError' })
	}
})

test('showtimes may remain unpriced but configured prices must be positive integer paise', async () => {
	assert.equal(new Showtime().ticketPrice, null)
	await new Showtime({ ticketPrice: 15000 }).validate()
	for (const ticketPrice of [0, -1, 1.5, Number.MAX_SAFE_INTEGER + 1]) {
		await assert.rejects(new Showtime({ ticketPrice }).validate(), { name: 'ValidationError' })
	}
})

test('payments store verified IDs and reject invalid amounts', async () => {
	const data = {
		booking: new mongoose.Types.ObjectId(),
		amount: 15000,
		razorpayOrderId: 'order_test',
		razorpayPaymentId: 'pay_test'
	}
	await new Payment(data).validate()
	for (const amount of [-1, 1.5]) {
		await assert.rejects(new Payment({ ...data, amount }).validate(), { name: 'ValidationError' })
	}
	assert.equal(Payment.schema.path('refundStatus'), undefined)
})
