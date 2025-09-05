#!/bin/bash

# Mac系统邮件机器人安装脚本
# 使用方法: chmod +x install_mac.sh && ./install_mac.sh

set -e  # 遇到错误时退出

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

# 检查是否为Mac系统
check_macos() {
    if [[ "$OSTYPE" != "darwin"* ]]; then
        log_error "此脚本仅适用于 macOS 系统"
        exit 1
    fi
    log_info "检测到 macOS 系统"
}

# 检查并安装 Homebrew
install_homebrew() {
    log_step "检查 Homebrew..."
    
    if ! command -v brew &> /dev/null; then
        log_info "Homebrew 未安装，正在安装..."
        /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
        
        # 添加到 PATH
        echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zprofile
        eval "$(/opt/homebrew/bin/brew shellenv)"
        
        log_info "Homebrew 安装完成"
    else
        log_info "Homebrew 已安装"
        brew update
    fi
}

# 检查并安装 Python 3
install_python() {
    log_step "检查 Python 3..."
    
    if ! command -v python3 &> /dev/null; then
        log_info "Python 3 未安装，正在通过 Homebrew 安装..."
        brew install python@3.11
        log_info "Python 3 安装完成"
    else
        PYTHON_VERSION=$(python3 --version 2>&1 | grep -o '[0-9]\+\.[0-9]\+')
        log_info "Python 3 已安装，版本: $PYTHON_VERSION"
    fi
    
    # 确保 pip 可用
    if ! command -v pip3 &> /dev/null; then
        log_info "安装 pip..."
        python3 -m ensurepip --upgrade
    fi
}

# 创建项目目录和虚拟环境
setup_project() {
    log_step "设置项目环境..."
    
    PROJECT_DIR="$HOME/email_bot"
    
    # 创建项目目录
    if [ ! -d "$PROJECT_DIR" ]; then
        mkdir -p "$PROJECT_DIR"
        log_info "创建项目目录: $PROJECT_DIR"
    fi
    
    cd "$PROJECT_DIR"
    
    # 创建虚拟环境
    if [ ! -d "venv" ]; then
        log_info "创建 Python 虚拟环境..."
        python3 -m venv venv
    fi
    
    # 激活虚拟环境
    source venv/bin/activate
    
    # 升级 pip
    pip install --upgrade pip
    
    log_info "项目环境设置完成"
}

# 复制项目文件
copy_project_files() {
    log_step "复制项目文件..."
    
    # 假设脚本在项目根目录运行
    SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    PROJECT_DIR="$HOME/email_bot"
    
    # 复制 Python 文件
    cp "$SCRIPT_DIR"/*.py "$PROJECT_DIR/" 2>/dev/null || true
    cp "$SCRIPT_DIR"/requirements.txt "$PROJECT_DIR/" 2>/dev/null || true
    cp "$SCRIPT_DIR"/config.yaml "$PROJECT_DIR/" 2>/dev/null || true
    cp "$SCRIPT_DIR"/.env.example "$PROJECT_DIR/" 2>/dev/null || true
    
    # 创建必要的目录
    mkdir -p "$PROJECT_DIR/logs"
    mkdir -p "$PROJECT_DIR/output"
    
    log_info "项目文件复制完成"
}

# 安装 Python 依赖
install_dependencies() {
    log_step "安装 Python 依赖..."
    
    cd "$HOME/email_bot"
    source venv/bin/activate
    
    if [ -f "requirements.txt" ]; then
        pip install -r requirements.txt
        log_info "Python 依赖安装完成"
    else
        log_warn "requirements.txt 文件不存在，跳过依赖安装"
    fi
}

# 配置环境变量
setup_environment() {
    log_step "配置环境变量..."
    
    cd "$HOME/email_bot"
    
    if [ ! -f ".env" ]; then
        if [ -f ".env.example" ]; then
            cp .env.example .env
            log_info "已创建 .env 文件，请编辑该文件并填入您的邮箱信息"
            log_warn "请使用以下命令编辑配置文件:"
            echo "  nano $HOME/email_bot/.env"
        else
            log_warn "未找到 .env.example 文件"
        fi
    else
        log_info ".env 文件已存在"
    fi
}

# 创建启动脚本
create_launch_script() {
    log_step "创建启动脚本..."
    
    LAUNCH_SCRIPT="$HOME/email_bot/start_email_bot.sh"
    
    cat > "$LAUNCH_SCRIPT" << 'EOF'
#!/bin/bash

# 邮件机器人启动脚本

EMAIL_BOT_DIR="$HOME/email_bot"
cd "$EMAIL_BOT_DIR"

# 激活虚拟环境
source venv/bin/activate

# 检查配置文件
if [ ! -f ".env" ]; then
    echo "错误: .env 文件不存在，请先配置邮箱信息"
    echo "使用命令: nano $EMAIL_BOT_DIR/.env"
    exit 1
fi

# 运行机器人
echo "启动邮件机器人..."
python3 email_bot.py "$@"
EOF
    
    chmod +x "$LAUNCH_SCRIPT"
    log_info "启动脚本已创建: $LAUNCH_SCRIPT"
}

# 创建 launchd plist 文件用于定期执行
create_launchd_service() {
    log_step "创建 macOS 定时服务..."
    
    PLIST_FILE="$HOME/Library/LaunchAgents/com.emailbot.daemon.plist"
    
    cat > "$PLIST_FILE" << EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.emailbot.daemon</string>
    <key>ProgramArguments</key>
    <array>
        <string>$HOME/email_bot/start_email_bot.sh</string>
        <string>--daemon</string>
    </array>
    <key>WorkingDirectory</key>
    <string>$HOME/email_bot</string>
    <key>StandardOutPath</key>
    <string>$HOME/email_bot/logs/launchd.out</string>
    <key>StandardErrorPath</key>
    <string>$HOME/email_bot/logs/launchd.err</string>
    <key>KeepAlive</key>
    <true/>
    <key>RunAtLoad</key>
    <true/>
</dict>
</plist>
EOF
    
    log_info "launchd 服务文件已创建: $PLIST_FILE"
    log_info "使用以下命令管理服务:"
    echo "  启动服务: launchctl load $PLIST_FILE"
    echo "  停止服务: launchctl unload $PLIST_FILE"
    echo "  查看状态: launchctl list | grep emailbot"
}

# 设置别名
setup_aliases() {
    log_step "设置命令别名..."
    
    SHELL_RC=""
    if [ -n "$ZSH_VERSION" ]; then
        SHELL_RC="$HOME/.zshrc"
    elif [ -n "$BASH_VERSION" ]; then
        SHELL_RC="$HOME/.bash_profile"
    fi
    
    if [ -n "$SHELL_RC" ]; then
        # 检查别名是否已存在
        if ! grep -q "alias emailbot=" "$SHELL_RC" 2>/dev/null; then
            echo "" >> "$SHELL_RC"
            echo "# Email Bot aliases" >> "$SHELL_RC"
            echo "alias emailbot='$HOME/email_bot/start_email_bot.sh'" >> "$SHELL_RC"
            echo "alias emailbot-once='$HOME/email_bot/start_email_bot.sh --once'" >> "$SHELL_RC"
            echo "alias emailbot-daemon='$HOME/email_bot/start_email_bot.sh --daemon'" >> "$SHELL_RC"
            
            log_info "已添加命令别名到 $SHELL_RC"
            log_info "重新加载 shell 配置: source $SHELL_RC"
        else
            log_info "命令别名已存在"
        fi
    fi
}

# 显示安装完成信息
show_completion_info() {
    log_step "安装完成!"
    
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo -e "${GREEN}邮件机器人安装完成！${NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo -e "${YELLOW}下一步操作:${NC}"
    echo "1. 配置邮箱信息:"
    echo "   nano $HOME/email_bot/.env"
    echo ""
    echo "2. 修改关键字配置 (可选):"
    echo "   nano $HOME/email_bot/config.yaml"
    echo ""
    echo "3. 测试运行:"
    echo "   $HOME/email_bot/start_email_bot.sh --once"
    echo ""
    echo "4. 启动守护进程:"
    echo "   $HOME/email_bot/start_email_bot.sh --daemon"
    echo ""
    echo "5. 设置为系统服务 (可选):"
    echo "   launchctl load $HOME/Library/LaunchAgents/com.emailbot.daemon.plist"
    echo ""
    echo -e "${YELLOW}常用命令 (重新加载 shell 后可用):${NC}"
    echo "   emailbot --once      # 执行一次"
    echo "   emailbot --daemon    # 守护进程模式"
    echo ""
    echo -e "${BLUE}项目目录: $HOME/email_bot${NC}"
    echo -e "${BLUE}日志目录: $HOME/email_bot/logs${NC}"
    echo -e "${BLUE}输出目录: $HOME/email_bot/output${NC}"
    echo ""
}

# 主函数
main() {
    log_info "开始安装邮件机器人..."
    
    check_macos
    install_homebrew
    install_python
    setup_project
    copy_project_files
    install_dependencies
    setup_environment
    create_launch_script
    create_launchd_service
    setup_aliases
    show_completion_info
}

# 运行主函数
main "$@"