#!/bin/bash

# 数据汇总服务安装脚本

set -e

echo "🚀 开始安装数据汇总服务..."

# 检查Node.js版本
if ! command -v node &> /dev/null; then
    echo "❌ Node.js 未安装，请先安装 Node.js 18+ 版本"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js 版本过低，需要 18+ 版本，当前版本: $(node -v)"
    exit 1
fi

echo "✅ Node.js 版本检查通过: $(node -v)"

# 检查npm
if ! command -v npm &> /dev/null; then
    echo "❌ npm 未安装"
    exit 1
fi

echo "✅ npm 版本: $(npm -v)"

# 安装依赖
echo "📦 安装项目依赖..."
npm install

# 创建必要目录
echo "📁 创建必要目录..."
mkdir -p logs temp

# 设置权限
echo "🔐 设置目录权限..."
chmod 755 logs temp

# 复制环境变量模板
if [ ! -f .env ]; then
    echo "📝 创建环境变量配置文件..."
    cp .env.example .env
    echo "⚠️  请编辑 .env 文件配置数据库和OSS信息"
fi

# 检查Docker（可选）
if command -v docker &> /dev/null; then
    echo "✅ Docker 已安装: $(docker --version)"
    if command -v docker-compose &> /dev/null; then
        echo "✅ Docker Compose 已安装: $(docker-compose --version)"
    else
        echo "⚠️  Docker Compose 未安装，建议安装以使用容器化部署"
    fi
else
    echo "⚠️  Docker 未安装，建议安装以使用容器化部署"
fi

echo ""
echo "🎉 安装完成！"
echo ""
echo "📋 下一步操作："
echo "1. 编辑 .env 文件配置数据库和OSS信息"
echo "2. 运行 'npm start' 启动服务"
echo "3. 或使用 'docker-compose up -d' 进行容器化部署"
echo ""
echo "📖 更多信息请查看 README.md 文件"