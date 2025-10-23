#!/bin/bash
# Nginx IP Monitor 安装脚本

set -e

echo "=== Nginx IP Monitor 安装脚本 ==="

# 检查是否以root权限运行
if [[ $EUID -ne 0 ]]; then
   echo "错误: 请以root权限运行此脚本"
   echo "使用: sudo $0"
   exit 1
fi

# 检查Python3是否安装
if ! command -v python3 &> /dev/null; then
    echo "错误: 未找到Python3，请先安装Python3"
    exit 1
fi

echo "✓ Python3 已安装: $(python3 --version)"

# 检查pip是否安装
if ! command -v pip3 &> /dev/null; then
    echo "安装pip3..."
    apt-get update
    apt-get install -y python3-pip
fi

echo "✓ pip3 已安装"

# 安装Python依赖
echo "安装Python依赖包..."
pip3 install requests

# 可选：安装daemon包（用于守护进程模式）
echo "安装可选依赖包..."
pip3 install python-daemon || echo "警告: python-daemon安装失败，守护进程模式可能不可用"

# 创建工作目录
INSTALL_DIR="/opt/nginx-ip-monitor"
echo "创建安装目录: $INSTALL_DIR"
mkdir -p "$INSTALL_DIR"

# 复制文件
echo "复制程序文件..."
cp nginx_ip_monitor.py "$INSTALL_DIR/"
cp nginx_monitor_config.json "$INSTALL_DIR/"
cp nginx_default.template "$INSTALL_DIR/"

# 设置权限
chmod +x "$INSTALL_DIR/nginx_ip_monitor.py"

# 创建systemd服务文件
echo "创建systemd服务..."
cat > /etc/systemd/system/nginx-ip-monitor.service << EOF
[Unit]
Description=Nginx IP Monitor Service
After=network.target nginx.service
Wants=nginx.service

[Service]
Type=simple
User=root
WorkingDirectory=$INSTALL_DIR
ExecStart=/usr/bin/python3 $INSTALL_DIR/nginx_ip_monitor.py -c $INSTALL_DIR/nginx_monitor_config.json
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF

# 重新加载systemd
systemctl daemon-reload

# 创建日志目录
mkdir -p /var/log
touch /var/log/nginx_ip_monitor.log
chmod 644 /var/log/nginx_ip_monitor.log

# 备份现有nginx配置（如果存在）
if [ -f "/etc/nginx/sites-available/default" ]; then
    echo "备份现有nginx配置..."
    cp /etc/nginx/sites-available/default /etc/nginx/sites-available/default.backup.$(date +%Y%m%d_%H%M%S)
fi

# 复制模板到nginx目录
if [ ! -f "/etc/nginx/sites-available/default.template" ]; then
    echo "复制nginx配置模板..."
    cp "$INSTALL_DIR/nginx_default.template" /etc/nginx/sites-available/default.template
fi

echo ""
echo "=== 安装完成 ==="
echo ""
echo "安装位置: $INSTALL_DIR"
echo "配置文件: $INSTALL_DIR/nginx_monitor_config.json"
echo "日志文件: /var/log/nginx_ip_monitor.log"
echo ""
echo "使用方法:"
echo "1. 编辑配置文件: nano $INSTALL_DIR/nginx_monitor_config.json"
echo "2. 手动运行一次测试: python3 $INSTALL_DIR/nginx_ip_monitor.py --check-once"
echo "3. 启动服务: systemctl start nginx-ip-monitor"
echo "4. 开机自启: systemctl enable nginx-ip-monitor"
echo "5. 查看状态: systemctl status nginx-ip-monitor"
echo "6. 查看日志: journalctl -u nginx-ip-monitor -f"
echo ""
echo "重要提示:"
echo "- 请确保nginx已安装并正常运行"
echo "- 请根据需要修改配置文件中的nginx路径"
echo "- 建议先进行测试运行，确认一切正常后再启用服务"
echo ""