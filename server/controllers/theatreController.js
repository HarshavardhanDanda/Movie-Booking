const Theatre = require('../models/Theatre')

//@desc     GET all theatres
//@route    GET /theatre
//@access   Public
exports.getTheatres = async (req, res, next) => {
	try {
		const theatres = await Theatre.find()
			.populate({
				path: 'screens',
				populate: {
					path: 'showtimes',
					populate: { path: 'movie', select: 'name length' },
					select: 'movie showtime isRelease'
				},
				select: 'number seatPlan showtimes'
			})
			.collation({ locale: 'en', strength: 2 })
			.sort({ name: 1 })
			.then((theatres) => {
				theatres.forEach((theatre) => {
					theatre.screens.forEach((screen) => {
						screen.showtimes = screen.showtimes.filter((showtime) => showtime.isRelease)
					})
				})
				return theatres
			})

		res.status(200).json({ success: true, count: theatres.length, data: theatres })
	} catch (err) {
		res.status(400).json({ success: false, message: err })
	}
}

//@desc     GET all theatres with all unreleased showtime
//@route    GET /theatre/unreleased
//@access   Private admin
exports.getUnreleasedTheatres = async (req, res, next) => {
	try {
		const theatres = await Theatre.find()
			.populate({
				path: 'screens',
				populate: {
					path: 'showtimes',
					populate: { path: 'movie', select: 'name length' },
					select: 'movie showtime isRelease'
				},
				select: 'number seatPlan showtimes'
			})
			.collation({ locale: 'en', strength: 2 })
			.sort({ name: 1 })

		res.status(200).json({ success: true, count: theatres.length, data: theatres })
	} catch (err) {
		res.status(400).json({ success: false, message: err })
	}
}

//@desc     GET single theatre
//@route    GET /theatre/:id
//@access   Public
exports.getTheatre = async (req, res, next) => {
	try {
		const theatre = await Theatre.findById(req.params.id)
			.populate({
				path: 'screens',
				populate: {
					path: 'showtimes',
					populate: { path: 'movie', select: 'name length' },
					select: 'movie showtime isRelease'
				},
				select: 'number seatPlan showtimes'
			})
			.then((theatres) => {
				theatres.forEach((theatre) => {
					theatre.screens.forEach((screen) => {
						screen.showtimes = screen.showtimes.filter((showtime) => showtime.isRelease)
					})
				})
				return theatres
			})

		if (!theatre) {
			return res.status(400).json({ success: false, message: `Theatre not found with id of ${req.params.id}` })
		}

		res.status(200).json({ success: true, data: theatre })
	} catch (err) {
		res.status(400).json({ success: false, message: err })
	}
}

//@desc     Create theatre
//@route    POST /theatre
//@access   Private
exports.createTheatre = async (req, res, next) => {
	try {
		const theatre = await Theatre.create(req.body)
		res.status(201).json({
			success: true,
			data: theatre
		})
	} catch (err) {
		res.status(400).json({ success: false, message: err })
	}
}

//@desc     Update theatres
//@route    PUT /theatre/:id
//@access   Private Admin
exports.updateTheatre = async (req, res, next) => {
	try {
		const theatre = await Theatre.findByIdAndUpdate(req.params.id, req.body, {
			new: true,
			runValidators: true
		})

		if (!theatre) {
			return res.status(400).json({ success: false, message: `Theatre not found with id of ${req.params.id}` })
		}
		res.status(200).json({ success: true, data: theatre })
	} catch (err) {
		res.status(400).json({ success: false, message: err })
	}
}

//@desc     Delete single theatre
//@route    DELETE /theatre/:id
//@access   Private Admin
exports.deleteTheatre = async (req, res, next) => {
	try {
		const theatre = await Theatre.findById(req.params.id)

		if (!theatre) {
			return res.status(400).json({ success: false, message: `Theatre not found with id of ${req.params.id}` })
		}

		await theatre.deleteOne()

		res.status(200).json({ success: true })
	} catch (err) {
		console.log(err)
		res.status(400).json({ success: false, message: err })
	}
}
