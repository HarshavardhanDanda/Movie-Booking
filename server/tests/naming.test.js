const { test } = require('node:test')
const assert = require('node:assert/strict')
const Theatre = require('../models/Theatre')
const Screen = require('../models/Screen')
const Showtime = require('../models/Showtime')
const Movie = require('../models/Movie')
const { createScreen } = require('../controllers/screenController')
const { addShowtime, getShowtimes } = require('../controllers/showtimeController')

function response() {
	return { status(code) { this.code = code; return this }, json(body) { this.body = body; return this } }
}

test('models use the new collections and reference chain', () => {
	assert.equal(Theatre.collection.name, 'theatres')
	assert.equal(Screen.collection.name, 'screens')
	assert.equal(Theatre.schema.path('screens').caster.options.ref, 'Screen')
	assert.equal(Screen.schema.path('theatre').options.ref, 'Theatre')
	assert.equal(Showtime.schema.path('screen').options.ref, 'Screen')
	assert.equal(Theatre.schema.path('theaters'), undefined)
	assert.equal(Screen.schema.path('cinema'), undefined)
	assert.equal(Showtime.schema.path('theater'), undefined)
})

test('creating a screen links it to its theatre', async (t) => {
	const theatre = new Theatre({ name: 'Test Theatre' })
	let saved = false
	t.mock.method(Theatre, 'findById', async (id) => {
		assert.equal(id, theatre.id)
		return theatre
	})
	t.mock.method(theatre, 'save', async () => { saved = true })
	t.mock.method(Screen, 'create', async (data) => {
		assert.equal(data.theatre, theatre)
		assert.equal(data.number, 1)
		return new Screen(data)
	})
	const res = response()
	await createScreen({ body: { theatre: theatre.id, row: 'C', column: 10 } }, res)
	assert.equal(res.code, 201)
	assert.equal(res.body.data.validateSync(), undefined)
	assert.ok(theatre.screens[0].equals(res.body.data._id))
	assert.ok(saved)
})

test('creating a showtime uses the screen field and updates its screen', async (t) => {
	const screen = new Screen({ number: 1, seatPlan: { row: 'C', column: 10 } })
	const movie = new Movie()
	let saved = false
	t.mock.method(Screen, 'findById', async (id) => {
		assert.equal(id, screen.id)
		return screen
	})
	t.mock.method(Movie, 'findById', async () => movie)
	t.mock.method(screen, 'save', async () => { saved = true })
	t.mock.method(Showtime, 'create', async (data) => {
		assert.equal(data.screen, screen)
		assert.equal(data.theater, undefined)
		return new Showtime(data)
	})
	const res = response()
	await addShowtime({ body: { screen: screen.id, movie: movie.id, showtime: '2030-01-01T12:00:00Z', isRelease: true } }, res)
	assert.equal(res.code, 200)
	assert.equal(screen.showtimes.length, 1)
	assert.ok(saved)
})

test('showtime responses populate screen and theatre', async (t) => {
	t.mock.method(Showtime, 'find', () => ({
		populate(paths) {
			assert.deepEqual(paths[1], { path: 'screen', populate: { path: 'theatre', select: 'name' }, select: 'number theatre seatPlan' })
			return { select: async () => [] }
		}
	}))
	const res = response()
	await getShowtimes({}, res)
	assert.equal(res.code, 200)
	assert.deepEqual(res.body.data, [])
})

test('all route modules load their renamed controller handlers', () => {
	for (const name of ['theatre', 'screen', 'showtime', 'movie', 'auth']) {
		const router = require(`../routes/${name}`)
		assert.ok(router.stack.length > 0)
	}
})
