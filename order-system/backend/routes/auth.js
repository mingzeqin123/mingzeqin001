const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { validateUserRegistration, validateUserLogin } = require('../middleware/validation');
const { authenticateToken } = require('../middleware/auth');

// 用户注册
router.post('/register', validateUserRegistration, authController.register);

// 用户登录
router.post('/login', validateUserLogin, authController.login);

// 获取当前用户信息
router.get('/profile', authenticateToken, authController.getProfile);

// 更新用户信息
router.put('/profile', authenticateToken, authController.updateProfile);

// 刷新令牌
router.post('/refresh', authenticateToken, authController.refreshToken);

module.exports = router;