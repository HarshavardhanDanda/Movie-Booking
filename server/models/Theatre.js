const mongoose = require('mongoose')

const theatreSchema = new mongoose.Schema(
	{
		name: {
			type: String,
			trim: true,
			unique: true,
			required: [true, 'Please add a name']
		},
		screens: [{ type: mongoose.Schema.ObjectId, ref: 'Screen' }]
	},
	{ timestamps: true }
)

theatreSchema.pre('deleteOne', { document: true, query: true }, async function (next) {
	// Remove screens associated with the theatre being deleted
	const screens = await this.model('Screen').find({ _id: { $in: this.screens } })

	for (const screen of screens) {
		await screen.deleteOne()
	}
	next()
})

module.exports = mongoose.model('Theatre', theatreSchema)
