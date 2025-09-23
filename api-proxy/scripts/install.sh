#!/bin/bash
# API代理服务器安装脚本

set -e  # 遇到错误立即退出

echo "🚀 API代理服务器安装脚本"
echo "========================="

# 检查Node.js版本
check_nodejs() {
    if ! command -v node &> /dev/null; then
        echo "❌ Node.js未安装！请先安装Node.js 16.0.0或更高版本"
        echo "   下载地址: https://nodejs.org/"
        exit 1
    fi

    NODE_VERSION=$(node -v | cut -d'.' -f1 | sed 's/v//')
    if [ "$NODE_VERSION" -lt 16 ]; then
        echo "❌ Node.js版本过低！当前版本: $(node -v)"
        echo "   请升级到16.0.0或更高版本"
        exit 1
    fi

    echo "✅ Node.js版本检查通过: $(node -v)"
}

# 检查npm版本
check_npm() {
    if ! command -v npm &> /dev/null; then
        echo "❌ npm未安装！"
        exit 1
    fi

    echo "✅ npm版本检查通过: $(npm -v)"
}

# 安装依赖
install_dependencies() {
    echo "📦 安装依赖包..."
    
    if [ -f "package.json" ]; then
        npm install
        echo "✅ 依赖包安装完成"
    else
        echo "❌ 找不到package.json文件！"
        exit 1
    fi
}

# 创建环境变量文件
setup_env() {
    echo "⚙️ 设置环境变量..."
    
    if [ ! -f ".env" ]; then
        cp .env.example .env
        echo "✅ 创建.env文件"
        echo "📝 请编辑.env文件以配置您的环境变量"
    else
        echo "ℹ️ .env文件已存在，跳过创建"
    fi
}

# 创建必要的目录
create_directories() {
    echo "📁 创建必要的目录..."
    
    mkdir -p logs
    mkdir -p config
    mkdir -p examples/protos
    
    echo "✅ 目录创建完成"
}

# 检查配置文件
check_config() {
    echo "📋 检查配置文件..."
    
    if [ ! -f "config/default.json" ]; then
        echo "❌ 配置文件不存在！"
        echo "   请确保config/default.json文件存在"
        exit 1
    fi
    
    echo "✅ 配置文件检查完成"
}

# 运行测试
run_tests() {
    echo "🧪 运行测试..."
    
    if npm test 2>/dev/null; then
        echo "✅ 测试通过"
    else
        echo "⚠️ 测试失败或跳过"
    fi
}

# 主安装过程
main() {
    echo "开始安装..."
    
    # 检查环境
    check_nodejs
    check_npm
    
    # 安装和设置
    install_dependencies
    setup_env
    create_directories
    check_config
    
    # 可选测试
    if [ "$1" = "--with-tests" ]; then
        run_tests
    fi
    
    echo ""
    echo "🎉 安装完成！"
    echo ""
    echo "下一步："
    echo "1. 编辑.env文件设置环境变量"
    echo "2. 编辑config/default.json配置API端点"
    echo "3. 运行 'npm start' 启动服务器"
    echo "4. 或运行 'npm run dev' 启动开发模式"
    echo ""
    echo "服务器将运行在: http://localhost:3000"
    echo "健康检查: http://localhost:3000/health"
    echo ""
    echo "📚 查看README.md获取更多信息"
}

# 显示帮助
show_help() {
    echo "用法: $0 [选项]"
    echo ""
    echo "选项:"
    echo "  --with-tests    运行安装后测试"
    echo "  --help         显示帮助信息"
    echo ""
    echo "示例:"
    echo "  $0              # 标准安装"
    echo "  $0 --with-tests # 安装并运行测试"
}

# 处理命令行参数
case "${1:-}" in
    --help)
        show_help
        exit 0
        ;;
    *)
        main "$@"
        ;;
esac