const { googleLogin } = require('../services/googleAuthService')
const { endpoint } = require('../services/errors')
const User = require('../models/User')
const Booking = require('../models/Booking')
const { pick } = require('../services/catalogService')

exports.googleLogin = endpoint(async (req, res) => {
	const user = await googleLogin(req.body.credential)
	sendTokenResponse(user, 200, res)
})

//@desc    Register user
//@route   POST /auth/register
//@access  Public
exports.register = async (req, res, next) => {
	try {
		const { username, email, password } = req.body

		//Create user
		const user = await User.create({
			username,
			email,
			password,
			role: 'user'
		})

		sendTokenResponse(user, 200, res)
	} catch (err) {
		res.status(400).json({ success: false, message: err })
	}
}

//@desc		Login user
//@route	POST /auth/login
//@access	Public
exports.login = async (req, res, next) => {
	try {
		const { username, password } = req.body

		//Validate email & password
		if (!username || !password) {
			return res.status(400).json('Please provide an username and password')
		}

		//Check for user
		const user = await User.findOne({ username }).select('+password')

		if (!user) {
			return res.status(400).json('Invalid credentials')
		}

		//Check if password matches
		const isMatch = await user.matchPassword(password)

		if (!isMatch) {
			return res.status(401).json('Invalid credentials')
		}

		sendTokenResponse(user, 200, res)
	} catch (err) {
		res.status(400).json({ success: false, message: err })
	}
}

//Get token from model, create cookie and send response
const sendTokenResponse = (user, statusCode, res) => {
	//Create token
	const token = user.getSignedJwtToken()

	const options = {
		expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000),
		httpOnly: true
	}

	if (process.env.NODE_ENV === 'production') {
		options.secure = true
	}
	res.status(statusCode).cookie('token', token, options).json({
		success: true,
		token,
		user: { username: user.username, email: user.email, role: user.role }
	})
}

//@desc		Get current Logged in user
//@route 	POST /auth/me
//@access	Private
exports.getMe = async (req, res, next) => {
	try {
		const user = await User.findById(req.user.id)
		res.status(200).json({
			success: true,
			data: user
		})
	} catch (err) {
		res.status(400).json({ success: false, message: err })
	}
}

//@desc		Get user's tickets
//@route 	POST /auth/tickets
//@access	Private
exports.getTickets = async (req, res, next) => {
	try {
		// Keep the old response shape until the checkout frontend is updated.
		const bookings = await Booking.find({ user: req.user.id, status: 'confirmed' }).sort({ createdAt: -1 })
		const user = await User.findById(req.user.id, { tickets: 1 }).populate({
			path: 'tickets.showtime',
			populate: [
				'movie',
				{ path: 'screen', populate: { path: 'theatre', select: 'name' }, select: 'theatre number' }
			],
			select: 'screen movie showtime isRelease'
		})

		res.status(200).json({
			success: true,
			data: {
				...user.toObject(),
				tickets: [
					...user.tickets,
					...bookings.map((booking) => ({
						_id: booking._id,
						reference: booking.reference,
						totalAmount: booking.totalAmount,
						currency: booking.currency,
						showtime: {
							_id: booking.showtime,
							showtime: booking.snapshot.startsAt,
							isRelease: true,
							movie: {
								name: booking.snapshot.movieName,
								length: booking.snapshot.movieLength,
								img: booking.snapshot.movieImage
							},
							screen: {
								number: booking.snapshot.screenNumber,
								theatre: { name: booking.snapshot.theatreName }
							}
						},
						seats: booking.seats.map((seat) => require('../services/bookingService').seatParts(seat))
					}))
				]
			}
		})
	} catch (err) {
		res.status(400).json({ success: false, message: err })
	}
}

//@desc		Log user out / clear cookie
//@route 	GET /auth/logout
//@access	Private
exports.logout = async (req, res, next) => {
	try {
		res.cookie('token', 'none', {
			expires: new Date(Date.now() + 10 * 1000),
			httpOnly: true
		})

		res.status(200).json({
			success: true
		})
	} catch (err) {
		res.status(400).json({ success: false, message: err })
	}
}

//@desc		Get All user
//@route 	POST /auth/user
//@access	Private Admin
exports.getAll = async (req, res, next) => {
	try {
		const user = await User.find().populate({
			path: 'tickets.showtime',
			populate: [
				'movie',
				{ path: 'screen', populate: { path: 'theatre', select: 'name' }, select: 'theatre number' }
			],
			select: 'screen movie showtime isRelease'
		})

		res.status(200).json({
			success: true,
			data: user
		})
	} catch (err) {
		res.status(400).json({ success: false, message: err })
	}
}

//@desc		Delete user
//@route 	DELETE /auth/user/:id
//@access	Private Admin
exports.deleteUser = async (req, res, next) => {
	try {
		const user = await User.findByIdAndDelete(req.params.id)

		if (!user) {
			return res.status(400).json({ success: false })
		}
		res.status(200).json({ success: true })
	} catch (err) {
		res.status(400).json({ success: false, message: err })
	}
}

//@desc     Update user
//@route    PUT /auth/user/:id
//@access   Private
exports.updateUser = async (req, res, next) => {
	try {
		if (req.user.role !== 'admin' && req.user.id !== req.params.id)
			return res.status(403).json({ success: false, message: 'You can only update your own account' })
		// Never accept tickets or payment state from an account-edit request.
		const fields = req.user.role === 'admin' ? ['username', 'email', 'role'] : ['username', 'email']
		const user = await User.findByIdAndUpdate(req.params.id, pick(req.body, fields), {
			new: true,
			runValidators: true
		})

		if (!user) {
			return res.status(400).json({ success: false, message: `User not found with id of ${req.params.id}` })
		}
		res.status(200).json({ success: true, data: user })
	} catch (err) {
		res.status(400).json({ success: false, message: err })
	}
}
