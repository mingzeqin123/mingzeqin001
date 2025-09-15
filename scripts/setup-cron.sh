#!/bin/bash

# 设置定时任务脚本
# 用于配置自动化构建和部署的cron任务

set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 配置
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CRON_USER="${CRON_USER:-$(whoami)}"
LOG_DIR="$PROJECT_ROOT/logs"

log_info "设置定时任务..."
log_info "项目路径: $PROJECT_ROOT"
log_info "用户: $CRON_USER"

# 创建日志目录
mkdir -p "$LOG_DIR"

# 创建临时cron文件
TEMP_CRON=$(mktemp)

# 保留现有的cron任务（排除本项目相关的）
crontab -l 2>/dev/null | grep -v "$PROJECT_ROOT" > "$TEMP_CRON" || true

# 添加新的cron任务
cat >> "$TEMP_CRON" << EOF

# ============================================
# 项目自动化任务 - $(date)
# ============================================

# 每天凌晨2点执行完整更新（拉取代码 + 构建 + 部署）
0 2 * * * cd $PROJECT_ROOT && $PROJECT_ROOT/scripts/update-service.sh >> $LOG_DIR/update.log 2>&1

# 每天凌晨2:30执行独立部署（仅部署已构建的产物）
30 2 * * * cd $PROJECT_ROOT && $PROJECT_ROOT/scripts/deploy.sh >> $LOG_DIR/deploy.log 2>&1

# 每小时执行健康检查
0 * * * * $PROJECT_ROOT/scripts/health-check.sh >> $LOG_DIR/health.log 2>&1

# 每6小时检查代码更新（不自动部署）
0 */6 * * * cd $PROJECT_ROOT && git fetch origin && if [ \$(git rev-list HEAD...origin/main --count) -gt 0 ]; then echo "[$(date)] 检测到新提交" >> $LOG_DIR/git-check.log; fi

# 每天凌晨4点清理旧日志文件（保留7天）
0 4 * * * find $LOG_DIR -name "*.log" -mtime +7 -delete

# 每周日凌晨3点清理旧构建产物（保留30天）
0 3 * * 0 find $PROJECT_ROOT/build -name "*.tar.gz" -mtime +30 -delete

# 每天凌晨5点生成日报
0 5 * * * $PROJECT_ROOT/scripts/generate-report.sh >> $LOG_DIR/report.log 2>&1

# ============================================

EOF

# 安装新的cron任务
crontab "$TEMP_CRON"
rm "$TEMP_CRON"

log_success "定时任务设置完成"

# 显示当前的cron任务
log_info "当前的定时任务:"
crontab -l | grep -A 20 -B 5 "$PROJECT_ROOT" || log_warning "没有找到相关任务"

# 检查cron服务状态
if systemctl is-active --quiet cron 2>/dev/null || systemctl is-active --quiet crond 2>/dev/null; then
    log_success "Cron服务运行正常"
else
    log_warning "Cron服务可能未运行，请检查系统服务"
    
    # 尝试启动cron服务
    if command -v systemctl &> /dev/null; then
        sudo systemctl enable cron 2>/dev/null || sudo systemctl enable crond 2>/dev/null || true
        sudo systemctl start cron 2>/dev/null || sudo systemctl start crond 2>/dev/null || true
    fi
fi

# 创建日志轮转配置
log_info "配置日志轮转..."

LOGROTATE_CONF="/etc/logrotate.d/app-project"
if [ -w "/etc/logrotate.d" ] || [ "$EUID" -eq 0 ]; then
    sudo tee "$LOGROTATE_CONF" > /dev/null << EOF
$LOG_DIR/*.log {
    daily
    rotate 30
    compress
    delaycompress
    missingok
    notifempty
    create 0644 $CRON_USER $CRON_USER
    postrotate
        # 可以在这里添加日志轮转后的操作
    endscript
}
EOF
    log_success "日志轮转配置完成: $LOGROTATE_CONF"
else
    log_warning "无权限创建日志轮转配置，请手动配置"
fi

log_success "定时任务设置完成！"
echo ""
echo "定时任务说明:"
echo "- 每天凌晨2:00 - 完整更新（代码 + 构建 + 部署）"
echo "- 每天凌晨2:30 - 独立部署"
echo "- 每小时 - 健康检查"
echo "- 每6小时 - 检查代码更新"
echo "- 每天凌晨4:00 - 清理旧日志"
echo "- 每周日凌晨3:00 - 清理旧构建产物"
echo "- 每天凌晨5:00 - 生成日报"
echo ""
echo "日志位置: $LOG_DIR"
echo "查看任务: crontab -l"
echo "编辑任务: crontab -e"