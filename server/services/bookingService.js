const mongoose = require('mongoose')
const Booking = require('../models/Booking')
const Showtime = require('../models/Showtime')
const { fail, objectId } = require('./errors')

function seatParts(seat) {
	const match = typeof seat === 'string' && /^([A-Z]{1,2})([1-9]\d*)$/.exec(seat)
	if (!match || !Number.isSafeInteger(Number(match[2]))) fail(400, 'Invalid seat')
	return { row: match[1], number: Number(match[2]) }
}

function rowNumber(row) {
	return [...row].reduce((value, letter) => value * 26 + letter.charCodeAt(0) - 64, 0)
}

function validateSeats(seats, plan) {
	if (!Array.isArray(seats) || !seats.length || seats.length > 10 || new Set(seats).size !== seats.length) {
		fail(400, 'Choose between 1 and 10 different seats')
	}
	for (const seat of seats) {
		const { row, number } = seatParts(seat)
		if (rowNumber(row) > rowNumber(plan.row) || number > plan.column)
			fail(400, 'Seat is outside the screen layout')
	}
}

// Checking availability and writing the hold use the same database operation.
// A second customer cannot pass this condition once the first hold is written.
function availableFilter(showtimeId, seats, now, ownBooking) {
	const conflicts = seats.map((seat) => ({ seats: { $elemMatch: seatParts(seat) } }))
	const hold = { seats: { $in: seats }, expiresAt: { $gt: now } }
	if (ownBooking) hold.booking = { $ne: ownBooking }
	conflicts.push({ holds: { $elemMatch: hold } })
	return { _id: showtimeId, isRelease: true, showtime: { $gt: now }, $nor: conflicts }
}

async function owned(id, userId) {
	const booking = await Booking.findOne({ _id: objectId(id), user: userId })
	if (!booking) fail(404, 'Booking not found')
	return booking
}

async function create(userId, input, requestKey) {
	const showtimeId = objectId(input.showtime)
	if (typeof requestKey !== 'string' || !/^[\w-]{8,100}$/.test(requestKey))
		fail(400, 'Send an Idempotency-Key header (8–100 letters, numbers, underscores or hyphens)')
	if (!Array.isArray(input.seats)) fail(400, 'Seats are required')
	const seats = [...input.seats].sort()
	const replay = async () => {
		const existing = await Booking.findOne({ user: userId, requestKey })
		if (
			existing &&
			(String(existing.showtime) !== String(showtimeId) ||
				JSON.stringify(existing.seats) !== JSON.stringify(seats))
		) {
			fail(409, 'This request key was already used for a different booking')
		}
		return existing
	}
	const existing = await replay()
	if (existing) return existing
	try {
		let created
		await mongoose.connection.transaction(async (session) => {
			const showtime = await Showtime.findById(showtimeId)
				.session(session)
				.populate(['movie', { path: 'screen', populate: { path: 'theatre' } }])
			const now = new Date()
			if (!showtime?.movie || !showtime.screen?.theatre || !showtime.isRelease || !(showtime.showtime > now))
				fail(409, 'This showtime is not bookable')
			if (!Number.isSafeInteger(showtime.ticketPrice) || showtime.ticketPrice < 1)
				fail(409, 'Ticket price has not been configured')
			validateSeats(seats, showtime.screen.seatPlan)
			const booking = new Booking({
				user: userId,
				showtime: showtimeId,
				requestKey,
				seats,
				unitPrice: showtime.ticketPrice,
				totalAmount: showtime.ticketPrice * seats.length,
				expiresAt: new Date(Math.min(now.getTime() + 300000, showtime.showtime.getTime())),
				snapshot: {
					movieName: showtime.movie.name,
					movieLength: showtime.movie.length,
					movieImage: showtime.movie.img,
					theatreName: showtime.screen.theatre.name,
					screenNumber: showtime.screen.number,
					startsAt: showtime.showtime
				}
			})
			const held = await Showtime.updateOne(
				availableFilter(showtimeId, seats, now),
				{
					$push: { holds: { booking: booking._id, seats, expiresAt: booking.expiresAt } }
				},
				{ session }
			)
			if (!held.modifiedCount) fail(409, 'Some seats are already booked or held')
			await booking.save({ session })
			created = booking
		})
		return created
	} catch (error) {
		// A simultaneous retry may win the unique request-key index.
		if (error.code === 11000) {
			const booking = await replay()
			if (booking) return booking
		}
		throw error
	}
}

async function expire() {
	const now = new Date()
	await Booking.updateMany({ status: 'pending', expiresAt: { $lte: now } }, { $set: { status: 'expired' } })
	await Showtime.updateMany(
		{ 'holds.expiresAt': { $lte: now } },
		{ $pull: { holds: { expiresAt: { $lte: now } } } }
	)
}

async function cancel(id, userId) {
	let booking
	// Cancel the booking and release its holds together, without removing paid seats.
	await mongoose.connection.transaction(async (session) => {
		booking = await Booking.findOne({ _id: objectId(id), user: userId }).session(session)
		if (!booking) fail(404, 'Booking not found')
		if (booking.status === 'confirmed') fail(409, 'Confirmed bookings cannot be cancelled')
		if (booking.status !== 'cancelled') {
			booking.status = 'cancelled'
			booking.cancelledAt = new Date()
			await booking.save({ session })
		}
		await Showtime.updateOne(
			{ _id: booking.showtime },
			{ $pull: { holds: { booking: booking._id } } },
			{ session }
		)
	})
	return booking
}

module.exports = { create, owned, expire, cancel, validateSeats, seatParts, availableFilter }
