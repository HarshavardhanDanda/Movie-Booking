const catalog = require('../services/catalogService')
const { endpoint } = require('../services/errors')
const Theatre = require('../models/Theatre')
const Screen = require('../models/Screen')

//@desc     GET all screens
//@route    GET /screen
//@access   Public
exports.getScreens = async (req, res, next) => {
	try {
		const screens = await Screen.find()
			.populate([
				{ path: 'showtimes', select: 'movie showtime isRelease ticketPrice currency' },
				{ path: 'theatre', select: 'name' }
			])
			.then((screens) => {
				screens.forEach((screen) => {
					screen.showtimes = screen.showtimes.filter((showtime) => showtime.isRelease)
				})
				return screens
			})

		res.status(200).json({ success: true, count: screens.length, data: screens })
	} catch (err) {
		res.status(400).json({ success: false, message: err })
	}
}

//@desc     GET single screen
//@route    GET /screen/:id
//@access   Public
exports.getScreen = async (req, res, next) => {
	try {
		const screen = await Screen.findById(req.params.id)
			.populate([
				{ path: 'showtimes', select: 'movie showtime isRelease ticketPrice currency' },
				{ path: 'theatre', select: 'name' }
			])
			.then((screen) => {
				screen.showtimes = screen.showtimes.filter((showtime) => showtime.isRelease)
				return screen
			})

		if (!screen) {
			return res.status(400).json({ success: false, message: `Screen not found with id of ${req.params.id}` })
		}

		res.status(200).json({ success: true, data: screen })
	} catch (err) {
		res.status(400).json({ success: false, message: err })
	}
}

//@desc     GET single screen with all unreleased showtime
//@route    GET /screen/unreleased/:id
//@access   Private admin
exports.getUnreleasedScreen = async (req, res, next) => {
	try {
		const screen = await Screen.findById(req.params.id).populate([
			{ path: 'showtimes', select: 'movie showtime isRelease ticketPrice currency' },
			{ path: 'theatre', select: 'name' }
		])

		if (!screen) {
			return res.status(400).json({ success: false, message: `Screen not found with id of ${req.params.id}` })
		}

		res.status(200).json({ success: true, data: screen })
	} catch (err) {
		res.status(400).json({ success: false, message: err })
	}
}

//@desc     GET screens by movie and date
//@route    GET /screen/movie/:mid/:date/:timezone
//@access   Public
exports.getScreenByMovie = async (req, res, next) => {
	try {
		const { mid, date, timezone } = req.params
		let screens = await Screen.find()
			.populate([
				{
					path: 'showtimes',
					populate: { path: 'movie', select: 'name _id' },
					select: 'movie showtime isRelease ticketPrice currency'
				},
				{ path: 'theatre', select: 'name' }
			])
			.then((screens) => {
				screens.forEach((screen) => {
					screen.showtimes = screen.showtimes.filter((showtime) => showtime.isRelease)
				})
				return screens
			})

		screens = screens.filter((screen) => {
			return screen.showtimes.some((showtime) => {
				const d1 = new Date(showtime.showtime)
				const d2 = new Date(date)
				d1.setTime(d1.getTime() - timezone * 60 * 1000)
				d2.setTime(d2.getTime() - timezone * 60 * 1000)
				return (
					showtime.movie._id.equals(mid) &&
					d1.getUTCFullYear() === d2.getUTCFullYear() &&
					d1.getUTCMonth() === d2.getUTCMonth() &&
					d1.getUTCDate() === d2.getUTCDate()
				)
			})
		})
		res.status(200).json({ success: true, data: screens })
	} catch (err) {
		console.log(err)
		res.status(400).json({ success: false, message: err })
	}
}

//@desc     GET screens by movie and date with all unreleased showtime
//@route    GET /screen/movie/unreleased/:mid/:date/:timezone
//@access   Private admin
exports.getUnreleasedScreenByMovie = async (req, res, next) => {
	try {
		const { mid, date, timezone } = req.params
		let screens = await Screen.find().populate([
			{
				path: 'showtimes',
				populate: { path: 'movie', select: 'name _id' },
				select: 'movie showtime isRelease ticketPrice currency'
			},
			{ path: 'theatre', select: 'name' }
		])

		screens = screens.filter((screen) => {
			return screen.showtimes.some((showtime) => {
				const d1 = new Date(showtime.showtime)
				const d2 = new Date(date)
				d1.setTime(d1.getTime() - timezone * 60 * 1000)
				d2.setTime(d2.getTime() - timezone * 60 * 1000)
				return (
					showtime.movie._id.equals(mid) &&
					d1.getUTCFullYear() === d2.getUTCFullYear() &&
					d1.getUTCMonth() === d2.getUTCMonth() &&
					d1.getUTCDate() === d2.getUTCDate()
				)
			})
		})
		res.status(200).json({ success: true, data: screens })
	} catch (err) {
		console.log(err)
		res.status(400).json({ success: false, message: err })
	}
}

//@desc     Create screen
//@route    POST /screen
//@access   Private
exports.createScreen = async (req, res, next) => {
	try {
		const { theatre: theatreId, row, column } = req.body
		const rowRegex = /^([A-D][A-Z]|[A-Z])$/
		if (!rowRegex.test(row)) {
			return res.status(400).json({ success: false, message: `Row is not a valid letter between A to CZ` })
		}

		if (column < 1 || column > 120) {
			return res.status(400).json({ success: false, message: `Column is not a valid number between 1 to 250` })
		}

		const theatre = await Theatre.findById(theatreId)

		if (!theatre) {
			return res.status(400).json({ success: false, message: `Theatre not found with id of ${theatreId}` })
		}

		const screen = await Screen.create({ theatre, number: theatre.screens.length + 1, seatPlan: { row, column } })

		theatre.screens.push(screen._id)

		await theatre.save()

		res.status(201).json({
			success: true,
			data: screen
		})
	} catch (err) {
		res.status(400).json({ success: false, message: err })
	}
}

//@desc     Update screens
//@route    PUT /screen/:id
//@access   Private Admin
exports.updateScreen = async (req, res, next) => {
	try {
		const screen = await Screen.findOneAndUpdate({ _id: req.params.id }, catalog.pick(req.body, ['number', 'seatPlan']), {
			new: true,
			runValidators: true
		})

		if (!screen) {
			return res.status(400).json({ success: false, message: `Screen not found with id of ${req.params.id}` })
		}
		res.status(200).json({ success: true, data: screen })
	} catch (err) {
		res.status(400).json({ success: false, message: err })
	}
}

//@desc     Delete single screens
//@route    DELETE /screen/:id
//@access   Private Admin
exports.deleteScreen = endpoint(async (req, res) => {
  res.json({ success: true, count: await catalog.remove('screen', [req.params.id]) })
})
