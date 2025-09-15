#!/bin/bash

# 服务更新脚本
# 用于从Git仓库拉取最新代码并触发构建部署

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
GIT_BRANCH="${GIT_BRANCH:-main}"
FORCE_UPDATE="${FORCE_UPDATE:-false}"

log_info "开始服务更新流程..."
log_info "项目路径: $PROJECT_ROOT"
log_info "Git分支: $GIT_BRANCH"

cd "$PROJECT_ROOT"

# 1. 检查Git状态
log_info "检查Git仓库状态..."

if [ ! -d ".git" ]; then
    log_error "当前目录不是Git仓库"
    exit 1
fi

# 保存当前更改（如果有）
if ! git diff --quiet || ! git diff --cached --quiet; then
    log_warning "发现未提交的更改，正在暂存..."
    git stash push -m "Auto stash before update $(date)"
fi

# 2. 拉取最新代码
log_info "拉取最新代码..."

# 获取当前提交哈希
OLD_COMMIT=$(git rev-parse HEAD)

# 拉取最新代码
git fetch origin
git checkout "$GIT_BRANCH"
git pull origin "$GIT_BRANCH"

# 获取新的提交哈希
NEW_COMMIT=$(git rev-parse HEAD)

# 检查是否有更新
if [ "$OLD_COMMIT" = "$NEW_COMMIT" ] && [ "$FORCE_UPDATE" != "true" ]; then
    log_info "没有新的代码更新"
    exit 0
fi

log_success "代码更新完成"
log_info "旧版本: ${OLD_COMMIT:0:8}"
log_info "新版本: ${NEW_COMMIT:0:8}"

# 3. 显示更改日志
log_info "代码更改概览:"
git log --oneline "$OLD_COMMIT..$NEW_COMMIT" | head -10

# 4. 检查依赖更新
log_info "检查依赖更新..."

# 检查Java依赖
if [ -f "java-mac-app/pom.xml" ]; then
    if git diff "$OLD_COMMIT" HEAD --name-only | grep -q "java-mac-app/pom.xml"; then
        log_info "检测到Java依赖更新"
        cd java-mac-app
        mvn dependency:resolve-sources -q
        cd ..
    fi
fi

# 检查Python依赖
if git diff "$OLD_COMMIT" HEAD --name-only | grep -q "requirements.txt"; then
    log_info "检测到Python依赖更新"
    if command -v python3 &> /dev/null; then
        python3 -m pip install -r requirements.txt --quiet
    fi
fi

# 5. 执行构建
log_info "开始构建..."
if [ -x "scripts/build-all.sh" ]; then
    ./scripts/build-all.sh
else
    log_error "构建脚本不存在或无执行权限"
    exit 1
fi

# 6. 执行部署
log_info "开始部署..."
if [ -x "scripts/deploy.sh" ]; then
    ./scripts/deploy.sh
else
    log_error "部署脚本不存在或无执行权限"
    exit 1
fi

# 7. 记录更新日志
UPDATE_LOG="$PROJECT_ROOT/logs/update_$(date +"%Y%m%d_%H%M%S").log"
mkdir -p "$(dirname "$UPDATE_LOG")"

cat > "$UPDATE_LOG" << EOF
服务更新日志
============

更新时间: $(date)
更新主机: $(hostname)
更新用户: $(whoami)

版本信息:
旧版本: $OLD_COMMIT
新版本: $NEW_COMMIT
分支: $GIT_BRANCH

代码更改:
$(git log --oneline "$OLD_COMMIT..$NEW_COMMIT")

更新状态: 成功

EOF

log_success "服务更新完成！"
log_info "更新日志: $UPDATE_LOG"