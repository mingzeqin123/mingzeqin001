#!/bin/bash

# 生成日报脚本
# 用于生成项目状态和构建部署的日报

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

# 配置
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
LOG_DIR="$PROJECT_ROOT/logs"
REPORT_DIR="$PROJECT_ROOT/reports"
TIMESTAMP=$(date +"%Y-%m-%d")
REPORT_FILE="$REPORT_DIR/daily-report_$TIMESTAMP.md"

mkdir -p "$REPORT_DIR"

log_info "生成日报: $TIMESTAMP"

# 生成Markdown格式的日报
cat > "$REPORT_FILE" << EOF
# 项目日报 - $TIMESTAMP

## 📊 总体概况

**生成时间**: $(date)  
**报告周期**: $(date -d '1 day ago' +"%Y-%m-%d") 至 $TIMESTAMP  
**项目路径**: $PROJECT_ROOT  
**主机信息**: $(hostname) ($(whoami))  

---

## 🚀 构建部署状态

### 最新构建
EOF

# 检查最新构建
BUILD_DIR="$PROJECT_ROOT/build"
if [ -d "$BUILD_DIR" ]; then
    LATEST_BUILD=$(ls -t "$BUILD_DIR"/full-release_*.tar.gz 2>/dev/null | head -1)
    if [ -n "$LATEST_BUILD" ]; then
        BUILD_TIME=$(stat -c %y "$LATEST_BUILD" 2>/dev/null | cut -d' ' -f1,2)
        BUILD_SIZE=$(du -h "$LATEST_BUILD" | cut -f1)
        echo "- **最新版本**: $(basename "$LATEST_BUILD" .tar.gz)" >> "$REPORT_FILE"
        echo "- **构建时间**: $BUILD_TIME" >> "$REPORT_FILE"
        echo "- **文件大小**: $BUILD_SIZE" >> "$REPORT_FILE"
        echo "- **构建状态**: ✅ 正常" >> "$REPORT_FILE"
    else
        echo "- **构建状态**: ❌ 没有找到构建产物" >> "$REPORT_FILE"
    fi
else
    echo "- **构建状态**: ❌ 构建目录不存在" >> "$REPORT_FILE"
fi

cat >> "$REPORT_FILE" << EOF

### 部署状态
EOF

# 检查服务状态
if docker-compose ps 2>/dev/null | grep -q "Up"; then
    echo "- **Docker服务**: ✅ 运行中" >> "$REPORT_FILE"
else
    echo "- **Docker服务**: ❌ 未运行" >> "$REPORT_FILE"
fi

SERVICE_NAME="${SERVICE_NAME:-app-service}"
if systemctl is-active --quiet "$SERVICE_NAME" 2>/dev/null; then
    echo "- **系统服务**: ✅ 运行中" >> "$REPORT_FILE"
else
    echo "- **系统服务**: ⚠️ 未运行或不存在" >> "$REPORT_FILE"
fi

# 检查健康状态
HEALTH_CHECK_URL="${HEALTH_CHECK_URL:-http://localhost:8080/health}"
if curl -f -s --max-time 5 "$HEALTH_CHECK_URL" > /dev/null 2>&1; then
    echo "- **健康检查**: ✅ 通过" >> "$REPORT_FILE"
else
    echo "- **健康检查**: ❌ 失败" >> "$REPORT_FILE"
fi

cat >> "$REPORT_FILE" << EOF

---

## 📈 系统资源

### 资源使用情况
EOF

# 系统资源信息
DISK_USAGE=$(df -h / | awk 'NR==2 {print $5}')
MEMORY_USAGE=$(free | awk 'NR==2{printf "%.1f%%", $3*100/$2}')
LOAD_AVG=$(uptime | awk -F'load average:' '{print $2}' | awk '{print $1}' | sed 's/,//')
CPU_COUNT=$(nproc)

echo "- **磁盘使用**: $DISK_USAGE" >> "$REPORT_FILE"
echo "- **内存使用**: $MEMORY_USAGE" >> "$REPORT_FILE"
echo "- **CPU负载**: $LOAD_AVG (核心数: $CPU_COUNT)" >> "$REPORT_FILE"
echo "- **系统运行时间**: $(uptime -p)" >> "$REPORT_FILE"

cat >> "$REPORT_FILE" << EOF

### 网络状态
EOF

# 端口监听状态
PORTS=("8080" "9090" "80" "443")
echo "| 端口 | 状态 |" >> "$REPORT_FILE"
echo "|------|------|" >> "$REPORT_FILE"

for port in "${PORTS[@]}"; do
    if netstat -tuln 2>/dev/null | grep -q ":$port "; then
        echo "| $port | ✅ 监听中 |" >> "$REPORT_FILE"
    else
        echo "| $port | ❌ 未监听 |" >> "$REPORT_FILE"
    fi
done

cat >> "$REPORT_FILE" << EOF

---

## 📝 日志分析

### 24小时内活动统计
EOF

# 分析日志
if [ -d "$LOG_DIR" ]; then
    # 统计各类日志数量
    BUILD_LOGS=$(find "$LOG_DIR" -name "*build*.log" -mtime -1 -exec wc -l {} + 2>/dev/null | tail -1 | awk '{print $1}' || echo "0")
    DEPLOY_LOGS=$(find "$LOG_DIR" -name "*deploy*.log" -mtime -1 -exec wc -l {} + 2>/dev/null | tail -1 | awk '{print $1}' || echo "0")
    ERROR_COUNT=$(find "$LOG_DIR" -name "*.log" -mtime -1 -exec grep -i "error\|exception\|failed" {} \; 2>/dev/null | wc -l)
    WARNING_COUNT=$(find "$LOG_DIR" -name "*.log" -mtime -1 -exec grep -i "warning\|warn" {} \; 2>/dev/null | wc -l)
    
    echo "- **构建日志行数**: $BUILD_LOGS" >> "$REPORT_FILE"
    echo "- **部署日志行数**: $DEPLOY_LOGS" >> "$REPORT_FILE"
    echo "- **错误数量**: $ERROR_COUNT" >> "$REPORT_FILE"
    echo "- **警告数量**: $WARNING_COUNT" >> "$REPORT_FILE"
    
    # 如果有错误，显示最近的几个
    if [ "$ERROR_COUNT" -gt 0 ]; then
        echo "" >> "$REPORT_FILE"
        echo "### 最近错误（最多显示5条）" >> "$REPORT_FILE"
        echo '```' >> "$REPORT_FILE"
        find "$LOG_DIR" -name "*.log" -mtime -1 -exec grep -i "error\|exception\|failed" {} \; 2>/dev/null | head -5 >> "$REPORT_FILE"
        echo '```' >> "$REPORT_FILE"
    fi
else
    echo "- **日志目录**: ❌ 不存在" >> "$REPORT_FILE"
fi

cat >> "$REPORT_FILE" << EOF

---

## 🔄 Git状态

### 代码仓库信息
EOF

cd "$PROJECT_ROOT"

# Git信息
if [ -d ".git" ]; then
    CURRENT_BRANCH=$(git branch --show-current 2>/dev/null || echo "未知")
    LAST_COMMIT=$(git log -1 --format="%h - %s (%cr)" 2>/dev/null || echo "无法获取")
    UNCOMMITTED_CHANGES=$(git status --porcelain 2>/dev/null | wc -l)
    
    echo "- **当前分支**: $CURRENT_BRANCH" >> "$REPORT_FILE"
    echo "- **最新提交**: $LAST_COMMIT" >> "$REPORT_FILE"
    echo "- **未提交更改**: $UNCOMMITTED_CHANGES 个文件" >> "$REPORT_FILE"
    
    # 检查是否有远程更新
    git fetch origin 2>/dev/null || true
    BEHIND_COUNT=$(git rev-list HEAD...origin/main --count 2>/dev/null || echo "0")
    if [ "$BEHIND_COUNT" -gt 0 ]; then
        echo "- **远程更新**: ⚠️ 落后 $BEHIND_COUNT 个提交" >> "$REPORT_FILE"
    else
        echo "- **远程更新**: ✅ 已是最新" >> "$REPORT_FILE"
    fi
else
    echo "- **Git状态**: ❌ 非Git仓库" >> "$REPORT_FILE"
fi

cat >> "$REPORT_FILE" << EOF

---

## 📊 构建历史

### 最近5次构建
EOF

# 构建历史
if [ -d "$BUILD_DIR" ]; then
    echo "| 构建版本 | 创建时间 | 大小 |" >> "$REPORT_FILE"
    echo "|----------|----------|------|" >> "$REPORT_FILE"
    
    ls -t "$BUILD_DIR"/full-release_*.tar.gz 2>/dev/null | head -5 | while read -r build_file; do
        if [ -f "$build_file" ]; then
            BUILD_NAME=$(basename "$build_file" .tar.gz)
            BUILD_TIME=$(stat -c %y "$build_file" 2>/dev/null | cut -d' ' -f1,2)
            BUILD_SIZE=$(du -h "$build_file" | cut -f1)
            echo "| $BUILD_NAME | $BUILD_TIME | $BUILD_SIZE |" >> "$REPORT_FILE"
        fi
    done
else
    echo "没有找到构建历史" >> "$REPORT_FILE"
fi

cat >> "$REPORT_FILE" << EOF

---

## 🎯 待办事项和建议

### 自动检测的问题
EOF

# 自动检测问题并给出建议
SUGGESTIONS=()

# 检查磁盘空间
DISK_USAGE_NUM=$(echo "$DISK_USAGE" | sed 's/%//')
if [ "$DISK_USAGE_NUM" -gt 80 ]; then
    SUGGESTIONS+=("- ⚠️ 磁盘使用率超过80%，建议清理旧文件")
fi

# 检查错误日志
if [ "$ERROR_COUNT" -gt 10 ]; then
    SUGGESTIONS+=("- ❌ 24小时内错误数量较多($ERROR_COUNT)，需要调查")
fi

# 检查构建产物
if [ -z "$LATEST_BUILD" ]; then
    SUGGESTIONS+=("- ❌ 没有找到构建产物，需要检查构建流程")
fi

# 检查远程更新
if [ "$BEHIND_COUNT" -gt 0 ]; then
    SUGGESTIONS+=("- 📥 代码落后远程仓库，建议更新")
fi

if [ ${#SUGGESTIONS[@]} -eq 0 ]; then
    echo "✅ 暂无发现问题" >> "$REPORT_FILE"
else
    printf '%s\n' "${SUGGESTIONS[@]}" >> "$REPORT_FILE"
fi

cat >> "$REPORT_FILE" << EOF

### 定期维护建议
- 🔄 每周检查依赖更新
- 🧹 每月清理Docker镜像和容器
- 🔒 每月检查安全更新
- 📊 每月分析性能指标
- 💾 每月检查备份完整性

---

## 📞 联系信息

**生成工具**: 自动化日报系统  
**报告路径**: $REPORT_FILE  
**项目路径**: $PROJECT_ROOT  

---

*本报告由系统自动生成，时间: $(date)*
EOF

log_info "日报生成完成: $REPORT_FILE"

# 生成HTML版本（如果安装了pandoc）
if command -v pandoc &> /dev/null; then
    HTML_REPORT="$REPORT_DIR/daily-report_$TIMESTAMP.html"
    pandoc "$REPORT_FILE" -o "$HTML_REPORT" --standalone --css=style.css 2>/dev/null || true
    if [ -f "$HTML_REPORT" ]; then
        log_info "HTML版本已生成: $HTML_REPORT"
    fi
fi

# 发送通知（如果配置了）
if [ -n "$REPORT_WEBHOOK_URL" ]; then
    SUMMARY="📊 日报已生成\\n时间: $TIMESTAMP\\n构建状态: $([ -n "$LATEST_BUILD" ] && echo "正常" || echo "异常")\\n错误数: $ERROR_COUNT"
    curl -X POST "$REPORT_WEBHOOK_URL" \
         -H "Content-Type: application/json" \
         -d "{\"text\":\"$SUMMARY\"}" \
         2>/dev/null || true
fi

# 清理旧报告（保留30天）
find "$REPORT_DIR" -name "daily-report_*.md" -mtime +30 -delete 2>/dev/null || true
find "$REPORT_DIR" -name "daily-report_*.html" -mtime +30 -delete 2>/dev/null || true

echo "日报已保存到: $REPORT_FILE"