#!/bin/bash

# 直播系统停止脚本

set -e

echo "🛑 停止直播系统..."

# 检查Docker Compose是否安装
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose未安装"
    exit 1
fi

# 停止服务
echo "🛑 停止所有服务..."
docker-compose down

# 清理资源（可选）
read -p "是否清理所有数据？这将删除所有容器、镜像和数据卷 (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🧹 清理所有资源..."
    docker-compose down -v --rmi all
    docker system prune -f
    echo "✅ 清理完成"
fi

echo "✅ 直播系统已停止"