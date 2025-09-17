/**
 * 认证路由模块
 * 定义用户认证相关的API路由
 */
import express from 'express';
import {
  register,
  login,
  getCurrentUser,
  updateCurrentUser,
  changePassword,
  refreshToken,
  logout
} from '../controllers/AuthController.js';
import { authenticateToken } from '../middleware/auth.js';
import { validateRequest, validationRules } from '../middleware/validation.js';

const router = express.Router();

/**
 * @route   POST /api/v1/auth/register
 * @desc    用户注册
 * @access  Public
 */
router.post('/register', 
  validateRequest(validationRules.userRegistration),
  register
);

/**
 * @route   POST /api/v1/auth/login
 * @desc    用户登录
 * @access  Public
 */
router.post('/login',
  validateRequest(validationRules.userLogin),
  login
);

/**
 * @route   GET /api/v1/auth/me
 * @desc    获取当前用户信息
 * @access  Private
 */
router.get('/me',
  authenticateToken,
  getCurrentUser
);

/**
 * @route   PUT /api/v1/auth/me
 * @desc    更新当前用户信息
 * @access  Private
 */
router.put('/me',
  authenticateToken,
  validateRequest({
    body: {
      fields: {
        firstName: {
          type: 'string',
          maxLength: 50
        },
        lastName: {
          type: 'string',
          maxLength: 50
        },
        email: {
          type: 'email'
        }
      }
    },
    sanitize: {
      body: ['firstName', 'lastName', 'email']
    }
  }),
  updateCurrentUser
);

/**
 * @route   POST /api/v1/auth/change-password
 * @desc    修改密码
 * @access  Private
 */
router.post('/change-password',
  authenticateToken,
  validateRequest({
    body: {
      required: ['currentPassword', 'newPassword'],
      fields: {
        currentPassword: {
          type: 'string',
          minLength: 1
        },
        newPassword: {
          type: 'string',
          minLength: 8,
          validator: (value) => {
            const hasLetter = /[a-zA-Z]/.test(value);
            const hasNumber = /\d/.test(value);
            return hasLetter && hasNumber ? [] : ['新密码格式无效，至少8位，需包含字母和数字'];
          }
        }
      }
    }
  }),
  changePassword
);

/**
 * @route   POST /api/v1/auth/refresh
 * @desc    刷新令牌
 * @access  Private
 */
router.post('/refresh',
  authenticateToken,
  refreshToken
);

/**
 * @route   POST /api/v1/auth/logout
 * @desc    用户登出
 * @access  Private
 */
router.post('/logout',
  authenticateToken,
  logout
);

export default router;