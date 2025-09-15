#!/bin/bash

# DevOps系统一键部署脚本
# 用于快速设置完整的DevOps自动化环境

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

# 显示欢迎信息
cat << 'EOF'
╔══════════════════════════════════════════════════════════════╗
║                    DevOps 自动化部署系统                      ║
║                                                              ║
║  🚀 自动化构建和部署                                          ║
║  📅 定时任务调度                                             ║
║  📊 监控和日志收集                                           ║
║  🔄 CI/CD 流水线                                            ║
║  🐳 Docker 容器化                                           ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
EOF

echo ""
log_info "开始部署DevOps系统..."

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_ROOT"

# 1. 环境检查
log_info "检查系统环境..."

# 检查操作系统
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    log_success "操作系统: Linux"
elif [[ "$OSTYPE" == "darwin"* ]]; then
    log_success "操作系统: macOS"
else
    log_warning "未完全测试的操作系统: $OSTYPE"
fi

# 检查必要命令
REQUIRED_COMMANDS=("git" "curl" "tar" "chmod")
for cmd in "${REQUIRED_COMMANDS[@]}"; do
    if command -v $cmd &> /dev/null; then
        log_success "✓ $cmd 已安装"
    else
        log_error "✗ $cmd 未安装，请先安装"
        exit 1
    fi
done

# 2. 创建必要目录
log_info "创建项目目录结构..."
mkdir -p {build,logs,reports,config,monitoring,web,nginx}
log_success "目录结构创建完成"

# 3. 设置脚本权限
log_info "设置脚本执行权限..."
find scripts/ -name "*.sh" -exec chmod +x {} \;
chmod +x deploy-devops.sh
log_success "脚本权限设置完成"

# 4. 检查并安装依赖
log_info "检查和安装依赖..."

# Java检查
if command -v java &> /dev/null; then
    JAVA_VERSION=$(java -version 2>&1 | head -n 1 | cut -d'"' -f 2 | cut -d'.' -f 1)
    if [ "$JAVA_VERSION" -ge 11 ]; then
        log_success "✓ Java $JAVA_VERSION 已安装"
    else
        log_warning "Java版本较低，建议升级到Java 11+"
    fi
else
    log_warning "Java未安装，将跳过Java应用构建"
fi

# Python检查
if command -v python3 &> /dev/null; then
    PYTHON_VERSION=$(python3 --version | cut -d' ' -f 2 | cut -d'.' -f 1-2)
    log_success "✓ Python $PYTHON_VERSION 已安装"
    
    # 安装Python依赖
    if [ -f "requirements.txt" ]; then
        log_info "安装Python依赖..."
        python3 -m pip install -r requirements.txt --quiet
        log_success "Python依赖安装完成"
    fi
else
    log_warning "Python3未安装，将跳过Python工具构建"
fi

# Maven检查
if command -v mvn &> /dev/null; then
    log_success "✓ Maven 已安装"
else
    log_warning "Maven未安装，将跳过Java应用构建"
fi

# Docker检查
if command -v docker &> /dev/null; then
    log_success "✓ Docker 已安装"
    if command -v docker-compose &> /dev/null; then
        log_success "✓ Docker Compose 已安装"
    else
        log_warning "Docker Compose未安装，将跳过容器编排"
    fi
else
    log_warning "Docker未安装，将跳过容器化部署"
fi

# 5. 配置环境变量
log_info "配置环境变量..."
if [ ! -f ".env" ]; then
    cp .env.example .env
    log_success "已创建 .env 配置文件，请根据需要修改"
else
    log_info ".env 文件已存在"
fi

# 6. 初始化Git钩子（如果在Git仓库中）
if [ -d ".git" ]; then
    log_info "设置Git钩子..."
    
    # 创建pre-commit钩子
    cat > .git/hooks/pre-commit << 'EOF'
#!/bin/bash
# 提交前检查
echo "执行提交前检查..."

# 检查Python代码格式
if command -v flake8 &> /dev/null && [ -f "excel_transpose.py" ]; then
    flake8 excel_transpose.py --max-line-length=88 || exit 1
fi

# 检查Java代码编译
if [ -d "java-mac-app" ] && command -v mvn &> /dev/null; then
    cd java-mac-app
    mvn clean compile -q || exit 1
    cd ..
fi

echo "提交前检查通过"
EOF
    
    chmod +x .git/hooks/pre-commit
    log_success "Git钩子设置完成"
fi

# 7. 设置定时任务
log_info "设置定时任务..."
if command -v crontab &> /dev/null; then
    read -p "是否要设置定时任务？(y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        ./scripts/setup-cron.sh
        log_success "定时任务设置完成"
    else
        log_info "跳过定时任务设置"
    fi
else
    log_warning "Cron未安装，跳过定时任务设置"
fi

# 8. 执行首次构建（可选）
read -p "是否要执行首次构建？(y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    log_info "执行首次构建..."
    ./scripts/build-all.sh
    log_success "首次构建完成"
else
    log_info "跳过首次构建"
fi

# 9. 启动Docker服务（可选）
if command -v docker-compose &> /dev/null; then
    read -p "是否要启动Docker服务？(y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        log_info "启动Docker服务..."
        docker-compose up -d
        log_success "Docker服务已启动"
        
        # 等待服务启动
        sleep 10
        
        # 检查服务状态
        docker-compose ps
    else
        log_info "跳过Docker服务启动"
    fi
fi

# 10. 生成部署报告
log_info "生成部署报告..."
REPORT_FILE="logs/deployment-report_$(date +%Y%m%d_%H%M%S).txt"
cat > "$REPORT_FILE" << EOF
DevOps系统部署报告
==================

部署时间: $(date)
部署主机: $(hostname)
部署用户: $(whoami)
项目路径: $PROJECT_ROOT

系统信息:
- 操作系统: $(uname -a)
- Git版本: $(git --version 2>/dev/null || echo "未安装")
- Java版本: $(java -version 2>&1 | head -1 || echo "未安装")
- Python版本: $(python3 --version 2>/dev/null || echo "未安装")
- Maven版本: $(mvn --version 2>/dev/null | head -1 || echo "未安装")
- Docker版本: $(docker --version 2>/dev/null || echo "未安装")

组件状态:
- 构建脚本: $([ -x scripts/build-all.sh ] && echo "已配置" || echo "未配置")
- 部署脚本: $([ -x scripts/deploy.sh ] && echo "已配置" || echo "未配置")
- 健康检查: $([ -x scripts/health-check.sh ] && echo "已配置" || echo "未配置")
- 定时任务: $(crontab -l 2>/dev/null | grep -q "$PROJECT_ROOT" && echo "已设置" || echo "未设置")
- Docker服务: $(docker-compose ps 2>/dev/null | grep -q "Up" && echo "运行中" || echo "未运行")

下一步操作:
1. 检查并修改 .env 配置文件
2. 根据需要调整 config/app.conf 配置
3. 设置CI/CD流水线的密钥和变量
4. 配置监控和告警通知
5. 测试构建和部署流程

EOF

log_success "部署报告已生成: $REPORT_FILE"

# 显示完成信息
echo ""
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║                    🎉 部署完成！                             ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""
echo "📁 项目路径: $PROJECT_ROOT"
echo "📋 部署报告: $REPORT_FILE"
echo "📖 详细文档: DEVOPS_README.md"
echo ""
echo "🔧 常用命令:"
echo "  ./scripts/build-all.sh      - 构建所有组件"
echo "  ./scripts/deploy.sh         - 部署应用"
echo "  ./scripts/health-check.sh   - 健康检查"
echo "  ./scripts/generate-report.sh - 生成日报"
echo "  docker-compose up -d        - 启动Docker服务"
echo "  docker-compose ps           - 查看服务状态"
echo ""
echo "📊 监控地址:"
echo "  应用服务: http://localhost:8080"
echo "  Prometheus: http://localhost:9090"
echo "  Web界面: http://localhost:80"
echo ""
echo "📝 配置文件:"
echo "  环境变量: .env"
echo "  应用配置: config/app.conf"
echo "  Docker编排: docker-compose.yml"
echo ""
log_success "DevOps系统部署完成！请查看文档了解更多使用方法。"