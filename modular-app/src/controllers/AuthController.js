/**
 * 认证控制器
 * 处理用户认证相关的HTTP请求
 */
import UserService from '../services/UserService.js';
import { generateToken } from '../middleware/auth.js';
import { 
  successResponse, 
  createdResponse, 
  errorResponse,
  unauthorizedResponse
} from '../utils/response.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import logger from '../utils/logger.js';

/**
 * 认证控制器类
 */
export class AuthController {
  constructor() {
    this.userService = new UserService();
  }

  /**
   * 用户注册
   */
  register = asyncHandler(async (req, res) => {
    const { username, email, password, firstName, lastName } = req.body;

    // 创建用户
    const user = await this.userService.createUser({
      username,
      email,
      password,
      firstName,
      lastName
    });

    // 生成JWT令牌
    const token = generateToken(user);

    // 返回用户信息和令牌
    const responseData = {
      user: user.getPublicInfo(),
      token,
      expiresIn: '24h'
    };

    logger.info('用户注册成功', { userId: user.id, username: user.username });

    return createdResponse(res, responseData, '注册成功');
  });

  /**
   * 用户登录
   */
  login = asyncHandler(async (req, res) => {
    const { usernameOrEmail, password } = req.body;

    // 验证用户登录
    const user = await this.userService.validateLogin(usernameOrEmail, password);

    // 生成JWT令牌
    const token = generateToken(user);

    // 返回用户信息和令牌
    const responseData = {
      user: user.getPublicInfo(),
      token,
      expiresIn: '24h'
    };

    logger.info('用户登录成功', { userId: user.id, username: user.username });

    return successResponse(res, responseData, '登录成功');
  });

  /**
   * 获取当前用户信息
   */
  getCurrentUser = asyncHandler(async (req, res) => {
    const userId = req.user.id;

    // 获取最新的用户信息
    const user = await this.userService.getUserById(userId);
    
    if (!user) {
      return unauthorizedResponse(res, '用户不存在');
    }

    if (!user.isActive) {
      return unauthorizedResponse(res, '用户账户已被停用');
    }

    return successResponse(res, user.getPublicInfo(), '获取用户信息成功');
  });

  /**
   * 更新当前用户信息
   */
  updateCurrentUser = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { firstName, lastName, email } = req.body;

    // 更新用户信息
    const updatedUser = await this.userService.updateUser(userId, {
      firstName,
      lastName,
      email
    });

    logger.info('用户信息更新成功', { userId });

    return successResponse(res, updatedUser.getPublicInfo(), '用户信息更新成功');
  });

  /**
   * 修改密码
   */
  changePassword = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    // 修改密码
    await this.userService.changePassword(userId, currentPassword, newPassword);

    logger.info('用户密码修改成功', { userId });

    return successResponse(res, null, '密码修改成功');
  });

  /**
   * 刷新令牌
   */
  refreshToken = asyncHandler(async (req, res) => {
    const userId = req.user.id;

    // 获取最新的用户信息
    const user = await this.userService.getUserById(userId);
    
    if (!user) {
      return unauthorizedResponse(res, '用户不存在');
    }

    if (!user.isActive) {
      return unauthorizedResponse(res, '用户账户已被停用');
    }

    // 生成新的JWT令牌
    const token = generateToken(user);

    const responseData = {
      user: user.getPublicInfo(),
      token,
      expiresIn: '24h'
    };

    logger.info('令牌刷新成功', { userId });

    return successResponse(res, responseData, '令牌刷新成功');
  });

  /**
   * 用户登出
   */
  logout = asyncHandler(async (req, res) => {
    const userId = req.user.id;

    // 在实际应用中，这里可以将令牌加入黑名单
    // 或者清除服务器端的会话信息

    logger.info('用户登出', { userId });

    return successResponse(res, null, '登出成功');
  });
}

// 创建控制器实例
const authController = new AuthController();

// 导出控制器方法
export const {
  register,
  login,
  getCurrentUser,
  updateCurrentUser,
  changePassword,
  refreshToken,
  logout
} = authController;

export default authController;