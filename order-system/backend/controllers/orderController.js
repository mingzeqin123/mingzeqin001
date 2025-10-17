const Order = require('../models/Order');
const Product = require('../models/Product');

// 创建订单
const createOrder = async (req, res) => {
  try {
    const { items, shipping_address, billing_address, payment_method, notes } = req.body;
    const user_id = req.user.id;

    // 验证商品库存
    for (const item of items) {
      const hasStock = await Product.checkStock(item.product_id, item.quantity);
      if (!hasStock) {
        return res.status(400).json({
          success: false,
          message: `商品ID ${item.product_id} 库存不足`
        });
      }
    }

    // 创建订单
    const orderData = {
      user_id,
      items,
      shipping_address,
      billing_address,
      payment_method,
      notes
    };

    const result = await Order.create(orderData);

    res.status(201).json({
      success: true,
      message: '订单创建成功',
      data: result
    });

  } catch (error) {
    console.error('创建订单错误:', error);
    res.status(400).json({
      success: false,
      message: error.message || '创建订单失败'
    });
  }
};

// 获取订单详情
const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    const user_id = req.user.id;
    const user_role = req.user.role;

    const order = await Order.findById(id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: '订单不存在'
      });
    }

    // 检查权限：只有订单所有者或管理员可以查看
    if (order.user_id !== user_id && user_role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: '无权访问此订单'
      });
    }

    res.json({
      success: true,
      data: order
    });

  } catch (error) {
    console.error('获取订单详情错误:', error);
    res.status(500).json({
      success: false,
      message: '获取订单详情失败'
    });
  }
};

// 根据订单号获取订单
const getOrderByNumber = async (req, res) => {
  try {
    const { orderNumber } = req.params;
    const user_id = req.user.id;
    const user_role = req.user.role;

    const order = await Order.findByOrderNumber(orderNumber);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: '订单不存在'
      });
    }

    // 检查权限：只有订单所有者或管理员可以查看
    if (order.user_id !== user_id && user_role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: '无权访问此订单'
      });
    }

    res.json({
      success: true,
      data: order
    });

  } catch (error) {
    console.error('获取订单详情错误:', error);
    res.status(500).json({
      success: false,
      message: '获取订单详情失败'
    });
  }
};

// 获取用户订单列表
const getUserOrders = async (req, res) => {
  try {
    const user_id = req.user.id;
    const { page = 1, limit = 10, status } = req.query;

    const result = await Order.getUserOrders(
      user_id,
      parseInt(page),
      parseInt(limit),
      status
    );

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('获取用户订单列表错误:', error);
    res.status(500).json({
      success: false,
      message: '获取订单列表失败'
    });
  }
};

// 获取所有订单列表（管理员）
const getAllOrders = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, user_id } = req.query;

    const result = await Order.getAllOrders(
      parseInt(page),
      parseInt(limit),
      status,
      user_id ? parseInt(user_id) : null
    );

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('获取所有订单列表错误:', error);
    res.status(500).json({
      success: false,
      message: '获取订单列表失败'
    });
  }
};

// 更新订单状态
const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;
    const updated_by = req.user.id;

    const updated = await Order.updateStatus(id, status, notes, updated_by);

    if (!updated) {
      return res.status(400).json({
        success: false,
        message: '更新订单状态失败'
      });
    }

    res.json({
      success: true,
      message: '订单状态更新成功'
    });

  } catch (error) {
    console.error('更新订单状态错误:', error);
    res.status(400).json({
      success: false,
      message: error.message || '更新订单状态失败'
    });
  }
};

// 取消订单
const cancelOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const user_id = req.user.id;
    const user_role = req.user.role;

    // 获取订单信息
    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: '订单不存在'
      });
    }

    // 检查权限
    if (order.user_id !== user_id && user_role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: '无权操作此订单'
      });
    }

    // 检查订单状态是否可以取消
    if (!['pending', 'confirmed'].includes(order.status)) {
      return res.status(400).json({
        success: false,
        message: '订单状态不允许取消'
      });
    }

    const updated = await Order.updateStatus(id, 'cancelled', '用户取消订单', user_id);

    if (!updated) {
      return res.status(400).json({
        success: false,
        message: '取消订单失败'
      });
    }

    res.json({
      success: true,
      message: '订单取消成功'
    });

  } catch (error) {
    console.error('取消订单错误:', error);
    res.status(400).json({
      success: false,
      message: error.message || '取消订单失败'
    });
  }
};

// 获取订单状态历史
const getOrderStatusHistory = async (req, res) => {
  try {
    const { id } = req.params;
    const user_id = req.user.id;
    const user_role = req.user.role;

    // 检查订单权限
    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: '订单不存在'
      });
    }

    if (order.user_id !== user_id && user_role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: '无权访问此订单'
      });
    }

    const history = await Order.getStatusHistory(id);

    res.json({
      success: true,
      data: history
    });

  } catch (error) {
    console.error('获取订单状态历史错误:', error);
    res.status(500).json({
      success: false,
      message: '获取订单状态历史失败'
    });
  }
};

// 获取订单统计
const getOrderStats = async (req, res) => {
  try {
    const { start_date, end_date } = req.query;

    const stats = await Order.getOrderStats(start_date, end_date);

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('获取订单统计错误:', error);
    res.status(500).json({
      success: false,
      message: '获取订单统计失败'
    });
  }
};

module.exports = {
  createOrder,
  getOrderById,
  getOrderByNumber,
  getUserOrders,
  getAllOrders,
  updateOrderStatus,
  cancelOrder,
  getOrderStatusHistory,
  getOrderStats
};