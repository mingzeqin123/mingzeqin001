/**
 * 用户数据模型
 * 定义用户相关的数据结构和业务逻辑
 */
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';

/**
 * 用户类
 */
export class User {
  constructor({
    id = uuidv4(),
    username,
    email,
    password,
    firstName = '',
    lastName = '',
    isActive = true,
    createdAt = new Date(),
    updatedAt = new Date()
  }) {
    this.id = id;
    this.username = username;
    this.email = email;
    this.password = password;
    this.firstName = firstName;
    this.lastName = lastName;
    this.isActive = isActive;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  /**
   * 获取用户全名
   */
  getFullName() {
    return `${this.firstName} ${this.lastName}`.trim() || this.username;
  }

  /**
   * 获取用户的公开信息（不包含密码）
   */
  getPublicInfo() {
    const { password, ...publicInfo } = this;
    return publicInfo;
  }

  /**
   * 验证密码
   */
  async validatePassword(plainPassword) {
    return await bcrypt.compare(plainPassword, this.password);
  }

  /**
   * 设置密码（加密）
   */
  async setPassword(plainPassword) {
    const saltRounds = 12;
    this.password = await bcrypt.hash(plainPassword, saltRounds);
    this.updatedAt = new Date();
  }

  /**
   * 更新用户信息
   */
  updateInfo(updates) {
    const allowedUpdates = ['firstName', 'lastName', 'email'];
    
    for (const [key, value] of Object.entries(updates)) {
      if (allowedUpdates.includes(key) && value !== undefined) {
        this[key] = value;
      }
    }
    
    this.updatedAt = new Date();
  }

  /**
   * 激活/停用用户
   */
  setActiveStatus(isActive) {
    this.isActive = isActive;
    this.updatedAt = new Date();
  }

  /**
   * 转换为JSON对象
   */
  toJSON() {
    return {
      id: this.id,
      username: this.username,
      email: this.email,
      firstName: this.firstName,
      lastName: this.lastName,
      fullName: this.getFullName(),
      isActive: this.isActive,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}

export default User;