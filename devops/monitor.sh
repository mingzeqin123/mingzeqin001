#!/bin/bash

# =============================================================================
# 监控和通知脚本 - 微信小程序跳一跳游戏项目
# 功能：实时监控系统状态，发送通知，记录监控数据
# 作者：DevOps Team
# 版本：1.0.0
# =============================================================================

set -e  # 遇到错误立即退出

# 配置变量
PROJECT_NAME="jump-jump-game"
PROJECT_ROOT="/workspace"
MONITOR_LOG_DIR="/var/log/monitoring"
ALERT_LOG_FILE="${MONITOR_LOG_DIR}/alerts.log"
METRICS_LOG_FILE="${MONITOR_LOG_DIR}/metrics.log"
NOTIFICATION_CONFIG="${PROJECT_ROOT}/devops/notification.conf"

# 监控配置
CPU_THRESHOLD=80
MEMORY_THRESHOLD=85
DISK_THRESHOLD=90
PROCESS_THRESHOLD=100

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

# 初始化监控环境
init_monitoring() {
    print_info "初始化监控环境..."
    
    # 创建监控日志目录
    if [ ! -d "$MONITOR_LOG_DIR" ]; then
        sudo mkdir -p "$MONITOR_LOG_DIR"
        sudo chown $(whoami):$(whoami) "$MONITOR_LOG_DIR"
        print_info "✓ 已创建监控日志目录: $MONITOR_LOG_DIR"
    fi
    
    # 创建通知配置文件
    if [ ! -f "$NOTIFICATION_CONFIG" ]; then
        create_notification_config
    fi
    
    print_info "监控环境初始化完成"
}

# 创建通知配置文件
create_notification_config() {
    print_info "创建通知配置文件..."
    
    cat > "$NOTIFICATION_CONFIG" << 'EOF'
# 通知配置文件
# 启用/禁用通知功能
ENABLE_EMAIL=false
ENABLE_WEBHOOK=false
ENABLE_SLACK=false

# 邮件配置
EMAIL_SMTP_SERVER="smtp.example.com"
EMAIL_SMTP_PORT=587
EMAIL_USERNAME="monitor@example.com"
EMAIL_PASSWORD="your_password"
EMAIL_TO="admin@example.com"

# Webhook配置
WEBHOOK_URL="https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK"
WEBHOOK_TIMEOUT=10

# Slack配置
SLACK_TOKEN="xoxb-your-slack-token"
SLACK_CHANNEL="#alerts"

# 通知阈值
ALERT_CPU_THRESHOLD=80
ALERT_MEMORY_THRESHOLD=85
ALERT_DISK_THRESHOLD=90
ALERT_PROCESS_THRESHOLD=100

# 通知频率限制（分钟）
NOTIFICATION_COOLDOWN=60
EOF
    
    print_info "✓ 通知配置文件已创建: $NOTIFICATION_CONFIG"
    print_warn "请根据需要修改配置文件中的通知设置"
}

# 收集系统指标
collect_metrics() {
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    # CPU使用率
    local cpu_usage=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | awk -F'%' '{print $1}')
    
    # 内存使用率
    local memory_info=$(free | awk 'NR==2{printf "%.1f", $3*100/$2}')
    
    # 磁盘使用率
    local disk_usage=$(df /workspace | awk 'NR==2 {print $5}' | sed 's/%//')
    
    # 进程数量
    local process_count=$(ps aux | wc -l)
    
    # 负载平均值
    local load_avg=$(uptime | awk -F'load average:' '{print $2}' | awk '{print $1}' | sed 's/,//')
    
    # 记录指标到日志
    echo "$timestamp,CPU,$cpu_usage,MEMORY,$memory_info,DISK,$disk_usage,PROCESSES,$process_count,LOAD,$load_avg" >> "$METRICS_LOG_FILE"
    
    echo "$cpu_usage,$memory_info,$disk_usage,$process_count,$load_avg"
}

# 检查CPU使用率
check_cpu() {
    local cpu_usage=$1
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    if (( $(echo "$cpu_usage > $CPU_THRESHOLD" | bc -l) )); then
        local alert_msg="CPU使用率过高: ${cpu_usage}% (阈值: ${CPU_THRESHOLD}%)"
        echo "$timestamp,CPU_ALERT,$alert_msg" >> "$ALERT_LOG_FILE"
        send_alert "CPU" "$alert_msg"
        return 1
    fi
    return 0
}

# 检查内存使用率
check_memory() {
    local memory_usage=$1
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    if (( $(echo "$memory_usage > $MEMORY_THRESHOLD" | bc -l) )); then
        local alert_msg="内存使用率过高: ${memory_usage}% (阈值: ${MEMORY_THRESHOLD}%)"
        echo "$timestamp,MEMORY_ALERT,$alert_msg" >> "$ALERT_LOG_FILE"
        send_alert "MEMORY" "$alert_msg"
        return 1
    fi
    return 0
}

# 检查磁盘使用率
check_disk() {
    local disk_usage=$1
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    if [ "$disk_usage" -gt "$DISK_THRESHOLD" ]; then
        local alert_msg="磁盘使用率过高: ${disk_usage}% (阈值: ${DISK_THRESHOLD}%)"
        echo "$timestamp,DISK_ALERT,$alert_msg" >> "$ALERT_LOG_FILE"
        send_alert "DISK" "$alert_msg"
        return 1
    fi
    return 0
}

# 检查进程数量
check_processes() {
    local process_count=$1
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    if [ "$process_count" -gt "$PROCESS_THRESHOLD" ]; then
        local alert_msg="进程数量过多: ${process_count} (阈值: ${PROCESS_THRESHOLD})"
        echo "$timestamp,PROCESS_ALERT,$alert_msg" >> "$ALERT_LOG_FILE"
        send_alert "PROCESS" "$alert_msg"
        return 1
    fi
    return 0
}

# 检查项目文件完整性
check_project_integrity() {
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    local missing_files=0
    local critical_files=("app.js" "app.json" "app.wxss" "project.config.json")
    
    for file in "${critical_files[@]}"; do
        if [ ! -f "$PROJECT_ROOT/$file" ]; then
            ((missing_files++))
        fi
    done
    
    if [ "$missing_files" -gt 0 ]; then
        local alert_msg="项目文件完整性检查失败，缺少 $missing_files 个关键文件"
        echo "$timestamp,INTEGRITY_ALERT,$alert_msg" >> "$ALERT_LOG_FILE"
        send_alert "INTEGRITY" "$alert_msg"
        return 1
    fi
    
    return 0
}

# 检查服务状态
check_services() {
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    local failed_services=()
    
    # 检查关键服务
    local services=("cron" "rsyslog")
    for service in "${services[@]}"; do
        if ! systemctl is-active --quiet "$service" 2>/dev/null; then
            failed_services+=("$service")
        fi
    done
    
    if [ ${#failed_services[@]} -gt 0 ]; then
        local alert_msg="关键服务异常: ${failed_services[*]}"
        echo "$timestamp,SERVICE_ALERT,$alert_msg" >> "$ALERT_LOG_FILE"
        send_alert "SERVICE" "$alert_msg"
        return 1
    fi
    
    return 0
}

# 发送告警通知
send_alert() {
    local alert_type=$1
    local message=$2
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    # 检查通知冷却时间
    if check_notification_cooldown "$alert_type"; then
        print_warn "通知冷却中，跳过发送: $alert_type"
        return 0
    fi
    
    # 发送邮件通知
    if is_notification_enabled "EMAIL"; then
        send_email_alert "$alert_type" "$message"
    fi
    
    # 发送Webhook通知
    if is_notification_enabled "WEBHOOK"; then
        send_webhook_alert "$alert_type" "$message"
    fi
    
    # 发送Slack通知
    if is_notification_enabled "SLACK"; then
        send_slack_alert "$alert_type" "$message"
    fi
    
    # 记录通知发送时间
    echo "$timestamp" > "${MONITOR_LOG_DIR}/last_notification_${alert_type}.txt"
    
    print_info "告警通知已发送: $alert_type"
}

# 检查通知是否启用
is_notification_enabled() {
    local type=$1
    if [ -f "$NOTIFICATION_CONFIG" ]; then
        source "$NOTIFICATION_CONFIG"
        case "$type" in
            "EMAIL") [ "$ENABLE_EMAIL" = "true" ] ;;
            "WEBHOOK") [ "$ENABLE_WEBHOOK" = "true" ] ;;
            "SLACK") [ "$ENABLE_SLACK" = "true" ] ;;
            *) false ;;
        esac
    else
        false
    fi
}

# 检查通知冷却时间
check_notification_cooldown() {
    local alert_type=$1
    local last_notification_file="${MONITOR_LOG_DIR}/last_notification_${alert_type}.txt"
    
    if [ ! -f "$last_notification_file" ]; then
        return 1  # 没有发送过通知，可以发送
    fi
    
    local last_time=$(cat "$last_notification_file")
    local current_time=$(date +%s)
    local last_timestamp=$(date -d "$last_time" +%s 2>/dev/null || echo "0")
    local cooldown_seconds=$((NOTIFICATION_COOLDOWN * 60))
    
    if [ $((current_time - last_timestamp)) -lt $cooldown_seconds ]; then
        return 0  # 在冷却时间内
    else
        return 1  # 冷却时间已过，可以发送
    fi
}

# 发送邮件告警
send_email_alert() {
    local alert_type=$1
    local message=$2
    
    if ! command -v mail &> /dev/null; then
        print_warn "mail命令不可用，跳过邮件通知"
        return
    fi
    
    local subject="[$PROJECT_NAME] 系统告警 - $alert_type"
    local body="时间: $(date)
项目: $PROJECT_NAME
告警类型: $alert_type
消息: $message
服务器: $(hostname)"

    echo "$body" | mail -s "$subject" "$EMAIL_TO" 2>/dev/null || true
}

# 发送Webhook告警
send_webhook_alert() {
    local alert_type=$1
    local message=$2
    
    local payload=$(cat << EOF
{
    "text": "[$PROJECT_NAME] 系统告警",
    "attachments": [
        {
            "color": "danger",
            "fields": [
                {
                    "title": "告警类型",
                    "value": "$alert_type",
                    "short": true
                },
                {
                    "title": "时间",
                    "value": "$(date)",
                    "short": true
                },
                {
                    "title": "消息",
                    "value": "$message",
                    "short": false
                },
                {
                    "title": "服务器",
                    "value": "$(hostname)",
                    "short": true
                }
            ]
        }
    ]
}
EOF
)
    
    curl -X POST -H 'Content-type: application/json' \
         --data "$payload" \
         --connect-timeout "$WEBHOOK_TIMEOUT" \
         "$WEBHOOK_URL" 2>/dev/null || true
}

# 发送Slack告警
send_slack_alert() {
    local alert_type=$1
    local message=$2
    
    local payload=$(cat << EOF
{
    "channel": "$SLACK_CHANNEL",
    "text": "[$PROJECT_NAME] 系统告警 - $alert_type",
    "attachments": [
        {
            "color": "danger",
            "fields": [
                {
                    "title": "告警类型",
                    "value": "$alert_type",
                    "short": true
                },
                {
                    "title": "时间",
                    "value": "$(date)",
                    "short": true
                },
                {
                    "title": "消息",
                    "value": "$message",
                    "short": false
                }
            ]
        }
    ]
}
EOF
)
    
    curl -X POST -H 'Authorization: Bearer '"$SLACK_TOKEN" \
         -H 'Content-type: application/json' \
         --data "$payload" \
         --connect-timeout 10 \
         "https://slack.com/api/chat.postMessage" 2>/dev/null || true
}

# 生成监控报告
generate_monitoring_report() {
    local report_file="${MONITOR_LOG_DIR}/monitoring_report_$(date +%Y%m%d).txt"
    
    cat > "$report_file" << EOF
=============================================================================
                        监控报告
=============================================================================
生成时间: $(date)
项目名称: $PROJECT_NAME

## 系统状态
CPU使用率: $(top -bn1 | grep "Cpu(s)" | awk '{print $2}')
内存使用率: $(free | awk 'NR==2{printf "%.1f%%", $3*100/$2}')
磁盘使用率: $(df /workspace | awk 'NR==2 {print $5}')
进程数量: $(ps aux | wc -l)
负载平均值: $(uptime | awk -F'load average:' '{print $2}')

## 最近告警 (最近24小时)
$(grep "$(date +%Y-%m-%d)" "$ALERT_LOG_FILE" 2>/dev/null | tail -10 || echo "无告警记录")

## 系统资源使用趋势
$(tail -20 "$METRICS_LOG_FILE" 2>/dev/null || echo "无监控数据")

## 项目文件状态
$(find "$PROJECT_ROOT" -name "*.js" -o -name "*.json" -o -name "*.wxss" | wc -l) 个项目文件

=============================================================================
EOF
    
    print_info "监控报告已生成: $report_file"
}

# 清理旧监控数据
cleanup_old_data() {
    print_info "清理旧监控数据..."
    
    # 清理30天前的告警日志
    find "$MONITOR_LOG_DIR" -name "alerts.log" -mtime +30 -delete 2>/dev/null || true
    
    # 清理90天前的指标日志
    find "$MONITOR_LOG_DIR" -name "metrics.log" -mtime +90 -delete 2>/dev/null || true
    
    # 清理7天前的通知记录
    find "$MONITOR_LOG_DIR" -name "last_notification_*.txt" -mtime +7 -delete 2>/dev/null || true
    
    print_info "旧监控数据清理完成"
}

# 主监控函数
run_monitoring() {
    print_info "开始执行监控检查..."
    
    # 收集系统指标
    local metrics=$(collect_metrics)
    IFS=',' read -r cpu_usage memory_usage disk_usage process_count load_avg <<< "$metrics"
    
    local alert_count=0
    
    # 执行各项检查
    check_cpu "$cpu_usage" || ((alert_count++))
    check_memory "$memory_usage" || ((alert_count++))
    check_disk "$disk_usage" || ((alert_count++))
    check_processes "$process_count" || ((alert_count++))
    check_project_integrity || ((alert_count++))
    check_services || ((alert_count++))
    
    if [ $alert_count -eq 0 ]; then
        print_info "✓ 所有监控检查通过"
    else
        print_warn "⚠ 发现 $alert_count 个告警项"
    fi
    
    # 生成报告
    generate_monitoring_report
    
    # 清理旧数据
    cleanup_old_data
}

# 连续监控模式
continuous_monitoring() {
    print_header "启动连续监控模式"
    print_info "监控间隔: 5分钟"
    print_info "按 Ctrl+C 停止监控"
    
    while true; do
        run_monitoring
        sleep 300  # 5分钟
    done
}

# 显示监控状态
show_monitoring_status() {
    print_header "监控状态"
    
    echo "监控配置:"
    echo "  CPU阈值: ${CPU_THRESHOLD}%"
    echo "  内存阈值: ${MEMORY_THRESHOLD}%"
    echo "  磁盘阈值: ${DISK_THRESHOLD}%"
    echo "  进程阈值: ${PROCESS_THRESHOLD}"
    
    echo ""
    echo "通知配置:"
    if [ -f "$NOTIFICATION_CONFIG" ]; then
        source "$NOTIFICATION_CONFIG"
        echo "  邮件通知: $([ "$ENABLE_EMAIL" = "true" ] && echo "启用" || echo "禁用")"
        echo "  Webhook通知: $([ "$ENABLE_WEBHOOK" = "true" ] && echo "启用" || echo "禁用")"
        echo "  Slack通知: $([ "$ENABLE_SLACK" = "true" ] && echo "启用" || echo "禁用")"
    else
        echo "  配置文件不存在"
    fi
    
    echo ""
    echo "最近告警:"
    tail -5 "$ALERT_LOG_FILE" 2>/dev/null || echo "无告警记录"
    
    echo ""
    echo "系统状态:"
    local metrics=$(collect_metrics)
    IFS=',' read -r cpu_usage memory_usage disk_usage process_count load_avg <<< "$metrics"
    echo "  CPU使用率: ${cpu_usage}%"
    echo "  内存使用率: ${memory_usage}%"
    echo "  磁盘使用率: ${disk_usage}%"
    echo "  进程数量: ${process_count}"
    echo "  负载平均值: ${load_avg}"
}

# 主函数
main() {
    case "${1:-status}" in
        "init")
            init_monitoring
            ;;
        "run")
            run_monitoring
            ;;
        "continuous")
            continuous_monitoring
            ;;
        "status")
            show_monitoring_status
            ;;
        "report")
            generate_monitoring_report
            ;;
        *)
            echo "用法: $0 {init|run|continuous|status|report}"
            echo ""
            echo "  init        - 初始化监控环境"
            echo "  run         - 执行一次监控检查"
            echo "  continuous  - 启动连续监控"
            echo "  status      - 显示监控状态"
            echo "  report      - 生成监控报告"
            exit 1
            ;;
    esac
}

# 错误处理
trap 'print_error "监控过程中发生错误，退出码: $?"; exit 1' ERR

# 执行主函数
main "$@"