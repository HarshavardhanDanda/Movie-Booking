const nodemailer = require('nodemailer')
const Booking = require('../models/Booking')
const User = require('../models/User')

function confirmationText(booking) {
  const details = booking.snapshot
  const date = new Date(details.startsAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'full', timeStyle: 'short' })
  return [
    'Movie Booking - Booking confirmed',
    '',
    `Movie: ${details.movieName}`,
    `Theatre: ${details.theatreName}`,
    `Screen: ${details.screenNumber}`,
    `Showtime: ${date} (IST)`,
    `Seats: ${booking.seats.join(', ')}`,
    `Amount paid: INR ${(booking.totalAmount / 100).toFixed(2)}`,
    `Booking reference: ${booking.reference}`,
    '',
    'Your tickets are also available on the My Tickets page.'
  ].join('\n')
}

async function sendConfirmation(id) {
  // Claim once so simultaneous verification requests do not both send an email.
  const booking = await Booking.findOneAndUpdate(
    { _id: id, status: 'confirmed', confirmationEmailStatus: { $nin: ['sending', 'sent'] } },
    { $set: { confirmationEmailStatus: 'sending' } },
    { new: true }
  )
  if (!booking) return
  try {
    const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, MAIL_FROM } = process.env
    if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS || !MAIL_FROM) throw new Error('Email configuration missing')
    const user = await User.findById(booking.user)
    if (!user?.email) throw new Error('Recipient unavailable')
    const port = Number(SMTP_PORT || 587)
    const transport = nodemailer.createTransport({
      host: SMTP_HOST, port, secure: port === 465,
      requireTLS: port !== 465,
      auth: { user: SMTP_USER, pass: SMTP_PASS },
      connectionTimeout: 10000, greetingTimeout: 10000, socketTimeout: 15000
    })
    const result = await transport.sendMail({
      from: MAIL_FROM,
      to: user.email,
      subject: 'Movie Booking - Booking confirmation',
      text: confirmationText(booking)
    })
    if (!result.accepted?.length) throw new Error('Email not accepted')
  } catch {
    // A mail failure must never cancel a paid booking or expose SMTP credentials.
    await Booking.updateOne({ _id: id }, { $set: { confirmationEmailStatus: 'failed' } })
    return
  }
  await Booking.updateOne({ _id: id }, { $set: { confirmationEmailStatus: 'sent', confirmationEmailSentAt: new Date() } })
}
module.exports = { sendConfirmation, confirmationText }
