const mongoose = require('mongoose')

// Store the verified payment alongside its booking.
const paymentSchema = new mongoose.Schema(
	{
		booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true },
		razorpayOrderId: { type: String, required: true },
		razorpayPaymentId: { type: String, required: true },
		amount: { type: Number, required: true, min: 1, validate: Number.isSafeInteger },
		currency: { type: String, enum: ['INR'], default: 'INR', required: true },
		status: { type: String, enum: ['captured'], default: 'captured' },
		verifiedAt: { type: Date, default: Date.now }
	},
	{ timestamps: true }
)
paymentSchema.index({ booking: 1 })
paymentSchema.index(
	{ razorpayPaymentId: 1 },
	{ unique: true, partialFilterExpression: { razorpayPaymentId: { $type: 'string' } } }
)
module.exports = mongoose.model('Payment', paymentSchema)
