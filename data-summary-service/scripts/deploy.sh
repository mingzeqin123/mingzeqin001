#!/bin/bash

# 数据汇总服务部署脚本

set -e

echo "🚀 开始部署数据汇总服务..."

# 检查环境变量文件
if [ ! -f .env ]; then
    echo "❌ 未找到 .env 配置文件，请先配置环境变量"
    exit 1
fi

# 检查PM2是否安装
if ! command -v pm2 &> /dev/null; then
    echo "📦 安装 PM2..."
    npm install -g pm2
fi

echo "✅ PM2 版本: $(pm2 -v)"

# 停止现有服务
echo "⏹️  停止现有服务..."
pm2 stop data-summary-service 2>/dev/null || true

# 删除现有服务
echo "🗑️  删除现有服务..."
pm2 delete data-summary-service 2>/dev/null || true

# 安装/更新依赖
echo "📦 安装依赖..."
npm ci --only=production

# 创建必要目录
echo "📁 创建必要目录..."
mkdir -p logs temp exports

# 启动服务
echo "▶️  启动服务..."
pm2 start ecosystem.config.js --env production

# 保存PM2配置
echo "💾 保存 PM2 配置..."
pm2 save

# 设置PM2开机自启
echo "🔄 设置开机自启..."
pm2 startup || true

# 显示服务状态
echo "📊 服务状态:"
pm2 status

echo ""
echo "✅ 部署完成！"
echo ""
echo "📋 常用命令:"
echo "  查看状态: pm2 status"
echo "  查看日志: pm2 logs data-summary-service"
echo "  重启服务: pm2 restart data-summary-service"
echo "  停止服务: pm2 stop data-summary-service"
echo "  监控服务: pm2 monit"