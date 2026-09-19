const router = require('express').Router()
const { protect } = require('../middleware/auth')
const controller = require('../controllers/bookingController')

router.use(protect)
router.post('/', controller.create)
router.get('/my', controller.my)
router.get('/:id', controller.get)
module.exports = router
