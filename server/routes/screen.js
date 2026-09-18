const express = require('express')
const {
	getScreens,
	getScreen,
	createScreen,
	updateScreen,
	deleteScreen,
	getScreenByMovie,
	getUnreleasedScreen,
	getUnreleasedScreenByMovie
} = require('../controllers/screenController')
const router = express.Router()

const { protect, authorize } = require('../middleware/auth')

router.route('/').get(getScreens).post(protect, authorize('admin'), createScreen)
router.route('/unreleased/:id').get(protect, authorize('admin'), getUnreleasedScreen)
router.route('/movie/unreleased/:mid/:date/:timezone').get(protect, authorize('admin'), getUnreleasedScreenByMovie)
router.route('/movie/:mid/:date/:timezone').get(getScreenByMovie)
router
	.route('/:id')
	.get(getScreen)
	.put(protect, authorize('admin'), updateScreen)
	.delete(protect, authorize('admin'), deleteScreen)

module.exports = router
