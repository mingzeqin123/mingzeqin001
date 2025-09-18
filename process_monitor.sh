#!/bin/bash

# 程序监控和自动重启脚本
# Process Monitor and Auto Restart Script
# 
# 功能特性：
# - 监控指定程序是否正常运行
# - 程序崩溃时自动重启
# - 支持最大重启次数限制
# - 记录详细日志
# - 支持配置文件
# - 支持进程PID文件管理
# - 支持优雅关闭

set -euo pipefail

# 默认配置
PROGRAM_NAME=""
PROGRAM_CMD=""
PROGRAM_ARGS=""
WORK_DIR="$(pwd)"
CHECK_INTERVAL=5
MAX_RESTART_COUNT=10
RESTART_DELAY=2
LOG_FILE="./monitor.log"
PID_FILE="./monitor.pid"
PROGRAM_PID_FILE=""
CONFIG_FILE=""
QUIET=false
DAEMON_MODE=false

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 显示帮助信息
show_help() {
    cat << EOF
程序监控和自动重启脚本

用法: $0 [选项] <程序命令>

选项:
  -n, --name NAME           程序名称（用于日志显示）
  -c, --config FILE         配置文件路径
  -i, --interval SECONDS    检查间隔（默认: 5秒）
  -m, --max-restarts COUNT  最大重启次数（默认: 10次，0为无限制）
  -d, --delay SECONDS       重启延迟（默认: 2秒）
  -w, --workdir DIR         工作目录（默认: 当前目录）
  -l, --log FILE            日志文件路径（默认: ./monitor.log）
  -p, --pid FILE            PID文件路径（默认: ./monitor.pid）
  --program-pid FILE        程序PID文件路径
  -q, --quiet               静默模式
  --daemon                  后台守护进程模式
  -h, --help                显示此帮助信息

示例:
  $0 -n "Web Server" -i 10 -m 5 "python3 app.py"
  $0 -c monitor.conf "java -jar myapp.jar"
  $0 --daemon -l /var/log/monitor.log "nginx -g 'daemon off;'"

配置文件格式（INI风格）:
  program_name=My Application
  program_cmd=python3
  program_args=app.py --port 8080
  work_dir=/opt/myapp
  check_interval=10
  max_restart_count=5
  restart_delay=3
  log_file=/var/log/myapp_monitor.log
  pid_file=/var/run/myapp_monitor.pid
  program_pid_file=/var/run/myapp.pid

EOF
}

# 日志函数
log() {
    local level="$1"
    shift
    local message="$*"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    if [[ ! "$QUIET" == "true" ]]; then
        case "$level" in
            "INFO")  echo -e "${GREEN}[INFO]${NC}  $timestamp - $message" ;;
            "WARN")  echo -e "${YELLOW}[WARN]${NC}  $timestamp - $message" ;;
            "ERROR") echo -e "${RED}[ERROR]${NC} $timestamp - $message" ;;
            "DEBUG") echo -e "${BLUE}[DEBUG]${NC} $timestamp - $message" ;;
        esac
    fi
    
    echo "[$level] $timestamp - $message" >> "$LOG_FILE"
}

# 读取配置文件
read_config() {
    local config_file="$1"
    
    if [[ ! -f "$config_file" ]]; then
        log "ERROR" "配置文件不存在: $config_file"
        exit 1
    fi
    
    log "INFO" "读取配置文件: $config_file"
    
    while IFS='=' read -r key value; do
        # 跳过注释和空行
        [[ "$key" =~ ^[[:space:]]*# ]] && continue
        [[ -z "$key" ]] && continue
        
        # 去除前后空格
        key=$(echo "$key" | xargs)
        value=$(echo "$value" | xargs)
        
        case "$key" in
            "program_name") PROGRAM_NAME="$value" ;;
            "program_cmd") PROGRAM_CMD="$value" ;;
            "program_args") PROGRAM_ARGS="$value" ;;
            "work_dir") WORK_DIR="$value" ;;
            "check_interval") CHECK_INTERVAL="$value" ;;
            "max_restart_count") MAX_RESTART_COUNT="$value" ;;
            "restart_delay") RESTART_DELAY="$value" ;;
            "log_file") LOG_FILE="$value" ;;
            "pid_file") PID_FILE="$value" ;;
            "program_pid_file") PROGRAM_PID_FILE="$value" ;;
        esac
    done < "$config_file"
}

# 检查程序是否运行
is_program_running() {
    local pid="$1"
    
    if [[ -z "$pid" ]]; then
        return 1
    fi
    
    if kill -0 "$pid" 2>/dev/null; then
        return 0
    else
        return 1
    fi
}

# 通过PID文件获取程序PID
get_program_pid_from_file() {
    if [[ -n "$PROGRAM_PID_FILE" && -f "$PROGRAM_PID_FILE" ]]; then
        local pid=$(cat "$PROGRAM_PID_FILE" 2>/dev/null)
        if [[ -n "$pid" && "$pid" =~ ^[0-9]+$ ]]; then
            echo "$pid"
            return 0
        fi
    fi
    return 1
}

# 通过进程名查找PID
find_program_pid() {
    local cmd_pattern="$PROGRAM_CMD"
    if [[ -n "$PROGRAM_ARGS" ]]; then
        cmd_pattern="$PROGRAM_CMD.*$PROGRAM_ARGS"
    fi
    
    local pid=$(pgrep -f "$cmd_pattern" | head -1)
    if [[ -n "$pid" ]]; then
        echo "$pid"
        return 0
    fi
    return 1
}

# 启动程序
start_program() {
    log "INFO" "启动程序: $PROGRAM_NAME"
    log "INFO" "命令: $PROGRAM_CMD $PROGRAM_ARGS"
    log "INFO" "工作目录: $WORK_DIR"
    
    cd "$WORK_DIR"
    
    # 启动程序
    if [[ -n "$PROGRAM_ARGS" ]]; then
        nohup $PROGRAM_CMD $PROGRAM_ARGS >> "$LOG_FILE" 2>&1 &
    else
        nohup $PROGRAM_CMD >> "$LOG_FILE" 2>&1 &
    fi
    
    local pid=$!
    
    # 等待一下确保程序启动
    sleep 1
    
    if is_program_running "$pid"; then
        log "INFO" "程序启动成功，PID: $pid"
        echo "$pid"
        return 0
    else
        log "ERROR" "程序启动失败"
        return 1
    fi
}

# 停止程序
stop_program() {
    local pid="$1"
    
    if [[ -z "$pid" ]]; then
        log "WARN" "没有找到要停止的程序PID"
        return 1
    fi
    
    log "INFO" "停止程序，PID: $pid"
    
    # 先尝试优雅关闭
    if kill -TERM "$pid" 2>/dev/null; then
        local count=0
        while [[ $count -lt 10 ]] && is_program_running "$pid"; do
            sleep 1
            ((count++))
        done
        
        # 如果还在运行，强制杀死
        if is_program_running "$pid"; then
            log "WARN" "程序未响应TERM信号，使用KILL信号强制停止"
            kill -KILL "$pid" 2>/dev/null
            sleep 1
        fi
    fi
    
    if ! is_program_running "$pid"; then
        log "INFO" "程序已停止"
        return 0
    else
        log "ERROR" "无法停止程序"
        return 1
    fi
}

# 清理函数
cleanup() {
    log "INFO" "监控脚本正在退出..."
    
    if [[ -f "$PID_FILE" ]]; then
        rm -f "$PID_FILE"
    fi
    
    exit 0
}

# 信号处理
trap cleanup SIGTERM SIGINT

# 主监控循环
monitor_loop() {
    local restart_count=0
    local program_pid=""
    
    log "INFO" "开始监控程序: $PROGRAM_NAME"
    log "INFO" "检查间隔: ${CHECK_INTERVAL}秒"
    log "INFO" "最大重启次数: $MAX_RESTART_COUNT"
    
    while true; do
        # 获取程序PID
        if [[ -z "$program_pid" ]]; then
            # 尝试从PID文件获取
            if ! program_pid=$(get_program_pid_from_file); then
                # 尝试通过进程名查找
                if ! program_pid=$(find_program_pid); then
                    log "WARN" "未找到运行中的程序，尝试启动..."
                    if program_pid=$(start_program); then
                        restart_count=0
                    else
                        log "ERROR" "程序启动失败"
                        ((restart_count++))
                    fi
                fi
            fi
        fi
        
        # 检查程序是否还在运行
        if [[ -n "$program_pid" ]] && ! is_program_running "$program_pid"; then
            log "WARN" "检测到程序已停止运行，PID: $program_pid"
            
            # 检查是否超过最大重启次数
            if [[ $MAX_RESTART_COUNT -gt 0 && $restart_count -ge $MAX_RESTART_COUNT ]]; then
                log "ERROR" "已达到最大重启次数 ($MAX_RESTART_COUNT)，停止监控"
                break
            fi
            
            ((restart_count++))
            log "INFO" "准备重启程序 (第 $restart_count 次重启)"
            
            # 等待重启延迟
            if [[ $RESTART_DELAY -gt 0 ]]; then
                log "INFO" "等待 ${RESTART_DELAY} 秒后重启..."
                sleep "$RESTART_DELAY"
            fi
            
            # 重启程序
            if program_pid=$(start_program); then
                log "INFO" "程序重启成功"
            else
                log "ERROR" "程序重启失败"
                program_pid=""
            fi
        elif [[ -n "$program_pid" ]]; then
            log "DEBUG" "程序运行正常，PID: $program_pid"
        fi
        
        # 等待下次检查
        sleep "$CHECK_INTERVAL"
    done
}

# 解析命令行参数
parse_args() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            -n|--name)
                PROGRAM_NAME="$2"
                shift 2
                ;;
            -c|--config)
                CONFIG_FILE="$2"
                shift 2
                ;;
            -i|--interval)
                CHECK_INTERVAL="$2"
                shift 2
                ;;
            -m|--max-restarts)
                MAX_RESTART_COUNT="$2"
                shift 2
                ;;
            -d|--delay)
                RESTART_DELAY="$2"
                shift 2
                ;;
            -w|--workdir)
                WORK_DIR="$2"
                shift 2
                ;;
            -l|--log)
                LOG_FILE="$2"
                shift 2
                ;;
            -p|--pid)
                PID_FILE="$2"
                shift 2
                ;;
            --program-pid)
                PROGRAM_PID_FILE="$2"
                shift 2
                ;;
            -q|--quiet)
                QUIET=true
                shift
                ;;
            --daemon)
                DAEMON_MODE=true
                shift
                ;;
            -h|--help)
                show_help
                exit 0
                ;;
            -*)
                echo "未知选项: $1" >&2
                show_help
                exit 1
                ;;
            *)
                # 剩余参数作为程序命令
                PROGRAM_CMD="$1"
                shift
                PROGRAM_ARGS="$*"
                break
                ;;
        esac
    done
}

# 主函数
main() {
    parse_args "$@"
    
    # 读取配置文件
    if [[ -n "$CONFIG_FILE" ]]; then
        read_config "$CONFIG_FILE"
    fi
    
    # 验证必需参数
    if [[ -z "$PROGRAM_CMD" ]]; then
        echo "错误: 必须指定要监控的程序命令" >&2
        show_help
        exit 1
    fi
    
    # 设置默认程序名称
    if [[ -z "$PROGRAM_NAME" ]]; then
        PROGRAM_NAME="$PROGRAM_CMD"
    fi
    
    # 创建日志文件目录
    mkdir -p "$(dirname "$LOG_FILE")"
    mkdir -p "$(dirname "$PID_FILE")"
    
    # 检查是否已经在运行
    if [[ -f "$PID_FILE" ]]; then
        local existing_pid=$(cat "$PID_FILE" 2>/dev/null)
        if [[ -n "$existing_pid" ]] && is_program_running "$existing_pid"; then
            echo "监控脚本已经在运行，PID: $existing_pid" >&2
            exit 1
        fi
    fi
    
    # 记录监控脚本PID
    echo $$ > "$PID_FILE"
    
    log "INFO" "监控脚本启动，PID: $$"
    
    # 如果是守护进程模式，后台运行
    if [[ "$DAEMON_MODE" == "true" ]]; then
        log "INFO" "以守护进程模式运行"
        monitor_loop &
        disown
        echo "监控脚本已在后台启动，PID: $$"
    else
        monitor_loop
    fi
}

# 运行主函数
main "$@"