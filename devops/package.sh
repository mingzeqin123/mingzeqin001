#!/bin/bash

# =============================================================================
# 代码打包脚本 - 微信小程序跳一跳游戏项目
# 功能：自动打包项目代码，生成发布版本，支持版本管理和依赖检查
# 作者：DevOps Team
# 版本：1.0.0
# =============================================================================

set -e  # 遇到错误立即退出

# 配置变量
PROJECT_NAME="jump-jump-game"
PROJECT_ROOT="/workspace"
PACKAGE_ROOT="/packages"
DATE=$(date +"%Y%m%d_%H%M%S")
VERSION=${1:-"1.0.0"}
PACKAGE_DIR="${PACKAGE_ROOT}/${PROJECT_NAME}_v${VERSION}_${DATE}"
LOG_FILE="${PACKAGE_ROOT}/package_${DATE}.log"

# 颜色输出函数
print_info() {
    echo -e "\033[32m[INFO]\033[0m $1" | tee -a "$LOG_FILE"
}

print_warn() {
    echo -e "\033[33m[WARN]\033[0m $1" | tee -a "$LOG_FILE"
}

print_error() {
    echo -e "\033[31m[ERROR]\033[0m $1" | tee -a "$LOG_FILE"
}

print_header() {
    echo -e "\033[36m=============================================================================\033[0m" | tee -a "$LOG_FILE"
    echo -e "\033[36m$1\033[0m" | tee -a "$LOG_FILE"
    echo -e "\033[36m=============================================================================\033[0m" | tee -a "$LOG_FILE"
}

# 检查必要工具
check_tools() {
    print_info "检查必要工具..."
    
    local tools=("git" "tar" "gzip" "node" "npm")
    local missing_tools=()
    
    for tool in "${tools[@]}"; do
        if ! command -v "$tool" &> /dev/null; then
            missing_tools+=("$tool")
        fi
    done
    
    if [ ${#missing_tools[@]} -gt 0 ]; then
        print_error "缺少必要工具: ${missing_tools[*]}"
        print_info "请安装缺少的工具后重试"
        exit 1
    fi
    
    print_info "工具检查完成"
}

# 检查目录结构
check_directories() {
    print_info "检查目录结构..."
    
    if [ ! -d "$PROJECT_ROOT" ]; then
        print_error "项目根目录不存在: $PROJECT_ROOT"
        exit 1
    fi
    
    if [ ! -d "$PACKAGE_ROOT" ]; then
        print_info "创建打包根目录: $PACKAGE_ROOT"
        mkdir -p "$PACKAGE_ROOT"
    fi
    
    if [ ! -d "$PACKAGE_DIR" ]; then
        print_info "创建打包目录: $PACKAGE_DIR"
        mkdir -p "$PACKAGE_DIR"
    fi
    
    print_info "目录检查完成"
}

# 检查项目完整性
check_project_integrity() {
    print_info "检查项目完整性..."
    
    local required_files=(
        "app.js"
        "app.json"
        "app.wxss"
        "project.config.json"
        "pages/game/game.js"
        "pages/game/gameEngine.js"
    )
    
    local missing_files=()
    
    for file in "${required_files[@]}"; do
        if [ ! -f "$PROJECT_ROOT/$file" ]; then
            missing_files+=("$file")
        fi
    done
    
    if [ ${#missing_files[@]} -gt 0 ]; then
        print_error "缺少必要文件: ${missing_files[*]}"
        exit 1
    fi
    
    print_info "项目完整性检查通过"
}

# 获取Git信息
get_git_info() {
    print_info "获取Git信息..."
    
    cd "$PROJECT_ROOT"
    
    if [ -d ".git" ]; then
        local git_hash=$(git rev-parse HEAD 2>/dev/null || echo "unknown")
        local git_branch=$(git branch --show-current 2>/dev/null || echo "unknown")
        local git_status=$(git status --porcelain 2>/dev/null || echo "")
        
        echo "GIT_HASH=$git_hash" > "$PACKAGE_DIR/build_info.txt"
        echo "GIT_BRANCH=$git_branch" >> "$PACKAGE_DIR/build_info.txt"
        echo "BUILD_DATE=$(date)" >> "$PACKAGE_DIR/build_info.txt"
        echo "BUILD_VERSION=$VERSION" >> "$PACKAGE_DIR/build_info.txt"
        
        if [ -n "$git_status" ]; then
            print_warn "工作目录有未提交的更改"
            echo "GIT_STATUS=uncommitted_changes" >> "$PACKAGE_DIR/build_info.txt"
        else
            echo "GIT_STATUS=clean" >> "$PACKAGE_DIR/build_info.txt"
        fi
        
        print_info "Git信息已记录"
    else
        print_warn "不是Git仓库，跳过Git信息获取"
        echo "GIT_HASH=not_git_repo" > "$PACKAGE_DIR/build_info.txt"
        echo "BUILD_DATE=$(date)" >> "$PACKAGE_DIR/build_info.txt"
        echo "BUILD_VERSION=$VERSION" >> "$PACKAGE_DIR/build_info.txt"
    fi
}

# 复制项目文件
copy_project_files() {
    print_info "复制项目文件..."
    
    # 需要打包的文件和目录
    local include_patterns=(
        "app.js"
        "app.json"
        "app.wxss"
        "sitemap.json"
        "project.config.json"
        "pages/"
        "utils/"
        "images/"
        "sounds/"
        "examples/"
        "docs/"
        "java-mac-app/"
        "*.py"
        "*.md"
        "*.txt"
        "*.json"
        "*.xml"
        "LICENSE"
        "requirements.txt"
    )
    
    # 需要排除的文件和目录
    local exclude_patterns=(
        "node_modules/"
        ".git/"
        ".DS_Store"
        "*.log"
        "*.tmp"
        "target/"
        "build/"
        "dist/"
        ".vscode/"
        ".idea/"
        "*.pyc"
        "__pycache__/"
        ".pytest_cache/"
        "devops/"
        "/backup/"
        "/packages/"
    )
    
    local exclude_args=""
    for pattern in "${exclude_patterns[@]}"; do
        exclude_args="$exclude_args --exclude=$pattern"
    done
    
    local copied_count=0
    
    for pattern in "${include_patterns[@]}"; do
        if [ -e "$PROJECT_ROOT/$pattern" ]; then
            print_info "复制: $pattern"
            rsync -av $exclude_args "$PROJECT_ROOT/$pattern" "$PACKAGE_DIR/" >> "$LOG_FILE" 2>&1
            ((copied_count++))
        else
            print_warn "文件/目录不存在，跳过: $pattern"
        fi
    done
    
    print_info "文件复制完成，共处理 $copied_count 个项目"
}

# 处理依赖
handle_dependencies() {
    print_info "处理项目依赖..."
    
    # 检查Python依赖
    if [ -f "$PACKAGE_DIR/requirements.txt" ]; then
        print_info "发现Python依赖文件"
        # 可以在这里添加Python依赖安装逻辑
        # pip install -r requirements.txt --target "$PACKAGE_DIR/dependencies/"
    fi
    
    # 检查Node.js依赖
    if [ -f "$PACKAGE_DIR/package.json" ]; then
        print_info "发现Node.js依赖文件"
        # 可以在这里添加npm依赖安装逻辑
        # cd "$PACKAGE_DIR" && npm install --production
    fi
    
    # 检查Java依赖
    if [ -f "$PACKAGE_DIR/java-mac-app/pom.xml" ]; then
        print_info "发现Java Maven项目"
        # 可以在这里添加Maven构建逻辑
        # cd "$PACKAGE_DIR/java-mac-app" && mvn clean package -DskipTests
    fi
    
    print_info "依赖处理完成"
}

# 生成版本信息
generate_version_info() {
    print_info "生成版本信息..."
    
    local version_file="$PACKAGE_DIR/version.json"
    
    cat > "$version_file" << EOF
{
    "project_name": "$PROJECT_NAME",
    "version": "$VERSION",
    "build_date": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
    "build_timestamp": "$(date +%s)",
    "environment": "production",
    "package_type": "miniprogram",
    "description": "微信小程序跳一跳游戏 - 发布版本"
}
EOF
    
    print_info "版本信息已生成: $version_file"
}

# 创建部署脚本
create_deploy_script() {
    print_info "创建部署脚本..."
    
    local deploy_script="$PACKAGE_DIR/deploy.sh"
    
    cat > "$deploy_script" << 'EOF'
#!/bin/bash
# 自动生成的部署脚本

set -e

echo "开始部署微信小程序..."
echo "请确保已安装微信开发者工具"

# 检查微信开发者工具
if ! command -v cli &> /dev/null; then
    echo "警告: 未找到微信开发者工具CLI"
    echo "请手动使用微信开发者工具打开项目进行上传"
    exit 0
fi

# 上传代码
echo "上传代码到微信小程序平台..."
cli upload --project-path . --version "$(date +%Y%m%d_%H%M%S)" --desc "自动部署版本"

echo "部署完成！"
EOF
    
    chmod +x "$deploy_script"
    print_info "部署脚本已创建: $deploy_script"
}

# 压缩打包文件
compress_package() {
    print_info "压缩打包文件..."
    
    cd "$PACKAGE_ROOT"
    local archive_name="${PROJECT_NAME}_v${VERSION}_${DATE}.tar.gz"
    
    if tar -czf "$archive_name" "$(basename "$PACKAGE_DIR")" 2>> "$LOG_FILE"; then
        print_info "压缩成功: $archive_name"
        
        # 计算文件大小
        local file_size=$(du -h "$archive_name" | cut -f1)
        print_info "打包文件大小: $file_size"
        
        # 删除临时打包目录
        rm -rf "$PACKAGE_DIR"
        print_info "已清理临时打包目录"
        
        # 更新最新版本记录
        echo "$archive_name" > "${PACKAGE_ROOT}/latest_package.txt"
        echo "$VERSION" > "${PACKAGE_ROOT}/latest_version.txt"
        print_info "版本信息已记录"
    else
        print_error "压缩失败"
        exit 1
    fi
}

# 清理旧版本（保留最近10个版本）
cleanup_old_packages() {
    print_info "清理旧版本（保留最近10个版本）..."
    
    cd "$PACKAGE_ROOT"
    local deleted_count=0
    
    # 按时间排序，保留最新的10个版本
    ls -t ${PROJECT_NAME}_v*_*.tar.gz 2>/dev/null | tail -n +11 | while read -r file; do
        print_info "删除旧版本: $(basename "$file")"
        rm -f "$file"
        ((deleted_count++))
    done
    
    if [ $deleted_count -gt 0 ]; then
        print_info "已删除 $deleted_count 个旧版本文件"
    else
        print_info "没有需要清理的旧版本文件"
    fi
}

# 生成打包报告
generate_report() {
    print_info "生成打包报告..."
    
    local report_file="${PACKAGE_ROOT}/package_report_${DATE}.txt"
    
    cat > "$report_file" << EOF
=============================================================================
                        打包报告
=============================================================================
项目名称: $PROJECT_NAME
版本号: $VERSION
打包时间: $(date)
打包目录: $PACKAGE_ROOT
打包文件: ${PROJECT_NAME}_v${VERSION}_${DATE}.tar.gz
项目根目录: $PROJECT_ROOT

打包内容:
- 小程序核心文件 (app.js, app.json, app.wxss)
- 游戏页面和逻辑 (pages/game/)
- 工具类和资源 (utils/, images/, sounds/)
- 文档和示例 (docs/, examples/)
- Java应用 (java-mac-app/)
- Python脚本 (*.py)
- 项目配置文件

排除内容:
- 开发工具配置 (.vscode/, .idea/)
- 构建产物 (node_modules/, target/, build/)
- 临时文件 (*.log, *.tmp)
- 开发脚本 (devops/)

打包状态: 成功
日志文件: $LOG_FILE
=============================================================================
EOF
    
    print_info "打包报告已生成: $report_file"
}

# 验证打包结果
verify_package() {
    print_info "验证打包结果..."
    
    local archive_name="${PROJECT_NAME}_v${VERSION}_${DATE}.tar.gz"
    
    if [ ! -f "$PACKAGE_ROOT/$archive_name" ]; then
        print_error "打包文件不存在: $archive_name"
        exit 1
    fi
    
    # 检查压缩包完整性
    if tar -tzf "$PACKAGE_ROOT/$archive_name" > /dev/null 2>&1; then
        print_info "压缩包完整性验证通过"
    else
        print_error "压缩包完整性验证失败"
        exit 1
    fi
    
    # 显示压缩包内容概览
    local file_count=$(tar -tzf "$PACKAGE_ROOT/$archive_name" | wc -l)
    print_info "压缩包包含 $file_count 个文件"
    
    print_info "打包验证完成"
}

# 发送通知
send_notification() {
    local status=$1
    local message="打包任务完成 - 项目: $PROJECT_NAME, 版本: $VERSION, 状态: $status"
    
    # 如果有配置邮件或webhook，可以在这里添加通知逻辑
    print_info "通知: $message"
}

# 主函数
main() {
    print_header "开始执行代码打包任务 - $(date)"
    
    # 检查工具
    check_tools
    
    # 检查目录
    check_directories
    
    # 检查项目完整性
    check_project_integrity
    
    # 获取Git信息
    get_git_info
    
    # 复制项目文件
    copy_project_files
    
    # 处理依赖
    handle_dependencies
    
    # 生成版本信息
    generate_version_info
    
    # 创建部署脚本
    create_deploy_script
    
    # 压缩打包文件
    compress_package
    
    # 清理旧版本
    cleanup_old_packages
    
    # 生成报告
    generate_report
    
    # 验证打包结果
    verify_package
    
    # 发送通知
    send_notification "成功"
    
    print_header "打包任务完成 - $(date)"
    print_info "打包文件位置: ${PACKAGE_ROOT}/${PROJECT_NAME}_v${VERSION}_${DATE}.tar.gz"
    print_info "日志文件位置: $LOG_FILE"
}

# 错误处理
trap 'print_error "打包过程中发生错误，退出码: $?"; send_notification "失败"; exit 1' ERR

# 执行主函数
main "$@"