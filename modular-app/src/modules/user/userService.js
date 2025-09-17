/**
 * 用户管理模块
 * 提供用户注册、登录、信息管理等功能
 */

class UserService {
    constructor() {
        this.users = new Map();
        this.currentUser = null;
    }

    /**
     * 用户注册
     * @param {Object} userData - 用户数据
     * @param {string} userData.username - 用户名
     * @param {string} userData.email - 邮箱
     * @param {string} userData.password - 密码
     * @returns {Object} 注册结果
     */
    async register(userData) {
        try {
            const { username, email, password } = userData;
            
            // 验证必填字段
            if (!username || !email || !password) {
                throw new Error('用户名、邮箱和密码不能为空');
            }

            // 检查用户是否已存在
            if (this.users.has(email)) {
                throw new Error('该邮箱已被注册');
            }

            // 创建用户对象
            const user = {
                id: this.generateUserId(),
                username,
                email,
                password: this.hashPassword(password),
                createdAt: new Date(),
                isActive: true
            };

            // 保存用户
            this.users.set(email, user);

            return {
                success: true,
                message: '注册成功',
                user: this.sanitizeUser(user)
            };
        } catch (error) {
            return {
                success: false,
                message: error.message
            };
        }
    }

    /**
     * 用户登录
     * @param {string} email - 邮箱
     * @param {string} password - 密码
     * @returns {Object} 登录结果
     */
    async login(email, password) {
        try {
            const user = this.users.get(email);
            
            if (!user) {
                throw new Error('用户不存在');
            }

            if (!user.isActive) {
                throw new Error('账户已被禁用');
            }

            if (!this.verifyPassword(password, user.password)) {
                throw new Error('密码错误');
            }

            this.currentUser = user;

            return {
                success: true,
                message: '登录成功',
                user: this.sanitizeUser(user)
            };
        } catch (error) {
            return {
                success: false,
                message: error.message
            };
        }
    }

    /**
     * 获取当前用户信息
     * @returns {Object|null} 当前用户信息
     */
    getCurrentUser() {
        return this.currentUser ? this.sanitizeUser(this.currentUser) : null;
    }

    /**
     * 用户登出
     * @returns {Object} 登出结果
     */
    logout() {
        this.currentUser = null;
        return {
            success: true,
            message: '登出成功'
        };
    }

    /**
     * 更新用户信息
     * @param {Object} updateData - 更新数据
     * @returns {Object} 更新结果
     */
    async updateUser(updateData) {
        try {
            if (!this.currentUser) {
                throw new Error('请先登录');
            }

            const user = this.users.get(this.currentUser.email);
            Object.assign(user, updateData);
            this.currentUser = user;

            return {
                success: true,
                message: '用户信息更新成功',
                user: this.sanitizeUser(user)
            };
        } catch (error) {
            return {
                success: false,
                message: error.message
            };
        }
    }

    /**
     * 生成用户ID
     * @returns {string} 用户ID
     */
    generateUserId() {
        return 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * 密码哈希
     * @param {string} password - 原始密码
     * @returns {string} 哈希后的密码
     */
    hashPassword(password) {
        // 简单的哈希实现，实际项目中应使用bcrypt等安全库
        return Buffer.from(password).toString('base64');
    }

    /**
     * 验证密码
     * @param {string} password - 原始密码
     * @param {string} hashedPassword - 哈希后的密码
     * @returns {boolean} 验证结果
     */
    verifyPassword(password, hashedPassword) {
        return this.hashPassword(password) === hashedPassword;
    }

    /**
     * 清理用户敏感信息
     * @param {Object} user - 用户对象
     * @returns {Object} 清理后的用户对象
     */
    sanitizeUser(user) {
        const { password, ...sanitizedUser } = user;
        return sanitizedUser;
    }

    /**
     * 获取所有用户（管理员功能）
     * @returns {Array} 用户列表
     */
    getAllUsers() {
        return Array.from(this.users.values()).map(user => this.sanitizeUser(user));
    }
}

module.exports = UserService;