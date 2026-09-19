const mongoose = require('mongoose')
const { randomUUID } = require('node:crypto')

const bookingSchema = new mongoose.Schema(
	{
		reference: { type: String, required: true, unique: true, default: () => randomUUID() },
		user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
		requestKey: String,
		razorpayOrderId: String,
		showtime: { type: mongoose.Schema.Types.ObjectId, ref: 'Showtime', required: true },
		// Historical ticket details survive changes to the referenced records.
		snapshot: {
			movieName: { type: String, required: true, trim: true },
			movieLength: Number,
			movieImage: String,
			theatreName: { type: String, required: true, trim: true },
			screenNumber: { type: Number, required: true, min: 1, validate: Number.isSafeInteger },
			startsAt: { type: Date, required: true }
		},
		seats: {
			type: [{ type: String, match: /^[A-Z]{1,2}[1-9]\d*$/ }],
			validate: {
				validator: (seats) =>
					Array.isArray(seats) &&
					seats.length > 0 &&
					seats.every((seat) => typeof seat === 'string') &&
					new Set(seats).size === seats.length,
				message: 'Select at least one seat without duplicates'
			}
		},
		// All monetary amounts are integer paise, computed by the booking service.
		unitPrice: { type: Number, required: true, min: 1, validate: Number.isSafeInteger },
		totalAmount: { type: Number, required: true, min: 1, validate: Number.isSafeInteger },
		currency: { type: String, enum: ['INR'], default: 'INR', required: true },
		status: {
			type: String,
			enum: ['pending', 'confirmed', 'expired', 'cancelled'],
			default: 'pending',
			required: true
		},
		expiresAt: { type: Date, required: true, default: () => new Date(Date.now() + 5 * 60 * 1000) },
		confirmedAt: Date,
		cancelledAt: Date
	},
	{ timestamps: true }
)

bookingSchema.pre('validate', function () {
	if (Array.isArray(this.seats) && this.totalAmount !== this.unitPrice * this.seats.length) {
		this.invalidate('totalAmount', 'Total must equal unit price multiplied by seat count')
	}
})

bookingSchema.index({ user: 1, createdAt: -1 })
bookingSchema.index(
	{ user: 1, requestKey: 1 },
	{ unique: true, partialFilterExpression: { requestKey: { $type: 'string' } } }
)
bookingSchema.index(
	{ razorpayOrderId: 1 },
	{ unique: true, partialFilterExpression: { razorpayOrderId: { $type: 'string' } } }
)
bookingSchema.index({ showtime: 1, status: 1 })
// A normal index, not TTL: expired bookings must remain for booking history.
bookingSchema.index({ status: 1, expiresAt: 1 })

module.exports = mongoose.model('Booking', bookingSchema)
