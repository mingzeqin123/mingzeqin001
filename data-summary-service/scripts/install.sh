#!/bin/bash

# 数据汇总服务安装脚本

set -e

echo "🚀 开始安装数据汇总服务..."

# 检查Node.js版本
if ! command -v node &> /dev/null; then
    echo "❌ Node.js 未安装，请先安装 Node.js 14+ 版本"
    exit 1
fi

NODE_VERSION=$(node -v | sed 's/v//' | cut -d. -f1)
if [ "$NODE_VERSION" -lt 14 ]; then
    echo "❌ Node.js 版本过低，需要 14+ 版本，当前版本: $(node -v)"
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

# 创建必要的目录
echo "📁 创建必要的目录..."
mkdir -p logs temp exports

# 复制环境配置文件
if [ ! -f .env ]; then
    echo "⚙️  复制环境配置文件..."
    cp .env.example .env
    echo "📝 请编辑 .env 文件配置您的数据库和OSS参数"
fi

# 设置权限
echo "🔒 设置文件权限..."
chmod +x scripts/*.sh

echo "✅ 安装完成！"
echo ""
echo "📋 下一步操作："
echo "1. 编辑 .env 文件，配置数据库和OSS连接信息"
echo "2. 运行 'npm run dev' 启动开发模式"
echo "3. 或运行 'npm start' 启动生产模式"
echo ""
echo "📚 更多信息请查看 README.md 文件"