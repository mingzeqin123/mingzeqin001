// 配置检查脚本
const fs = require('fs');
const path = require('path');

console.log('🔍 检查系统配置...\n');

// 检查文件是否存在
const filesToCheck = [
    'backend/package.json',
    'backend/server.js',
    'backend/.env.example',
    'frontend/index.html',
    'start-server.sh'
];

console.log('📁 检查必要文件:');
filesToCheck.forEach(file => {
    const exists = fs.existsSync(file);
    console.log(`  ${exists ? '✅' : '❌'} ${file}`);
});

// 检查Node.js版本
console.log('\n📦 检查Node.js环境:');
try {
    const nodeVersion = process.version;
    console.log(`  ✅ Node.js版本: ${nodeVersion}`);
    
    const majorVersion = parseInt(nodeVersion.split('.')[0].substring(1));
    if (majorVersion >= 14) {
        console.log('  ✅ Node.js版本符合要求 (>= 14)');
    } else {
        console.log('  ⚠️  Node.js版本过低，建议升级到14或更高版本');
    }
} catch (error) {
    console.log('  ❌ 无法获取Node.js版本');
}

// 检查npm
console.log('\n📦 检查npm:');
try {
    const { execSync } = require('child_process');
    const npmVersion = execSync('npm --version', { encoding: 'utf8' }).trim();
    console.log(`  ✅ npm版本: ${npmVersion}`);
} catch (error) {
    console.log('  ❌ npm未安装或不可用');
}

// 检查.env文件
console.log('\n⚙️  检查配置文件:');
const envPath = 'backend/.env';
if (fs.existsSync(envPath)) {
    console.log('  ✅ .env文件存在');
    
    // 读取.env文件内容
    const envContent = fs.readFileSync(envPath, 'utf8');
    const requiredVars = ['EMAIL_HOST', 'EMAIL_PORT', 'EMAIL_USER', 'EMAIL_PASS', 'EMAIL_FROM'];
    
    console.log('  📋 检查必要的环境变量:');
    requiredVars.forEach(varName => {
        const hasVar = envContent.includes(varName);
        const isConfigured = hasVar && !envContent.includes(`${varName}=your-`);
        console.log(`    ${isConfigured ? '✅' : '❌'} ${varName}`);
    });
    
    if (envContent.includes('your-email@gmail.com') || envContent.includes('your-app-password')) {
        console.log('\n  ⚠️  请配置您的邮件服务信息:');
        console.log('     1. 编辑 backend/.env 文件');
        console.log('     2. 填入您的邮件服务配置');
        console.log('     3. 对于Gmail，使用应用专用密码');
    }
} else {
    console.log('  ❌ .env文件不存在');
    console.log('  💡 请复制 .env.example 到 .env 并配置');
}

// 检查端口占用
console.log('\n🌐 检查端口占用:');
const net = require('net');
const port = 3000;

const server = net.createServer();
server.listen(port, () => {
    server.once('close', () => {
        console.log(`  ✅ 端口 ${port} 可用`);
    });
    server.close();
});

server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.log(`  ❌ 端口 ${port} 已被占用`);
        console.log('  💡 请停止其他服务或修改端口配置');
    } else {
        console.log(`  ❌ 端口检查失败: ${err.message}`);
    }
});

console.log('\n🎯 下一步操作:');
console.log('  1. 配置邮件服务 (编辑 backend/.env)');
console.log('  2. 安装依赖: cd backend && npm install');
console.log('  3. 启动服务: ./start-server.sh');
console.log('  4. 打开前端: frontend/index.html');
console.log('  5. 测试注册功能');

console.log('\n📚 更多信息请查看: README_EMAIL_SERVICE.md');