# DevOps 自动化脚本套件

本套件为微信小程序跳一跳游戏项目提供完整的 DevOps 自动化解决方案，包括代码备份、打包、部署、监控和定时任务管理。

## 📁 脚本结构

```
devops/
├── backup.sh          # 代码备份脚本
├── package.sh         # 代码打包脚本
├── update.sh          # 更新部署脚本
├── setup_cron.sh      # 定时任务设置脚本
├── monitor.sh         # 监控和通知脚本
├── health_check.sh    # 健康检查脚本（自动生成）
├── monthly_report.sh  # 月度报告脚本（自动生成）
├── manage.sh          # 管理脚本（自动生成）
├── notification.conf  # 通知配置文件（自动生成）
└── README.md          # 本文档
```

## 🚀 快速开始

### 1. 设置执行权限

```bash
chmod +x /workspace/devops/*.sh
```

### 2. 初始化监控环境

```bash
/workspace/devops/monitor.sh init
```

### 3. 设置定时任务

```bash
/workspace/devops/setup_cron.sh
```

### 4. 测试脚本功能

```bash
# 测试备份
/workspace/devops/manage.sh backup

# 测试打包
/workspace/devops/manage.sh package 1.0.1

# 测试更新
/workspace/devops/manage.sh update auto

# 查看状态
/workspace/devops/manage.sh status
```

## 📋 脚本功能详解

### backup.sh - 代码备份脚本

**功能：**
- 自动备份项目代码到指定目录
- 支持增量备份和压缩
- 自动清理旧备份文件（保留7天）
- 生成备份报告

**使用方法：**
```bash
./backup.sh
```

**配置说明：**
- 备份目录：`/backup`
- 保留时间：7天
- 压缩格式：tar.gz

### package.sh - 代码打包脚本

**功能：**
- 自动打包项目代码，生成发布版本
- 支持版本管理
- 依赖检查和处理
- 自动清理旧版本（保留10个版本）

**使用方法：**
```bash
./package.sh [版本号]
# 例如：./package.sh 1.0.1
```

**配置说明：**
- 打包目录：`/packages`
- 保留版本：10个
- 支持格式：tar.gz

### update.sh - 更新部署脚本

**功能：**
- 自动部署新版本
- 支持自动回滚
- 健康检查
- 服务管理

**使用方法：**
```bash
./update.sh [部署类型] [版本号]
# 例如：
./update.sh auto latest      # 自动部署最新版本
./update.sh manual 1.0.1     # 手动部署指定版本
./update.sh rollback         # 回滚到上一个版本
```

**部署类型：**
- `auto`: 自动部署（默认）
- `manual`: 手动部署
- `rollback`: 回滚部署

### setup_cron.sh - 定时任务设置脚本

**功能：**
- 配置 crontab 定时任务
- 创建辅助脚本
- 验证安装结果

**定时任务配置：**
- 每天凌晨2点：代码备份
- 每周一凌晨3点：代码打包
- 每天凌晨4点：自动更新
- 每小时：健康检查
- 每周日：清理旧文件
- 每月1号：生成月度报告

### monitor.sh - 监控和通知脚本

**功能：**
- 实时监控系统状态
- 发送告警通知
- 记录监控数据
- 生成监控报告

**使用方法：**
```bash
./monitor.sh init          # 初始化监控环境
./monitor.sh run           # 执行一次监控检查
./monitor.sh continuous    # 启动连续监控
./monitor.sh status        # 显示监控状态
./monitor.sh report        # 生成监控报告
```

**监控指标：**
- CPU使用率（阈值：80%）
- 内存使用率（阈值：85%）
- 磁盘使用率（阈值：90%）
- 进程数量（阈值：100）
- 项目文件完整性
- 服务状态

## 🔧 配置说明

### 通知配置

编辑 `/workspace/devops/notification.conf` 文件：

```bash
# 启用/禁用通知功能
ENABLE_EMAIL=false
ENABLE_WEBHOOK=false
ENABLE_SLACK=false

# 邮件配置
EMAIL_SMTP_SERVER="smtp.example.com"
EMAIL_SMTP_PORT=587
EMAIL_USERNAME="monitor@example.com"
EMAIL_PASSWORD="your_password"
EMAIL_TO="admin@example.com"

# Webhook配置
WEBHOOK_URL="https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK"

# Slack配置
SLACK_TOKEN="xoxb-your-slack-token"
SLACK_CHANNEL="#alerts"
```

### 监控阈值配置

在 `monitor.sh` 中修改以下变量：

```bash
CPU_THRESHOLD=80
MEMORY_THRESHOLD=85
DISK_THRESHOLD=90
PROCESS_THRESHOLD=100
```

## 📊 日志管理

### 日志文件位置

- **备份日志：** `/backup/backup_YYYYMMDD_HHMMSS.log`
- **打包日志：** `/packages/package_YYYYMMDD_HHMMSS.log`
- **部署日志：** `/deploy/update_YYYYMMDD_HHMMSS.log`
- **监控日志：** `/var/log/monitoring/alerts.log`
- **定时任务日志：** `/var/log/cron_jobs/`

### 日志查看命令

```bash
# 查看最近日志
/workspace/devops/manage.sh logs

# 查看特定日志
tail -f /var/log/cron_jobs/backup_$(date +%Y%m%d).log

# 查看告警日志
tail -f /var/log/monitoring/alerts.log
```

## 🛠️ 管理命令

使用 `manage.sh` 脚本进行日常管理：

```bash
# 查看定时任务状态
./manage.sh status

# 立即执行备份
./manage.sh backup

# 立即执行打包（指定版本）
./manage.sh package 1.0.1

# 立即执行更新
./manage.sh update auto

# 执行健康检查
./manage.sh health

# 查看日志
./manage.sh logs

# 生成月度报告
./manage.sh report

# 卸载定时任务
./manage.sh uninstall
```

## 🔍 故障排除

### 常见问题

1. **脚本权限问题**
   ```bash
   chmod +x /workspace/devops/*.sh
   ```

2. **目录不存在**
   ```bash
   mkdir -p /backup /packages /deploy /var/log/cron_jobs
   ```

3. **定时任务未执行**
   ```bash
   # 检查crontab状态
   crontab -l
   
   # 检查cron服务
   systemctl status cron
   ```

4. **通知未发送**
   - 检查通知配置文件
   - 验证网络连接
   - 查看通知日志

### 日志分析

```bash
# 查看错误日志
grep -i error /var/log/cron_jobs/*.log

# 查看警告日志
grep -i warning /var/log/cron_jobs/*.log

# 查看特定时间段的日志
grep "2024-01-15" /var/log/cron_jobs/*.log
```

## 📈 性能优化

### 备份优化
- 使用 rsync 进行增量备份
- 压缩备份文件减少存储空间
- 定期清理旧备份

### 监控优化
- 调整监控间隔
- 优化告警阈值
- 使用通知冷却机制

### 部署优化
- 并行处理多个任务
- 使用健康检查确保部署成功
- 自动回滚机制

## 🔒 安全注意事项

1. **权限管理**
   - 确保脚本文件权限正确
   - 限制敏感配置文件访问权限

2. **数据保护**
   - 定期备份重要数据
   - 加密敏感配置信息

3. **网络安全**
   - 使用HTTPS进行通知
   - 限制监控端口访问

## 📞 技术支持

如遇到问题，请：

1. 查看相关日志文件
2. 检查配置文件设置
3. 验证系统环境
4. 联系技术支持团队

---

**版本：** 1.0.0  
**更新时间：** 2024年1月  
**维护团队：** DevOps Team