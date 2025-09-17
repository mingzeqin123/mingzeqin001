/**
 * 高级功能示例
 * 展示模块化应用的高级特性和最佳实践
 */

const ModularApp = require('../src/app');
const { getConfig, setConfig } = require('../src/config');

async function advancedFeaturesExample() {
    console.log('🚀 模块化应用高级功能示例\n');

    // 创建应用实例，使用自定义配置
    const app = new ModularApp({
        logger: { 
            level: 'debug',
            format: 'text'
        },
        api: { 
            baseURL: 'https://api.example.com',
            timeout: 5000
        }
    });

    try {
        // 1. 配置管理示例
        console.log('⚙️ 1. 配置管理示例');
        console.log('='.repeat(50));
        
        // 获取当前配置
        const currentConfig = getConfig('app');
        console.log('当前应用配置:', currentConfig);
        
        // 动态修改配置
        setConfig('app.debug', true);
        setConfig('security.passwordMinLength', 12);
        
        const updatedConfig = getConfig('app');
        console.log('更新后的配置:', updatedConfig);
        console.log('');

        // 2. 批量用户注册示例
        console.log('👥 2. 批量用户注册示例');
        console.log('='.repeat(50));
        
        const users = [
            { username: 'alice', email: 'alice@example.com', password: 'password123', age: 25 },
            { username: 'bob', email: 'bob@example.com', password: 'password456', age: 30 },
            { username: 'charlie', email: 'charlie@example.com', password: 'password789', age: 35 }
        ];

        const registrationResults = await Promise.allSettled(
            users.map(user => app.registerUser(user))
        );

        console.log('批量注册结果:');
        registrationResults.forEach((result, index) => {
            if (result.status === 'fulfilled') {
                console.log(`用户 ${users[index].username}: ${result.value.success ? '成功' : '失败'}`);
            } else {
                console.log(`用户 ${users[index].username}: 异常 - ${result.reason.message}`);
            }
        });
        console.log('');

        // 3. 高级数据操作示例
        console.log('💾 3. 高级数据操作示例');
        console.log('='.repeat(50));
        
        // 存储不同类型的数据
        const dataTypes = [
            { key: 'user:alice', value: { name: 'Alice', role: 'admin' }, type: 'object' },
            { key: 'config:theme', value: 'dark', type: 'string' },
            { key: 'stats:visitors', value: 1250, type: 'number' },
            { key: 'features:enabled', value: ['auth', 'api', 'logging'], type: 'array' },
            { key: 'system:active', value: true, type: 'boolean' }
        ];

        for (const data of dataTypes) {
            await app.dataService.store(data.key, data.value, {
                metadata: { category: 'test', type: data.type }
            });
        }

        // 复杂查询
        const complexQuery = await app.dataService.query({
            metadata: { category: 'test' },
            limit: 10
        });
        console.log('复杂查询结果:', complexQuery);
        console.log('');

        // 4. 数据分析示例
        console.log('📊 4. 数据分析示例');
        console.log('='.repeat(50));
        
        // 分析不同类型的数据
        for (const data of dataTypes) {
            const analysis = await app.dataService.analyze(data.key);
            if (analysis.success) {
                console.log(`数据 ${data.key} 分析:`, analysis.analysis);
            }
        }
        console.log('');

        // 5. 自定义验证器示例
        console.log('✅ 5. 自定义验证器示例');
        console.log('='.repeat(50));
        
        // 添加自定义验证器
        app.validator.addValidator('phone', (value) => {
            if (!/^1[3-9]\d{9}$/.test(value)) {
                return '手机号格式不正确';
            }
            return true;
        });

        app.validator.addValidator('strongPassword', (value) => {
            const result = app.validator.validatePassword(value, {
                minLength: 12,
                requireUppercase: true,
                requireLowercase: true,
                requireNumbers: true,
                requireSpecialChars: true
            });
            return result.isValid ? true : result.errors.join(', ');
        });

        // 使用自定义验证器
        const phoneValidation = app.validator.useCustomValidator('phone', '13812345678');
        const passwordValidation = app.validator.useCustomValidator('strongPassword', 'MyStrongPassword123!');
        
        console.log('手机号验证:', phoneValidation);
        console.log('强密码验证:', passwordValidation);
        console.log('');

        // 6. 数据清理和转换示例
        console.log('🧹 6. 数据清理和转换示例');
        console.log('='.repeat(50));
        
        const rawData = {
            name: '  JOHN DOE  ',
            email: '  JOHN@EXAMPLE.COM  ',
            age: '30',
            phone: '13812345678',
            active: 'true'
        };

        const schema = {
            name: { type: 'string', trim: true, toLowerCase: false },
            email: { type: 'string', trim: true, toLowerCase: true },
            age: { type: 'number', default: 0 },
            phone: { type: 'string', trim: true },
            active: { type: 'boolean', default: false }
        };

        const cleanedData = app.validator.sanitize(rawData, schema);
        console.log('原始数据:', rawData);
        console.log('清理后数据:', cleanedData);
        console.log('');

        // 7. 日志管理示例
        console.log('📝 7. 日志管理示例');
        console.log('='.repeat(50));
        
        // 创建多个子日志器
        const userLogger = app.logger.child('user-service');
        const dataLogger = app.logger.child('data-service');
        const apiLogger = app.logger.child('api-service');

        // 模拟不同服务的日志
        userLogger.info('用户服务启动');
        dataLogger.debug('数据服务初始化完成');
        apiLogger.warn('API服务连接超时');

        // 获取日志历史
        const recentLogs = app.logger.getLogs({ limit: 5 });
        console.log('最近的日志:', recentLogs.map(log => ({
            timestamp: log.timestamp,
            level: log.level,
            message: log.message
        })));
        console.log('');

        // 8. 错误处理示例
        console.log('❌ 8. 错误处理示例');
        console.log('='.repeat(50));
        
        // 模拟各种错误情况
        try {
            // 尝试注册已存在的用户
            await app.registerUser({
                username: 'alice',
                email: 'alice@example.com',
                password: 'password123'
            });
        } catch (error) {
            console.log('捕获到预期错误:', error.message);
        }

        try {
            // 尝试获取不存在的数据
            await app.getData('nonexistent:key');
        } catch (error) {
            console.log('捕获到预期错误:', error.message);
        }

        try {
            // 尝试使用无效的验证器
            app.validator.useCustomValidator('nonexistent', 'value');
        } catch (error) {
            console.log('捕获到预期错误:', error.message);
        }
        console.log('');

        // 9. 性能监控示例
        console.log('⚡ 9. 性能监控示例');
        console.log('='.repeat(50));
        
        // 测量操作执行时间
        const startTime = Date.now();
        
        // 执行一些操作
        await app.dataService.store('perf:test', { data: 'performance test' });
        await app.dataService.get('perf:test');
        await app.dataService.query({ limit: 10 });
        
        const endTime = Date.now();
        const executionTime = endTime - startTime;
        
        console.log(`操作执行时间: ${executionTime}ms`);
        
        // 获取数据统计
        const stats = app.dataService.getStats();
        console.log('数据统计:', {
            totalItems: stats.totalItems,
            totalSize: `${(stats.totalSize / 1024).toFixed(2)} KB`,
            typeDistribution: stats.typeDistribution
        });
        console.log('');

        // 10. 模块集成示例
        console.log('🔗 10. 模块集成示例');
        console.log('='.repeat(50));
        
        // 展示模块间的协作
        const integrationExample = async () => {
            // 1. 用户登录
            const loginResult = await app.loginUser('alice@example.com', 'password123');
            if (!loginResult.success) {
                throw new Error('登录失败');
            }

            // 2. 存储用户会话数据
            await app.storeData('session:alice', {
                userId: loginResult.user.id,
                loginTime: new Date(),
                ipAddress: '192.168.1.1'
            }, { ttl: 3600000 });

            // 3. 记录登录日志
            app.logger.info('用户登录成功', {
                userId: loginResult.user.id,
                username: loginResult.user.username
            });

            // 4. 验证会话数据
            const sessionData = await app.getData('session:alice');
            if (sessionData.success) {
                console.log('会话数据验证成功:', sessionData.data);
            }

            // 5. 更新用户最后活动时间
            await app.userService.updateUser({
                lastActiveAt: new Date()
            });

            console.log('模块集成示例完成 - 所有模块协作正常');
        };

        await integrationExample();
        console.log('');

        console.log('✅ 高级功能示例完成！');
        console.log('所有高级功能都正常工作，展示了模块化架构的强大能力。');

    } catch (error) {
        console.error('❌ 高级功能示例运行出错:', error.message);
        app.logger.error('高级功能示例运行失败', { 
            error: error.message, 
            stack: error.stack 
        });
    } finally {
        // 清理资源
        await app.cleanup();
        console.log('\n🧹 资源清理完成');
    }
}

// 运行示例
if (require.main === module) {
    advancedFeaturesExample().catch(console.error);
}

module.exports = advancedFeaturesExample;