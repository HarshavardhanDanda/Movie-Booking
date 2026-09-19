const mongoose = require('mongoose')

const movieSchema = new mongoose.Schema(
	{
		name: {
			type: String,
			required: [true, 'Please add a movie name'],
			trim: true
		},
		description: {
			type: String,
			trim: true,
			default: '',
			maxlength: [2000, 'Description must be 2000 characters or fewer']
		},
		length: {
			type: Number,
			required: [true, 'Please add a movie length']
		},
		img: {
			type: String,
			required: [true, 'Please add a movie img'],
			trim: true
		}
	},
	{ timestamps: true }
)

movieSchema.pre('deleteOne', { document: true, query: true }, async function (next) {
	const movieId = this._id
	const showtimes = await this.model('Showtime').find({ movie: movieId })

	for (const showtime of showtimes) {
		await showtime.deleteOne()
	}
	next()
})

module.exports = mongoose.model('Movie', movieSchema)
