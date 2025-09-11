# Python邮件发送演示程序

这是一个功能完整的Python邮件发送演示程序，支持多种邮件服务商和各种邮件类型。

## 🚀 功能特点

- ✅ 支持多种邮件服务商 (Gmail, Outlook, QQ, 163, 新浪等)
- ✅ 支持纯文本和HTML格式邮件
- ✅ 支持附件发送
- ✅ 支持批量发送
- ✅ 支持中文内容
- ✅ 完整的错误处理
- ✅ 面向对象设计，易于扩展

## 📦 安装依赖

```bash
# 克隆或下载项目文件
# 安装依赖（可选，主要使用Python标准库）
pip install -r requirements.txt
```

## 🔧 配置说明

### 1. 邮箱配置

在 `email_demo.py` 文件中修改以下配置：

```python
EMAIL_PROVIDER = 'gmail'  # 邮件服务商
SENDER_EMAIL = 'your_email@gmail.com'  # 发送者邮箱
SENDER_PASSWORD = 'your_app_password'  # 发送者密码
RECIPIENT_EMAIL = 'recipient@example.com'  # 收件人邮箱
```

### 2. 支持的邮件服务商

| 服务商 | SMTP服务器 | 端口 | 说明 |
|--------|------------|------|------|
| Gmail | smtp.gmail.com | 587 | 需要应用专用密码 |
| Outlook | smtp-mail.outlook.com | 587 | 支持Microsoft账户 |
| QQ邮箱 | smtp.qq.com | 587 | 需要开启SMTP服务 |
| 163邮箱 | smtp.163.com | 587 | 需要开启SMTP服务 |
| 新浪邮箱 | smtp.sina.com | 587 | 需要开启SMTP服务 |

### 3. 获取应用专用密码

#### Gmail
1. 启用两步验证
2. 生成应用专用密码
3. 使用应用专用密码而不是账户密码

#### QQ邮箱
1. 登录QQ邮箱
2. 设置 → 账户 → 开启SMTP服务
3. 获取授权码

#### 163邮箱
1. 登录163邮箱
2. 设置 → POP3/SMTP/IMAP → 开启SMTP服务
3. 获取授权码

## 🎯 使用方法

### 基本使用

```bash
python email_demo.py
```

### 自定义使用

```python
from email_demo import EmailSender, get_smtp_config

# 获取SMTP配置
config = get_smtp_config('gmail')

# 创建邮件发送器
sender = EmailSender(
    smtp_server=config['smtp_server'],
    smtp_port=config['smtp_port'],
    sender_email='your_email@gmail.com',
    sender_password='your_app_password'
)

# 发送纯文本邮件
sender.send_text_email(
    recipient_email='recipient@example.com',
    subject='测试邮件',
    body='这是一封测试邮件'
)

# 发送HTML邮件
html_content = '<h1>Hello World!</h1><p>这是HTML邮件</p>'
sender.send_html_email(
    recipient_email='recipient@example.com',
    subject='HTML测试邮件',
    html_body=html_content
)

# 发送带附件的邮件
sender.send_email_with_attachment(
    recipient_email='recipient@example.com',
    subject='带附件邮件',
    body='请查看附件',
    attachment_path='/path/to/file.txt'
)

# 批量发送邮件
recipients = ['user1@example.com', 'user2@example.com']
sender.send_bulk_email(recipients, '批量邮件', '批量发送内容')
```

## 📋 演示内容

程序包含以下演示：

1. **纯文本邮件发送** - 发送简单的文本邮件
2. **HTML邮件发送** - 发送格式化的HTML邮件
3. **带附件邮件发送** - 发送包含附件的邮件
4. **批量邮件发送** - 向多个收件人发送邮件

## ⚠️ 注意事项

1. **安全性**：不要在代码中硬编码密码，建议使用环境变量
2. **频率限制**：注意邮件服务商的发送频率限制
3. **垃圾邮件**：避免发送垃圾邮件，遵守相关法律法规
4. **网络连接**：确保网络连接正常，能够访问SMTP服务器

## 🔒 安全建议

### 使用环境变量

```python
import os

SENDER_EMAIL = os.getenv('SENDER_EMAIL', 'your_email@gmail.com')
SENDER_PASSWORD = os.getenv('SENDER_PASSWORD', 'your_app_password')
```

### 配置文件方式

创建 `config.py` 文件：

```python
# config.py
EMAIL_CONFIG = {
    'gmail': {
        'smtp_server': 'smtp.gmail.com',
        'smtp_port': 587,
        'sender_email': 'your_email@gmail.com',
        'sender_password': 'your_app_password'
    }
}
```

## 🐛 常见问题

### 1. 认证失败
- 检查邮箱和密码是否正确
- 确认是否使用了应用专用密码
- 检查是否开启了SMTP服务

### 2. 连接超时
- 检查网络连接
- 确认SMTP服务器地址和端口
- 检查防火墙设置

### 3. 中文乱码
- 确保使用UTF-8编码
- 检查邮件头设置

## 📚 扩展功能

可以基于此程序扩展以下功能：

- 邮件模板系统
- 邮件队列管理
- 邮件发送状态跟踪
- 邮件统计分析
- 多线程批量发送
- 邮件内容加密

## 📄 许可证

MIT License

## 🤝 贡献

欢迎提交Issue和Pull Request来改进这个项目！

---

**注意**：请确保遵守相关法律法规和邮件服务商的使用条款。