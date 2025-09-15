#!/bin/bash

# 自动部署脚本
# 用于部署构建好的应用到目标环境

set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 日志函数
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

# 配置变量
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BUILD_DIR="$PROJECT_ROOT/build"
DEPLOY_DIR="${DEPLOY_DIR:-/opt/app}"
BACKUP_DIR="${BACKUP_DIR:-/opt/app/backups}"
SERVICE_NAME="${SERVICE_NAME:-app-service}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

# 检查是否以root权限运行
if [[ $EUID -eq 0 ]]; then
    log_warning "以root权限运行部署脚本"
fi

log_info "开始部署流程，时间戳: $TIMESTAMP"

# 1. 预检查
log_info "执行部署前检查..."

# 检查构建产物
if [ ! -d "$BUILD_DIR" ]; then
    log_error "构建目录不存在: $BUILD_DIR"
    exit 1
fi

# 查找最新的构建产物
LATEST_BUILD=$(ls -t "$BUILD_DIR"/full-release_*.tar.gz 2>/dev/null | head -1)
if [ -z "$LATEST_BUILD" ]; then
    log_error "没有找到构建产物"
    exit 1
fi

log_info "找到最新构建产物: $(basename "$LATEST_BUILD")"

# 2. 创建备份
log_info "创建当前版本备份..."
mkdir -p "$BACKUP_DIR"

if [ -d "$DEPLOY_DIR" ] && [ "$(ls -A "$DEPLOY_DIR" 2>/dev/null)" ]; then
    BACKUP_FILE="$BACKUP_DIR/backup_$TIMESTAMP.tar.gz"
    tar -czf "$BACKUP_FILE" -C "$(dirname "$DEPLOY_DIR")" "$(basename "$DEPLOY_DIR")"
    log_success "备份创建完成: $BACKUP_FILE"
    
    # 保留最近10个备份
    ls -t "$BACKUP_DIR"/backup_*.tar.gz | tail -n +11 | xargs -r rm -f
else
    log_info "目标目录为空，跳过备份"
fi

# 3. 停止服务
log_info "停止相关服务..."

# 停止Docker服务
if command -v docker-compose &> /dev/null; then
    cd "$PROJECT_ROOT"
    docker-compose down 2>/dev/null || true
    log_info "Docker服务已停止"
fi

# 停止systemd服务
if systemctl is-active --quiet "$SERVICE_NAME" 2>/dev/null; then
    systemctl stop "$SERVICE_NAME"
    log_info "系统服务 $SERVICE_NAME 已停止"
fi

# 4. 部署新版本
log_info "部署新版本..."

# 创建部署目录
mkdir -p "$DEPLOY_DIR"

# 解压构建产物
TEMP_DIR=$(mktemp -d)
tar -xzf "$LATEST_BUILD" -C "$TEMP_DIR"

# 查找解压后的目录
EXTRACTED_DIR=$(find "$TEMP_DIR" -type d -name "release_*" | head -1)
if [ -z "$EXTRACTED_DIR" ]; then
    log_error "构建产物格式错误"
    rm -rf "$TEMP_DIR"
    exit 1
fi

# 移动文件到部署目录
rsync -av "$EXTRACTED_DIR"/ "$DEPLOY_DIR/"
rm -rf "$TEMP_DIR"

log_success "新版本部署完成"

# 5. 配置权限
log_info "设置文件权限..."
if [ -f "$DEPLOY_DIR/java-app_"*".tar.gz" ]; then
    # 解压Java应用
    cd "$DEPLOY_DIR"
    tar -xzf java-app_*.tar.gz
    chmod +x java-app_*/target/*.jar 2>/dev/null || true
fi

if [ -f "$DEPLOY_DIR/python-tools_"*".tar.gz" ]; then
    # 解压Python工具
    cd "$DEPLOY_DIR"
    tar -xzf python-tools_*.tar.gz
    chmod +x python-tools_*/excel_transpose.py 2>/dev/null || true
fi

# 6. 更新配置文件
log_info "更新配置文件..."

# 创建运行时配置
cat > "$DEPLOY_DIR/runtime.conf" << EOF
# 运行时配置
DEPLOY_TIME=$TIMESTAMP
DEPLOY_VERSION=$(basename "$LATEST_BUILD" .tar.gz)
DEPLOY_USER=$(whoami)
DEPLOY_HOST=$(hostname)

# 应用配置
APP_ENV=production
LOG_LEVEL=info
SERVICE_PORT=8080
EOF

# 7. 启动服务
log_info "启动服务..."

# 启动Docker服务
if [ -f "$PROJECT_ROOT/docker-compose.yml" ]; then
    cd "$PROJECT_ROOT"
    docker-compose up -d
    log_info "Docker服务已启动"
fi

# 启动systemd服务
if [ -f "/etc/systemd/system/$SERVICE_NAME.service" ]; then
    systemctl daemon-reload
    systemctl start "$SERVICE_NAME"
    systemctl enable "$SERVICE_NAME"
    log_info "系统服务 $SERVICE_NAME 已启动"
fi

# 8. 健康检查
log_info "执行健康检查..."
sleep 10  # 等待服务启动

HEALTH_CHECK_URL="${HEALTH_CHECK_URL:-http://localhost:8080/health}"
MAX_RETRIES=5
RETRY_COUNT=0

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if curl -f -s "$HEALTH_CHECK_URL" > /dev/null 2>&1; then
        log_success "健康检查通过"
        break
    else
        RETRY_COUNT=$((RETRY_COUNT + 1))
        log_warning "健康检查失败 ($RETRY_COUNT/$MAX_RETRIES)，等待重试..."
        sleep 5
    fi
done

if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
    log_error "健康检查失败，可能需要手动检查服务状态"
    
    # 自动回滚选项
    read -p "是否要回滚到上一个版本？(y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        log_info "开始回滚..."
        
        # 查找最新的备份
        LATEST_BACKUP=$(ls -t "$BACKUP_DIR"/backup_*.tar.gz 2>/dev/null | head -1)
        if [ -n "$LATEST_BACKUP" ]; then
            # 停止当前服务
            docker-compose down 2>/dev/null || true
            systemctl stop "$SERVICE_NAME" 2>/dev/null || true
            
            # 恢复备份
            rm -rf "$DEPLOY_DIR"
            mkdir -p "$DEPLOY_DIR"
            tar -xzf "$LATEST_BACKUP" -C "$(dirname "$DEPLOY_DIR")"
            
            # 重新启动服务
            cd "$PROJECT_ROOT"
            docker-compose up -d 2>/dev/null || true
            systemctl start "$SERVICE_NAME" 2>/dev/null || true
            
            log_success "回滚完成"
        else
            log_error "没有找到备份文件，无法回滚"
        fi
    fi
else
    # 9. 生成部署报告
    log_info "生成部署报告..."
    
    DEPLOY_REPORT="$DEPLOY_DIR/deploy-report_$TIMESTAMP.txt"
    cat > "$DEPLOY_REPORT" << EOF
部署报告
========

部署时间: $(date)
部署主机: $(hostname)
部署用户: $(whoami)
部署版本: $(basename "$LATEST_BUILD" .tar.gz)

部署状态: 成功
健康检查: 通过
服务状态: 运行中

部署路径: $DEPLOY_DIR
备份文件: $BACKUP_FILE

服务信息:
$(docker-compose ps 2>/dev/null || echo "Docker服务未运行")
$(systemctl status "$SERVICE_NAME" --no-pager -l 2>/dev/null || echo "系统服务未运行")

EOF

    log_success "部署报告已生成: $DEPLOY_REPORT"
    
    # 10. 发送通知（可选）
    if [ -n "$WEBHOOK_URL" ]; then
        log_info "发送部署通知..."
        curl -X POST "$WEBHOOK_URL" \
             -H "Content-Type: application/json" \
             -d "{\"text\":\"🚀 部署完成\\n版本: $(basename "$LATEST_BUILD" .tar.gz)\\n时间: $(date)\\n状态: 成功\"}" \
             2>/dev/null || log_warning "通知发送失败"
    fi
    
    log_success "部署流程完成！"
    log_info "部署版本: $(basename "$LATEST_BUILD" .tar.gz)"
    log_info "部署路径: $DEPLOY_DIR"
    log_info "健康检查: $HEALTH_CHECK_URL"
fi