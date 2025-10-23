#!/bin/bash

# Nginx IP Monitor 卸载脚本
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

# 停止服务
stop_service() {
    log_info "停止nginx-ip-monitor服务..."
    
    if systemctl is-active --quiet nginx-ip-monitor; then
        systemctl stop nginx-ip-monitor
        log_info "服务已停止"
    else
        log_info "服务未运行"
    fi
}

# 禁用服务
disable_service() {
    log_info "禁用nginx-ip-monitor服务..."
    
    if systemctl is-enabled --quiet nginx-ip-monitor; then
        systemctl disable nginx-ip-monitor
        log_info "服务已禁用"
    else
        log_info "服务未启用"
    fi
}

# 删除systemd服务文件
remove_service_file() {
    log_info "删除systemd服务文件..."
    
    if [[ -f /etc/systemd/system/nginx-ip-monitor.service ]]; then
        rm -f /etc/systemd/system/nginx-ip-monitor.service
        log_info "服务文件已删除"
    else
        log_info "服务文件不存在"
    fi
}

# 重新加载systemd
reload_systemd() {
    log_info "重新加载systemd..."
    systemctl daemon-reload
    log_info "systemd已重新加载"
}

# 删除程序文件
remove_program_files() {
    log_info "删除程序文件..."
    
    # 删除主脚本
    if [[ -f /usr/local/bin/nginx-ip-monitor.py ]]; then
        rm -f /usr/local/bin/nginx-ip-monitor.py
        log_info "主脚本已删除"
    fi
    
    # 删除配置目录
    if [[ -d /etc/nginx-ip-monitor ]]; then
        rm -rf /etc/nginx-ip-monitor
        log_info "配置目录已删除"
    fi
    
    # 删除日志文件
    if [[ -f /var/log/nginx-ip-monitor.log ]]; then
        rm -f /var/log/nginx-ip-monitor.log
        log_info "日志文件已删除"
    fi
}

# 恢复nginx配置（可选）
restore_nginx_config() {
    log_warn "是否要恢复nginx配置？"
    log_warn "这将删除当前的nginx配置并恢复备份（如果存在）"
    read -p "继续？(y/N): " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        if [[ -f /etc/nginx-ip-monitor/nginx.conf.backup ]]; then
            cp /etc/nginx-ip-monitor/nginx.conf.backup /etc/nginx/nginx.conf
            log_info "nginx配置已恢复"
            
            # 测试nginx配置
            if nginx -t; then
                log_info "nginx配置测试通过"
            else
                log_warn "nginx配置测试失败，请手动检查"
            fi
        else
            log_warn "未找到nginx配置备份"
        fi
    else
        log_info "跳过nginx配置恢复"
    fi
}

# 清理临时文件
cleanup_temp_files() {
    log_info "清理临时文件..."
    
    if [[ -f /tmp/nginx_monitor_current_ip ]]; then
        rm -f /tmp/nginx_monitor_current_ip
        log_info "临时IP文件已删除"
    fi
}

# 显示卸载结果
show_result() {
    log_info "卸载完成！"
    echo
    echo "已删除的文件和目录："
    echo "  - /usr/local/bin/nginx-ip-monitor.py"
    echo "  - /etc/nginx-ip-monitor/"
    echo "  - /etc/systemd/system/nginx-ip-monitor.service"
    echo "  - /var/log/nginx-ip-monitor.log"
    echo "  - /tmp/nginx_monitor_current_ip"
    echo
    echo "注意："
    echo "  - nginx配置文件未被删除"
    echo "  - 如果之前有备份，可以手动恢复"
    echo "  - 建议重启nginx服务以确保配置生效"
    echo
    echo "重启nginx："
    echo "  sudo systemctl restart nginx"
}

# 主函数
main() {
    log_info "开始卸载 Nginx IP Monitor..."
    
    check_root
    stop_service
    disable_service
    remove_service_file
    reload_systemd
    remove_program_files
    restore_nginx_config
    cleanup_temp_files
    show_result
    
    log_info "卸载完成！"
}

# 运行主函数
main "$@"