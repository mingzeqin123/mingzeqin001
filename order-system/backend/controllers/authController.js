const jwt = require('jsonwebtoken');
const User = require('../models/User');

// 用户注册
const register = async (req, res) => {
  try {
    const { username, email, password, full_name, phone, address } = req.body;

    // 创建用户
    const userId = await User.create({
      username,
      email,
      password,
      full_name,
      phone,
      address
    });

    // 生成JWT令牌
    const token = jwt.sign(
      { userId, email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    res.status(201).json({
      success: true,
      message: '用户注册成功',
      data: {
        token,
        user: {
          id: userId,
          username,
          email,
          full_name,
          phone,
          address
        }
      }
    });

  } catch (error) {
    console.error('注册错误:', error);
    res.status(400).json({
      success: false,
      message: error.message || '注册失败'
    });
  }
};

// 用户登录
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 查找用户
    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: '邮箱或密码错误'
      });
    }

    // 检查用户状态
    if (user.status !== 'active') {
      return res.status(401).json({
        success: false,
        message: '账户已被禁用'
      });
    }

    // 验证密码
    const isValidPassword = await User.validatePassword(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: '邮箱或密码错误'
      });
    }

    // 生成JWT令牌
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    res.json({
      success: true,
      message: '登录成功',
      data: {
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          full_name: user.full_name,
          phone: user.phone,
          address: user.address,
          role: user.role
        }
      }
    });

  } catch (error) {
    console.error('登录错误:', error);
    res.status(500).json({
      success: false,
      message: '登录失败'
    });
  }
};

// 获取当前用户信息
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    res.json({
      success: true,
      data: user
    });

  } catch (error) {
    console.error('获取用户信息错误:', error);
    res.status(500).json({
      success: false,
      message: '获取用户信息失败'
    });
  }
};

// 更新用户信息
const updateProfile = async (req, res) => {
  try {
    const { full_name, phone, address } = req.body;
    const userId = req.user.id;

    const updated = await User.update(userId, {
      full_name,
      phone,
      address
    });

    if (!updated) {
      return res.status(400).json({
        success: false,
        message: '更新失败'
      });
    }

    // 获取更新后的用户信息
    const user = await User.findById(userId);

    res.json({
      success: true,
      message: '用户信息更新成功',
      data: user
    });

  } catch (error) {
    console.error('更新用户信息错误:', error);
    res.status(400).json({
      success: false,
      message: error.message || '更新用户信息失败'
    });
  }
};

// 刷新令牌
const refreshToken = async (req, res) => {
  try {
    const { userId, email } = req.user;

    // 生成新的JWT令牌
    const token = jwt.sign(
      { userId, email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    res.json({
      success: true,
      message: '令牌刷新成功',
      data: { token }
    });

  } catch (error) {
    console.error('刷新令牌错误:', error);
    res.status(500).json({
      success: false,
      message: '刷新令牌失败'
    });
  }
};

module.exports = {
  register,
  login,
  getProfile,
  updateProfile,
  refreshToken
};