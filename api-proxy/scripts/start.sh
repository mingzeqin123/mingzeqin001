#!/bin/bash
# API代理服务器启动脚本

set -e

echo "🚀 启动API代理服务器"
echo "===================="

# 配置文件路径
CONFIG_DIR="./config"
LOG_DIR="./logs"
ENV_FILE=".env"

# 检查必要文件和目录
check_prerequisites() {
    echo "🔍 检查必要文件和目录..."
    
    # 检查Node.js
    if ! command -v node &> /dev/null; then
        echo "❌ Node.js未安装或不在PATH中"
        exit 1
    fi
    
    # 检查主文件
    if [ ! -f "src/index.js" ]; then
        echo "❌ 找不到src/index.js文件"
        exit 1
    fi
    
    # 检查配置目录
    if [ ! -d "$CONFIG_DIR" ]; then
        echo "❌ 配置目录不存在: $CONFIG_DIR"
        exit 1
    fi
    
    # 检查配置文件
    if [ ! -f "$CONFIG_DIR/default.json" ]; then
        echo "❌ 默认配置文件不存在: $CONFIG_DIR/default.json"
        exit 1
    fi
    
    # 创建日志目录
    if [ ! -d "$LOG_DIR" ]; then
        mkdir -p "$LOG_DIR"
        echo "📁 创建日志目录: $LOG_DIR"
    fi
    
    # 检查环境变量文件
    if [ ! -f "$ENV_FILE" ]; then
        echo "⚠️ 环境变量文件不存在: $ENV_FILE"
        echo "   将使用默认配置"
    else
        echo "✅ 找到环境变量文件: $ENV_FILE"
    fi
    
    echo "✅ 必要文件检查完成"
}

# 验证配置
validate_config() {
    echo "📋 验证配置文件..."
    
    # 使用Node.js验证JSON格式
    if ! node -e "require('$CONFIG_DIR/default.json')" 2>/dev/null; then
        echo "❌ 配置文件格式错误: $CONFIG_DIR/default.json"
        exit 1
    fi
    
    echo "✅ 配置文件格式正确"
}

# 检查端口是否被占用
check_port() {
    local port=${PORT:-3000}
    
    if command -v lsof &> /dev/null; then
        if lsof -i :$port &> /dev/null; then
            echo "⚠️ 端口 $port 已被占用"
            echo "   当前占用进程:"
            lsof -i :$port
            
            read -p "是否要终止占用进程并继续？(y/N): " -n 1 -r
            echo
            if [[ $REPLY =~ ^[Yy]$ ]]; then
                echo "终止占用端口的进程..."
                lsof -ti:$port | xargs kill -9 2>/dev/null || true
                sleep 2
            else
                echo "启动取消"
                exit 1
            fi
        fi
    fi
}

# 显示配置信息
show_config() {
    echo "📊 当前配置信息:"
    echo "   Node版本: $(node -v)"
    echo "   环境: ${NODE_ENV:-development}"
    echo "   端口: ${PORT:-3000}"
    echo "   主机: ${HOST:-localhost}"
    echo "   日志级别: ${LOG_LEVEL:-info}"
    echo ""
}

# 启动服务器
start_server() {
    local mode=${1:-production}
    
    echo "🔄 启动模式: $mode"
    
    case $mode in
        "dev" | "development")
            echo "🛠️ 开发模式启动..."
            if command -v nodemon &> /dev/null; then
                nodemon src/index.js
            else
                echo "⚠️ nodemon未安装，使用普通模式启动"
                node src/index.js
            fi
            ;;
        "prod" | "production")
            echo "🏭 生产模式启动..."
            node src/index.js
            ;;
        "cluster")
            echo "🔗 集群模式启动..."
            if [ -f "cluster.js" ]; then
                node cluster.js
            else
                echo "❌ cluster.js文件不存在，使用普通模式"
                node src/index.js
            fi
            ;;
        "pm2")
            echo "⚡ PM2模式启动..."
            if command -v pm2 &> /dev/null; then
                pm2 start ecosystem.config.js
            else
                echo "❌ PM2未安装，请先安装: npm install -g pm2"
                exit 1
            fi
            ;;
        "docker")
            echo "🐳 Docker模式启动..."
            if [ -f "docker-compose.yml" ]; then
                docker-compose up -d
            elif [ -f "Dockerfile" ]; then
                docker build -t api-proxy .
                docker run -p 3000:3000 -d api-proxy
            else
                echo "❌ 找不到Docker配置文件"
                exit 1
            fi
            ;;
        *)
            echo "❌ 未知的启动模式: $mode"
            show_help
            exit 1
            ;;
    esac
}

# 健康检查
health_check() {
    local max_attempts=30
    local attempt=0
    local port=${PORT:-3000}
    local host=${HOST:-localhost}
    
    echo "🏥 等待服务启动..."
    
    while [ $attempt -lt $max_attempts ]; do
        if curl -sf "http://$host:$port/health" > /dev/null 2>&1; then
            echo "✅ 服务健康检查通过"
            echo "🌐 服务器运行在: http://$host:$port"
            echo "📊 健康检查: http://$host:$port/health"
            echo "📋 API信息: http://$host:$port/api/info"
            return 0
        fi
        
        sleep 1
        ((attempt++))
        echo -n "."
    done
    
    echo ""
    echo "❌ 服务启动超时或失败"
    echo "   请检查日志文件获取更多信息"
    return 1
}

# 停止服务
stop_server() {
    echo "⏹️ 停止API代理服务器..."
    
    local port=${PORT:-3000}
    
    if command -v lsof &> /dev/null; then
        local pids=$(lsof -ti:$port 2>/dev/null || true)
        if [ ! -z "$pids" ]; then
            echo "终止进程: $pids"
            echo "$pids" | xargs kill -TERM 2>/dev/null || true
            sleep 2
            
            # 如果还没停止，强制终止
            pids=$(lsof -ti:$port 2>/dev/null || true)
            if [ ! -z "$pids" ]; then
                echo "强制终止进程: $pids"
                echo "$pids" | xargs kill -9 2>/dev/null || true
            fi
            
            echo "✅ 服务已停止"
        else
            echo "ℹ️ 没有找到运行的服务"
        fi
    else
        echo "⚠️ 无法检查运行状态，请手动检查"
    fi
}

# 重启服务
restart_server() {
    echo "🔄 重启API代理服务器..."
    stop_server
    sleep 1
    start_server "$1"
}

# 显示状态
show_status() {
    local port=${PORT:-3000}
    local host=${HOST:-localhost}
    
    echo "📊 服务状态检查"
    echo "==============="
    
    # 检查进程
    if command -v lsof &> /dev/null; then
        local pids=$(lsof -ti:$port 2>/dev/null || true)
        if [ ! -z "$pids" ]; then
            echo "✅ 服务正在运行"
            echo "   进程ID: $pids"
            echo "   端口: $port"
            
            # 健康检查
            if curl -sf "http://$host:$port/health" > /dev/null 2>&1; then
                echo "✅ 健康检查通过"
                
                # 获取详细信息
                if command -v curl &> /dev/null; then
                    echo ""
                    echo "📋 服务信息:"
                    curl -s "http://$host:$port/health" | node -e "
                        const data = JSON.parse(require('fs').readFileSync(0, 'utf-8'));
                        console.log('   状态:', data.status);
                        console.log('   版本:', data.version);
                        console.log('   运行时间:', Math.round(data.uptime), '秒');
                        console.log('   环境:', data.environment);
                    " 2>/dev/null || echo "   无法获取详细信息"
                fi
            else
                echo "❌ 健康检查失败"
            fi
        else
            echo "❌ 服务未运行"
        fi
    else
        echo "⚠️ 无法检查服务状态"
    fi
    
    # 显示连接信息
    echo ""
    echo "🌐 连接信息:"
    echo "   服务器: http://$host:$port"
    echo "   健康检查: http://$host:$port/health"
    echo "   API信息: http://$host:$port/api/info"
}

# 显示帮助
show_help() {
    echo "API代理服务器启动脚本"
    echo ""
    echo "用法: $0 [命令] [模式]"
    echo ""
    echo "命令:"
    echo "  start [mode]   启动服务器 (默认)"
    echo "  stop           停止服务器"
    echo "  restart [mode] 重启服务器"
    echo "  status         显示服务器状态"
    echo "  health         执行健康检查"
    echo "  help           显示帮助信息"
    echo ""
    echo "启动模式:"
    echo "  production     生产模式 (默认)"
    echo "  dev            开发模式 (使用nodemon)"
    echo "  cluster        集群模式"
    echo "  pm2            PM2模式"
    echo "  docker         Docker模式"
    echo ""
    echo "环境变量:"
    echo "  NODE_ENV       节点环境 (development/production)"
    echo "  PORT           服务器端口 (默认3000)"
    echo "  HOST           服务器主机 (默认localhost)"
    echo "  LOG_LEVEL      日志级别 (error/warn/info/debug)"
    echo ""
    echo "示例:"
    echo "  $0                    # 生产模式启动"
    echo "  $0 start dev          # 开发模式启动"
    echo "  $0 start pm2          # PM2模式启动"
    echo "  $0 stop               # 停止服务"
    echo "  $0 restart dev        # 开发模式重启"
    echo "  $0 status             # 查看状态"
}

# 主函数
main() {
    local command=${1:-start}
    local mode=${2:-production}
    
    # 加载环境变量
    if [ -f "$ENV_FILE" ]; then
        export $(cat "$ENV_FILE" | grep -v '^#' | xargs) 2>/dev/null || true
    fi
    
    case $command in
        "start")
            check_prerequisites
            validate_config
            show_config
            check_port
            start_server "$mode"
            if [ "$mode" != "docker" ]; then
                health_check
            fi
            ;;
        "stop")
            stop_server
            ;;
        "restart")
            restart_server "$mode"
            ;;
        "status")
            show_status
            ;;
        "health")
            health_check
            ;;
        "help" | "--help" | "-h")
            show_help
            ;;
        *)
            echo "❌ 未知命令: $command"
            echo ""
            show_help
            exit 1
            ;;
    esac
}

# 信号处理
trap 'echo ""; echo "⏹️ 收到中断信号，停止服务..."; stop_server; exit 0' INT TERM

# 运行主函数
main "$@"