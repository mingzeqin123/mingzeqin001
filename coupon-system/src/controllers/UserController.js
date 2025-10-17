const { User } = require('../models');
const jwt = require('jsonwebtoken');
const Joi = require('joi');
const CouponDistributionService = require('../services/CouponDistributionService');

class UserController {
  /**
   * 用户注册
   */
  async register(req, res) {
    try {
      const schema = Joi.object({
        username: Joi.string().alphanum().min(3).max(50).required(),
        email: Joi.string().email().required(),
        password: Joi.string().min(6).required(),
        phone: Joi.string().pattern(/^[\+]?[1-9][\d]{0,15}$/).optional()
      });

      const { error, value } = schema.validate(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          error: error.details[0].message
        });
      }

      // 检查用户名和邮箱是否已存在
      const existingUser = await User.findOne({
        where: {
          $or: [
            { username: value.username },
            { email: value.email }
          ]
        }
      });

      if (existingUser) {
        return res.status(400).json({
          success: false,
          error: '用户名或邮箱已存在'
        });
      }

      // 创建用户
      const user = await User.create(value);

      // 发放新用户优惠券
      try {
        await CouponDistributionService.distributeWelcomeCoupons(user.id);
      } catch (error) {
        console.error('发放新用户优惠券失败:', error.message);
      }

      // 生成JWT token
      const token = jwt.sign(
        { userId: user.id, username: user.username },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
      );

      res.status(201).json({
        success: true,
        data: {
          user: user.toJSON(),
          token
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * 用户登录
   */
  async login(req, res) {
    try {
      const schema = Joi.object({
        username: Joi.string().required(),
        password: Joi.string().required()
      });

      const { error, value } = schema.validate(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          error: error.details[0].message
        });
      }

      // 查找用户（支持用户名或邮箱登录）
      const user = await User.findOne({
        where: {
          $or: [
            { username: value.username },
            { email: value.username }
          ]
        }
      });

      if (!user) {
        return res.status(401).json({
          success: false,
          error: '用户名或密码错误'
        });
      }

      if (user.status !== 'active') {
        return res.status(401).json({
          success: false,
          error: '账户已被禁用'
        });
      }

      // 验证密码
      const isValidPassword = await user.comparePassword(value.password);
      if (!isValidPassword) {
        return res.status(401).json({
          success: false,
          error: '用户名或密码错误'
        });
      }

      // 生成JWT token
      const token = jwt.sign(
        { userId: user.id, username: user.username },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
      );

      res.json({
        success: true,
        data: {
          user: user.toJSON(),
          token
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * 获取用户信息
   */
  async getProfile(req, res) {
    try {
      const user = await User.findByPk(req.user.id);
      
      if (!user) {
        return res.status(404).json({
          success: false,
          error: '用户不存在'
        });
      }

      res.json({
        success: true,
        data: user.toJSON()
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * 更新用户信息
   */
  async updateProfile(req, res) {
    try {
      const schema = Joi.object({
        username: Joi.string().alphanum().min(3).max(50).optional(),
        email: Joi.string().email().optional(),
        phone: Joi.string().pattern(/^[\+]?[1-9][\d]{0,15}$/).optional()
      });

      const { error, value } = schema.validate(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          error: error.details[0].message
        });
      }

      const user = await User.findByPk(req.user.id);
      if (!user) {
        return res.status(404).json({
          success: false,
          error: '用户不存在'
        });
      }

      // 检查用户名和邮箱唯一性
      if (value.username || value.email) {
        const whereClause = {
          id: { $ne: user.id }
        };

        if (value.username) {
          whereClause.username = value.username;
        }
        if (value.email) {
          whereClause.email = value.email;
        }

        const existingUser = await User.findOne({ where: whereClause });
        if (existingUser) {
          return res.status(400).json({
            success: false,
            error: '用户名或邮箱已被使用'
          });
        }
      }

      // 更新用户信息
      await user.update(value);

      res.json({
        success: true,
        data: user.toJSON()
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * 修改密码
   */
  async changePassword(req, res) {
    try {
      const schema = Joi.object({
        currentPassword: Joi.string().required(),
        newPassword: Joi.string().min(6).required(),
        confirmPassword: Joi.string().valid(Joi.ref('newPassword')).required()
      });

      const { error, value } = schema.validate(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          error: error.details[0].message
        });
      }

      const user = await User.findByPk(req.user.id);
      if (!user) {
        return res.status(404).json({
          success: false,
          error: '用户不存在'
        });
      }

      // 验证当前密码
      const isValidPassword = await user.comparePassword(value.currentPassword);
      if (!isValidPassword) {
        return res.status(400).json({
          success: false,
          error: '当前密码错误'
        });
      }

      // 更新密码
      await user.update({ password: value.newPassword });

      res.json({
        success: true,
        message: '密码修改成功'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * 忘记密码
   */
  async forgotPassword(req, res) {
    try {
      const schema = Joi.object({
        email: Joi.string().email().required()
      });

      const { error, value } = schema.validate(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          error: error.details[0].message
        });
      }

      const user = await User.findOne({ where: { email: value.email } });
      if (!user) {
        return res.status(404).json({
          success: false,
          error: '邮箱不存在'
        });
      }

      // 生成重置token（实际项目中应该发送邮件）
      const resetToken = jwt.sign(
        { userId: user.id, type: 'password_reset' },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );

      // 这里应该发送邮件，现在只是返回token（仅用于演示）
      res.json({
        success: true,
        message: '密码重置邮件已发送',
        resetToken // 实际项目中不应该返回token
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * 重置密码
   */
  async resetPassword(req, res) {
    try {
      const schema = Joi.object({
        resetToken: Joi.string().required(),
        newPassword: Joi.string().min(6).required(),
        confirmPassword: Joi.string().valid(Joi.ref('newPassword')).required()
      });

      const { error, value } = schema.validate(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          error: error.details[0].message
        });
      }

      // 验证重置token
      let decoded;
      try {
        decoded = jwt.verify(value.resetToken, process.env.JWT_SECRET);
      } catch (error) {
        return res.status(400).json({
          success: false,
          error: '重置链接已过期或无效'
        });
      }

      if (decoded.type !== 'password_reset') {
        return res.status(400).json({
          success: false,
          error: '无效的重置token'
        });
      }

      const user = await User.findByPk(decoded.userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          error: '用户不存在'
        });
      }

      // 更新密码
      await user.update({ password: value.newPassword });

      res.json({
        success: true,
        message: '密码重置成功'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
}

module.exports = new UserController();