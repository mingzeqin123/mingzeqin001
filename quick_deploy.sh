#!/bin/bash
# MySQL备份到阿里云OSS - 快速部署脚本

set -e

echo "MySQL数据库备份到阿里云OSS - 快速部署"
echo "======================================="

# 检查是否为root用户
if [[ $EUID -eq 0 ]]; then
   echo "警告: 不建议使用root用户运行此脚本"
   read -p "是否继续? (y/N): " continue_root
   if [[ ! $continue_root =~ ^[Yy]$ ]]; then
       exit 1
   fi
fi

# 获取当前目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "当前工作目录: $SCRIPT_DIR"

# 步骤1: 安装依赖
echo ""
echo "步骤1: 安装系统依赖和Python包"
echo "--------------------------------"
if [ -f "install_dependencies.sh" ]; then
    bash install_dependencies.sh
else
    echo "错误: install_dependencies.sh 文件不存在"
    exit 1
fi

# 步骤2: 配置文件设置
echo ""
echo "步骤2: 配置参数设置"
echo "------------------"

if [ ! -f "backup_config.json" ]; then
    if [ -f "backup_config.example.json" ]; then
        cp backup_config.example.json backup_config.json
        echo "已创建配置文件: backup_config.json"
    else
        echo "错误: backup_config.example.json 文件不存在"
        exit 1
    fi
else
    echo "配置文件已存在: backup_config.json"
fi

echo ""
echo "请编辑配置文件填入您的MySQL和OSS参数:"
echo "配置文件路径: $SCRIPT_DIR/backup_config.json"
echo ""
echo "主要配置项:"
echo "- MySQL连接信息 (host, port, user, password, databases)"
echo "- 阿里云OSS信息 (access_key_id, access_key_secret, endpoint, bucket_name)"
echo ""

read -p "现在编辑配置文件? (Y/n): " edit_config
if [[ ! $edit_config =~ ^[Nn]$ ]]; then
    # 尝试使用不同的编辑器
    if command -v nano &> /dev/null; then
        nano backup_config.json
    elif command -v vim &> /dev/null; then
        vim backup_config.json
    elif command -v vi &> /dev/null; then
        vi backup_config.json
    else
        echo "未找到文本编辑器，请手动编辑配置文件"
        echo "配置文件路径: $SCRIPT_DIR/backup_config.json"
    fi
fi

# 步骤3: 测试配置
echo ""
echo "步骤3: 测试配置"
echo "--------------"
read -p "运行配置测试? (Y/n): " run_test
if [[ ! $run_test =~ ^[Nn]$ ]]; then
    if python3 test_backup.py; then
        echo "✓ 配置测试通过"
    else
        echo "✗ 配置测试失败，请检查配置文件"
        echo "可以稍后运行: python3 test_backup.py"
        read -p "是否继续部署? (y/N): " continue_deploy
        if [[ ! $continue_deploy =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
fi

# 步骤4: 手动备份测试
echo ""
echo "步骤4: 手动备份测试"
echo "------------------"
read -p "执行一次手动备份测试? (Y/n): " manual_backup
if [[ ! $manual_backup =~ ^[Nn]$ ]]; then
    echo "正在执行手动备份..."
    if python3 mysql_backup_to_oss.py; then
        echo "✓ 手动备份测试成功"
    else
        echo "✗ 手动备份测试失败"
        echo "请检查日志: /var/log/mysql_backup.log"
        read -p "是否继续设置定时任务? (y/N): " continue_cron
        if [[ ! $continue_cron =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
fi

# 步骤5: 设置定时任务
echo ""
echo "步骤5: 设置定时任务"
echo "------------------"
read -p "设置定时备份任务? (Y/n): " setup_cron
if [[ ! $setup_cron =~ ^[Nn]$ ]]; then
    bash setup_cron.sh
fi

# 完成部署
echo ""
echo "======================================="
echo "✓ MySQL备份到阿里云OSS部署完成!"
echo "======================================="
echo ""
echo "重要文件位置:"
echo "- 主脚本: $SCRIPT_DIR/mysql_backup_to_oss.py"
echo "- 配置文件: $SCRIPT_DIR/backup_config.json"
echo "- 测试脚本: $SCRIPT_DIR/test_backup.py"
echo ""
echo "日志文件:"
echo "- 备份日志: /var/log/mysql_backup.log"
echo "- Cron日志: /var/log/mysql_backup_cron.log"
echo "- 备份历史: /var/log/mysql_backup_history.json"
echo ""
echo "常用命令:"
echo "- 手动备份: python3 $SCRIPT_DIR/mysql_backup_to_oss.py"
echo "- 配置测试: python3 $SCRIPT_DIR/test_backup.py"
echo "- 查看日志: tail -f /var/log/mysql_backup.log"
echo "- 管理定时任务: bash $SCRIPT_DIR/setup_cron.sh"
echo ""
echo "详细文档请查看: README_MySQL_Backup.md"