const Theatre = require('../models/Theatre')
const Screen = require('../models/Screen')
const Movie = require('../models/Movie')
const Showtime = require('../models/Showtime')
const { fail, objectId } = require('./errors')

// Use the existing model hooks to remove related records.
async function remove(kind, ids) {
	const Model = { theatre: Theatre, screen: Screen, movie: Movie, showtime: Showtime }[kind]
	const documents = await Model.find({ _id: { $in: ids.map((id) => objectId(String(id))) } })
	for (const document of documents) {
		await document.deleteOne()
		if (kind === 'screen')
			await Theatre.updateMany({ screens: document._id }, { $pull: { screens: document._id } })
		if (kind === 'showtime')
			await Screen.updateMany({ showtimes: document._id }, { $pull: { showtimes: document._id } })
	}
	return documents.length
}

function pick(body, fields) {
	return Object.fromEntries(
		fields.filter((field) => Object.hasOwn(body, field)).map((field) => [field, body[field]])
	)
}

async function updateShowtime(id, body) {
	const changes = pick(body, ['movie', 'showtime', 'ticketPrice', 'isRelease'])
	if (
		changes.ticketPrice !== undefined &&
		(!Number.isSafeInteger(changes.ticketPrice) || changes.ticketPrice < 1)
	)
		fail(400, 'Ticket price must be positive integer paise')
	const doc = await Showtime.findByIdAndUpdate(
		objectId(id),
		{ $set: changes },
		{ new: true, runValidators: true }
	)
	if (!doc) fail(404, 'Showtime not found')
	return doc
}
module.exports = { remove, pick, updateShowtime }
