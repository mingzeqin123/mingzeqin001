#!/bin/bash

# 全项目构建脚本
# 用于构建所有组件：微信小程序、Java应用、Python工具

set -e  # 遇到错误立即退出

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

# 获取项目根目录
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BUILD_DIR="$PROJECT_ROOT/build"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

log_info "开始构建项目，时间戳: $TIMESTAMP"
log_info "项目根目录: $PROJECT_ROOT"

# 创建构建目录
mkdir -p "$BUILD_DIR"

# 1. 构建微信小程序
log_info "构建微信小程序..."
cd "$PROJECT_ROOT"

# 创建小程序构建目录
MINIPROGRAM_BUILD_DIR="$BUILD_DIR/miniprogram_${TIMESTAMP}"
mkdir -p "$MINIPROGRAM_BUILD_DIR"

# 复制小程序文件（排除不必要的文件）
rsync -av --exclude='node_modules' \
          --exclude='.git' \
          --exclude='build' \
          --exclude='java-mac-app' \
          --exclude='*.py' \
          --exclude='*.xlsx' \
          --exclude='requirements.txt' \
          --exclude='scripts' \
          . "$MINIPROGRAM_BUILD_DIR/"

# 压缩小程序代码
cd "$BUILD_DIR"
tar -czf "miniprogram_${TIMESTAMP}.tar.gz" "miniprogram_${TIMESTAMP}"
log_success "微信小程序构建完成: miniprogram_${TIMESTAMP}.tar.gz"

# 2. 构建Java应用
log_info "构建Java应用..."
cd "$PROJECT_ROOT/java-mac-app"

# 检查Java环境
if ! command -v java &> /dev/null; then
    log_error "Java未安装或未在PATH中"
    exit 1
fi

if ! command -v mvn &> /dev/null; then
    log_error "Maven未安装或未在PATH中"
    exit 1
fi

# Maven构建
mvn clean package -DskipTests

# 复制构建产物
JAVA_BUILD_DIR="$BUILD_DIR/java-app_${TIMESTAMP}"
mkdir -p "$JAVA_BUILD_DIR"
cp target/*.jar "$JAVA_BUILD_DIR/"
cp -r src "$JAVA_BUILD_DIR/"
cp pom.xml "$JAVA_BUILD_DIR/"

# 压缩Java应用
cd "$BUILD_DIR"
tar -czf "java-app_${TIMESTAMP}.tar.gz" "java-app_${TIMESTAMP}"
log_success "Java应用构建完成: java-app_${TIMESTAMP}.tar.gz"

# 3. 构建Python工具
log_info "构建Python工具..."
cd "$PROJECT_ROOT"

# 检查Python环境
if ! command -v python3 &> /dev/null; then
    log_error "Python3未安装或未在PATH中"
    exit 1
fi

# 创建Python构建目录
PYTHON_BUILD_DIR="$BUILD_DIR/python-tools_${TIMESTAMP}"
mkdir -p "$PYTHON_BUILD_DIR"

# 复制Python文件
cp excel_transpose.py "$PYTHON_BUILD_DIR/"
cp requirements.txt "$PYTHON_BUILD_DIR/"
cp README_excel_transpose.md "$PYTHON_BUILD_DIR/"
cp sample_data*.xlsx "$PYTHON_BUILD_DIR/" 2>/dev/null || true

# 创建虚拟环境并安装依赖
cd "$PYTHON_BUILD_DIR"
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# 压缩Python工具
cd "$BUILD_DIR"
tar -czf "python-tools_${TIMESTAMP}.tar.gz" "python-tools_${TIMESTAMP}"
log_success "Python工具构建完成: python-tools_${TIMESTAMP}.tar.gz"

# 4. 创建完整发布包
log_info "创建完整发布包..."
RELEASE_DIR="$BUILD_DIR/release_${TIMESTAMP}"
mkdir -p "$RELEASE_DIR"

# 复制所有构建产物
cp *.tar.gz "$RELEASE_DIR/"

# 创建发布说明
cat > "$RELEASE_DIR/RELEASE_NOTES.md" << EOF
# 发布说明

**发布时间**: $(date)
**版本标识**: ${TIMESTAMP}

## 包含组件

1. **微信小程序** (miniprogram_${TIMESTAMP}.tar.gz)
   - 跳一跳游戏
   - 水印功能页面

2. **Java应用** (java-app_${TIMESTAMP}.tar.gz)
   - macOS桌面应用
   - JavaFX界面

3. **Python工具** (python-tools_${TIMESTAMP}.tar.gz)
   - Excel数据转置工具
   - 依赖环境已预装

## 部署说明

请参考项目根目录下的deploy.md文件获取详细部署说明。

EOF

# 创建最终发布包
tar -czf "full-release_${TIMESTAMP}.tar.gz" "release_${TIMESTAMP}"
log_success "完整发布包创建完成: full-release_${TIMESTAMP}.tar.gz"

# 清理临时目录
log_info "清理临时文件..."
rm -rf "miniprogram_${TIMESTAMP}" "java-app_${TIMESTAMP}" "python-tools_${TIMESTAMP}" "release_${TIMESTAMP}"

# 保留最近5个版本，删除旧版本
log_info "清理旧版本..."
cd "$BUILD_DIR"
ls -t full-release_*.tar.gz | tail -n +6 | xargs -r rm -f
ls -t miniprogram_*.tar.gz | tail -n +6 | xargs -r rm -f
ls -t java-app_*.tar.gz | tail -n +6 | xargs -r rm -f
ls -t python-tools_*.tar.gz | tail -n +6 | xargs -r rm -f

log_success "构建完成！"
log_info "构建产物位置: $BUILD_DIR"
log_info "主要文件:"
ls -la "$BUILD_DIR"/*.tar.gz 2>/dev/null || log_warning "没有找到构建产物"

# 生成构建报告
cat > "$BUILD_DIR/build-report_${TIMESTAMP}.txt" << EOF
构建报告
========

构建时间: $(date)
构建主机: $(hostname)
用户: $(whoami)
项目路径: $PROJECT_ROOT

构建状态: 成功
构建产物:
$(ls -la "$BUILD_DIR"/*.tar.gz 2>/dev/null || echo "无构建产物")

EOF

log_success "构建报告已生成: build-report_${TIMESTAMP}.txt"