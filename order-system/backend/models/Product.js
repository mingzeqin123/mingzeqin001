const { pool } = require('../config/database');

class Product {
  // 创建商品
  static async create(productData) {
    const { name, description, price, stock_quantity, category_id, sku, image_url } = productData;
    
    // 检查SKU是否已存在
    if (sku) {
      const [existingProducts] = await pool.execute(
        'SELECT id FROM products WHERE sku = ?',
        [sku]
      );
      if (existingProducts.length > 0) {
        throw new Error('SKU已存在');
      }
    }

    const [result] = await pool.execute(
      `INSERT INTO products (name, description, price, stock_quantity, category_id, sku, image_url) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [name, description, price, stock_quantity, category_id, sku, image_url]
    );

    return result.insertId;
  }

  // 根据ID查找商品
  static async findById(id) {
    const [products] = await pool.execute(
      `SELECT p.*, c.name as category_name 
       FROM products p 
       LEFT JOIN categories c ON p.category_id = c.id 
       WHERE p.id = ?`,
      [id]
    );
    return products[0] || null;
  }

  // 获取商品列表（分页）
  static async getProducts(page = 1, limit = 10, category_id = null, search = null) {
    const offset = (page - 1) * limit;
    let query = `SELECT p.*, c.name as category_name 
                 FROM products p 
                 LEFT JOIN categories c ON p.category_id = c.id 
                 WHERE p.status = 'active'`;
    let countQuery = 'SELECT COUNT(*) as total FROM products p WHERE p.status = "active"';
    const params = [];

    if (category_id) {
      query += ' AND p.category_id = ?';
      countQuery += ' AND p.category_id = ?';
      params.push(category_id);
    }

    if (search) {
      query += ' AND (p.name LIKE ? OR p.description LIKE ?)';
      countQuery += ' AND (p.name LIKE ? OR p.description LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm);
    }

    query += ' ORDER BY p.created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const [products] = await pool.execute(query, params);
    const [countResult] = await pool.execute(countQuery, params.slice(0, -2));
    const total = countResult[0].total;

    return {
      products,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  // 更新商品
  static async update(id, updateData) {
    const allowedFields = ['name', 'description', 'price', 'stock_quantity', 'category_id', 'sku', 'image_url', 'status'];
    const updates = [];
    const values = [];

    for (const [key, value] of Object.entries(updateData)) {
      if (allowedFields.includes(key) && value !== undefined) {
        updates.push(`${key} = ?`);
        values.push(value);
      }
    }

    if (updates.length === 0) {
      throw new Error('没有有效的更新字段');
    }

    // 检查SKU是否重复
    if (updateData.sku) {
      const [existingProducts] = await pool.execute(
        'SELECT id FROM products WHERE sku = ? AND id != ?',
        [updateData.sku, id]
      );
      if (existingProducts.length > 0) {
        throw new Error('SKU已存在');
      }
    }

    values.push(id);
    const query = `UPDATE products SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
    
    const [result] = await pool.execute(query, values);
    return result.affectedRows > 0;
  }

  // 更新库存
  static async updateStock(id, quantity) {
    const [result] = await pool.execute(
      'UPDATE products SET stock_quantity = stock_quantity + ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [quantity, id]
    );
    return result.affectedRows > 0;
  }

  // 检查库存是否足够
  static async checkStock(productId, requiredQuantity) {
    const [products] = await pool.execute(
      'SELECT stock_quantity FROM products WHERE id = ? AND status = "active"',
      [productId]
    );
    
    if (products.length === 0) {
      throw new Error('商品不存在或已下架');
    }

    return products[0].stock_quantity >= requiredQuantity;
  }

  // 减少库存
  static async decreaseStock(productId, quantity) {
    const [result] = await pool.execute(
      'UPDATE products SET stock_quantity = stock_quantity - ? WHERE id = ? AND stock_quantity >= ?',
      [quantity, productId, quantity]
    );
    
    if (result.affectedRows === 0) {
      throw new Error('库存不足');
    }
    
    return true;
  }

  // 增加库存
  static async increaseStock(productId, quantity) {
    const [result] = await pool.execute(
      'UPDATE products SET stock_quantity = stock_quantity + ? WHERE id = ?',
      [quantity, productId]
    );
    return result.affectedRows > 0;
  }

  // 删除商品
  static async delete(id) {
    const [result] = await pool.execute('DELETE FROM products WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }

  // 获取分类列表
  static async getCategories() {
    const [categories] = await pool.execute(
      'SELECT * FROM categories WHERE status = "active" ORDER BY name'
    );
    return categories;
  }

  // 创建分类
  static async createCategory(categoryData) {
    const { name, description, parent_id } = categoryData;
    
    const [result] = await pool.execute(
      'INSERT INTO categories (name, description, parent_id) VALUES (?, ?, ?)',
      [name, description, parent_id]
    );

    return result.insertId;
  }
}

module.exports = Product;