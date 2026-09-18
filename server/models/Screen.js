const mongoose = require('mongoose')

const screenSchema = new mongoose.Schema({
	theatre: { type: mongoose.Schema.ObjectId, ref: 'Theatre' },
	number: { type: Number, required: true },
	seatPlan: {
		row: {
			type: String,
			maxlength: 2,
			required: [true, 'Please add a seatPlan row']
		},
		column: {
			type: Number,
			required: [true, 'Please add a seatPlan column']
		}
	},
	showtimes: [{ type: mongoose.Schema.ObjectId, ref: 'Showtime' }]
})

screenSchema.pre('deleteOne', { document: true, query: true }, async function (next) {
	const showtimes = await this.model('Showtime').find({ _id: { $in: this.showtimes } })

	for (const showtime of showtimes) {
		await showtime.deleteOne()
	}
	next()
})

module.exports = mongoose.model('Screen', screenSchema)
