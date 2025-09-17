/**
 * 应用配置文件
 * 集中管理应用配置
 */

const config = {
    // 应用基础配置
    app: {
        name: 'ModularApp',
        version: '1.0.0',
        description: '模块化开发示例程序',
        author: 'Developer',
        port: process.env.PORT || 3000,
        environment: process.env.NODE_ENV || 'development'
    },

    // 日志配置
    logger: {
        level: process.env.LOG_LEVEL || 'info',
        format: 'text',
        output: 'console'
    },

    // 数据库配置
    database: {
        type: 'memory', // memory, mysql, postgresql, mongodb
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 3306,
        name: process.env.DB_NAME || 'modular_app',
        username: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        options: {
            charset: 'utf8mb4',
            timezone: '+08:00'
        }
    },

    // API配置
    api: {
        baseURL: process.env.API_BASE_URL || '',
        timeout: 5000,
        retries: 3,
        headers: {
            'User-Agent': 'ModularApp/1.0.0'
        }
    },

    // 安全配置
    security: {
        jwtSecret: process.env.JWT_SECRET || 'your-secret-key',
        passwordMinLength: 8,
        sessionTimeout: 24 * 60 * 60 * 1000, // 24小时
        maxLoginAttempts: 5,
        lockoutDuration: 15 * 60 * 1000 // 15分钟
    },

    // 缓存配置
    cache: {
        type: 'memory', // memory, redis
        ttl: 3600, // 1小时
        maxSize: 1000
    },

    // 文件上传配置
    upload: {
        maxFileSize: 10 * 1024 * 1024, // 10MB
        allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'],
        uploadPath: './uploads'
    },

    // 邮件配置
    email: {
        host: process.env.EMAIL_HOST || 'smtp.gmail.com',
        port: process.env.EMAIL_PORT || 587,
        secure: false,
        auth: {
            user: process.env.EMAIL_USER || '',
            pass: process.env.EMAIL_PASS || ''
        }
    },

    // 开发环境配置
    development: {
        debug: true,
        hotReload: true,
        mockData: true
    },

    // 生产环境配置
    production: {
        debug: false,
        hotReload: false,
        mockData: false,
        minify: true,
        compression: true
    }
};

/**
 * 获取配置
 * @param {string} key - 配置键，支持点号分隔的嵌套键
 * @returns {*} 配置值
 */
function getConfig(key) {
    if (!key) {
        return config;
    }

    const keys = key.split('.');
    let value = config;

    for (const k of keys) {
        if (value && typeof value === 'object' && k in value) {
            value = value[k];
        } else {
            return undefined;
        }
    }

    return value;
}

/**
 * 设置配置
 * @param {string} key - 配置键
 * @param {*} value - 配置值
 */
function setConfig(key, value) {
    const keys = key.split('.');
    const lastKey = keys.pop();
    let target = config;

    for (const k of keys) {
        if (!target[k] || typeof target[k] !== 'object') {
            target[k] = {};
        }
        target = target[k];
    }

    target[lastKey] = value;
}

/**
 * 根据环境获取配置
 * @param {string} key - 配置键
 * @returns {*} 配置值
 */
function getEnvConfig(key) {
    const env = config.app.environment;
    const envConfig = config[env];
    
    if (envConfig && key in envConfig) {
        return envConfig[key];
    }
    
    return getConfig(key);
}

/**
 * 验证配置
 * @returns {Object} 验证结果
 */
function validateConfig() {
    const errors = [];

    // 验证必需配置
    const requiredConfigs = [
        'app.name',
        'app.version',
        'security.jwtSecret'
    ];

    for (const key of requiredConfigs) {
        if (!getConfig(key)) {
            errors.push(`缺少必需配置: ${key}`);
        }
    }

    // 验证端口号
    const port = getConfig('app.port');
    if (port && (isNaN(port) || port < 1 || port > 65535)) {
        errors.push('端口号必须是1-65535之间的数字');
    }

    // 验证密码最小长度
    const minLength = getConfig('security.passwordMinLength');
    if (minLength && (isNaN(minLength) || minLength < 6)) {
        errors.push('密码最小长度不能少于6位');
    }

    return {
        isValid: errors.length === 0,
        errors
    };
}

module.exports = {
    config,
    getConfig,
    setConfig,
    getEnvConfig,
    validateConfig
};