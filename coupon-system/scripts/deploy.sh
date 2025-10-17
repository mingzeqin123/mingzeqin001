#!/bin/bash

# 优惠券系统部署脚本

set -e

echo "🚀 开始部署优惠券系统..."

# 检查Docker是否安装
if ! command -v docker &> /dev/null; then
    echo "❌ Docker未安装，请先安装Docker"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose未安装，请先安装Docker Compose"
    exit 1
fi

# 创建必要的目录
echo "📁 创建目录结构..."
mkdir -p logs
mkdir -p ssl

# 检查环境变量文件
if [ ! -f .env ]; then
    echo "📝 创建环境变量文件..."
    cp .env.example .env
    echo "⚠️  请编辑 .env 文件配置数据库密码等信息"
fi

# 构建并启动服务
echo "🔨 构建Docker镜像..."
docker-compose build

echo "🚀 启动服务..."
docker-compose up -d

# 等待服务启动
echo "⏳ 等待服务启动..."
sleep 10

# 检查服务状态
echo "🔍 检查服务状态..."
docker-compose ps

# 健康检查
echo "🏥 执行健康检查..."
if curl -f http://localhost:3000/health > /dev/null 2>&1; then
    echo "✅ 服务启动成功！"
    echo "🌐 API地址: http://localhost:3000/api/v1"
    echo "📖 API文档: http://localhost:3000/api/v1"
else
    echo "❌ 服务启动失败，请检查日志"
    docker-compose logs app
    exit 1
fi

echo "🎉 部署完成！"
echo ""
echo "常用命令："
echo "  查看日志: docker-compose logs -f app"
echo "  停止服务: docker-compose down"
echo "  重启服务: docker-compose restart"
echo "  查看状态: docker-compose ps"