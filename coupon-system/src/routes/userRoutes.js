const express = require('express');
const UserController = require('../controllers/UserController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// 用户认证
router.post('/register', UserController.register);
router.post('/login', UserController.login);

// 用户信息管理
router.get('/profile', authenticate, UserController.getProfile);
router.put('/profile', authenticate, UserController.updateProfile);

// 密码管理
router.post('/change-password', authenticate, UserController.changePassword);
router.post('/forgot-password', UserController.forgotPassword);
router.post('/reset-password', UserController.resetPassword);

module.exports = router;