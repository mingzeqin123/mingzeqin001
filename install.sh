#!/bin/bash

# Nginx IP Monitor 安装脚本
# 需要root权限运行

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
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

# 检查是否以root权限运行
check_root() {
    if [[ $EUID -ne 0 ]]; then
        log_error "此脚本需要root权限运行"
        log_info "请使用: sudo $0"
        exit 1
    fi
}

# 检查系统要求
check_requirements() {
    log_info "检查系统要求..."
    
    # 检查Python3
    if ! command -v python3 &> /dev/null; then
        log_error "Python3 未安装"
        exit 1
    fi
    
    # 检查pip
    if ! command -v pip3 &> /dev/null; then
        log_error "pip3 未安装"
        exit 1
    fi
    
    # 检查nginx
    if ! command -v nginx &> /dev/null; then
        log_warn "nginx 未安装，请先安装nginx"
    fi
    
    log_info "系统要求检查完成"
}

# 安装Python依赖
install_dependencies() {
    log_info "安装Python依赖..."
    
    pip3 install requests
    
    log_info "Python依赖安装完成"
}

# 创建目录结构
create_directories() {
    log_info "创建目录结构..."
    
    mkdir -p /etc/nginx-ip-monitor
    mkdir -p /var/log
    mkdir -p /usr/local/bin
    
    log_info "目录结构创建完成"
}

# 安装文件
install_files() {
    log_info "安装文件..."
    
    # 复制主脚本
    cp nginx_ip_monitor.py /usr/local/bin/nginx-ip-monitor.py
    chmod +x /usr/local/bin/nginx-ip-monitor.py
    
    # 复制配置文件
    cp config.json /etc/nginx-ip-monitor/config.json
    chmod 644 /etc/nginx-ip-monitor/config.json
    
    # 复制nginx模板
    cp nginx.conf.template /etc/nginx-ip-monitor/nginx.conf.template
    chmod 644 /etc/nginx-ip-monitor/nginx.conf.template
    
    # 复制systemd服务文件
    cp nginx-ip-monitor.service /etc/systemd/system/nginx-ip-monitor.service
    chmod 644 /etc/systemd/system/nginx-ip-monitor.service
    
    log_info "文件安装完成"
}

# 配置systemd服务
configure_service() {
    log_info "配置systemd服务..."
    
    # 重新加载systemd
    systemctl daemon-reload
    
    # 启用服务
    systemctl enable nginx-ip-monitor.service
    
    log_info "systemd服务配置完成"
}

# 创建初始nginx配置
create_initial_nginx_config() {
    log_info "创建初始nginx配置..."
    
    # 获取当前IP
    CURRENT_IP=$(curl -s https://api.ipify.org || echo "127.0.0.1")
    
    # 更新nginx配置模板中的IP
    sed "s/{{SERVER_IP}}/$CURRENT_IP/g" /etc/nginx-ip-monitor/nginx.conf.template > /etc/nginx/nginx.conf
    
    log_info "初始nginx配置已创建，当前IP: $CURRENT_IP"
}

# 测试安装
test_installation() {
    log_info "测试安装..."
    
    # 测试配置文件语法
    if command -v nginx &> /dev/null; then
        if nginx -t; then
            log_info "nginx配置测试通过"
        else
            log_warn "nginx配置测试失败，请检查配置"
        fi
    fi
    
    # 测试Python脚本
    if python3 /usr/local/bin/nginx-ip-monitor.py --once --config /etc/nginx-ip-monitor/config.json; then
        log_info "Python脚本测试通过"
    else
        log_warn "Python脚本测试失败，请检查配置"
    fi
    
    log_info "安装测试完成"
}

# 显示使用说明
show_usage() {
    log_info "安装完成！"
    echo
    echo "使用方法："
    echo "  启动服务: systemctl start nginx-ip-monitor"
    echo "  停止服务: systemctl stop nginx-ip-monitor"
    echo "  重启服务: systemctl restart nginx-ip-monitor"
    echo "  查看状态: systemctl status nginx-ip-monitor"
    echo "  查看日志: journalctl -u nginx-ip-monitor -f"
    echo
    echo "配置文件: /etc/nginx-ip-monitor/config.json"
    echo "日志文件: /var/log/nginx-ip-monitor.log"
    echo
    echo "手动执行一次检查:"
    echo "  python3 /usr/local/bin/nginx-ip-monitor.py --once"
    echo
}

# 主函数
main() {
    log_info "开始安装 Nginx IP Monitor..."
    
    check_root
    check_requirements
    install_dependencies
    create_directories
    install_files
    configure_service
    create_initial_nginx_config
    test_installation
    show_usage
    
    log_info "安装完成！"
}

# 运行主函数
main "$@"