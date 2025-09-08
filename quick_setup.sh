#!/bin/bash
# MySQL备份到阿里云OSS快速设置脚本

set -e

echo "=========================================="
echo "MySQL备份到阿里云OSS快速设置"
echo "=========================================="

# 检查是否为root用户
if [ "$EUID" -ne 0 ]; then
    echo "请使用sudo运行此脚本"
    exit 1
fi

# 1. 安装依赖
echo "步骤 1/6: 安装系统依赖..."
if command -v apt-get &> /dev/null; then
    apt-get update
    apt-get install -y python3 python3-pip mysql-client
elif command -v yum &> /dev/null; then
    yum install -y python3 python3-pip mysql
else
    echo "警告: 无法自动安装依赖，请手动安装Python3和MySQL客户端"
fi

# 2. 安装Python依赖
echo "步骤 2/6: 安装Python依赖..."
pip3 install oss2

# 3. 创建目录
echo "步骤 3/6: 创建必要目录..."
mkdir -p /opt/mysql_backup
mkdir -p /var/log
mkdir -p /tmp/mysql_backups

# 4. 复制文件
echo "步骤 4/6: 复制脚本文件..."
cp mysql_backup_to_oss.py /opt/mysql_backup/
cp backup_config.json /opt/mysql_backup/
cp test_backup.py /opt/mysql_backup/
chmod +x /opt/mysql_backup/*.py
chmod 600 /opt/mysql_backup/backup_config.json

# 5. 创建日志文件
echo "步骤 5/6: 创建日志文件..."
touch /var/log/mysql_backup.log
touch /var/log/mysql_backup_cron.log
chmod 644 /var/log/mysql_backup*.log

# 6. 配置提示
echo "步骤 6/6: 配置提示"
echo ""
echo "✅ 安装完成！"
echo ""
echo "下一步操作："
echo "1. 编辑配置文件:"
echo "   sudo nano /opt/mysql_backup/backup_config.json"
echo ""
echo "2. 测试配置:"
echo "   python3 /opt/mysql_backup/test_backup.py"
echo ""
echo "3. 手动测试备份:"
echo "   python3 /opt/mysql_backup/mysql_backup_to_oss.py"
echo ""
echo "4. 设置定时任务:"
echo "   sudo ./setup_cron.sh"
echo ""
echo "配置文件位置: /opt/mysql_backup/backup_config.json"
echo "日志文件位置: /var/log/mysql_backup.log"
echo ""
echo "需要配置的信息："
echo "- MySQL连接信息（主机、端口、用户名、密码）"
echo "- 阿里云OSS信息（endpoint、bucket名称、访问密钥）"
echo "- 备份策略（保留天数、压缩等）"