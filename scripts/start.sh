#!/bin/bash

# 数据汇总服务启动脚本

set -e

echo "🚀 启动数据汇总服务..."

# 检查环境变量文件
if [ ! -f .env ]; then
    echo "❌ .env 文件不存在，请先运行 ./scripts/install.sh"
    exit 1
fi

# 检查必要目录
mkdir -p logs temp

# 检查端口是否被占用
PORT=${PORT:-3000}
if lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null ; then
    echo "⚠️  端口 $PORT 已被占用，尝试停止现有服务..."
    pkill -f "node server.js" || true
    sleep 2
fi

# 启动服务
echo "📡 启动服务在端口 $PORT..."
if [ "$1" = "dev" ]; then
    echo "🔧 开发模式启动..."
    npm run dev
else
    echo "🏭 生产模式启动..."
    npm start
fi