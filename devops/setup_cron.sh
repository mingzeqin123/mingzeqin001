#!/bin/bash

# =============================================================================
# 定时任务设置脚本 - 微信小程序跳一跳游戏项目
# 功能：配置crontab定时任务，实现自动化备份、打包和部署
# 作者：DevOps Team
# 版本：1.0.0
# =============================================================================

set -e  # 遇到错误立即退出

# 配置变量
PROJECT_NAME="jump-jump-game"
PROJECT_ROOT="/workspace"
DEVOPS_ROOT="${PROJECT_ROOT}/devops"
CRON_LOG_DIR="/var/log/cron_jobs"

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

# 检查脚本权限
check_script_permissions() {
    print_info "检查脚本权限..."
    
    local scripts=("backup.sh" "package.sh" "update.sh")
    
    for script in "${scripts[@]}"; do
        local script_path="${DEVOPS_ROOT}/${script}"
        if [ -f "$script_path" ]; then
            chmod +x "$script_path"
            print_info "✓ 已设置执行权限: $script"
        else
            print_error "✗ 脚本不存在: $script_path"
            exit 1
        fi
    done
}

# 创建日志目录
create_log_directories() {
    print_info "创建日志目录..."
    
    if [ ! -d "$CRON_LOG_DIR" ]; then
        sudo mkdir -p "$CRON_LOG_DIR"
        sudo chown $(whoami):$(whoami) "$CRON_LOG_DIR"
        print_info "✓ 已创建日志目录: $CRON_LOG_DIR"
    else
        print_info "✓ 日志目录已存在: $CRON_LOG_DIR"
    fi
}

# 生成crontab配置
generate_crontab_config() {
    print_info "生成crontab配置..."
    
    local crontab_file="/tmp/crontab_${PROJECT_NAME}_$(date +%s)"
    
    cat > "$crontab_file" << EOF
# =============================================================================
# 微信小程序跳一跳游戏项目 - 自动化定时任务
# 生成时间: $(date)
# 项目路径: $PROJECT_ROOT
# =============================================================================

# 环境变量设置
PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
SHELL=/bin/bash

# 每天凌晨2点执行代码备份
0 2 * * * $DEVOPS_ROOT/backup.sh >> $CRON_LOG_DIR/backup_$(date +\%Y\%m\%d).log 2>&1

# 每周一凌晨3点执行代码打包（生产版本）
0 3 * * 1 $DEVOPS_ROOT/package.sh 1.0.0 >> $CRON_LOG_DIR/package_$(date +\%Y\%m\%d).log 2>&1

# 每天凌晨4点检查并执行自动更新（仅在有新版本时）
0 4 * * * $DEVOPS_ROOT/update.sh auto latest >> $CRON_LOG_DIR/update_$(date +\%Y\%m\%d).log 2>&1

# 每小时检查项目健康状态
0 * * * * $DEVOPS_ROOT/health_check.sh >> $CRON_LOG_DIR/health_$(date +\%Y\%m\%d).log 2>&1

# 每周日凌晨1点清理旧日志和备份文件
0 1 * * 0 find /backup -name "*.tar.gz" -mtime +30 -delete >> $CRON_LOG_DIR/cleanup_$(date +\%Y\%m\%d).log 2>&1
0 1 * * 0 find /packages -name "*.tar.gz" -mtime +30 -delete >> $CRON_LOG_DIR/cleanup_$(date +\%Y\%m\%d).log 2>&1
0 1 * * 0 find $CRON_LOG_DIR -name "*.log" -mtime +30 -delete >> $CRON_LOG_DIR/cleanup_$(date +\%Y\%m\%d).log 2>&1

# 每月1号凌晨5点生成月度报告
0 5 1 * * $DEVOPS_ROOT/monthly_report.sh >> $CRON_LOG_DIR/monthly_$(date +\%Y\%m).log 2>&1
EOF
    
    echo "$crontab_file"
}

# 安装crontab
install_crontab() {
    local crontab_file=$1
    
    print_info "安装crontab定时任务..."
    
    # 备份当前crontab
    local backup_file="/tmp/crontab_backup_$(date +%s)"
    crontab -l > "$backup_file" 2>/dev/null || true
    print_info "✓ 已备份当前crontab到: $backup_file"
    
    # 安装新的crontab
    if crontab "$crontab_file"; then
        print_info "✓ crontab定时任务安装成功"
    else
        print_error "✗ crontab定时任务安装失败"
        exit 1
    fi
    
    # 清理临时文件
    rm -f "$crontab_file"
}

# 验证crontab安装
verify_crontab() {
    print_info "验证crontab安装..."
    
    local cron_count=$(crontab -l 2>/dev/null | grep -c "$PROJECT_NAME" || echo "0")
    
    if [ "$cron_count" -gt 0 ]; then
        print_info "✓ 已安装 $cron_count 个相关定时任务"
        
        print_info "当前定时任务列表:"
        crontab -l | grep -A 20 "微信小程序跳一跳游戏项目" || true
    else
        print_error "✗ 未找到相关定时任务"
        exit 1
    fi
}

# 创建健康检查脚本
create_health_check_script() {
    print_info "创建健康检查脚本..."
    
    local health_script="${DEVOPS_ROOT}/health_check.sh"
    
    cat > "$health_script" << 'EOF'
#!/bin/bash

# 健康检查脚本
PROJECT_ROOT="/workspace"
LOG_FILE="/var/log/cron_jobs/health_$(date +%Y%m%d).log"

# 检查项目文件完整性
check_project_files() {
    local missing_files=0
    
    # 检查核心文件
    local core_files=("app.js" "app.json" "app.wxss" "project.config.json")
    for file in "${core_files[@]}"; do
        if [ ! -f "$PROJECT_ROOT/$file" ]; then
            echo "$(date): ERROR - 缺少核心文件: $file" >> "$LOG_FILE"
            ((missing_files++))
        fi
    done
    
    # 检查游戏文件
    local game_files=("pages/game/game.js" "pages/game/gameEngine.js")
    for file in "${game_files[@]}"; do
        if [ ! -f "$PROJECT_ROOT/$file" ]; then
            echo "$(date): ERROR - 缺少游戏文件: $file" >> "$LOG_FILE"
            ((missing_files++))
        fi
    done
    
    if [ $missing_files -eq 0 ]; then
        echo "$(date): INFO - 项目文件完整性检查通过" >> "$LOG_FILE"
        return 0
    else
        echo "$(date): ERROR - 发现 $missing_files 个缺失文件" >> "$LOG_FILE"
        return 1
    fi
}

# 检查磁盘空间
check_disk_space() {
    local usage=$(df /workspace | awk 'NR==2 {print $5}' | sed 's/%//')
    
    if [ "$usage" -gt 90 ]; then
        echo "$(date): WARNING - 磁盘空间使用率过高: ${usage}%" >> "$LOG_FILE"
        return 1
    else
        echo "$(date): INFO - 磁盘空间正常: ${usage}%" >> "$LOG_FILE"
        return 0
    fi
}

# 检查进程状态
check_processes() {
    local failed_checks=0
    
    # 检查是否有僵尸进程
    local zombie_count=$(ps aux | awk '$8 ~ /^Z/ { count++ } END { print count+0 }')
    if [ "$zombie_count" -gt 0 ]; then
        echo "$(date): WARNING - 发现 $zombie_count 个僵尸进程" >> "$LOG_FILE"
        ((failed_checks++))
    fi
    
    # 检查内存使用
    local mem_usage=$(free | awk 'NR==2{printf "%.0f", $3*100/$2}')
    if [ "$mem_usage" -gt 90 ]; then
        echo "$(date): WARNING - 内存使用率过高: ${mem_usage}%" >> "$LOG_FILE"
        ((failed_checks++))
    fi
    
    if [ $failed_checks -eq 0 ]; then
        echo "$(date): INFO - 系统进程状态正常" >> "$LOG_FILE"
        return 0
    else
        return 1
    fi
}

# 主检查函数
main() {
    echo "$(date): INFO - 开始健康检查" >> "$LOG_FILE"
    
    local failed_checks=0
    
    check_project_files || ((failed_checks++))
    check_disk_space || ((failed_checks++))
    check_processes || ((failed_checks++))
    
    if [ $failed_checks -eq 0 ]; then
        echo "$(date): INFO - 所有健康检查通过" >> "$LOG_FILE"
    else
        echo "$(date): ERROR - $failed_checks 项健康检查失败" >> "$LOG_FILE"
    fi
}

main "$@"
EOF
    
    chmod +x "$health_script"
    print_info "✓ 健康检查脚本已创建: $health_script"
}

# 创建月度报告脚本
create_monthly_report_script() {
    print_info "创建月度报告脚本..."
    
    local report_script="${DEVOPS_ROOT}/monthly_report.sh"
    
    cat > "$report_script" << 'EOF'
#!/bin/bash

# 月度报告脚本
PROJECT_NAME="jump-jump-game"
REPORT_DIR="/var/log/cron_jobs/reports"
DATE=$(date +%Y%m)

mkdir -p "$REPORT_DIR"

# 生成月度报告
generate_monthly_report() {
    local report_file="$REPORT_DIR/monthly_report_$DATE.txt"
    
    cat > "$report_file" << REPORT_EOF
=============================================================================
                        月度运维报告
=============================================================================
项目名称: $PROJECT_NAME
报告月份: $(date +%Y年%m月)
生成时间: $(date)

## 备份统计
$(ls -la /backup/*.tar.gz 2>/dev/null | wc -l) 个备份文件
最新备份: $(ls -t /backup/*.tar.gz 2>/dev/null | head -1 | xargs basename 2>/dev/null || echo "无")

## 打包统计
$(ls -la /packages/*.tar.gz 2>/dev/null | wc -l) 个打包文件
最新版本: $(ls -t /packages/*.tar.gz 2>/dev/null | head -1 | xargs basename 2>/dev/null || echo "无")

## 部署统计
部署次数: $(ls -la /deploy/deploy_report_*.txt 2>/dev/null | wc -l)
最新部署: $(ls -t /deploy/deploy_report_*.txt 2>/dev/null | head -1 | xargs basename 2>/dev/null || echo "无")

## 健康检查统计
健康检查次数: $(ls -la /var/log/cron_jobs/health_*.log 2>/dev/null | wc -l)
异常次数: $(grep -c "ERROR\|WARNING" /var/log/cron_jobs/health_*.log 2>/dev/null || echo "0")

## 磁盘使用情况
$(df -h /workspace)

## 系统资源使用情况
内存使用:
$(free -h)

CPU负载:
$(uptime)

=============================================================================
REPORT_EOF
    
    echo "月度报告已生成: $report_file"
}

generate_monthly_report
EOF
    
    chmod +x "$report_script"
    print_info "✓ 月度报告脚本已创建: $report_script"
}

# 创建管理脚本
create_management_script() {
    print_info "创建管理脚本..."
    
    local manage_script="${DEVOPS_ROOT}/manage.sh"
    
    cat > "$manage_script" << 'EOF'
#!/bin/bash

# DevOps 管理脚本
PROJECT_NAME="jump-jump-game"
DEVOPS_ROOT="/workspace/devops"

print_usage() {
    echo "用法: $0 <command> [options]"
    echo ""
    echo "可用命令:"
    echo "  status          - 查看定时任务状态"
    echo "  backup          - 立即执行备份"
    echo "  package [ver]   - 立即执行打包（可选版本号）"
    echo "  update [type]   - 立即执行更新（auto/manual/rollback）"
    echo "  health          - 执行健康检查"
    echo "  logs            - 查看日志"
    echo "  report          - 生成月度报告"
    echo "  uninstall       - 卸载定时任务"
    echo ""
}

show_status() {
    echo "=== 定时任务状态 ==="
    crontab -l | grep -A 20 "$PROJECT_NAME" || echo "未找到相关定时任务"
    echo ""
    echo "=== 最近日志文件 ==="
    ls -lt /var/log/cron_jobs/*.log 2>/dev/null | head -10 || echo "未找到日志文件"
}

show_logs() {
    echo "=== 最近日志内容 ==="
    for log in $(ls -t /var/log/cron_jobs/*.log 2>/dev/null | head -5); do
        echo "--- $(basename "$log") ---"
        tail -20 "$log"
        echo ""
    done
}

case "$1" in
    "status")
        show_status
        ;;
    "backup")
        echo "执行备份..."
        $DEVOPS_ROOT/backup.sh
        ;;
    "package")
        version=${2:-"1.0.0"}
        echo "执行打包，版本: $version"
        $DEVOPS_ROOT/package.sh "$version"
        ;;
    "update")
        type=${2:-"auto"}
        echo "执行更新，类型: $type"
        $DEVOPS_ROOT/update.sh "$type"
        ;;
    "health")
        echo "执行健康检查..."
        $DEVOPS_ROOT/health_check.sh
        ;;
    "logs")
        show_logs
        ;;
    "report")
        echo "生成月度报告..."
        $DEVOPS_ROOT/monthly_report.sh
        ;;
    "uninstall")
        echo "卸载定时任务..."
        crontab -l | grep -v "$PROJECT_NAME" | crontab -
        echo "定时任务已卸载"
        ;;
    *)
        print_usage
        ;;
esac
EOF
    
    chmod +x "$manage_script"
    print_info "✓ 管理脚本已创建: $manage_script"
}

# 主函数
main() {
    print_header "开始设置定时任务 - $(date)"
    
    # 检查脚本权限
    check_script_permissions
    
    # 创建日志目录
    create_log_directories
    
    # 生成crontab配置
    local crontab_file=$(generate_crontab_config)
    
    # 安装crontab
    install_crontab "$crontab_file"
    
    # 验证安装
    verify_crontab
    
    # 创建辅助脚本
    create_health_check_script
    create_monthly_report_script
    create_management_script
    
    print_header "定时任务设置完成"
    print_info "使用以下命令管理定时任务:"
    print_info "  $DEVOPS_ROOT/manage.sh status    - 查看状态"
    print_info "  $DEVOPS_ROOT/manage.sh backup    - 立即备份"
    print_info "  $DEVOPS_ROOT/manage.sh package   - 立即打包"
    print_info "  $DEVOPS_ROOT/manage.sh update    - 立即更新"
    print_info "  $DEVOPS_ROOT/manage.sh logs      - 查看日志"
    print_info "  $DEVOPS_ROOT/manage.sh uninstall - 卸载任务"
    print_info ""
    print_info "日志目录: $CRON_LOG_DIR"
    print_info "定时任务已配置完成，将在指定时间自动执行"
}

# 错误处理
trap 'print_error "设置过程中发生错误，退出码: $?"; exit 1' ERR

# 执行主函数
main "$@"