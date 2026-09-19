const Movie = require('../models/Movie')
const Showtime = require('../models/Showtime')
const Screen = require('../models/Screen')
const catalog = require('../services/catalogService')
const { endpoint } = require('../services/errors')

//@desc     GET showtimes
//@route    GET /showtime
//@access   Public
exports.getShowtimes = async (req, res, next) => {
	try {
		const showtimes = await Showtime.find({ isRelease: true })
			.populate([
				'movie',
				{ path: 'screen', populate: { path: 'theatre', select: 'name' }, select: 'number theatre seatPlan' }
			])
			.select('-seats.user -seats.row -seats.number')

		res.status(200).json({ success: true, count: showtimes.length, data: showtimes })
	} catch (err) {
		console.log(err)
		res.status(400).json({ success: false, message: err })
	}
}

//@desc     GET showtimes with all unreleased showtime
//@route    GET /showtime/unreleased
//@access   Private admin
exports.getUnreleasedShowtimes = async (req, res, next) => {
	try {
		const showtimes = await Showtime.find()
			.populate([
				'movie',
				{ path: 'screen', populate: { path: 'theatre', select: 'name' }, select: 'number theatre seatPlan' }
			])
			.select('-seats.user -seats.row -seats.number')

		res.status(200).json({ success: true, count: showtimes.length, data: showtimes })
	} catch (err) {
		console.log(err)
		res.status(400).json({ success: false, message: err })
	}
}

//@desc     GET single showtime
//@route    GET /showtime/:id
//@access   Public
exports.getShowtime = async (req, res, next) => {
	try {
		const showtime = await Showtime.findById(req.params.id)
			.populate([
				'movie',
				{ path: 'screen', populate: { path: 'theatre', select: 'name' }, select: 'number theatre seatPlan' }
			])
			.select('-seats.user +holds')

		if (!showtime) {
			return res
				.status(400)
				.json({ success: false, message: `Showtime not found with id of ${req.params.id}` })
		}

		if (!showtime.isRelease) {
			return res.status(400).json({ success: false, message: `Showtime is not released` })
		}

		const data = showtime.toObject()
		const now = new Date()
		// Confirmed seats and unexpired holds are unavailable to select.
		data.unavailableSeats = [...new Set([
			...showtime.seats.map((seat) => `${seat.row}${seat.number}`),
			...(showtime.holds || []).filter((hold) => hold.expiresAt > now).flatMap((hold) => hold.seats)
		])]
		// Only seat names are public; keep booking hold details private.
		delete data.holds
		res.status(200).json({ success: true, data })
	} catch (err) {
		console.log(err)
		res.status(400).json({ success: false, message: err })
	}
}

//@desc     GET single showtime with user
//@route    GET /showtime/user/:id
//@access   Private Admin
exports.getShowtimeWithUser = async (req, res, next) => {
	try {
		const showtime = await Showtime.findById(req.params.id).populate([
			'movie',
			{ path: 'screen', populate: { path: 'theatre', select: 'name' }, select: 'number theatre seatPlan' },
			{ path: 'seats', populate: { path: 'user', select: 'username email role' } }
		])

		if (!showtime) {
			return res
				.status(400)
				.json({ success: false, message: `Showtime not found with id of ${req.params.id}` })
		}

		res.status(200).json({ success: true, data: showtime })
	} catch (err) {
		console.log(err)
		res.status(400).json({ success: false, message: err })
	}
}

//@desc     Add Showtime
//@route    POST /showtime
//@access   Private
exports.addShowtime = async (req, res, next) => {
	try {
		const {
			movie: movieId,
			showtime: showtimeString,
			screen: screenId,
			repeat = 1,
			isRelease,
			ticketPrice
		} = req.body

		if (!Number.isInteger(repeat) || repeat > 31 || repeat < 1) {
			return res.status(400).json({ success: false, message: `Repeat is not a valid number between 1 to 31` })
		}

		if (ticketPrice !== undefined && (!Number.isSafeInteger(ticketPrice) || ticketPrice < 1)) {
			return res.status(400).json({ success: false, message: 'Ticket price must be positive integer paise' })
		}
		let showtime = new Date(showtimeString)
		if (!Number.isFinite(showtime.getTime()) || showtime <= new Date()) {
			return res.status(400).json({ success: false, message: 'Choose a future showtime' })
		}
		let showtimes = []
		let showtimeIds = []

		const screen = await Screen.findById(screenId)

		if (!screen) {
			return res.status(400).json({ success: false, message: `Screen not found with id of ${req.params.id}` })
		}

		const movie = await Movie.findById(movieId)

		if (!movie) {
			return res.status(400).json({ success: false, message: `Movie not found with id of ${movieId}` })
		}

		for (let i = 0; i < repeat; i++) {
			const showtimeDoc = await Showtime.create({
				screen,
				movie: movie._id,
				showtime,
				isRelease,
				ticketPrice
			})

			showtimeIds.push(showtimeDoc._id)
			showtimes.push(new Date(showtime))
			showtime.setDate(showtime.getDate() + 1)
		}
		screen.showtimes = screen.showtimes.concat(showtimeIds)

		await screen.save()

		res.status(200).json({
			success: true,
			showtimes: showtimes
		})
	} catch (err) {
		console.log(err)
		res.status(400).json({ success: false, message: err })
	}
}

// The old endpoint must not allow tickets to be issued without payment.
exports.purchase = (req, res) =>
	res.status(410).json({
		success: false,
		message: 'Use /bookings and /payments to complete checkout'
	})
//@desc     Update showtime
//@route    PUT /showtime/:id
//@access   Private Admin
exports.updateShowtime = endpoint(async (req, res) => {
	res.json({ success: true, data: await catalog.updateShowtime(req.params.id, req.body) })
})

exports.deleteShowtime = endpoint(async (req, res) => {
	const count = await catalog.remove('showtime', [req.params.id])
	res.json({ success: true, count })
})

exports.deleteShowtimes = endpoint(async (req, res) => {
	const ids = req.body.ids || (await Showtime.find({}, '_id')).map((doc) => doc._id)
	if (!Array.isArray(ids)) return res.status(400).json({ success: false, message: 'ids must be an array' })
	res.json({ success: true, count: await catalog.remove('showtime', ids) })
})

exports.deletePreviousShowtime = endpoint(async (req, res) => {
	const today = new Date()
	today.setHours(0, 0, 0, 0)
	const docs = await Showtime.find({ showtime: { $lt: today } }, '_id')
	res.json({
		success: true,
		count: await catalog.remove(
			'showtime',
			docs.map((doc) => doc._id)
		)
	})
})
