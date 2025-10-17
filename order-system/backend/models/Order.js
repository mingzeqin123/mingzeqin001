const { pool } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

class Order {
  // 生成订单号
  static generateOrderNumber() {
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `ORD${timestamp}${random}`;
  }

  // 创建订单
  static async create(orderData) {
    const { user_id, items, shipping_address, billing_address, payment_method, notes } = orderData;
    
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // 验证商品库存
      for (const item of items) {
        const [products] = await connection.execute(
          'SELECT id, name, price, stock_quantity FROM products WHERE id = ? AND status = "active"',
          [item.product_id]
        );

        if (products.length === 0) {
          throw new Error(`商品ID ${item.product_id} 不存在或已下架`);
        }

        if (products[0].stock_quantity < item.quantity) {
          throw new Error(`商品 ${products[0].name} 库存不足`);
        }
      }

      // 计算订单总金额
      let total_amount = 0;
      const orderItems = [];

      for (const item of items) {
        const [products] = await connection.execute(
          'SELECT id, name, price FROM products WHERE id = ?',
          [item.product_id]
        );
        
        const product = products[0];
        const unit_price = product.price;
        const total_price = unit_price * item.quantity;
        
        orderItems.push({
          product_id: item.product_id,
          quantity: item.quantity,
          unit_price,
          total_price
        });
        
        total_amount += total_price;
      }

      // 创建订单
      const order_number = this.generateOrderNumber();
      const [orderResult] = await connection.execute(
        `INSERT INTO orders (order_number, user_id, total_amount, shipping_address, billing_address, payment_method, notes) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [order_number, user_id, total_amount, shipping_address, billing_address, payment_method, notes]
      );

      const order_id = orderResult.insertId;

      // 创建订单商品详情
      for (const item of orderItems) {
        await connection.execute(
          `INSERT INTO order_items (order_id, product_id, quantity, unit_price, total_price) 
           VALUES (?, ?, ?, ?, ?)`,
          [order_id, item.product_id, item.quantity, item.unit_price, item.total_price]
        );

        // 减少库存
        await connection.execute(
          'UPDATE products SET stock_quantity = stock_quantity - ? WHERE id = ?',
          [item.quantity, item.product_id]
        );
      }

      // 记录订单状态历史
      await connection.execute(
        'INSERT INTO order_status_history (order_id, status, created_by) VALUES (?, "pending", ?)',
        [order_id, user_id]
      );

      await connection.commit();

      return {
        order_id,
        order_number,
        total_amount
      };

    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  // 根据ID查找订单
  static async findById(id) {
    const [orders] = await pool.execute(
      `SELECT o.*, u.username, u.full_name, u.email, u.phone 
       FROM orders o 
       JOIN users u ON o.user_id = u.id 
       WHERE o.id = ?`,
      [id]
    );

    if (orders.length === 0) {
      return null;
    }

    const order = orders[0];

    // 获取订单商品详情
    const [items] = await pool.execute(
      `SELECT oi.*, p.name as product_name, p.sku, p.image_url 
       FROM order_items oi 
       JOIN products p ON oi.product_id = p.id 
       WHERE oi.order_id = ?`,
      [id]
    );

    order.items = items;
    return order;
  }

  // 根据订单号查找订单
  static async findByOrderNumber(orderNumber) {
    const [orders] = await pool.execute(
      `SELECT o.*, u.username, u.full_name, u.email, u.phone 
       FROM orders o 
       JOIN users u ON o.user_id = u.id 
       WHERE o.order_number = ?`,
      [orderNumber]
    );

    if (orders.length === 0) {
      return null;
    }

    const order = orders[0];

    // 获取订单商品详情
    const [items] = await pool.execute(
      `SELECT oi.*, p.name as product_name, p.sku, p.image_url 
       FROM order_items oi 
       JOIN products p ON oi.product_id = p.id 
       WHERE oi.order_id = ?`,
      [order.id]
    );

    order.items = items;
    return order;
  }

  // 获取用户订单列表
  static async getUserOrders(userId, page = 1, limit = 10, status = null) {
    const offset = (page - 1) * limit;
    let query = `SELECT o.*, u.username, u.full_name 
                 FROM orders o 
                 JOIN users u ON o.user_id = u.id 
                 WHERE o.user_id = ?`;
    let countQuery = 'SELECT COUNT(*) as total FROM orders WHERE user_id = ?';
    const params = [userId];

    if (status) {
      query += ' AND o.status = ?';
      countQuery += ' AND status = ?';
      params.push(status);
    }

    query += ' ORDER BY o.created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const [orders] = await pool.execute(query, params);
    const [countResult] = await pool.execute(countQuery, status ? [userId, status] : [userId]);
    const total = countResult[0].total;

    return {
      orders,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  // 获取所有订单列表（管理员）
  static async getAllOrders(page = 1, limit = 10, status = null, userId = null) {
    const offset = (page - 1) * limit;
    let query = `SELECT o.*, u.username, u.full_name, u.email 
                 FROM orders o 
                 JOIN users u ON o.user_id = u.id 
                 WHERE 1=1`;
    let countQuery = 'SELECT COUNT(*) as total FROM orders WHERE 1=1';
    const params = [];

    if (status) {
      query += ' AND o.status = ?';
      countQuery += ' AND status = ?';
      params.push(status);
    }

    if (userId) {
      query += ' AND o.user_id = ?';
      countQuery += ' AND user_id = ?';
      params.push(userId);
    }

    query += ' ORDER BY o.created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const [orders] = await pool.execute(query, params);
    const [countResult] = await pool.execute(countQuery, params.slice(0, -2));
    const total = countResult[0].total;

    return {
      orders,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  // 更新订单状态
  static async updateStatus(orderId, status, notes = null, updatedBy = null) {
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // 更新订单状态
      const [result] = await connection.execute(
        'UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [status, orderId]
      );

      if (result.affectedRows === 0) {
        throw new Error('订单不存在');
      }

      // 记录状态历史
      await connection.execute(
        'INSERT INTO order_status_history (order_id, status, notes, created_by) VALUES (?, ?, ?, ?)',
        [orderId, status, notes, updatedBy]
      );

      // 如果订单被取消，恢复库存
      if (status === 'cancelled') {
        const [items] = await connection.execute(
          'SELECT product_id, quantity FROM order_items WHERE order_id = ?',
          [orderId]
        );

        for (const item of items) {
          await connection.execute(
            'UPDATE products SET stock_quantity = stock_quantity + ? WHERE id = ?',
            [item.quantity, item.product_id]
          );
        }
      }

      await connection.commit();
      return true;

    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  // 获取订单状态历史
  static async getStatusHistory(orderId) {
    const [history] = await pool.execute(
      `SELECT osh.*, u.username, u.full_name 
       FROM order_status_history osh 
       LEFT JOIN users u ON osh.created_by = u.id 
       WHERE osh.order_id = ? 
       ORDER BY osh.created_at ASC`,
      [orderId]
    );
    return history;
  }

  // 更新支付状态
  static async updatePaymentStatus(orderId, paymentStatus, paymentMethod = null) {
    const [result] = await pool.execute(
      'UPDATE orders SET payment_status = ?, payment_method = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [paymentStatus, paymentMethod, orderId]
    );
    return result.affectedRows > 0;
  }

  // 获取订单统计
  static async getOrderStats(startDate = null, endDate = null) {
    let dateFilter = '';
    const params = [];

    if (startDate && endDate) {
      dateFilter = 'WHERE o.created_at BETWEEN ? AND ?';
      params.push(startDate, endDate);
    }

    const [stats] = await pool.execute(
      `SELECT 
         COUNT(*) as total_orders,
         SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_orders,
         SUM(CASE WHEN status = 'confirmed' THEN 1 ELSE 0 END) as confirmed_orders,
         SUM(CASE WHEN status = 'processing' THEN 1 ELSE 0 END) as processing_orders,
         SUM(CASE WHEN status = 'shipped' THEN 1 ELSE 0 END) as shipped_orders,
         SUM(CASE WHEN status = 'delivered' THEN 1 ELSE 0 END) as delivered_orders,
         SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled_orders,
         SUM(total_amount) as total_revenue
       FROM orders o ${dateFilter}`,
      params
    );

    return stats[0];
  }
}

module.exports = Order;