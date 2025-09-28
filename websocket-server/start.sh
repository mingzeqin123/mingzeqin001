#!/bin/bash

# WebSocket聊天服务器启动脚本

echo "🚀 启动WebSocket聊天服务器..."

# 检查Node.js是否安装
if ! command -v node &> /dev/null; then
    echo "❌ 错误: 未找到Node.js，请先安装Node.js"
    exit 1
fi

# 检查npm是否安装
if ! command -v npm &> /dev/null; then
    echo "❌ 错误: 未找到npm，请先安装npm"
    exit 1
fi

# 进入服务器目录
cd "$(dirname "$0")"

# 检查package.json是否存在
if [ ! -f "package.json" ]; then
    echo "❌ 错误: 未找到package.json文件"
    exit 1
fi

# 安装依赖
echo "📦 安装依赖包..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ 错误: 依赖安装失败"
    exit 1
fi

# 启动服务器
echo "🌟 启动服务器..."
echo "📱 服务器地址: http://localhost:3000"
echo "🔌 WebSocket地址: ws://localhost:3000"
echo "📋 API文档: http://localhost:3000/api/rooms"
echo ""
echo "按 Ctrl+C 停止服务器"
echo ""

npm start