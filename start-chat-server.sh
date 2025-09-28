#!/bin/bash

# WebSocket 聊天服务器启动脚本

echo "正在启动 WebSocket 聊天服务器..."

# 检查 Node.js 是否安装
if ! command -v node &> /dev/null; then
    echo "错误: 未找到 Node.js，请先安装 Node.js"
    exit 1
fi

# 检查依赖是否安装
if [ ! -d "node_modules" ]; then
    echo "正在安装依赖..."
    npm install
fi

# 设置环境变量
export PORT=${PORT:-8080}

echo "服务器将在端口 $PORT 启动"
echo "按 Ctrl+C 停止服务器"

# 启动服务器
node chat-server.js