/**
 * 验证工具模块测试
 */

const Validator = require('../../src/modules/utils/validator');

describe('Validator', () => {
    let validator;

    beforeEach(() => {
        validator = new Validator();
    });

    describe('格式验证', () => {
        test('应该验证邮箱格式', () => {
            expect(validator.isEmail('test@example.com')).toBe(true);
            expect(validator.isEmail('user.name@domain.co.uk')).toBe(true);
            expect(validator.isEmail('invalid-email')).toBe(false);
            expect(validator.isEmail('@example.com')).toBe(false);
            expect(validator.isEmail('test@')).toBe(false);
        });

        test('应该验证手机号格式', () => {
            expect(validator.isPhone('13812345678')).toBe(true);
            expect(validator.isPhone('15912345678')).toBe(true);
            expect(validator.isPhone('12345678901')).toBe(false);
            expect(validator.isPhone('1381234567')).toBe(false);
            expect(validator.isPhone('138123456789')).toBe(false);
        });

        test('应该验证URL格式', () => {
            expect(validator.isURL('https://www.example.com')).toBe(true);
            expect(validator.isURL('http://localhost:3000')).toBe(true);
            expect(validator.isURL('ftp://files.example.com')).toBe(true);
            expect(validator.isURL('invalid-url')).toBe(false);
            expect(validator.isURL('not-a-url')).toBe(false);
        });

        test('应该验证身份证号格式', () => {
            expect(validator.isIdCard('110101199001011234')).toBe(true);
            expect(validator.isIdCard('11010119900101X')).toBe(true);
            expect(validator.isIdCard('123456789012345678')).toBe(false);
            expect(validator.isIdCard('11010119900101123')).toBe(false);
        });
    });

    describe('密码验证', () => {
        test('应该验证密码强度', () => {
            const result = validator.validatePassword('MyPassword123!', {
                minLength: 8,
                requireUppercase: true,
                requireLowercase: true,
                requireNumbers: true,
                requireSpecialChars: true
            });

            expect(result.isValid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });

        test('应该拒绝弱密码', () => {
            const result = validator.validatePassword('weak', {
                minLength: 8,
                requireUppercase: true,
                requireLowercase: true,
                requireNumbers: true,
                requireSpecialChars: true
            });

            expect(result.isValid).toBe(false);
            expect(result.errors.length).toBeGreaterThan(0);
        });

        test('应该检查密码长度', () => {
            const result = validator.validatePassword('short', {
                minLength: 8
            });

            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('密码长度至少 8 位');
        });

        test('应该检查大写字母要求', () => {
            const result = validator.validatePassword('lowercase123', {
                requireUppercase: true
            });

            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('密码必须包含大写字母');
        });

        test('应该检查小写字母要求', () => {
            const result = validator.validatePassword('UPPERCASE123', {
                requireLowercase: true
            });

            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('密码必须包含小写字母');
        });

        test('应该检查数字要求', () => {
            const result = validator.validatePassword('NoNumbers', {
                requireNumbers: true
            });

            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('密码必须包含数字');
        });

        test('应该检查特殊字符要求', () => {
            const result = validator.validatePassword('NoSpecialChars123', {
                requireSpecialChars: true
            });

            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('密码必须包含特殊字符');
        });
    });

    describe('模式验证', () => {
        test('应该验证对象结构', () => {
            const schema = {
                name: { type: 'string', required: true, minLength: 2 },
                age: { type: 'number', min: 0, max: 150 },
                email: { type: 'string', pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ }
            };

            const validData = {
                name: 'John Doe',
                age: 30,
                email: 'john@example.com'
            };

            const result = validator.validateSchema(validData, schema);

            expect(result.isValid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });

        test('应该拒绝无效的对象结构', () => {
            const schema = {
                name: { type: 'string', required: true, minLength: 2 },
                age: { type: 'number', min: 0, max: 150 },
                email: { type: 'string', pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ }
            };

            const invalidData = {
                name: 'J', // 太短
                age: 200, // 超出范围
                email: 'invalid-email' // 格式错误
            };

            const result = validator.validateSchema(invalidData, schema);

            expect(result.isValid).toBe(false);
            expect(result.errors.length).toBeGreaterThan(0);
        });

        test('应该检查必填字段', () => {
            const schema = {
                name: { type: 'string', required: true },
                age: { type: 'number', required: false }
            };

            const data = {
                age: 30
                // 缺少必填的 name 字段
            };

            const result = validator.validateSchema(data, schema);

            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('name 是必填字段');
        });

        test('应该检查类型', () => {
            const schema = {
                name: { type: 'string' },
                age: { type: 'number' }
            };

            const data = {
                name: 123, // 应该是字符串
                age: 'thirty' // 应该是数字
            };

            const result = validator.validateSchema(data, schema);

            expect(result.isValid).toBe(false);
            expect(result.errors.length).toBeGreaterThanOrEqual(2);
        });

        test('应该检查字符串长度', () => {
            const schema = {
                name: { type: 'string', minLength: 3, maxLength: 10 }
            };

            const shortData = { name: 'Jo' };
            const longData = { name: 'VeryLongName' };

            const shortResult = validator.validateSchema(shortData, schema);
            const longResult = validator.validateSchema(longData, schema);

            expect(shortResult.isValid).toBe(false);
            expect(longResult.isValid).toBe(false);
        });

        test('应该检查数值范围', () => {
            const schema = {
                age: { type: 'number', min: 18, max: 65 }
            };

            const youngData = { age: 16 };
            const oldData = { age: 70 };

            const youngResult = validator.validateSchema(youngData, schema);
            const oldResult = validator.validateSchema(oldData, schema);

            expect(youngResult.isValid).toBe(false);
            expect(oldResult.isValid).toBe(false);
        });

        test('应该检查枚举值', () => {
            const schema = {
                status: { type: 'string', enum: ['active', 'inactive', 'pending'] }
            };

            const validData = { status: 'active' };
            const invalidData = { status: 'unknown' };

            const validResult = validator.validateSchema(validData, schema);
            const invalidResult = validator.validateSchema(invalidData, schema);

            expect(validResult.isValid).toBe(true);
            expect(invalidResult.isValid).toBe(false);
        });

        test('应该检查正则表达式', () => {
            const schema = {
                phone: { type: 'string', pattern: /^1[3-9]\d{9}$/ }
            };

            const validData = { phone: '13812345678' };
            const invalidData = { phone: '12345678901' };

            const validResult = validator.validateSchema(validData, schema);
            const invalidResult = validator.validateSchema(invalidData, schema);

            expect(validResult.isValid).toBe(true);
            expect(invalidResult.isValid).toBe(false);
        });
    });

    describe('自定义验证器', () => {
        test('应该能够添加自定义验证器', () => {
            validator.addValidator('even', (value) => {
                return value % 2 === 0 ? true : '必须是偶数';
            });

            expect(validator.useCustomValidator('even', 4)).toBe(true);
            expect(validator.useCustomValidator('even', 3)).toBe('必须是偶数');
        });

        test('应该拒绝使用不存在的自定义验证器', () => {
            expect(() => {
                validator.useCustomValidator('nonexistent', 'value');
            }).toThrow('自定义验证器 nonexistent 不存在');
        });
    });

    describe('数据清理', () => {
        test('应该能够清理和转换数据', () => {
            const schema = {
                name: { type: 'string', trim: true, toLowerCase: true },
                age: { type: 'number', default: 0 },
                active: { type: 'boolean', default: false },
                email: { type: 'string', trim: true, toLowerCase: true }
            };

            const rawData = {
                name: '  JOHN DOE  ',
                age: '30',
                active: 'true',
                email: '  JOHN@EXAMPLE.COM  '
            };

            const cleanedData = validator.sanitize(rawData, schema);

            expect(cleanedData.name).toBe('john doe');
            expect(cleanedData.age).toBe(30);
            expect(cleanedData.active).toBe(true);
            expect(cleanedData.email).toBe('john@example.com');
        });

        test('应该使用默认值', () => {
            const schema = {
                name: { type: 'string', default: 'Unknown' },
                age: { type: 'number', default: 0 }
            };

            const rawData = {};

            const cleanedData = validator.sanitize(rawData, schema);

            expect(cleanedData.name).toBe('Unknown');
            expect(cleanedData.age).toBe(0);
        });

        test('应该处理类型转换错误', () => {
            const schema = {
                age: { type: 'number', default: 0 }
            };

            const rawData = { age: 'not-a-number' };

            const cleanedData = validator.sanitize(rawData, schema);

            expect(cleanedData.age).toBe(0);
        });
    });
});