#!/bin/bash
# MySQL备份到阿里云OSS - 依赖安装脚本

set -e

echo "正在安装MySQL备份到OSS的依赖..."

# 检查Python版本
python3 --version || {
    echo "错误: 需要Python 3.6或更高版本"
    exit 1
}

# 检查pip
pip3 --version || {
    echo "正在安装pip3..."
    sudo apt update
    sudo apt install -y python3-pip
}

# 安装系统依赖
echo "安装系统依赖包..."
sudo apt update
sudo apt install -y mysql-client-core-8.0 || sudo apt install -y mysql-client

# 安装Python依赖
echo "安装Python依赖包..."
pip3 install -r requirements.txt

# 创建日志目录
echo "创建日志目录..."
sudo mkdir -p /var/log
sudo chmod 755 /var/log

# 设置脚本执行权限
chmod +x mysql_backup_to_oss.py

echo "依赖安装完成!"
echo ""
echo "下一步操作:"
echo "1. 复制 backup_config.example.json 为 backup_config.json"
echo "2. 编辑 backup_config.json 填入您的MySQL和OSS配置"
echo "3. 运行测试: python3 mysql_backup_to_oss.py"
echo "4. 设置定时任务: bash setup_cron.sh"