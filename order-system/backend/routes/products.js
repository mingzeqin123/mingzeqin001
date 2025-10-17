const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { validateProduct, validateCartItem } = require('../middleware/validation');

// 获取商品列表（公开）
router.get('/', productController.getProducts);

// 获取商品详情（公开）
router.get('/:id', productController.getProductById);

// 获取商品分类（公开）
router.get('/categories/list', productController.getCategories);

// 创建商品（管理员）
router.post('/', authenticateToken, requireRole(['admin']), validateProduct, productController.createProduct);

// 更新商品（管理员）
router.put('/:id', authenticateToken, requireRole(['admin']), productController.updateProduct);

// 删除商品（管理员）
router.delete('/:id', authenticateToken, requireRole(['admin']), productController.deleteProduct);

// 更新商品库存（管理员）
router.put('/:id/stock', authenticateToken, requireRole(['admin', 'staff']), productController.updateProductStock);

// 创建商品分类（管理员）
router.post('/categories', authenticateToken, requireRole(['admin']), productController.createCategory);

module.exports = router;