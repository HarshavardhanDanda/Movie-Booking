const router = require('express').Router()
const { protect } = require('../middleware/auth')
const controller = require('../controllers/paymentController')
router.post('/order', protect, controller.order)
router.post('/verify', protect, controller.verify)
module.exports = router
