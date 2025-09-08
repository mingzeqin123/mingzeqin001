#!/bin/bash
# MySQL备份到阿里云OSS安装脚本

set -e

echo "开始安装MySQL备份到阿里云OSS工具..."

# 检查Python版本
if ! command -v python3 &> /dev/null; then
    echo "错误: 需要Python 3.6或更高版本"
    exit 1
fi

# 检查pip
if ! command -v pip3 &> /dev/null; then
    echo "错误: 需要pip3"
    exit 1
fi

# 安装依赖
echo "安装Python依赖包..."
pip3 install oss2

# 检查mysqldump
if ! command -v mysqldump &> /dev/null; then
    echo "警告: 未找到mysqldump，请确保MySQL客户端已安装"
    echo "Ubuntu/Debian: sudo apt-get install mysql-client"
    echo "CentOS/RHEL: sudo yum install mysql"
fi

# 创建必要的目录
echo "创建必要的目录..."
sudo mkdir -p /opt/mysql_backup
sudo mkdir -p /var/log
sudo mkdir -p /tmp/mysql_backups

# 复制脚本文件
echo "复制脚本文件..."
sudo cp mysql_backup_to_oss.py /opt/mysql_backup/
sudo cp backup_config.json /opt/mysql_backup/
sudo chmod +x /opt/mysql_backup/mysql_backup_to_oss.py

# 设置权限
sudo chown -R root:root /opt/mysql_backup
sudo chmod 600 /opt/mysql_backup/backup_config.json

echo "安装完成！"
echo ""
echo "下一步："
echo "1. 编辑配置文件: sudo nano /opt/mysql_backup/backup_config.json"
echo "2. 配置MySQL连接信息和阿里云OSS信息"
echo "3. 测试备份: python3 /opt/mysql_backup/mysql_backup_to_oss.py"
echo "4. 设置定时任务: crontab -e"
echo ""
echo "定时任务示例（每天凌晨2点备份）:"
echo "0 2 * * * /usr/bin/python3 /opt/mysql_backup/mysql_backup_to_oss.py /opt/mysql_backup/backup_config.json >> /var/log/mysql_backup_cron.log 2>&1"