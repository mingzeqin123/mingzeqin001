const express = require('express');
const router = express.Router();

const {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  updateUserStatus,
  getUserStats
} = require('../controllers/userController');

const { authenticate, requireTenantAdmin } = require('../middleware/auth');
const { identifyTenant, checkTenantLimits } = require('../middleware/tenant');

// 所有用户路由都需要认证
router.use(authenticate);

// 超级管理员路由（不需要租户上下文）
router.get('/super-admin/all', requireTenantAdmin, getUsers);
router.get('/super-admin/stats', requireTenantAdmin, getUserStats);

// 租户用户路由（需要租户上下文）
router.use('/:tenantSlug', identifyTenant);

// 用户管理路由
router.get('/:tenantSlug', requireTenantAdmin, getUsers);
router.post('/:tenantSlug', requireTenantAdmin, checkTenantLimits('users'), createUser);
router.get('/:tenantSlug/stats', requireTenantAdmin, getUserStats);
router.get('/:tenantSlug/:id', requireTenantAdmin, getUser);
router.put('/:tenantSlug/:id', requireTenantAdmin, updateUser);
router.delete('/:tenantSlug/:id', requireTenantAdmin, deleteUser);
router.patch('/:tenantSlug/:id/status', requireTenantAdmin, updateUserStatus);

// 如果没有租户标识符，使用当前用户的租户
router.get('/', requireTenantAdmin, getUsers);
router.post('/', requireTenantAdmin, checkTenantLimits('users'), createUser);
router.get('/stats', requireTenantAdmin, getUserStats);
router.get('/:id', requireTenantAdmin, getUser);
router.put('/:id', requireTenantAdmin, updateUser);
router.delete('/:id', requireTenantAdmin, deleteUser);
router.patch('/:id/status', requireTenantAdmin, updateUserStatus);

module.exports = router;