#!/bin/bash

# 微信公众号分享服务启动脚本

echo "🚀 启动微信公众号分享服务..."

# 检查 Node.js 是否安装
if ! command -v node &> /dev/null; then
    echo "❌ 错误: 未检测到 Node.js，请先安装 Node.js"
    exit 1
fi

# 检查 npm 是否安装
if ! command -v npm &> /dev/null; then
    echo "❌ 错误: 未检测到 npm，请先安装 npm"
    exit 1
fi

# 检查是否存在 package.json
if [ ! -f "package.json" ]; then
    echo "❌ 错误: 未找到 package.json 文件"
    exit 1
fi

# 安装依赖
echo "📦 安装依赖包..."
npm install

# 检查配置
echo "🔧 检查配置..."
if grep -q "YOUR_APPID" wechat-ticket-server.js; then
    echo "⚠️  警告: 请先在 wechat-ticket-server.js 中配置您的 AppID 和 AppSecret"
    echo "   找到以下行并替换为实际值:"
    echo "   appId: 'YOUR_APPID'"
    echo "   appSecret: 'YOUR_APPSECRET'"
    echo ""
    read -p "是否继续启动服务? (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# 启动服务
echo "🌟 启动服务器..."
echo "访问地址: http://localhost:3000"
echo "测试页面: 请在浏览器中打开 wechat-share-example.html"
echo "按 Ctrl+C 停止服务"
echo ""

npm start