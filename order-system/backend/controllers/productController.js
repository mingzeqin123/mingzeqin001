const Product = require('../models/Product');

// 获取商品列表
const getProducts = async (req, res) => {
  try {
    const { page = 1, limit = 10, category_id, search } = req.query;

    const result = await Product.getProducts(
      parseInt(page),
      parseInt(limit),
      category_id ? parseInt(category_id) : null,
      search
    );

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('获取商品列表错误:', error);
    res.status(500).json({
      success: false,
      message: '获取商品列表失败'
    });
  }
};

// 获取商品详情
const getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: '商品不存在'
      });
    }

    res.json({
      success: true,
      data: product
    });

  } catch (error) {
    console.error('获取商品详情错误:', error);
    res.status(500).json({
      success: false,
      message: '获取商品详情失败'
    });
  }
};

// 创建商品（管理员）
const createProduct = async (req, res) => {
  try {
    const productData = req.body;

    const productId = await Product.create(productData);

    // 获取创建的商品信息
    const product = await Product.findById(productId);

    res.status(201).json({
      success: true,
      message: '商品创建成功',
      data: product
    });

  } catch (error) {
    console.error('创建商品错误:', error);
    res.status(400).json({
      success: false,
      message: error.message || '创建商品失败'
    });
  }
};

// 更新商品（管理员）
const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const updated = await Product.update(id, updateData);

    if (!updated) {
      return res.status(400).json({
        success: false,
        message: '更新商品失败'
      });
    }

    // 获取更新后的商品信息
    const product = await Product.findById(id);

    res.json({
      success: true,
      message: '商品更新成功',
      data: product
    });

  } catch (error) {
    console.error('更新商品错误:', error);
    res.status(400).json({
      success: false,
      message: error.message || '更新商品失败'
    });
  }
};

// 删除商品（管理员）
const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const deleted = await Product.delete(id);

    if (!deleted) {
      return res.status(400).json({
        success: false,
        message: '删除商品失败'
      });
    }

    res.json({
      success: true,
      message: '商品删除成功'
    });

  } catch (error) {
    console.error('删除商品错误:', error);
    res.status(500).json({
      success: false,
      message: '删除商品失败'
    });
  }
};

// 更新商品库存（管理员）
const updateProductStock = async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity } = req.body;

    if (typeof quantity !== 'number') {
      return res.status(400).json({
        success: false,
        message: '库存数量必须是数字'
      });
    }

    const updated = await Product.updateStock(id, quantity);

    if (!updated) {
      return res.status(400).json({
        success: false,
        message: '更新库存失败'
      });
    }

    // 获取更新后的商品信息
    const product = await Product.findById(id);

    res.json({
      success: true,
      message: '库存更新成功',
      data: product
    });

  } catch (error) {
    console.error('更新库存错误:', error);
    res.status(400).json({
      success: false,
      message: error.message || '更新库存失败'
    });
  }
};

// 获取商品分类
const getCategories = async (req, res) => {
  try {
    const categories = await Product.getCategories();

    res.json({
      success: true,
      data: categories
    });

  } catch (error) {
    console.error('获取商品分类错误:', error);
    res.status(500).json({
      success: false,
      message: '获取商品分类失败'
    });
  }
};

// 创建商品分类（管理员）
const createCategory = async (req, res) => {
  try {
    const { name, description, parent_id } = req.body;

    const categoryId = await Product.createCategory({
      name,
      description,
      parent_id: parent_id || null
    });

    res.status(201).json({
      success: true,
      message: '分类创建成功',
      data: { id: categoryId, name, description, parent_id }
    });

  } catch (error) {
    console.error('创建分类错误:', error);
    res.status(400).json({
      success: false,
      message: error.message || '创建分类失败'
    });
  }
};

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  updateProductStock,
  getCategories,
  createCategory
};