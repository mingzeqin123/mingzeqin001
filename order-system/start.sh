#!/bin/bash

# 订单系统快速启动脚本
# 使用方法: ./start.sh

echo "🚀 订单系统启动脚本"
echo "===================="

# 检查Node.js是否安装
if ! command -v node &> /dev/null; then
    echo "❌ Node.js 未安装，请先安装 Node.js 16.0+"
    exit 1
fi

# 检查MySQL是否安装
if ! command -v mysql &> /dev/null; then
    echo "❌ MySQL 未安装，请先安装 MySQL 8.0+"
    exit 1
fi

echo "✅ 环境检查通过"

# 进入后端目录
cd backend

# 检查是否已安装依赖
if [ ! -d "node_modules" ]; then
    echo "📦 安装后端依赖..."
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ 依赖安装失败"
        exit 1
    fi
fi

# 检查环境变量文件
if [ ! -f ".env" ]; then
    echo "⚙️  创建环境变量文件..."
    cp .env.example .env
    echo "📝 请编辑 backend/.env 文件，配置数据库连接信息"
    echo "   数据库配置示例："
    echo "   DB_HOST=localhost"
    echo "   DB_PORT=3306"
    echo "   DB_NAME=order_system"
    echo "   DB_USER=root"
    echo "   DB_PASSWORD=your_password"
    echo "   JWT_SECRET=your_jwt_secret_key"
    echo ""
    read -p "按回车键继续..."
fi

# 检查数据库是否存在
echo "🔍 检查数据库连接..."
node -e "
const { testConnection } = require('./config/database');
testConnection().then(() => {
    console.log('✅ 数据库连接成功');
    process.exit(0);
}).catch((error) => {
    console.log('❌ 数据库连接失败:', error.message);
    console.log('请检查数据库配置和确保MySQL服务正在运行');
    process.exit(1);
});
"

if [ $? -ne 0 ]; then
    echo ""
    echo "💡 数据库设置提示："
    echo "1. 确保MySQL服务正在运行"
    echo "2. 创建数据库: CREATE DATABASE order_system;"
    echo "3. 导入数据: mysql -u root -p order_system < ../database/schema.sql"
    echo "4. 检查 backend/.env 文件中的数据库配置"
    exit 1
fi

echo ""
echo "🎉 系统启动成功！"
echo "===================="
echo "📡 后端API: http://localhost:3000"
echo "🌐 前端界面: 打开 frontend/index.html"
echo "📚 API文档: http://localhost:3000/api"
echo "💚 健康检查: http://localhost:3000/health"
echo ""
echo "🔑 默认管理员账户:"
echo "   邮箱: admin@example.com"
echo "   密码: admin123"
echo ""
echo "👤 测试用户账户:"
echo "   邮箱: customer1@example.com"
echo "   密码: customer123"
echo ""
echo "按 Ctrl+C 停止服务"

# 启动后端服务
npm start