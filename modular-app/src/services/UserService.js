/**
 * 用户服务模块
 * 处理用户相关的业务逻辑
 */
import User from '../models/User.js';
import { DataStore } from '../data/DataStore.js';
import { 
  isValidEmail, 
  isValidPassword, 
  isValidUsername,
  validateRequired 
} from '../utils/validation.js';
import logger from '../utils/logger.js';

/**
 * 用户服务类
 */
export class UserService {
  constructor() {
    this.dataStore = new DataStore();
  }

  /**
   * 创建新用户
   */
  async createUser(userData) {
    try {
      // 验证必需字段
      const validation = validateRequired(userData, ['username', 'email', 'password']);
      if (!validation.isValid) {
        throw new Error(`缺少必需字段: ${validation.missing.join(', ')}`);
      }

      // 验证用户名
      if (!isValidUsername(userData.username)) {
        throw new Error('用户名格式无效，应为3-20位字符，只能包含字母、数字和下划线');
      }

      // 验证邮箱
      if (!isValidEmail(userData.email)) {
        throw new Error('邮箱格式无效');
      }

      // 验证密码
      if (!isValidPassword(userData.password)) {
        throw new Error('密码格式无效，至少8位，需包含字母和数字');
      }

      // 检查用户名是否已存在
      const existingUserByUsername = await this.getUserByUsername(userData.username);
      if (existingUserByUsername) {
        throw new Error('用户名已存在');
      }

      // 检查邮箱是否已存在
      const existingUserByEmail = await this.getUserByEmail(userData.email);
      if (existingUserByEmail) {
        throw new Error('邮箱已被注册');
      }

      // 创建用户实例
      const user = new User(userData);
      
      // 加密密码
      await user.setPassword(userData.password);

      // 保存用户
      const savedUser = await this.dataStore.users.create(user);

      logger.info('用户创建成功', { userId: savedUser.id, username: savedUser.username });
      
      return savedUser;
    } catch (error) {
      logger.error('用户创建失败', { error: error.message, userData: { ...userData, password: '[HIDDEN]' } });
      throw error;
    }
  }

  /**
   * 根据ID获取用户
   */
  async getUserById(userId) {
    try {
      const user = await this.dataStore.users.findById(userId);
      return user;
    } catch (error) {
      logger.error('获取用户失败', { userId, error: error.message });
      throw error;
    }
  }

  /**
   * 根据用户名获取用户
   */
  async getUserByUsername(username) {
    try {
      const user = await this.dataStore.users.findOne({ username });
      return user;
    } catch (error) {
      logger.error('根据用户名获取用户失败', { username, error: error.message });
      throw error;
    }
  }

  /**
   * 根据邮箱获取用户
   */
  async getUserByEmail(email) {
    try {
      const user = await this.dataStore.users.findOne({ email });
      return user;
    } catch (error) {
      logger.error('根据邮箱获取用户失败', { email, error: error.message });
      throw error;
    }
  }

  /**
   * 更新用户信息
   */
  async updateUser(userId, updates) {
    try {
      const user = await this.getUserById(userId);
      if (!user) {
        throw new Error('用户不存在');
      }

      // 如果更新邮箱，检查是否已被其他用户使用
      if (updates.email && updates.email !== user.email) {
        if (!isValidEmail(updates.email)) {
          throw new Error('邮箱格式无效');
        }

        const existingUser = await this.getUserByEmail(updates.email);
        if (existingUser && existingUser.id !== userId) {
          throw new Error('邮箱已被其他用户使用');
        }
      }

      // 更新用户信息
      user.updateInfo(updates);

      // 保存更新
      const updatedUser = await this.dataStore.users.update(userId, user);

      logger.info('用户信息更新成功', { userId, updates });

      return updatedUser;
    } catch (error) {
      logger.error('用户信息更新失败', { userId, updates, error: error.message });
      throw error;
    }
  }

  /**
   * 更改用户密码
   */
  async changePassword(userId, currentPassword, newPassword) {
    try {
      const user = await this.getUserById(userId);
      if (!user) {
        throw new Error('用户不存在');
      }

      // 验证当前密码
      const isCurrentPasswordValid = await user.validatePassword(currentPassword);
      if (!isCurrentPasswordValid) {
        throw new Error('当前密码不正确');
      }

      // 验证新密码
      if (!isValidPassword(newPassword)) {
        throw new Error('新密码格式无效，至少8位，需包含字母和数字');
      }

      // 设置新密码
      await user.setPassword(newPassword);

      // 保存更新
      await this.dataStore.users.update(userId, user);

      logger.info('用户密码更改成功', { userId });

      return true;
    } catch (error) {
      logger.error('用户密码更改失败', { userId, error: error.message });
      throw error;
    }
  }

  /**
   * 验证用户登录
   */
  async validateLogin(usernameOrEmail, password) {
    try {
      // 尝试通过用户名或邮箱查找用户
      let user = await this.getUserByUsername(usernameOrEmail);
      if (!user) {
        user = await this.getUserByEmail(usernameOrEmail);
      }

      if (!user) {
        throw new Error('用户名或邮箱不存在');
      }

      if (!user.isActive) {
        throw new Error('用户账户已被停用');
      }

      // 验证密码
      const isPasswordValid = await user.validatePassword(password);
      if (!isPasswordValid) {
        throw new Error('密码不正确');
      }

      logger.info('用户登录验证成功', { userId: user.id, username: user.username });

      return user;
    } catch (error) {
      logger.error('用户登录验证失败', { usernameOrEmail, error: error.message });
      throw error;
    }
  }

  /**
   * 获取所有用户（分页）
   */
  async getAllUsers(options = {}) {
    try {
      const { page = 1, limit = 10, search = '' } = options;
      
      let filters = {};
      if (search) {
        filters = {
          $or: [
            { username: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } },
            { firstName: { $regex: search, $options: 'i' } },
            { lastName: { $regex: search, $options: 'i' } }
          ]
        };
      }

      const users = await this.dataStore.users.findMany(filters, {
        page,
        limit,
        sort: { createdAt: -1 }
      });

      return users;
    } catch (error) {
      logger.error('获取用户列表失败', { options, error: error.message });
      throw error;
    }
  }

  /**
   * 停用/激活用户
   */
  async setUserActiveStatus(userId, isActive) {
    try {
      const user = await this.getUserById(userId);
      if (!user) {
        throw new Error('用户不存在');
      }

      user.setActiveStatus(isActive);
      await this.dataStore.users.update(userId, user);

      logger.info('用户状态更新成功', { userId, isActive });

      return user;
    } catch (error) {
      logger.error('用户状态更新失败', { userId, isActive, error: error.message });
      throw error;
    }
  }
}

export default UserService;