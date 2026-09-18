const express = require('express')
const {
	getTheatres,
	getTheatre,
	createTheatre,
	updateTheatre,
	deleteTheatre,
	getUnreleasedTheatres
} = require('../controllers/theatreController')
const router = express.Router()

const { protect, authorize } = require('../middleware/auth')

router.route('/').get(getTheatres).post(protect, authorize('admin'), createTheatre)
router.route('/unreleased').get(protect, authorize('admin'), getUnreleasedTheatres)
router
	.route('/:id')
	.get(getTheatre)
	.put(protect, authorize('admin'), updateTheatre)
	.delete(protect, authorize('admin'), deleteTheatre)

module.exports = router
