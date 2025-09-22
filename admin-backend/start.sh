#!/bin/bash

# 多租户后台管理系统启动脚本
# 作者: Assistant
# 版本: 1.0.0

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 打印带颜色的消息
print_message() {
    echo -e "${2}${1}${NC}"
}

print_header() {
    echo -e "${BLUE}"
    echo "=================================="
    echo "  多租户后台管理系统启动脚本"
    echo "=================================="
    echo -e "${NC}"
}

print_success() {
    print_message "✅ $1" $GREEN
}

print_warning() {
    print_message "⚠️  $1" $YELLOW
}

print_error() {
    print_message "❌ $1" $RED
}

print_info() {
    print_message "ℹ️  $1" $BLUE
}

# 检查 Node.js
check_node() {
    if ! command -v node &> /dev/null; then
        print_error "Node.js 未安装，请先安装 Node.js 16+"
        exit 1
    fi
    
    NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 16 ]; then
        print_error "Node.js 版本过低，需要 16+，当前版本: $(node -v)"
        exit 1
    fi
    
    print_success "Node.js 版本检查通过: $(node -v)"
}

# 检查 MongoDB
check_mongodb() {
    if command -v mongosh &> /dev/null; then
        print_success "MongoDB 已安装"
    elif command -v mongo &> /dev/null; then
        print_success "MongoDB 已安装"
    else
        print_warning "MongoDB 客户端未找到，请确保 MongoDB 服务正在运行"
    fi
}

# 安装依赖
install_dependencies() {
    print_info "安装项目依赖..."
    if [ -f "package-lock.json" ]; then
        npm ci
    else
        npm install
    fi
    print_success "依赖安装完成"
}

# 设置环境变量
setup_env() {
    if [ ! -f ".env" ]; then
        print_info "创建环境变量文件..."
        cp .env.example .env
        print_success "环境变量文件创建完成"
        print_warning "请编辑 .env 文件配置数据库连接等参数"
    else
        print_info "环境变量文件已存在"
    fi
}

# 数据库迁移
run_migration() {
    print_info "运行数据库迁移..."
    node scripts/migrate.js
    print_success "数据库迁移完成"
}

# 初始化数据
seed_data() {
    print_info "初始化示例数据..."
    if [ "$1" = "--clean" ]; then
        node scripts/seed.js --clean
    else
        node scripts/seed.js
    fi
    print_success "数据初始化完成"
}

# 启动服务器
start_server() {
    print_info "启动服务器..."
    if [ "$1" = "--dev" ]; then
        print_info "开发模式启动"
        npm run dev
    else
        print_info "生产模式启动"
        npm start
    fi
}

# 显示帮助信息
show_help() {
    echo "用法: $0 [选项]"
    echo ""
    echo "选项:"
    echo "  --help          显示此帮助信息"
    echo "  --dev           开发模式启动"
    echo "  --clean         清理现有数据并重新初始化"
    echo "  --no-seed       跳过数据初始化"
    echo "  --no-migrate    跳过数据库迁移"
    echo ""
    echo "示例:"
    echo "  $0              正常启动"
    echo "  $0 --dev        开发模式启动"
    echo "  $0 --clean      清理数据重新开始"
}

# 主函数
main() {
    print_header
    
    # 解析命令行参数
    DEV_MODE=false
    CLEAN_DATA=false
    NO_SEED=false
    NO_MIGRATE=false
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            --help)
                show_help
                exit 0
                ;;
            --dev)
                DEV_MODE=true
                shift
                ;;
            --clean)
                CLEAN_DATA=true
                shift
                ;;
            --no-seed)
                NO_SEED=true
                shift
                ;;
            --no-migrate)
                NO_MIGRATE=true
                shift
                ;;
            *)
                print_error "未知选项: $1"
                show_help
                exit 1
                ;;
        esac
    done
    
    # 执行检查
    check_node
    check_mongodb
    
    # 安装依赖
    install_dependencies
    
    # 设置环境
    setup_env
    
    # 数据库操作
    if [ "$NO_MIGRATE" = false ]; then
        run_migration
    fi
    
    if [ "$NO_SEED" = false ]; then
        if [ "$CLEAN_DATA" = true ]; then
            seed_data --clean
        else
            seed_data
        fi
    fi
    
    # 启动服务器
    print_info "准备启动服务器..."
    echo ""
    print_info "服务将运行在: http://localhost:3000"
    print_info "API 文档: http://localhost:3000/api"
    print_info "健康检查: http://localhost:3000/health"
    echo ""
    
    if [ "$DEV_MODE" = true ]; then
        start_server --dev
    else
        start_server
    fi
}

# 错误处理
trap 'print_error "脚本执行失败"; exit 1' ERR

# 运行主函数
main "$@"