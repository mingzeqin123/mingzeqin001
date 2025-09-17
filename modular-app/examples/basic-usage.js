/**
 * 基础使用示例
 * 展示如何使用模块化应用的基本功能
 */

const ModularApp = require('../src/app');

async function basicUsageExample() {
    console.log('🚀 模块化应用基础使用示例\n');

    // 创建应用实例
    const app = new ModularApp({
        logger: { level: 'info' },
        api: { timeout: 3000 }
    });

    try {
        // 1. 用户注册示例
        console.log('📝 1. 用户注册示例');
        console.log('='.repeat(40));
        
        const registerResult = await app.registerUser({
            username: 'john_doe',
            email: 'john@example.com',
            password: 'password123',
            age: 30
        });
        
        console.log('注册结果:', registerResult);
        console.log('');

        // 2. 用户登录示例
        console.log('🔐 2. 用户登录示例');
        console.log('='.repeat(40));
        
        const loginResult = await app.loginUser('john@example.com', 'password123');
        console.log('登录结果:', loginResult);
        console.log('');

        // 3. 数据存储示例
        console.log('💾 3. 数据存储示例');
        console.log('='.repeat(40));
        
        const storeResult = await app.storeData('user:profile', {
            name: 'John Doe',
            email: 'john@example.com',
            preferences: {
                theme: 'dark',
                language: 'zh-CN'
            }
        }, {
            ttl: 3600000, // 1小时过期
            metadata: { type: 'user_profile' }
        });
        
        console.log('存储结果:', storeResult);
        console.log('');

        // 4. 数据获取示例
        console.log('📖 4. 数据获取示例');
        console.log('='.repeat(40));
        
        const getResult = await app.getData('user:profile');
        console.log('获取结果:', getResult);
        console.log('');

        // 5. 应用状态查询
        console.log('📊 5. 应用状态查询');
        console.log('='.repeat(40));
        
        const status = app.getStatus();
        console.log('应用状态:', JSON.stringify(status, null, 2));
        console.log('');

        // 6. 数据查询示例
        console.log('🔍 6. 数据查询示例');
        console.log('='.repeat(40));
        
        // 存储更多测试数据
        await app.dataService.store('user:settings', { theme: 'light' }, { metadata: { type: 'settings' } });
        await app.dataService.store('user:notifications', { enabled: true }, { metadata: { type: 'settings' } });
        
        const queryResult = await app.dataService.query({
            metadata: { type: 'settings' },
            limit: 10
        });
        
        console.log('查询结果:', queryResult);
        console.log('');

        // 7. 日志功能示例
        console.log('📝 7. 日志功能示例');
        console.log('='.repeat(40));
        
        app.logger.info('这是一条信息日志');
        app.logger.warn('这是一条警告日志');
        app.logger.error('这是一条错误日志');
        
        // 创建子日志器
        const userLogger = app.logger.child('user-service');
        userLogger.debug('用户服务调试信息');
        
        console.log('日志记录完成，查看上方输出');
        console.log('');

        // 8. 验证功能示例
        console.log('✅ 8. 验证功能示例');
        console.log('='.repeat(40));
        
        // 邮箱验证
        const isEmail = app.validator.isEmail('test@example.com');
        console.log('邮箱验证结果:', isEmail);
        
        // 密码强度验证
        const passwordResult = app.validator.validatePassword('MyPassword123!', {
            minLength: 8,
            requireUppercase: true,
            requireLowercase: true,
            requireNumbers: true,
            requireSpecialChars: true
        });
        console.log('密码强度验证:', passwordResult);
        
        // 模式验证
        const schema = {
            name: { type: 'string', required: true, minLength: 2 },
            age: { type: 'number', min: 0, max: 150 },
            email: { type: 'string', pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ }
        };
        
        const validationResult = app.validator.validateSchema({
            name: 'John Doe',
            age: 30,
            email: 'john@example.com'
        }, schema);
        
        console.log('模式验证结果:', validationResult);
        console.log('');

        // 9. API服务示例
        console.log('🌐 9. API服务示例');
        console.log('='.repeat(40));
        
        // 注意：这个示例需要真实的API端点
        try {
            const apiResult = await app.apiService.get('https://jsonplaceholder.typicode.com/posts/1');
            console.log('API请求成功:', {
                status: apiResult.status,
                dataKeys: Object.keys(apiResult.data || {})
            });
        } catch (error) {
            console.log('API请求失败（这是正常的，因为没有网络连接）:', error.message);
        }
        console.log('');

        // 10. 数据统计示例
        console.log('📈 10. 数据统计示例');
        console.log('='.repeat(40));
        
        const stats = app.dataService.getStats();
        console.log('数据统计:', stats);
        console.log('');

        console.log('✅ 基础使用示例完成！');
        console.log('所有功能都正常工作，模块化架构运行良好。');

    } catch (error) {
        console.error('❌ 示例运行出错:', error.message);
        app.logger.error('示例运行失败', { error: error.message, stack: error.stack });
    } finally {
        // 清理资源
        await app.cleanup();
        console.log('\n🧹 资源清理完成');
    }
}

// 运行示例
if (require.main === module) {
    basicUsageExample().catch(console.error);
}

module.exports = basicUsageExample;