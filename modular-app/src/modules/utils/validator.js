/**
 * 数据验证工具模块
 * 提供各种数据验证功能
 */

class Validator {
    constructor() {
        this.rules = new Map();
        this.customValidators = new Map();
    }

    /**
     * 验证邮箱格式
     * @param {string} email - 邮箱地址
     * @returns {boolean} 验证结果
     */
    isEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    /**
     * 验证手机号格式
     * @param {string} phone - 手机号
     * @returns {boolean} 验证结果
     */
    isPhone(phone) {
        const phoneRegex = /^1[3-9]\d{9}$/;
        return phoneRegex.test(phone);
    }

    /**
     * 验证URL格式
     * @param {string} url - URL地址
     * @returns {boolean} 验证结果
     */
    isURL(url) {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    }

    /**
     * 验证身份证号格式
     * @param {string} idCard - 身份证号
     * @returns {boolean} 验证结果
     */
    isIdCard(idCard) {
        const idCardRegex = /^[1-9]\d{5}(18|19|20)\d{2}((0[1-9])|(1[0-2]))(([0-2][1-9])|10|20|30|31)\d{3}[0-9Xx]$/;
        return idCardRegex.test(idCard);
    }

    /**
     * 验证密码强度
     * @param {string} password - 密码
     * @param {Object} options - 选项
     * @returns {Object} 验证结果
     */
    validatePassword(password, options = {}) {
        const {
            minLength = 8,
            requireUppercase = true,
            requireLowercase = true,
            requireNumbers = true,
            requireSpecialChars = false
        } = options;

        const result = {
            isValid: true,
            errors: []
        };

        if (password.length < minLength) {
            result.isValid = false;
            result.errors.push(`密码长度至少 ${minLength} 位`);
        }

        if (requireUppercase && !/[A-Z]/.test(password)) {
            result.isValid = false;
            result.errors.push('密码必须包含大写字母');
        }

        if (requireLowercase && !/[a-z]/.test(password)) {
            result.isValid = false;
            result.errors.push('密码必须包含小写字母');
        }

        if (requireNumbers && !/\d/.test(password)) {
            result.isValid = false;
            result.errors.push('密码必须包含数字');
        }

        if (requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
            result.isValid = false;
            result.errors.push('密码必须包含特殊字符');
        }

        return result;
    }

    /**
     * 验证对象结构
     * @param {Object} data - 要验证的数据
     * @param {Object} schema - 验证模式
     * @returns {Object} 验证结果
     */
    validateSchema(data, schema) {
        const result = {
            isValid: true,
            errors: []
        };

        for (const [field, rules] of Object.entries(schema)) {
            const value = data[field];
            const fieldResult = this.validateField(value, rules, field);
            
            if (!fieldResult.isValid) {
                result.isValid = false;
                result.errors.push(...fieldResult.errors);
            }
        }

        return result;
    }

    /**
     * 验证字段
     * @param {*} value - 字段值
     * @param {Object} rules - 验证规则
     * @param {string} fieldName - 字段名
     * @returns {Object} 验证结果
     */
    validateField(value, rules, fieldName) {
        const result = {
            isValid: true,
            errors: []
        };

        // 必填验证
        if (rules.required && (value === undefined || value === null || value === '')) {
            result.isValid = false;
            result.errors.push(`${fieldName} 是必填字段`);
            return result;
        }

        // 如果字段为空且不是必填，跳过其他验证
        if (value === undefined || value === null || value === '') {
            return result;
        }

        // 类型验证
        if (rules.type && typeof value !== rules.type) {
            result.isValid = false;
            result.errors.push(`${fieldName} 必须是 ${rules.type} 类型`);
        }

        // 字符串长度验证
        if (rules.type === 'string') {
            if (rules.minLength && value.length < rules.minLength) {
                result.isValid = false;
                result.errors.push(`${fieldName} 长度不能少于 ${rules.minLength} 个字符`);
            }
            if (rules.maxLength && value.length > rules.maxLength) {
                result.isValid = false;
                result.errors.push(`${fieldName} 长度不能超过 ${rules.maxLength} 个字符`);
            }
        }

        // 数值范围验证
        if (rules.type === 'number') {
            if (rules.min !== undefined && value < rules.min) {
                result.isValid = false;
                result.errors.push(`${fieldName} 不能小于 ${rules.min}`);
            }
            if (rules.max !== undefined && value > rules.max) {
                result.isValid = false;
                result.errors.push(`${fieldName} 不能大于 ${rules.max}`);
            }
        }

        // 枚举值验证
        if (rules.enum && !rules.enum.includes(value)) {
            result.isValid = false;
            result.errors.push(`${fieldName} 必须是以下值之一: ${rules.enum.join(', ')}`);
        }

        // 正则表达式验证
        if (rules.pattern && !rules.pattern.test(value)) {
            result.isValid = false;
            result.errors.push(`${fieldName} 格式不正确`);
        }

        // 自定义验证器
        if (rules.validator && typeof rules.validator === 'function') {
            const customResult = rules.validator(value);
            if (customResult !== true) {
                result.isValid = false;
                result.errors.push(customResult || `${fieldName} 验证失败`);
            }
        }

        return result;
    }

    /**
     * 添加自定义验证器
     * @param {string} name - 验证器名称
     * @param {Function} validator - 验证函数
     */
    addValidator(name, validator) {
        this.customValidators.set(name, validator);
    }

    /**
     * 使用自定义验证器
     * @param {string} name - 验证器名称
     * @param {*} value - 要验证的值
     * @returns {boolean} 验证结果
     */
    useCustomValidator(name, value) {
        const validator = this.customValidators.get(name);
        if (!validator) {
            throw new Error(`自定义验证器 ${name} 不存在`);
        }
        return validator(value);
    }

    /**
     * 清理数据
     * @param {Object} data - 原始数据
     * @param {Object} schema - 清理模式
     * @returns {Object} 清理后的数据
     */
    sanitize(data, schema) {
        const sanitized = {};

        for (const [field, rules] of Object.entries(schema)) {
            let value = data[field];

            if (value === undefined || value === null) {
                if (rules.default !== undefined) {
                    value = rules.default;
                } else {
                    continue;
                }
            }

            // 类型转换
            if (rules.type === 'string') {
                value = String(value);
            } else if (rules.type === 'number') {
                value = Number(value);
                if (isNaN(value)) {
                    value = rules.default || 0;
                }
            } else if (rules.type === 'boolean') {
                value = Boolean(value);
            }

            // 字符串清理
            if (rules.type === 'string' && rules.trim) {
                value = value.trim();
            }

            // 字符串转换
            if (rules.type === 'string' && rules.toLowerCase) {
                value = value.toLowerCase();
            }
            if (rules.type === 'string' && rules.toUpperCase) {
                value = value.toUpperCase();
            }

            sanitized[field] = value;
        }

        return sanitized;
    }
}

module.exports = Validator;