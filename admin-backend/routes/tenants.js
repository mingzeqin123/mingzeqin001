const express = require('express');
const router = express.Router();

const {
  getAllTenants,
  getTenant,
  createTenant,
  updateTenant,
  deleteTenant,
  getCurrentTenant,
  updateTenantStatus,
  getTenantUsageReport
} = require('../controllers/tenantController');

const { authenticate, requireSuperAdmin, requireTenantAdmin } = require('../middleware/auth');
const { identifyTenant, checkTenantPermissions } = require('../middleware/tenant');

// 超级管理员路由（不需要租户上下文）
router.use('/super-admin', authenticate, requireSuperAdmin);
router.get('/super-admin', getAllTenants);
router.post('/super-admin', createTenant);
router.get('/super-admin/:id', getTenant);
router.put('/super-admin/:id', updateTenant);
router.delete('/super-admin/:id', deleteTenant);
router.patch('/super-admin/:id/status', updateTenantStatus);
router.get('/super-admin/:id/usage', getTenantUsageReport);

// 租户相关路由（需要租户上下文）
router.use('/:tenantSlug', identifyTenant);

// 获取当前租户信息
router.get('/:tenantSlug/current', authenticate, getCurrentTenant);

// 租户管理员路由
router.get('/:tenantSlug/info', authenticate, requireTenantAdmin, getTenant);
router.put('/:tenantSlug/info', authenticate, requireTenantAdmin, updateTenant);
router.get('/:tenantSlug/usage', authenticate, requireTenantAdmin, getTenantUsageReport);

module.exports = router;