#!/bin/bash

# 健康检查脚本
# 用于检查各个服务的运行状态

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
HEALTH_CHECK_URL="${HEALTH_CHECK_URL:-http://localhost:8080/health}"
SERVICE_NAME="${SERVICE_NAME:-app-service}"
TIMESTAMP=$(date +"%Y-%m-%d %H:%M:%S")

echo "========================================"
echo "健康检查报告 - $TIMESTAMP"
echo "========================================"

OVERALL_STATUS="HEALTHY"

# 1. 检查Docker服务
log_info "检查Docker服务状态..."
cd "$PROJECT_ROOT"

if command -v docker-compose &> /dev/null; then
    if docker-compose ps | grep -q "Up"; then
        log_success "Docker服务运行正常"
        docker-compose ps
    else
        log_error "Docker服务异常"
        OVERALL_STATUS="UNHEALTHY"
    fi
else
    log_warning "Docker Compose未安装"
fi

echo ""

# 2. 检查系统服务
log_info "检查系统服务状态..."

if systemctl is-active --quiet "$SERVICE_NAME" 2>/dev/null; then
    log_success "系统服务 $SERVICE_NAME 运行正常"
    systemctl status "$SERVICE_NAME" --no-pager -l | head -10
else
    log_warning "系统服务 $SERVICE_NAME 未运行或不存在"
fi

echo ""

# 3. 检查HTTP健康端点
log_info "检查HTTP健康端点..."

if curl -f -s --max-time 10 "$HEALTH_CHECK_URL" > /dev/null 2>&1; then
    log_success "HTTP健康检查通过: $HEALTH_CHECK_URL"
    
    # 获取详细健康信息
    HEALTH_RESPONSE=$(curl -s --max-time 10 "$HEALTH_CHECK_URL" 2>/dev/null || echo "无法获取详细信息")
    echo "健康检查响应: $HEALTH_RESPONSE"
else
    log_error "HTTP健康检查失败: $HEALTH_CHECK_URL"
    OVERALL_STATUS="UNHEALTHY"
fi

echo ""

# 4. 检查端口监听
log_info "检查端口监听状态..."

PORTS=("8080" "9090" "80" "443")
for port in "${PORTS[@]}"; do
    if netstat -tuln 2>/dev/null | grep -q ":$port "; then
        log_success "端口 $port 正在监听"
    else
        log_warning "端口 $port 未监听"
    fi
done

echo ""

# 5. 检查磁盘空间
log_info "检查磁盘空间..."

DISK_USAGE=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')
if [ "$DISK_USAGE" -lt 90 ]; then
    log_success "磁盘空间充足 (已使用: ${DISK_USAGE}%)"
else
    log_error "磁盘空间不足 (已使用: ${DISK_USAGE}%)"
    OVERALL_STATUS="UNHEALTHY"
fi

echo ""

# 6. 检查内存使用
log_info "检查内存使用..."

MEMORY_USAGE=$(free | awk 'NR==2{printf "%.2f", $3*100/$2}')
MEMORY_USAGE_INT=${MEMORY_USAGE%.*}

if [ "$MEMORY_USAGE_INT" -lt 90 ]; then
    log_success "内存使用正常 (已使用: ${MEMORY_USAGE}%)"
else
    log_warning "内存使用率较高 (已使用: ${MEMORY_USAGE}%)"
fi

echo ""

# 7. 检查CPU负载
log_info "检查CPU负载..."

LOAD_AVG=$(uptime | awk -F'load average:' '{print $2}' | awk '{print $1}' | sed 's/,//')
CPU_COUNT=$(nproc)
LOAD_RATIO=$(echo "$LOAD_AVG $CPU_COUNT" | awk '{printf "%.2f", $1/$2}')

if (( $(echo "$LOAD_RATIO < 0.8" | bc -l) )); then
    log_success "CPU负载正常 (负载: $LOAD_AVG, 核心数: $CPU_COUNT)"
else
    log_warning "CPU负载较高 (负载: $LOAD_AVG, 核心数: $CPU_COUNT)"
fi

echo ""

# 8. 检查日志错误
log_info "检查最近的错误日志..."

LOG_DIR="$PROJECT_ROOT/logs"
if [ -d "$LOG_DIR" ]; then
    ERROR_COUNT=$(find "$LOG_DIR" -name "*.log" -mtime -1 -exec grep -i "error\|exception\|failed" {} \; 2>/dev/null | wc -l)
    
    if [ "$ERROR_COUNT" -eq 0 ]; then
        log_success "最近24小时内无错误日志"
    elif [ "$ERROR_COUNT" -lt 10 ]; then
        log_warning "最近24小时内发现 $ERROR_COUNT 条错误日志"
    else
        log_error "最近24小时内发现 $ERROR_COUNT 条错误日志，需要关注"
        OVERALL_STATUS="UNHEALTHY"
    fi
else
    log_warning "日志目录不存在: $LOG_DIR"
fi

echo ""

# 9. 检查构建产物
log_info "检查最新构建产物..."

BUILD_DIR="$PROJECT_ROOT/build"
if [ -d "$BUILD_DIR" ]; then
    LATEST_BUILD=$(ls -t "$BUILD_DIR"/full-release_*.tar.gz 2>/dev/null | head -1)
    if [ -n "$LATEST_BUILD" ]; then
        BUILD_AGE=$(find "$LATEST_BUILD" -mtime +1 2>/dev/null | wc -l)
        if [ "$BUILD_AGE" -eq 0 ]; then
            log_success "构建产物较新: $(basename "$LATEST_BUILD")"
        else
            log_warning "构建产物较旧: $(basename "$LATEST_BUILD")"
        fi
    else
        log_warning "没有找到构建产物"
    fi
else
    log_warning "构建目录不存在: $BUILD_DIR"
fi

echo ""

# 10. 总体状态
echo "========================================"
if [ "$OVERALL_STATUS" = "HEALTHY" ]; then
    log_success "总体状态: 健康"
    exit 0
else
    log_error "总体状态: 异常，需要关注"
    
    # 如果配置了通知URL，发送告警
    if [ -n "$ALERT_WEBHOOK_URL" ]; then
        curl -X POST "$ALERT_WEBHOOK_URL" \
             -H "Content-Type: application/json" \
             -d "{\"text\":\"⚠️ 服务健康检查异常\\n时间: $TIMESTAMP\\n主机: $(hostname)\\n状态: $OVERALL_STATUS\"}" \
             2>/dev/null || true
    fi
    
    exit 1
fi