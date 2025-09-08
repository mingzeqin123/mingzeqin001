#!/bin/bash
# 设置MySQL备份定时任务

set -e

BACKUP_SCRIPT="/opt/mysql_backup/mysql_backup_to_oss.py"
CONFIG_FILE="/opt/mysql_backup/backup_config.json"
LOG_FILE="/var/log/mysql_backup_cron.log"

echo "设置MySQL备份定时任务..."

# 检查脚本文件是否存在
if [ ! -f "$BACKUP_SCRIPT" ]; then
    echo "错误: 备份脚本不存在，请先运行 install.sh"
    exit 1
fi

if [ ! -f "$CONFIG_FILE" ]; then
    echo "错误: 配置文件不存在，请先运行 install.sh"
    exit 1
fi

# 创建日志文件
sudo touch "$LOG_FILE"
sudo chmod 644 "$LOG_FILE"

# 添加定时任务
echo "添加定时任务到crontab..."

# 备份当前crontab
crontab -l > /tmp/current_crontab 2>/dev/null || touch /tmp/current_crontab

# 检查是否已经存在备份任务
if grep -q "mysql_backup_to_oss.py" /tmp/current_crontab; then
    echo "警告: 已存在MySQL备份定时任务"
    echo "当前crontab内容:"
    crontab -l | grep mysql_backup
    echo ""
    read -p "是否要替换现有任务? (y/N): " replace
    if [[ $replace =~ ^[Yy]$ ]]; then
        # 删除现有的备份任务
        grep -v "mysql_backup_to_oss.py" /tmp/current_crontab > /tmp/new_crontab
        mv /tmp/new_crontab /tmp/current_crontab
    else
        echo "取消设置定时任务"
        exit 0
    fi
fi

# 添加新的定时任务
cat >> /tmp/current_crontab << EOF

# MySQL备份到阿里云OSS - 每天凌晨2点执行
0 2 * * * /usr/bin/python3 $BACKUP_SCRIPT $CONFIG_FILE >> $LOG_FILE 2>&1
EOF

# 应用新的crontab
crontab /tmp/current_crontab

# 清理临时文件
rm -f /tmp/current_crontab

echo "定时任务设置完成！"
echo ""
echo "当前crontab内容:"
crontab -l
echo ""
echo "备份任务将在每天凌晨2点执行"
echo "日志文件: $LOG_FILE"
echo ""
echo "手动测试备份:"
echo "python3 $BACKUP_SCRIPT $CONFIG_FILE"