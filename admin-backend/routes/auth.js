const express = require('express');
const router = express.Router();

const {
  login,
  logout,
  getProfile,
  updateProfile,
  changePassword,
  verifyToken,
  refreshToken
} = require('../controllers/authController');

const { authenticate, optionalAuth } = require('../middleware/auth');

// 公开路由
router.post('/login', login);
router.post('/logout', logout);

// 需要认证的路由
router.use(authenticate);

router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.patch('/change-password', changePassword);
router.get('/verify', verifyToken);
router.post('/refresh', refreshToken);

module.exports = router;