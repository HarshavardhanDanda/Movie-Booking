const express = require('express')
const { googleLogin, register, login, getMe, getAll, logout, deleteUser, getTickets, updateUser } = require('../controllers/authController')

const router = express.Router()

const { protect, authorize } = require('../middleware/auth')

router.post('/register', register)
router.post('/login', login)
router.post('/google', googleLogin)
router.get('/logout', logout)
router.get('/me', protect, getMe)
router.get('/tickets', protect, getTickets)
router.put('/user/:id', protect, updateUser)
router.get('/user', protect, authorize('admin'), getAll)
router.delete('/user/:id', protect, authorize('admin'), deleteUser)

module.exports = router
