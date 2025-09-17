/**
 * 主应用程序测试
 */

const ModularApp = require('../src/app');

describe('ModularApp', () => {
    let app;

    beforeEach(() => {
        app = new ModularApp({
            logger: { level: 'error' } // 减少测试时的日志输出
        });
    });

    afterEach(async () => {
        await app.cleanup();
    });

    describe('初始化', () => {
        test('应该正确初始化应用', () => {
            expect(app).toBeDefined();
            expect(app.logger).toBeDefined();
            expect(app.validator).toBeDefined();
            expect(app.userService).toBeDefined();
            expect(app.dataService).toBeDefined();
            expect(app.apiService).toBeDefined();
        });

        test('应该设置正确的配置', () => {
            expect(app.config.name).toBe('ModularApp');
            expect(app.config.version).toBe('1.0.0');
        });
    });

    describe('用户管理', () => {
        test('应该能够注册新用户', async () => {
            const userData = {
                username: 'testuser',
                email: 'test@example.com',
                password: 'password123'
            };

            const result = await app.registerUser(userData);
            
            expect(result.success).toBe(true);
            expect(result.user).toBeDefined();
            expect(result.user.username).toBe('testuser');
            expect(result.user.email).toBe('test@example.com');
        });

        test('应该拒绝重复注册', async () => {
            const userData = {
                username: 'testuser',
                email: 'test@example.com',
                password: 'password123'
            };

            // 第一次注册
            await app.registerUser(userData);
            
            // 第二次注册相同邮箱
            const result = await app.registerUser(userData);
            
            expect(result.success).toBe(false);
            expect(result.message).toContain('已被注册');
        });

        test('应该能够登录用户', async () => {
            const userData = {
                username: 'testuser',
                email: 'test@example.com',
                password: 'password123'
            };

            // 先注册用户
            await app.registerUser(userData);
            
            // 登录用户
            const result = await app.loginUser('test@example.com', 'password123');
            
            expect(result.success).toBe(true);
            expect(result.user).toBeDefined();
        });

        test('应该拒绝错误的密码', async () => {
            const userData = {
                username: 'testuser',
                email: 'test@example.com',
                password: 'password123'
            };

            // 先注册用户
            await app.registerUser(userData);
            
            // 使用错误密码登录
            const result = await app.loginUser('test@example.com', 'wrongpassword');
            
            expect(result.success).toBe(false);
            expect(result.message).toContain('密码错误');
        });
    });

    describe('数据管理', () => {
        test('应该能够存储数据', async () => {
            const result = await app.storeData('test:key', { value: 'test data' });
            
            expect(result.success).toBe(true);
            expect(result.key).toBe('test:key');
        });

        test('应该能够获取数据', async () => {
            const testData = { value: 'test data' };
            
            // 先存储数据
            await app.storeData('test:key', testData);
            
            // 获取数据
            const result = await app.getData('test:key');
            
            expect(result.success).toBe(true);
            expect(result.data).toEqual(testData);
        });

        test('应该返回不存在的数据错误', async () => {
            const result = await app.getData('nonexistent:key');
            
            expect(result.success).toBe(false);
            expect(result.message).toContain('不存在');
        });
    });

    describe('数据验证', () => {
        test('应该验证用户数据', () => {
            const validData = {
                username: 'testuser',
                email: 'test@example.com',
                password: 'password123',
                age: 25
            };

            const result = app.validateUserData(validData);
            
            expect(result.isValid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });

        test('应该拒绝无效的用户数据', () => {
            const invalidData = {
                username: 'ab', // 太短
                email: 'invalid-email', // 无效邮箱
                password: '123' // 太短
            };

            const result = app.validateUserData(invalidData);
            
            expect(result.isValid).toBe(false);
            expect(result.errors.length).toBeGreaterThan(0);
        });
    });

    describe('应用状态', () => {
        test('应该返回应用状态', () => {
            const status = app.getStatus();
            
            expect(status).toBeDefined();
            expect(status.app).toBeDefined();
            expect(status.app.name).toBe('ModularApp');
            expect(status.user).toBeDefined();
            expect(status.data).toBeDefined();
        });
    });

    describe('错误处理', () => {
        test('应该处理注册时的验证错误', async () => {
            const invalidData = {
                username: 'ab', // 太短
                email: 'invalid-email',
                password: '123'
            };

            const result = await app.registerUser(invalidData);
            
            expect(result.success).toBe(false);
            expect(result.errors).toBeDefined();
        });

        test('应该处理数据存储错误', async () => {
            // 尝试存储不支持的数据类型
            const result = await app.storeData('test:key', undefined);
            
            expect(result.success).toBe(false);
        });
    });
});