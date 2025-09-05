# Mac邮件关键字抓取机器人

这是一个在Mac上运行的Python机器人，用于定期检查邮件并提取包含指定关键字的邮件。

## 功能特点

- 🔍 **多账户支持**: 支持多个邮件账户同时监控
- 📧 **多文件夹支持**: 可以监控多个邮件文件夹
- 🎯 **关键字搜索**: 在邮件主题和正文中搜索指定关键字
- ⏰ **定期执行**: 可配置的定期检查间隔
- 📊 **详细日志**: 完整的操作日志记录
- 📧 **邮件通知**: 发现匹配邮件时发送通知
- 💾 **结果保存**: 将匹配结果保存为JSON文件

## 安装和使用

### 1. 安装依赖

```bash
# 运行安装脚本
./setup_mac.sh

# 或手动安装
pip3 install -r requirements.txt
```

### 2. 配置邮件账户

编辑 `config.json` 文件，配置您的邮件账户信息：

```json
{
    "email_accounts": [
        {
            "name": "Gmail",
            "imap_server": "imap.gmail.com",
            "imap_port": 993,
            "smtp_server": "smtp.gmail.com",
            "smtp_port": 587,
            "email": "your_email@gmail.com",
            "password": "your_app_password",
            "folders": ["INBOX", "Important"]
        }
    ],
    "keywords": [
        "重要",
        "urgent",
        "会议",
        "meeting",
        "项目",
        "project"
    ],
    "notification": {
        "enabled": true,
        "email_notification": true,
        "notification_email": "notification@example.com",
        "check_interval_minutes": 30
    },
    "search_settings": {
        "days_back": 7,
        "max_emails_per_check": 50
    }
}
```

### 3. 运行机器人

```bash
# 开始定期监控（推荐）
python3 email_keyword_bot.py

# 只执行一次检查
python3 email_keyword_bot.py --once

# 使用自定义关键字
python3 email_keyword_bot.py --keywords "重要" "urgent" "会议"
```

## 配置说明

### 邮件账户配置

- **Gmail**: 需要使用应用专用密码，不是普通密码
- **Outlook/Hotmail**: 使用 `outlook.office365.com` 作为IMAP服务器
- **其他邮件服务**: 请查询相应的IMAP/SMTP服务器设置

### 关键字配置

- 支持中英文关键字
- 不区分大小写
- 在邮件主题和正文中搜索

### 通知设置

- 可以启用/禁用邮件通知
- 可以设置检查间隔（分钟）
- 结果会保存为JSON文件

## 安全注意事项

1. **密码安全**: 建议使用应用专用密码而不是主密码
2. **配置文件**: 不要将包含密码的配置文件提交到版本控制系统
3. **权限**: 确保只有您有权限访问配置文件

## 故障排除

### 常见问题

1. **连接失败**: 检查邮件服务器设置和密码
2. **认证失败**: 确保使用正确的应用专用密码
3. **权限错误**: 确保Python有读取配置文件的权限

### 日志文件

- 主日志: `email_bot.log`
- 结果文件: `email_results_YYYYMMDD_HHMMSS.json`

## 高级用法

### 自定义搜索条件

可以修改代码中的搜索条件，例如：
- 按发件人搜索
- 按日期范围搜索
- 按邮件大小搜索

### 集成其他服务

可以扩展代码以集成：
- Slack通知
- 微信通知
- 数据库存储
- 云存储服务

## 许可证

MIT License