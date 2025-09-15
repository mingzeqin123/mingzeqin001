#!/bin/bash

# =============================================================================
# 代码备份脚本 - 微信小程序跳一跳游戏项目
# 功能：自动备份项目代码到指定目录，支持增量备份和压缩
# 作者：DevOps Team
# 版本：1.0.0
# =============================================================================

set -e  # 遇到错误立即退出

# 配置变量
PROJECT_NAME="jump-jump-game"
PROJECT_ROOT="/workspace"
BACKUP_ROOT="/backup"
DATE=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="${BACKUP_ROOT}/${PROJECT_NAME}_${DATE}"
LOG_FILE="${BACKUP_ROOT}/backup_${DATE}.log"

# 需要备份的目录和文件
INCLUDE_PATTERNS=(
    "app.js"
    "app.json"
    "app.wxss"
    "sitemap.json"
    "project.config.json"
    "pages/"
    "utils/"
    "images/"
    "sounds/"
    "examples/"
    "docs/"
    "java-mac-app/"
    "*.py"
    "*.md"
    "*.txt"
    "*.json"
    "*.xml"
    "LICENSE"
)

# 需要排除的目录和文件
EXCLUDE_PATTERNS=(
    "node_modules/"
    ".git/"
    ".DS_Store"
    "*.log"
    "*.tmp"
    "target/"
    "build/"
    "dist/"
    ".vscode/"
    ".idea/"
    "*.pyc"
    "__pycache__/"
    ".pytest_cache/"
)

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

# 检查必要目录
check_directories() {
    print_info "检查目录结构..."
    
    if [ ! -d "$PROJECT_ROOT" ]; then
        print_error "项目根目录不存在: $PROJECT_ROOT"
        exit 1
    fi
    
    if [ ! -d "$BACKUP_ROOT" ]; then
        print_info "创建备份根目录: $BACKUP_ROOT"
        mkdir -p "$BACKUP_ROOT"
    fi
    
    if [ ! -d "$BACKUP_DIR" ]; then
        print_info "创建备份目录: $BACKUP_DIR"
        mkdir -p "$BACKUP_DIR"
    fi
    
    print_info "目录检查完成"
}

# 生成 rsync 排除参数
generate_exclude_args() {
    local exclude_args=""
    for pattern in "${EXCLUDE_PATTERNS[@]}"; do
        exclude_args="$exclude_args --exclude=$pattern"
    done
    echo "$exclude_args"
}

# 执行备份
perform_backup() {
    print_info "开始执行备份..."
    
    local exclude_args=$(generate_exclude_args)
    local backup_count=0
    
    # 备份主要文件和目录
    for pattern in "${INCLUDE_PATTERNS[@]}"; do
        if [ -e "$PROJECT_ROOT/$pattern" ]; then
            print_info "备份: $pattern"
            rsync -av $exclude_args "$PROJECT_ROOT/$pattern" "$BACKUP_DIR/" >> "$LOG_FILE" 2>&1
            ((backup_count++))
        else
            print_warn "文件/目录不存在，跳过: $pattern"
        fi
    done
    
    print_info "备份完成，共处理 $backup_count 个项目"
}

# 压缩备份文件
compress_backup() {
    print_info "压缩备份文件..."
    
    cd "$BACKUP_ROOT"
    local archive_name="${PROJECT_NAME}_${DATE}.tar.gz"
    
    if tar -czf "$archive_name" "$(basename "$BACKUP_DIR")" 2>> "$LOG_FILE"; then
        print_info "压缩成功: $archive_name"
        
        # 计算文件大小
        local file_size=$(du -h "$archive_name" | cut -f1)
        print_info "备份文件大小: $file_size"
        
        # 删除原始备份目录
        rm -rf "$BACKUP_DIR"
        print_info "已清理临时备份目录"
        
        echo "$archive_name" > "${BACKUP_ROOT}/latest_backup.txt"
        print_info "备份文件名已记录到: ${BACKUP_ROOT}/latest_backup.txt"
    else
        print_error "压缩失败"
        exit 1
    fi
}

# 清理旧备份（保留最近7天）
cleanup_old_backups() {
    print_info "清理旧备份文件（保留最近7天）..."
    
    cd "$BACKUP_ROOT"
    local deleted_count=0
    
    # 删除7天前的备份文件
    find . -name "${PROJECT_NAME}_*.tar.gz" -mtime +7 -type f | while read -r file; do
        print_info "删除旧备份: $(basename "$file")"
        rm -f "$file"
        ((deleted_count++))
    done
    
    if [ $deleted_count -gt 0 ]; then
        print_info "已删除 $deleted_count 个旧备份文件"
    else
        print_info "没有需要清理的旧备份文件"
    fi
}

# 生成备份报告
generate_report() {
    print_info "生成备份报告..."
    
    local report_file="${BACKUP_ROOT}/backup_report_${DATE}.txt"
    
    cat > "$report_file" << EOF
=============================================================================
                        备份报告
=============================================================================
项目名称: $PROJECT_NAME
备份时间: $(date)
备份目录: $BACKUP_ROOT
备份文件: ${PROJECT_NAME}_${DATE}.tar.gz
项目根目录: $PROJECT_ROOT

备份内容:
$(for pattern in "${INCLUDE_PATTERNS[@]}"; do echo "- $pattern"; done)

排除内容:
$(for pattern in "${EXCLUDE_PATTERNS[@]}"; do echo "- $pattern"; done)

备份状态: 成功
日志文件: $LOG_FILE
=============================================================================
EOF
    
    print_info "备份报告已生成: $report_file"
}

# 发送通知（可选）
send_notification() {
    local status=$1
    local message="备份任务完成 - 状态: $status"
    
    # 如果有配置邮件或webhook，可以在这里添加通知逻辑
    # 例如：curl -X POST -H 'Content-type: application/json' --data "{\"text\":\"$message\"}" $WEBHOOK_URL
    
    print_info "通知: $message"
}

# 主函数
main() {
    print_header "开始执行代码备份任务 - $(date)"
    
    # 检查目录
    check_directories
    
    # 执行备份
    perform_backup
    
    # 压缩备份
    compress_backup
    
    # 清理旧备份
    cleanup_old_backups
    
    # 生成报告
    generate_report
    
    # 发送通知
    send_notification "成功"
    
    print_header "备份任务完成 - $(date)"
    print_info "备份文件位置: ${BACKUP_ROOT}/${PROJECT_NAME}_${DATE}.tar.gz"
    print_info "日志文件位置: $LOG_FILE"
}

# 错误处理
trap 'print_error "备份过程中发生错误，退出码: $?"; send_notification "失败"; exit 1' ERR

# 执行主函数
main "$@"