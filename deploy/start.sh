#!/bin/bash

# 直播系统启动脚本

set -e

echo "🚀 启动直播系统..."

# 检查Docker是否安装
if ! command -v docker &> /dev/null; then
    echo "❌ Docker未安装，请先安装Docker"
    exit 1
fi

# 检查Docker Compose是否安装
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose未安装，请先安装Docker Compose"
    exit 1
fi

# 检查环境变量文件
if [ ! -f .env ]; then
    echo "⚠️  环境变量文件不存在，正在创建..."
    cp .env.example .env
    echo "📝 请编辑 .env 文件配置必要的环境变量"
    echo "   特别是以下变量："
    echo "   - REDIS_PASSWORD"
    echo "   - JWT_SECRET"
    echo "   - JWT_REFRESH_SECRET"
    echo "   - WECHAT_APPID"
    echo "   - WECHAT_SECRET"
    echo "   - NETEASE_APP_KEY"
    echo "   - NETEASE_APP_SECRET"
    echo "   - CORS_ORIGIN"
    echo "   - GRAFANA_PASSWORD"
    exit 1
fi

# 创建必要的目录
echo "📁 创建必要的目录..."
mkdir -p uploads logs ssl

# 设置目录权限
echo "🔐 设置目录权限..."
chmod 755 uploads logs ssl

# 构建镜像
echo "🔨 构建Docker镜像..."
docker-compose build

# 启动服务
echo "🚀 启动服务..."
docker-compose up -d

# 等待服务启动
echo "⏳ 等待服务启动..."
sleep 30

# 检查服务状态
echo "🔍 检查服务状态..."
docker-compose ps

# 检查健康状态
echo "🏥 检查健康状态..."
if curl -f http://localhost/health > /dev/null 2>&1; then
    echo "✅ 服务启动成功！"
    echo ""
    echo "📊 服务访问地址："
    echo "   - 主服务: http://localhost"
    echo "   - API文档: http://localhost/api/docs"
    echo "   - 监控面板: http://localhost:3001"
    echo "   - Prometheus: http://localhost:9090"
    echo ""
    echo "📝 查看日志："
    echo "   docker-compose logs -f"
    echo ""
    echo "🛑 停止服务："
    echo "   docker-compose down"
else
    echo "❌ 服务启动失败，请检查日志："
    echo "   docker-compose logs"
    exit 1
fi