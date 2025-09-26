// 测试用户注册功能的脚本
const fetch = require('node-fetch');

const API_BASE_URL = 'http://localhost:3000/api';

async function testRegistration() {
    console.log('🧪 开始测试用户注册功能...\n');
    
    // 测试数据
    const testData = {
        username: 'testuser' + Date.now(),
        email: 'test@example.com'
    };
    
    try {
        // 1. 测试健康检查
        console.log('1️⃣ 测试健康检查...');
        const healthResponse = await fetch(`${API_BASE_URL}/health`);
        const healthData = await healthResponse.json();
        
        if (healthData.success) {
            console.log('✅ 服务器运行正常');
        } else {
            console.log('❌ 服务器健康检查失败');
            return;
        }
        
        // 2. 测试用户注册
        console.log('\n2️⃣ 测试用户注册...');
        console.log(`📧 测试邮箱: ${testData.email}`);
        console.log(`👤 测试用户名: ${testData.username}`);
        
        const registerResponse = await fetch(`${API_BASE_URL}/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(testData)
        });
        
        const registerData = await registerResponse.json();
        
        if (registerData.success) {
            console.log('✅ 注册请求成功');
            console.log(`📨 邮件ID: ${registerData.data.messageId}`);
            console.log('📧 请检查邮箱是否收到注册邮件');
        } else {
            console.log('❌ 注册失败:', registerData.message);
        }
        
        // 3. 测试无效数据
        console.log('\n3️⃣ 测试无效数据验证...');
        
        const invalidData = {
            username: '',
            email: 'invalid-email'
        };
        
        const invalidResponse = await fetch(`${API_BASE_URL}/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(invalidData)
        });
        
        const invalidResult = await invalidResponse.json();
        
        if (!invalidResult.success) {
            console.log('✅ 无效数据验证正常:', invalidResult.message);
        } else {
            console.log('❌ 无效数据验证失败');
        }
        
        console.log('\n🎉 测试完成！');
        
    } catch (error) {
        console.error('❌ 测试过程中出现错误:', error.message);
        console.log('\n💡 请确保：');
        console.log('   1. 后端服务器正在运行 (npm start)');
        console.log('   2. 邮件服务配置正确');
        console.log('   3. 网络连接正常');
    }
}

// 运行测试
testRegistration();