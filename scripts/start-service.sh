#!/bin/bash

# 服务启动脚本
# 用于启动应用服务

set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DEPLOY_DIR="${DEPLOY_DIR:-/opt/app}"

log_info "启动应用服务..."

# 检查Java应用
if [ -d "$DEPLOY_DIR" ]; then
    JAVA_APP=$(find "$DEPLOY_DIR" -name "*.jar" | head -1)
    if [ -n "$JAVA_APP" ]; then
        log_info "启动Java应用: $JAVA_APP"
        java -jar "$JAVA_APP" &
        JAVA_PID=$!
        echo $JAVA_PID > /var/run/java-app.pid
        log_success "Java应用已启动，PID: $JAVA_PID"
    fi
fi

# 保持进程运行
while true; do
    sleep 60
    # 检查Java进程是否还在运行
    if [ -f /var/run/java-app.pid ]; then
        PID=$(cat /var/run/java-app.pid)
        if ! kill -0 $PID 2>/dev/null; then
            log_error "Java应用进程已停止，重新启动..."
            if [ -n "$JAVA_APP" ]; then
                java -jar "$JAVA_APP" &
                JAVA_PID=$!
                echo $JAVA_PID > /var/run/java-app.pid
                log_success "Java应用已重新启动，PID: $JAVA_PID"
            fi
        fi
    fi
done