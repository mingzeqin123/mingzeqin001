#!/bin/bash

echo "🚀 启动用户注册邮件服务..."

# 检查Node.js是否安装
if ! command -v node &> /dev/null; then
    echo "❌ 错误: 未找到Node.js，请先安装Node.js"
    echo "请访问: https://nodejs.org/"
    exit 1
fi

# 检查npm是否安装
if ! command -v npm &> /dev/null; then
    echo "❌ 错误: 未找到npm，请先安装npm"
    exit 1
fi

# 进入后端目录
cd backend

# 检查是否存在package.json
if [ ! -f "package.json" ]; then
    echo "❌ 错误: 未找到package.json文件"
    exit 1
fi

# 安装依赖
echo "📦 安装依赖包..."
npm install

# 检查是否存在.env文件
if [ ! -f ".env" ]; then
    echo "⚠️  警告: 未找到.env文件，正在创建示例配置文件..."
    cp .env.example .env
    echo "📝 请编辑 backend/.env 文件，配置您的邮件服务信息"
    echo "   特别是 EMAIL_USER 和 EMAIL_PASS 字段"
fi

# 启动服务器
echo "🌟 启动服务器..."
echo "📧 邮件服务将运行在: http://localhost:3000"
echo "🌐 前端页面: 打开 frontend/index.html"
echo "🔧 API文档: http://localhost:3000/api/health"
echo ""
echo "按 Ctrl+C 停止服务器"

npm start