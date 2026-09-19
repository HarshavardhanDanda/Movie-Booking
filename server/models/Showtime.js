const mongoose = require('mongoose')

const showtimeSchema = new mongoose.Schema({
	screen: { type: mongoose.Schema.ObjectId, ref: 'Screen' },
	movie: { type: mongoose.Schema.ObjectId, ref: 'Movie' },
	showtime: Date,
	// Temporary holds prevent two customers from choosing the same seats.
	holds: {
		type: [{ booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking' }, seats: [String], expiresAt: Date }],
		select: false, default: []
	},
	// Unpriced until configured; paid checkout must reject an unset price.
	ticketPrice: {
		type: Number,
		default: null,
		min: 1,
		validate: { validator: (value) => value == null || Number.isSafeInteger(value), message: 'Ticket price must be integer paise' }
	},
	currency: { type: String, enum: ['INR'], default: 'INR' },
	seats: [
		{
			booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', select: false },
			row: { type: String, required: [true, 'Please add a seat row'] },
			number: { type: Number, required: [true, 'Please add a seat number'] },
			user: { type: mongoose.Schema.ObjectId, ref: 'User' }
		}
	],
	isRelease: Boolean
})

showtimeSchema.pre('deleteOne', { document: true, query: true }, async function (next) {
	const showtimeId = this._id
	await this.model('User').updateMany(
		{ 'tickets.showtime': showtimeId },
		{ $pull: { tickets: { showtime: showtimeId } } }
	)
	next()
})

module.exports = mongoose.model('Showtime', showtimeSchema)
