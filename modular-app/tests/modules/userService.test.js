/**
 * 用户服务模块测试
 */

const UserService = require('../../src/modules/user/userService');

describe('UserService', () => {
    let userService;

    beforeEach(() => {
        userService = new UserService();
    });

    describe('用户注册', () => {
        test('应该能够注册新用户', async () => {
            const userData = {
                username: 'testuser',
                email: 'test@example.com',
                password: 'password123'
            };

            const result = await userService.register(userData);
            
            expect(result.success).toBe(true);
            expect(result.user).toBeDefined();
            expect(result.user.username).toBe('testuser');
            expect(result.user.email).toBe('test@example.com');
            expect(result.user.password).toBeUndefined(); // 密码应该被清理
        });

        test('应该拒绝重复注册', async () => {
            const userData = {
                username: 'testuser',
                email: 'test@example.com',
                password: 'password123'
            };

            // 第一次注册
            await userService.register(userData);
            
            // 第二次注册相同邮箱
            const result = await userService.register(userData);
            
            expect(result.success).toBe(false);
            expect(result.message).toContain('已被注册');
        });

        test('应该验证必填字段', async () => {
            const invalidData = {
                username: 'testuser'
                // 缺少 email 和 password
            };

            const result = await userService.register(invalidData);
            
            expect(result.success).toBe(false);
            expect(result.message).toContain('不能为空');
        });
    });

    describe('用户登录', () => {
        beforeEach(async () => {
            // 先注册一个测试用户
            await userService.register({
                username: 'testuser',
                email: 'test@example.com',
                password: 'password123'
            });
        });

        test('应该能够登录有效用户', async () => {
            const result = await userService.login('test@example.com', 'password123');
            
            expect(result.success).toBe(true);
            expect(result.user).toBeDefined();
            expect(result.user.email).toBe('test@example.com');
        });

        test('应该拒绝不存在的用户', async () => {
            const result = await userService.login('nonexistent@example.com', 'password123');
            
            expect(result.success).toBe(false);
            expect(result.message).toContain('不存在');
        });

        test('应该拒绝错误的密码', async () => {
            const result = await userService.login('test@example.com', 'wrongpassword');
            
            expect(result.success).toBe(false);
            expect(result.message).toContain('密码错误');
        });
    });

    describe('用户管理', () => {
        beforeEach(async () => {
            // 注册并登录用户
            await userService.register({
                username: 'testuser',
                email: 'test@example.com',
                password: 'password123'
            });
            await userService.login('test@example.com', 'password123');
        });

        test('应该能够获取当前用户', () => {
            const currentUser = userService.getCurrentUser();
            
            expect(currentUser).toBeDefined();
            expect(currentUser.email).toBe('test@example.com');
            expect(currentUser.password).toBeUndefined();
        });

        test('应该能够更新用户信息', async () => {
            const updateData = {
                username: 'updateduser',
                age: 30
            };

            const result = await userService.updateUser(updateData);
            
            expect(result.success).toBe(true);
            expect(result.user.username).toBe('updateduser');
            expect(result.user.age).toBe(30);
        });

        test('应该能够登出用户', () => {
            const result = userService.logout();
            
            expect(result.success).toBe(true);
            expect(userService.getCurrentUser()).toBeNull();
        });

        test('未登录时更新用户应该失败', async () => {
            // 先登出
            userService.logout();
            
            const result = await userService.updateUser({ username: 'newuser' });
            
            expect(result.success).toBe(false);
            expect(result.message).toContain('请先登录');
        });
    });

    describe('密码处理', () => {
        test('应该正确哈希密码', () => {
            const password = 'testpassword';
            const hashed = userService.hashPassword(password);
            
            expect(hashed).toBeDefined();
            expect(hashed).not.toBe(password);
            expect(typeof hashed).toBe('string');
        });

        test('应该正确验证密码', () => {
            const password = 'testpassword';
            const hashed = userService.hashPassword(password);
            
            expect(userService.verifyPassword(password, hashed)).toBe(true);
            expect(userService.verifyPassword('wrongpassword', hashed)).toBe(false);
        });
    });

    describe('用户列表', () => {
        test('应该能够获取所有用户', async () => {
            // 注册多个用户
            await userService.register({
                username: 'user1',
                email: 'user1@example.com',
                password: 'password123'
            });
            
            await userService.register({
                username: 'user2',
                email: 'user2@example.com',
                password: 'password456'
            });

            const users = userService.getAllUsers();
            
            expect(users).toHaveLength(2);
            expect(users[0].password).toBeUndefined();
            expect(users[1].password).toBeUndefined();
        });
    });
});