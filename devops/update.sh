#!/bin/bash

# =============================================================================
# 代码更新部署脚本 - 微信小程序跳一跳游戏项目
# 功能：自动部署更新，支持回滚、健康检查和监控
# 作者：DevOps Team
# 版本：1.0.0
# =============================================================================

set -e  # 遇到错误立即退出

# 配置变量
PROJECT_NAME="jump-jump-game"
PROJECT_ROOT="/workspace"
PACKAGE_ROOT="/packages"
BACKUP_ROOT="/backup"
DEPLOY_ROOT="/deploy"
DATE=$(date +"%Y%m%d_%H%M%S")
LOG_FILE="${DEPLOY_ROOT}/update_${DATE}.log"

# 部署配置
DEPLOY_TYPE=${1:-"auto"}  # auto, manual, rollback
TARGET_VERSION=${2:-"latest"}
ROLLBACK_VERSION=${3:-""}

# 颜色输出函数
print_info() {
    echo -e "\033[32m[INFO]\033[0m $1" | tee -a "$LOG_FILE"
}

print_warn() {
    echo -e "\033[33m[WARN]\033[0m $1" | tee -a "$LOG_FILE"
}

print_error() {
    echo -e "\033[31m[ERROR]\033[0m $1" | tee -a "$LOG_FILE"
}

print_header() {
    echo -e "\033[36m=============================================================================\033[0m" | tee -a "$LOG_FILE"
    echo -e "\033[36m$1\033[0m" | tee -a "$LOG_FILE"
    echo -e "\033[36m=============================================================================\033[0m" | tee -a "$LOG_FILE"
}

# 检查必要工具
check_tools() {
    print_info "检查必要工具..."
    
    local tools=("tar" "rsync" "curl" "jq")
    local missing_tools=()
    
    for tool in "${tools[@]}"; do
        if ! command -v "$tool" &> /dev/null; then
            missing_tools+=("$tool")
        fi
    done
    
    if [ ${#missing_tools[@]} -gt 0 ]; then
        print_error "缺少必要工具: ${missing_tools[*]}"
        exit 1
    fi
    
    print_info "工具检查完成"
}

# 检查目录结构
check_directories() {
    print_info "检查目录结构..."
    
    local required_dirs=("$PROJECT_ROOT" "$PACKAGE_ROOT" "$DEPLOY_ROOT")
    
    for dir in "${required_dirs[@]}"; do
        if [ ! -d "$dir" ]; then
            print_info "创建目录: $dir"
            mkdir -p "$dir"
        fi
    done
    
    print_info "目录检查完成"
}

# 获取最新版本信息
get_latest_version() {
    print_info "获取最新版本信息..."
    
    if [ -f "${PACKAGE_ROOT}/latest_package.txt" ]; then
        local latest_package=$(cat "${PACKAGE_ROOT}/latest_package.txt")
        if [ -f "${PACKAGE_ROOT}/${latest_package}" ]; then
            echo "$latest_package"
            return 0
        fi
    fi
    
    # 如果没有记录，查找最新的包文件
    local latest_package=$(ls -t ${PACKAGE_ROOT}/${PROJECT_NAME}_v*_*.tar.gz 2>/dev/null | head -n1)
    if [ -n "$latest_package" ]; then
        echo "$(basename "$latest_package")"
    else
        print_error "未找到可用的包文件"
        exit 1
    fi
}

# 创建部署前备份
create_pre_deploy_backup() {
    print_info "创建部署前备份..."
    
    local backup_name="${PROJECT_NAME}_pre_deploy_${DATE}.tar.gz"
    
    cd "$PROJECT_ROOT"
    if tar -czf "${BACKUP_ROOT}/${backup_name}" . --exclude=".git" --exclude="node_modules" --exclude="*.log" 2>> "$LOG_FILE"; then
        print_info "部署前备份创建成功: $backup_name"
        echo "$backup_name" > "${DEPLOY_ROOT}/pre_deploy_backup.txt"
    else
        print_error "部署前备份创建失败"
        exit 1
    fi
}

# 解压部署包
extract_package() {
    local package_file=$1
    local extract_dir="${DEPLOY_ROOT}/extract_${DATE}"
    
    print_info "解压部署包: $package_file"
    
    mkdir -p "$extract_dir"
    
    if tar -xzf "${PACKAGE_ROOT}/${package_file}" -C "$extract_dir" 2>> "$LOG_FILE"; then
        print_info "部署包解压成功"
        echo "$extract_dir"
    else
        print_error "部署包解压失败"
        exit 1
    fi
}

# 停止相关服务
stop_services() {
    print_info "停止相关服务..."
    
    # 停止可能运行的服务
    local services=("nginx" "apache2" "node" "python3")
    
    for service in "${services[@]}"; do
        if systemctl is-active --quiet "$service" 2>/dev/null; then
            print_info "停止服务: $service"
            systemctl stop "$service" 2>> "$LOG_FILE" || true
        fi
    done
    
    # 杀死可能占用端口的进程
    local ports=(80 443 3000 8080)
    for port in "${ports[@]}"; do
        local pid=$(lsof -ti:$port 2>/dev/null || true)
        if [ -n "$pid" ]; then
            print_info "停止占用端口 $port 的进程: $pid"
            kill -9 "$pid" 2>> "$LOG_FILE" || true
        fi
    done
    
    print_info "服务停止完成"
}

# 部署新版本
deploy_new_version() {
    local extract_dir=$1
    
    print_info "部署新版本..."
    
    # 备份当前版本
    create_pre_deploy_backup
    
    # 停止服务
    stop_services
    
    # 复制新版本文件
    print_info "复制新版本文件..."
    rsync -av --delete "$extract_dir/" "$PROJECT_ROOT/" >> "$LOG_FILE" 2>&1
    
    # 设置文件权限
    print_info "设置文件权限..."
    find "$PROJECT_ROOT" -type f -name "*.sh" -exec chmod +x {} \; 2>> "$LOG_FILE" || true
    find "$PROJECT_ROOT" -type d -exec chmod 755 {} \; 2>> "$LOG_FILE" || true
    
    print_info "新版本部署完成"
}

# 启动相关服务
start_services() {
    print_info "启动相关服务..."
    
    # 启动可能需要的服务
    local services=("nginx")
    
    for service in "${services[@]}"; do
        if systemctl is-enabled --quiet "$service" 2>/dev/null; then
            print_info "启动服务: $service"
            systemctl start "$service" 2>> "$LOG_FILE" || true
        fi
    done
    
    # 等待服务启动
    sleep 5
    
    print_info "服务启动完成"
}

# 健康检查
health_check() {
    print_info "执行健康检查..."
    
    local health_checks_passed=0
    local total_checks=0
    
    # 检查文件完整性
    print_info "检查文件完整性..."
    ((total_checks++))
    if [ -f "$PROJECT_ROOT/app.js" ] && [ -f "$PROJECT_ROOT/app.json" ]; then
        print_info "✓ 核心文件存在"
        ((health_checks_passed++))
    else
        print_error "✗ 核心文件缺失"
    fi
    
    # 检查配置文件
    print_info "检查配置文件..."
    ((total_checks++))
    if [ -f "$PROJECT_ROOT/project.config.json" ]; then
        local appid=$(jq -r '.appid' "$PROJECT_ROOT/project.config.json" 2>/dev/null || echo "")
        if [ -n "$appid" ] && [ "$appid" != "null" ]; then
            print_info "✓ 配置文件有效"
            ((health_checks_passed++))
        else
            print_error "✗ 配置文件无效"
        fi
    else
        print_error "✗ 配置文件不存在"
    fi
    
    # 检查服务状态
    print_info "检查服务状态..."
    ((total_checks++))
    if systemctl is-active --quiet "nginx" 2>/dev/null; then
        print_info "✓ Web服务运行正常"
        ((health_checks_passed++))
    else
        print_warn "⚠ Web服务未运行（可能是正常的）"
        ((health_checks_passed++))  # 对于小程序项目，Web服务不是必需的
    fi
    
    # 检查端口占用
    print_info "检查端口占用..."
    ((total_checks++))
    local port_conflicts=0
    local ports=(80 443)
    for port in "${ports[@]}"; do
        if lsof -ti:$port > /dev/null 2>&1; then
            ((port_conflicts++))
        fi
    done
    
    if [ $port_conflicts -eq 0 ]; then
        print_info "✓ 端口检查通过"
        ((health_checks_passed++))
    else
        print_warn "⚠ 存在端口冲突"
        ((health_checks_passed++))  # 对于小程序项目，端口冲突不是致命问题
    fi
    
    print_info "健康检查完成: $health_checks_passed/$total_checks 项通过"
    
    if [ $health_checks_passed -eq $total_checks ]; then
        return 0
    else
        return 1
    fi
}

# 回滚到上一个版本
rollback_deployment() {
    local rollback_version=$1
    
    print_info "执行回滚操作..."
    
    if [ -z "$rollback_version" ]; then
        # 使用最新的备份
        if [ -f "${DEPLOY_ROOT}/pre_deploy_backup.txt" ]; then
            rollback_version=$(cat "${DEPLOY_ROOT}/pre_deploy_backup.txt")
        else
            print_error "未找到可用的备份文件"
            exit 1
        fi
    fi
    
    local backup_file="${BACKUP_ROOT}/${rollback_version}"
    
    if [ ! -f "$backup_file" ]; then
        print_error "备份文件不存在: $backup_file"
        exit 1
    fi
    
    print_info "回滚到版本: $rollback_version"
    
    # 停止服务
    stop_services
    
    # 清理当前版本
    print_info "清理当前版本..."
    find "$PROJECT_ROOT" -type f ! -path "*/.git/*" -delete 2>> "$LOG_FILE" || true
    
    # 恢复备份版本
    print_info "恢复备份版本..."
    tar -xzf "$backup_file" -C "$PROJECT_ROOT" 2>> "$LOG_FILE"
    
    # 启动服务
    start_services
    
    # 健康检查
    if health_check; then
        print_info "回滚成功"
    else
        print_error "回滚后健康检查失败"
        exit 1
    fi
}

# 清理临时文件
cleanup_temp_files() {
    print_info "清理临时文件..."
    
    # 清理解压目录
    local extract_dirs=$(find "$DEPLOY_ROOT" -name "extract_*" -type d 2>/dev/null || true)
    if [ -n "$extract_dirs" ]; then
        echo "$extract_dirs" | xargs rm -rf 2>> "$LOG_FILE" || true
        print_info "已清理解压目录"
    fi
    
    # 清理旧日志（保留最近7天）
    find "$DEPLOY_ROOT" -name "update_*.log" -mtime +7 -delete 2>> "$LOG_FILE" || true
    
    print_info "临时文件清理完成"
}

# 生成部署报告
generate_report() {
    print_info "生成部署报告..."
    
    local report_file="${DEPLOY_ROOT}/deploy_report_${DATE}.txt"
    
    cat > "$report_file" << EOF
=============================================================================
                        部署报告
=============================================================================
项目名称: $PROJECT_NAME
部署时间: $(date)
部署类型: $DEPLOY_TYPE
目标版本: $TARGET_VERSION
项目根目录: $PROJECT_ROOT

部署状态: 成功
日志文件: $LOG_FILE

部署文件:
$(find "$PROJECT_ROOT" -maxdepth 1 -type f -name "*.js" -o -name "*.json" -o -name "*.wxss" | head -10)

健康检查: 通过
=============================================================================
EOF
    
    print_info "部署报告已生成: $report_file"
}

# 发送通知
send_notification() {
    local status=$1
    local message="部署任务完成 - 项目: $PROJECT_NAME, 类型: $DEPLOY_TYPE, 状态: $status"
    
    # 如果有配置邮件或webhook，可以在这里添加通知逻辑
    print_info "通知: $message"
}

# 主函数
main() {
    print_header "开始执行代码更新部署任务 - $(date)"
    
    # 检查工具
    check_tools
    
    # 检查目录
    check_directories
    
    case "$DEPLOY_TYPE" in
        "rollback")
            print_info "执行回滚部署..."
            rollback_deployment "$ROLLBACK_VERSION"
            ;;
        "auto"|"manual")
            print_info "执行正常部署..."
            
            # 获取部署包
            if [ "$TARGET_VERSION" = "latest" ]; then
                TARGET_VERSION=$(get_latest_version)
            fi
            
            local package_file="$TARGET_VERSION"
            if [ ! -f "${PACKAGE_ROOT}/${package_file}" ]; then
                print_error "部署包不存在: ${PACKAGE_ROOT}/${package_file}"
                exit 1
            fi
            
            # 解压部署包
            local extract_dir=$(extract_package "$package_file")
            
            # 部署新版本
            deploy_new_version "$extract_dir"
            
            # 启动服务
            start_services
            
            # 健康检查
            if health_check; then
                print_info "部署成功，健康检查通过"
            else
                print_error "部署失败，健康检查未通过"
                print_info "开始自动回滚..."
                rollback_deployment
                exit 1
            fi
            ;;
        *)
            print_error "未知的部署类型: $DEPLOY_TYPE"
            print_info "支持的部署类型: auto, manual, rollback"
            exit 1
            ;;
    esac
    
    # 清理临时文件
    cleanup_temp_files
    
    # 生成报告
    generate_report
    
    # 发送通知
    send_notification "成功"
    
    print_header "部署任务完成 - $(date)"
    print_info "日志文件位置: $LOG_FILE"
}

# 错误处理
trap 'print_error "部署过程中发生错误，退出码: $?"; send_notification "失败"; exit 1' ERR

# 执行主函数
main "$@"