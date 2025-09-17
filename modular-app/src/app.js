/**
 * 主应用程序入口
 * 模块化开发示例程序
 */

const UserService = require('./modules/user/userService');
const DataService = require('./modules/data/dataService');
const Logger = require('./modules/utils/logger');
const Validator = require('./modules/utils/validator');
const ApiService = require('./modules/api/apiService');

class ModularApp {
    constructor(options = {}) {
        // 初始化核心服务
        this.logger = new Logger(options.logger || {});
        this.validator = new Validator();
        this.userService = new UserService();
        this.dataService = new DataService();
        this.apiService = new ApiService(options.api || {});
        
        // 应用配置
        this.config = {
            name: 'ModularApp',
            version: '1.0.0',
            environment: process.env.NODE_ENV || 'development',
            ...options
        };

        // 初始化应用
        this.initialize();
    }

    /**
     * 初始化应用
     */
    async initialize() {
        try {
            this.logger.info('正在初始化应用...', { 
                name: this.config.name, 
                version: this.config.version 
            });

            // 设置全局错误处理
            this.setupErrorHandling();

            // 设置API拦截器
            this.setupApiInterceptors();

            // 注册自定义验证器
            this.setupCustomValidators();

            this.logger.info('应用初始化完成');
        } catch (error) {
            this.logger.error('应用初始化失败', { error: error.message });
            throw error;
        }
    }

    /**
     * 设置全局错误处理
     */
    setupErrorHandling() {
        process.on('uncaughtException', (error) => {
            this.logger.error('未捕获的异常', { error: error.message, stack: error.stack });
            process.exit(1);
        });

        process.on('unhandledRejection', (reason, promise) => {
            this.logger.error('未处理的Promise拒绝', { reason, promise });
        });
    }

    /**
     * 设置API拦截器
     */
    setupApiInterceptors() {
        // 请求拦截器 - 添加认证头
        this.apiService.addRequestInterceptor((options, data) => {
            const currentUser = this.userService.getCurrentUser();
            if (currentUser) {
                options.headers = {
                    ...options.headers,
                    'Authorization': `Bearer ${currentUser.id}`
                };
            }
            return { options, data };
        });

        // 响应拦截器 - 统一错误处理
        this.apiService.addResponseInterceptor((response) => {
            if (response.status >= 400) {
                this.logger.warn('API请求失败', { 
                    status: response.status, 
                    statusText: response.statusText 
                });
            }
            return response;
        });
    }

    /**
     * 设置自定义验证器
     */
    setupCustomValidators() {
        // 用户名验证器
        this.validator.addValidator('username', (value) => {
            if (!/^[a-zA-Z0-9_]{3,20}$/.test(value)) {
                return '用户名只能包含字母、数字和下划线，长度3-20位';
            }
            return true;
        });

        // 年龄验证器
        this.validator.addValidator('age', (value) => {
            const age = parseInt(value);
            if (isNaN(age) || age < 0 || age > 150) {
                return '年龄必须是0-150之间的数字';
            }
            return true;
        });
    }

    /**
     * 用户注册
     * @param {Object} userData - 用户数据
     * @returns {Promise<Object>} 注册结果
     */
    async registerUser(userData) {
        try {
            // 验证用户数据
            const validationResult = this.validateUserData(userData);
            if (!validationResult.isValid) {
                return {
                    success: false,
                    message: '数据验证失败',
                    errors: validationResult.errors
                };
            }

            // 注册用户
            const result = await this.userService.register(userData);
            
            if (result.success) {
                this.logger.info('用户注册成功', { userId: result.user.id });
            } else {
                this.logger.warn('用户注册失败', { reason: result.message });
            }

            return result;
        } catch (error) {
            this.logger.error('用户注册异常', { error: error.message });
            return {
                success: false,
                message: '注册过程中发生错误'
            };
        }
    }

    /**
     * 用户登录
     * @param {string} email - 邮箱
     * @param {string} password - 密码
     * @returns {Promise<Object>} 登录结果
     */
    async loginUser(email, password) {
        try {
            const result = await this.userService.login(email, password);
            
            if (result.success) {
                this.logger.info('用户登录成功', { userId: result.user.id });
            } else {
                this.logger.warn('用户登录失败', { reason: result.message });
            }

            return result;
        } catch (error) {
            this.logger.error('用户登录异常', { error: error.message });
            return {
                success: false,
                message: '登录过程中发生错误'
            };
        }
    }

    /**
     * 存储数据
     * @param {string} key - 数据键
     * @param {*} value - 数据值
     * @param {Object} options - 选项
     * @returns {Promise<Object>} 存储结果
     */
    async storeData(key, value, options = {}) {
        try {
            const result = await this.dataService.store(key, value, options);
            
            if (result.success) {
                this.logger.debug('数据存储成功', { key, dataType: result.dataType });
            } else {
                this.logger.warn('数据存储失败', { key, reason: result.message });
            }

            return result;
        } catch (error) {
            this.logger.error('数据存储异常', { key, error: error.message });
            return {
                success: false,
                message: '数据存储过程中发生错误'
            };
        }
    }

    /**
     * 获取数据
     * @param {string} key - 数据键
     * @returns {Promise<Object>} 获取结果
     */
    async getData(key) {
        try {
            const result = await this.dataService.get(key);
            
            if (result.success) {
                this.logger.debug('数据获取成功', { key });
            } else {
                this.logger.warn('数据获取失败', { key, reason: result.message });
            }

            return result;
        } catch (error) {
            this.logger.error('数据获取异常', { key, error: error.message });
            return {
                success: false,
                message: '数据获取过程中发生错误'
            };
        }
    }

    /**
     * 验证用户数据
     * @param {Object} userData - 用户数据
     * @returns {Object} 验证结果
     */
    validateUserData(userData) {
        const schema = {
            username: {
                type: 'string',
                required: true,
                minLength: 3,
                maxLength: 20,
                validator: (value) => this.validator.useCustomValidator('username', value)
            },
            email: {
                type: 'string',
                required: true,
                pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
            },
            password: {
                type: 'string',
                required: true,
                minLength: 8
            },
            age: {
                type: 'number',
                required: false,
                min: 0,
                max: 150,
                validator: (value) => this.validator.useCustomValidator('age', value)
            }
        };

        return this.validator.validateSchema(userData, schema);
    }

    /**
     * 获取应用状态
     * @returns {Object} 应用状态
     */
    getStatus() {
        const currentUser = this.userService.getCurrentUser();
        const dataStats = this.dataService.getStats();
        const logs = this.logger.getLogs({ limit: 10 });

        return {
            app: {
                name: this.config.name,
                version: this.config.version,
                environment: this.config.environment,
                uptime: process.uptime()
            },
            user: {
                isLoggedIn: !!currentUser,
                currentUser: currentUser
            },
            data: dataStats,
            logs: logs.length
        };
    }

    /**
     * 清理资源
     */
    async cleanup() {
        try {
            this.logger.info('正在清理应用资源...');
            
            // 清理过期数据
            await this.dataService.cleanup();
            
            // 用户登出
            this.userService.logout();
            
            this.logger.info('应用资源清理完成');
        } catch (error) {
            this.logger.error('资源清理失败', { error: error.message });
        }
    }
}

module.exports = ModularApp;