const { test } = require('node:test')
const assert = require('node:assert/strict')
const nodemailer = require('nodemailer')
const Booking = require('../models/Booking')
const User = require('../models/User')
const email = require('../services/emailService')

test('confirmation email sends once and preserves booking on SMTP failure', async (t) => {
  Object.assign(process.env, { SMTP_HOST: 'smtp.example.com', SMTP_PORT: '587', SMTP_USER: 'sender', SMTP_PASS: 'test', MAIL_FROM: 'Movie Booking <sender@example.com>' })
  const booking = { user: 'user', status: 'confirmed', confirmationEmailStatus: 'pending', snapshot: { movieName: 'Example', theatreName: 'Theatre', screenNumber: 1, startsAt: new Date('2030-01-01T12:00:00Z') }, seats: ['A1'], totalAmount: 15000, reference: 'reference' }
  t.mock.method(Booking, 'findOneAndUpdate', async (filter) => {
    assert.equal(filter.status, 'confirmed')
    if (filter.confirmationEmailStatus.$nin.includes(booking.confirmationEmailStatus)) return null
    booking.confirmationEmailStatus = 'sending'
    return booking
  })
  t.mock.method(Booking, 'updateOne', async (_, update) => Object.assign(booking, update.$set))
  t.mock.method(User, 'findById', async () => ({ email: 'recipient@example.com' }))
  let sends = 0
  let fail = false
  t.mock.method(nodemailer, 'createTransport', (options) => {
    assert.equal(options.requireTLS, true)
    return { sendMail: async (message) => {
      sends++
      if (fail) throw new Error('SMTP failure')
      assert.equal(message.to, 'recipient@example.com')
      assert.match(message.text, /Seats: A1/)
      assert.match(message.text, /INR 150.00/)
      assert.match(message.text, /IST/)
      return { accepted: ['recipient@example.com'] }
    } }
  })
  await Promise.all([email.sendConfirmation('booking'), email.sendConfirmation('booking')])
  assert.equal(sends, 1)
  assert.equal(booking.confirmationEmailStatus, 'sent')
  assert.ok(booking.confirmationEmailSentAt)
  booking.confirmationEmailStatus = 'pending'
  fail = true
  await email.sendConfirmation('booking')
  assert.equal(booking.confirmationEmailStatus, 'failed')
  assert.equal(booking.status, 'confirmed')
})
