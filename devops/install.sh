#!/bin/bash

# =============================================================================
# DevOps 脚本安装脚本 - 微信小程序跳一跳游戏项目
# 功能：一键安装和配置所有 DevOps 脚本
# 作者：DevOps Team
# 版本：1.0.0
# =============================================================================

set -e  # 遇到错误立即退出

# 配置变量
PROJECT_NAME="jump-jump-game"
PROJECT_ROOT="/workspace"
DEVOPS_ROOT="${PROJECT_ROOT}/devops"

# 颜色输出函数
print_info() {
    echo -e "\033[32m[INFO]\033[0m $1"
}

print_warn() {
    echo -e "\033[33m[WARN]\033[0m $1"
}

print_error() {
    echo -e "\033[31m[ERROR]\033[0m $1"
}

print_header() {
    echo -e "\033[36m=============================================================================\033[0m"
    echo -e "\033[36m$1\033[0m"
    echo -e "\033[36m=============================================================================\033[0m"
}

# 检查系统环境
check_system() {
    print_info "检查系统环境..."
    
    # 检查操作系统
    if [[ "$OSTYPE" != "linux-gnu"* ]]; then
        print_warn "当前系统: $OSTYPE"
        print_warn "建议在 Linux 系统上运行此脚本"
    fi
    
    # 检查必要工具
    local tools=("bash" "tar" "gzip" "rsync" "curl" "crontab")
    local missing_tools=()
    
    for tool in "${tools[@]}"; do
        if ! command -v "$tool" &> /dev/null; then
            missing_tools+=("$tool")
        fi
    done
    
    if [ ${#missing_tools[@]} -gt 0 ]; then
        print_error "缺少必要工具: ${missing_tools[*]}"
        print_info "请安装缺少的工具后重试"
        exit 1
    fi
    
    print_info "系统环境检查通过"
}

# 创建必要目录
create_directories() {
    print_info "创建必要目录..."
    
    local directories=(
        "/backup"
        "/packages"
        "/deploy"
        "/var/log/cron_jobs"
        "/var/log/monitoring"
    )
    
    for dir in "${directories[@]}"; do
        if [ ! -d "$dir" ]; then
            sudo mkdir -p "$dir"
            sudo chown $(whoami):$(whoami) "$dir"
            print_info "✓ 已创建目录: $dir"
        else
            print_info "✓ 目录已存在: $dir"
        fi
    done
}

# 设置脚本权限
set_permissions() {
    print_info "设置脚本权限..."
    
    if [ -d "$DEVOPS_ROOT" ]; then
        chmod +x "$DEVOPS_ROOT"/*.sh
        print_info "✓ 已设置脚本执行权限"
    else
        print_error "DevOps 目录不存在: $DEVOPS_ROOT"
        exit 1
    fi
}

# 初始化监控环境
init_monitoring() {
    print_info "初始化监控环境..."
    
    if [ -f "${DEVOPS_ROOT}/monitor.sh" ]; then
        "${DEVOPS_ROOT}/monitor.sh" init
        print_info "✓ 监控环境初始化完成"
    else
        print_warn "监控脚本不存在，跳过初始化"
    fi
}

# 配置定时任务
setup_cron_jobs() {
    print_info "配置定时任务..."
    
    if [ -f "${DEVOPS_ROOT}/setup_cron.sh" ]; then
        "${DEVOPS_ROOT}/setup_cron.sh"
        print_info "✓ 定时任务配置完成"
    else
        print_warn "定时任务设置脚本不存在，跳过配置"
    fi
}

# 测试脚本功能
test_scripts() {
    print_info "测试脚本功能..."
    
    # 测试备份脚本
    if [ -f "${DEVOPS_ROOT}/backup.sh" ]; then
        print_info "测试备份脚本..."
        if "${DEVOPS_ROOT}/backup.sh" > /dev/null 2>&1; then
            print_info "✓ 备份脚本测试通过"
        else
            print_warn "⚠ 备份脚本测试失败"
        fi
    fi
    
    # 测试打包脚本
    if [ -f "${DEVOPS_ROOT}/package.sh" ]; then
        print_info "测试打包脚本..."
        if "${DEVOPS_ROOT}/package.sh" "1.0.0" > /dev/null 2>&1; then
            print_info "✓ 打包脚本测试通过"
        else
            print_warn "⚠ 打包脚本测试失败"
        fi
    fi
    
    # 测试监控脚本
    if [ -f "${DEVOPS_ROOT}/monitor.sh" ]; then
        print_info "测试监控脚本..."
        if "${DEVOPS_ROOT}/monitor.sh" run > /dev/null 2>&1; then
            print_info "✓ 监控脚本测试通过"
        else
            print_warn "⚠ 监控脚本测试失败"
        fi
    fi
}

# 显示安装结果
show_installation_result() {
    print_header "安装完成"
    
    echo "DevOps 脚本套件已成功安装！"
    echo ""
    echo "📁 脚本位置: $DEVOPS_ROOT"
    echo "📊 日志目录: /var/log/cron_jobs"
    echo "💾 备份目录: /backup"
    echo "📦 打包目录: /packages"
    echo "🚀 部署目录: /deploy"
    echo ""
    echo "🔧 管理命令:"
    echo "  $DEVOPS_ROOT/manage.sh status    - 查看状态"
    echo "  $DEVOPS_ROOT/manage.sh backup    - 立即备份"
    echo "  $DEVOPS_ROOT/manage.sh package   - 立即打包"
    echo "  $DEVOPS_ROOT/manage.sh update    - 立即更新"
    echo "  $DEVOPS_ROOT/manage.sh logs      - 查看日志"
    echo ""
    echo "⏰ 定时任务:"
    echo "  每天凌晨2点: 代码备份"
    echo "  每周一凌晨3点: 代码打包"
    echo "  每天凌晨4点: 自动更新"
    echo "  每小时: 健康检查"
    echo ""
    echo "📖 详细文档: $DEVOPS_ROOT/README.md"
    echo ""
    echo "🎉 安装完成！现在可以开始使用 DevOps 自动化脚本了。"
}

# 主函数
main() {
    print_header "DevOps 脚本套件安装程序"
    
    # 检查系统环境
    check_system
    
    # 创建必要目录
    create_directories
    
    # 设置脚本权限
    set_permissions
    
    # 初始化监控环境
    init_monitoring
    
    # 配置定时任务
    setup_cron_jobs
    
    # 测试脚本功能
    test_scripts
    
    # 显示安装结果
    show_installation_result
}

# 错误处理
trap 'print_error "安装过程中发生错误，退出码: $?"; exit 1' ERR

# 执行主函数
main "$@"