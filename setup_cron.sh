#!/bin/bash
# MySQL备份到阿里云OSS - 定时任务设置脚本

set -e

# 获取当前脚本所在目录的绝对路径
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKUP_SCRIPT="$SCRIPT_DIR/mysql_backup_to_oss.py"
CONFIG_FILE="$SCRIPT_DIR/backup_config.json"

echo "MySQL备份定时任务设置"
echo "====================="

# 检查备份脚本是否存在
if [ ! -f "$BACKUP_SCRIPT" ]; then
    echo "错误: 备份脚本不存在: $BACKUP_SCRIPT"
    exit 1
fi

# 检查配置文件是否存在
if [ ! -f "$CONFIG_FILE" ]; then
    echo "错误: 配置文件不存在: $CONFIG_FILE"
    echo "请先复制 backup_config.example.json 为 backup_config.json 并配置相关参数"
    exit 1
fi

# 确保脚本有执行权限
chmod +x "$BACKUP_SCRIPT"

echo "当前工作目录: $SCRIPT_DIR"
echo "备份脚本路径: $BACKUP_SCRIPT"
echo "配置文件路径: $CONFIG_FILE"
echo ""

# 显示定时任务选项
echo "请选择备份频率:"
echo "1) 每天凌晨2点执行备份"
echo "2) 每天凌晨2点和下午2点执行备份"
echo "3) 每12小时执行一次备份"
echo "4) 每6小时执行一次备份"
echo "5) 每周日凌晨1点执行备份"
echo "6) 自定义cron表达式"
echo "7) 查看当前的备份任务"
echo "8) 删除现有的备份任务"

read -p "请输入选项 (1-8): " choice

# 定义cron表达式
case $choice in
    1)
        CRON_EXPRESSION="0 2 * * *"
        DESCRIPTION="每天凌晨2点"
        ;;
    2)
        CRON_EXPRESSION="0 2,14 * * *"
        DESCRIPTION="每天凌晨2点和下午2点"
        ;;
    3)
        CRON_EXPRESSION="0 */12 * * *"
        DESCRIPTION="每12小时"
        ;;
    4)
        CRON_EXPRESSION="0 */6 * * *"
        DESCRIPTION="每6小时"
        ;;
    5)
        CRON_EXPRESSION="0 1 * * 0"
        DESCRIPTION="每周日凌晨1点"
        ;;
    6)
        read -p "请输入自定义cron表达式 (例: 0 3 * * *): " CRON_EXPRESSION
        DESCRIPTION="自定义时间"
        ;;
    7)
        echo "当前的MySQL备份任务:"
        crontab -l | grep -E "(mysql_backup_to_oss|MySQL备份)" || echo "未找到相关备份任务"
        exit 0
        ;;
    8)
        echo "正在删除现有的备份任务..."
        # 创建临时文件存储过滤后的crontab
        TEMP_CRON=$(mktemp)
        crontab -l 2>/dev/null | grep -v -E "(mysql_backup_to_oss|MySQL备份)" > "$TEMP_CRON"
        crontab "$TEMP_CRON"
        rm "$TEMP_CRON"
        echo "备份任务已删除"
        exit 0
        ;;
    *)
        echo "无效选项"
        exit 1
        ;;
esac

# 验证cron表达式格式
if ! echo "$CRON_EXPRESSION" | grep -E '^[0-9*,-/]+ +[0-9*,-/]+ +[0-9*,-/]+ +[0-9*,-/]+ +[0-9*,-/]+$' > /dev/null; then
    echo "错误: cron表达式格式不正确: $CRON_EXPRESSION"
    exit 1
fi

# 构建完整的cron任务
CRON_JOB="$CRON_EXPRESSION cd $SCRIPT_DIR && /usr/bin/python3 $BACKUP_SCRIPT $CONFIG_FILE >> /var/log/mysql_backup_cron.log 2>&1"

echo ""
echo "将要添加的定时任务:"
echo "时间: $DESCRIPTION"
echo "表达式: $CRON_EXPRESSION"
echo "命令: cd $SCRIPT_DIR && /usr/bin/python3 $BACKUP_SCRIPT $CONFIG_FILE"
echo ""

read -p "确认添加此定时任务? (y/N): " confirm
if [[ ! $confirm =~ ^[Yy]$ ]]; then
    echo "操作已取消"
    exit 0
fi

# 备份当前的crontab
echo "备份当前crontab..."
crontab -l > /tmp/crontab_backup_$(date +%Y%m%d_%H%M%S) 2>/dev/null || true

# 添加新的cron任务
echo "添加定时任务..."
(crontab -l 2>/dev/null; echo "# MySQL备份到阿里云OSS - $DESCRIPTION"; echo "$CRON_JOB") | crontab -

# 验证任务是否添加成功
if crontab -l | grep -q "mysql_backup_to_oss"; then
    echo "✓ 定时任务添加成功!"
    echo ""
    echo "当前所有定时任务:"
    crontab -l
    echo ""
    echo "日志文件位置:"
    echo "- 备份日志: /var/log/mysql_backup.log"
    echo "- Cron日志: /var/log/mysql_backup_cron.log"
    echo "- 备份历史: /var/log/mysql_backup_history.json"
    echo ""
    echo "管理命令:"
    echo "- 查看备份日志: tail -f /var/log/mysql_backup.log"
    echo "- 查看cron日志: tail -f /var/log/mysql_backup_cron.log"
    echo "- 手动执行备份: python3 $BACKUP_SCRIPT $CONFIG_FILE"
    echo "- 删除定时任务: bash $SCRIPT_DIR/setup_cron.sh (选择选项8)"
else
    echo "✗ 定时任务添加失败"
    exit 1
fi