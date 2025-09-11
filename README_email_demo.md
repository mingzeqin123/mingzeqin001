# Python 邮件发送演示程序

## 📧 功能概述

这是一个完整的Python邮件发送演示程序，展示了如何使用Python的内置库发送各种类型的邮件。

### 主要功能

- ✅ **纯文本邮件** - 发送简单的文本邮件
- ✅ **HTML格式邮件** - 发送富文本格式邮件，支持样式、链接、图片等
- ✅ **带附件邮件** - 支持发送各种类型的文件附件
- ✅ **群发邮件** - 同时发送给多个收件人
- ✅ **混合格式邮件** - 同时包含文本和HTML版本
- ✅ **多邮箱服务商支持** - Gmail、163、QQ邮箱、Outlook等

## 📁 文件结构

```
/workspace/
├── email_demo.py              # 完整的邮件发送类和演示
├── simple_email_example.py    # 简单使用示例
├── email_config.json         # 邮件配置文件（运行后生成）
├── requirements.txt           # 依赖说明
└── README_email_demo.md       # 本说明文件
```

## 🚀 快速开始

### 1. 基本使用

```python
from email_demo import EmailSender

# 创建邮件发送器
email_sender = EmailSender(
    email="your_email@gmail.com",
    password="your_app_password", 
    provider='gmail'
)

# 发送简单邮件
success = email_sender.send_text_email(
    to_emails=["recipient@example.com"],
    subject="测试邮件",
    content="这是一封测试邮件"
)
```

### 2. 支持的邮箱服务商

| 服务商 | Provider参数 | SMTP服务器 | 端口 | 说明 |
|--------|-------------|------------|------|------|
| Gmail | `gmail` | smtp.gmail.com | 587 | 需要应用密码 |
| 163邮箱 | `163` | smtp.163.com | 25 | 需要开启SMTP |
| QQ邮箱 | `qq` | smtp.qq.com | 587 | 需要授权码 |
| Outlook | `outlook` | smtp-mail.outlook.com | 587 | 支持Hotmail |

## 📝 详细使用示例

### 发送纯文本邮件

```python
email_sender = EmailSender("your_email@gmail.com", "password", "gmail")

success = email_sender.send_text_email(
    to_emails=["user@example.com"],
    subject="纯文本邮件",
    content="这是邮件内容"
)
```

### 发送HTML邮件

```python
html_content = """
<html>
<body>
    <h2 style="color: blue;">HTML邮件标题</h2>
    <p>这是<strong>HTML格式</strong>的邮件内容。</p>
    <ul>
        <li>支持列表</li>
        <li><a href="https://python.org">支持链接</a></li>
    </ul>
</body>
</html>
"""

success = email_sender.send_html_email(
    to_emails=["user@example.com"],
    subject="HTML邮件",
    html_content=html_content
)
```

### 发送带附件邮件

```python
success = email_sender.send_email_with_attachment(
    to_emails=["user@example.com"],
    subject="带附件邮件",
    content="请查收附件",
    attachments=["file1.pdf", "file2.jpg"]
)
```

### 群发邮件

```python
success = email_sender.send_text_email(
    to_emails=["user1@example.com", "user2@example.com", "user3@example.com"],
    subject="群发邮件",
    content="这是群发邮件内容"
)
```

## ⚙️ 邮箱配置说明

### Gmail配置

1. 启用两步验证
2. 生成应用密码
3. 使用应用密码而不是账户密码

```python
email_sender = EmailSender(
    email="your_email@gmail.com",
    password="your_16_digit_app_password",  # 16位应用密码
    provider="gmail"
)
```

### 163邮箱配置

1. 登录163邮箱
2. 设置 → POP3/SMTP/IMAP
3. 开启SMTP服务
4. 设置客户端授权密码

```python
email_sender = EmailSender(
    email="your_email@163.com", 
    password="your_client_password",  # 客户端授权密码
    provider="163"
)
```

### QQ邮箱配置

1. 登录QQ邮箱
2. 设置 → 账户
3. 开启SMTP服务
4. 获取授权码

```python
email_sender = EmailSender(
    email="your_email@qq.com",
    password="your_authorization_code",  # 授权码
    provider="qq"
)
```

## 🔧 自定义SMTP服务器

```python
email_sender = EmailSender(
    email="your_email@company.com",
    password="your_password",
    provider="custom",
    smtp_server="mail.company.com",
    smtp_port=587,
    use_tls=True
)
```

## 🛡️ 安全注意事项

1. **不要在代码中硬编码密码**
   - 使用环境变量
   - 使用配置文件（不提交到版本控制）

2. **使用应用密码**
   - Gmail、Outlook等需要应用密码
   - 不要使用账户登录密码

3. **启用TLS加密**
   - 所有现代邮箱服务都支持TLS
   - 确保数据传输安全

## 🐛 常见问题

### 1. 认证失败

**问题**: `smtplib.SMTPAuthenticationError`

**解决方案**:
- 检查邮箱地址和密码
- 确认使用应用密码而不是账户密码
- 检查SMTP服务是否已开启

### 2. 连接超时

**问题**: `socket.timeout` 或连接失败

**解决方案**:
- 检查网络连接
- 确认SMTP服务器地址和端口
- 检查防火墙设置

### 3. 附件过大

**问题**: 邮件发送失败或被拒绝

**解决方案**:
- 检查附件大小限制（通常25MB）
- 压缩大文件
- 分批发送多个附件

### 4. 中文乱码

**问题**: 邮件内容显示乱码

**解决方案**:
- 确保使用UTF-8编码
- 正确设置邮件头的字符集

## 📚 扩展功能

### 环境变量配置

创建 `.env` 文件：

```bash
EMAIL_ADDRESS=your_email@gmail.com
EMAIL_PASSWORD=your_app_password
EMAIL_PROVIDER=gmail
```

Python代码：

```python
import os
from dotenv import load_dotenv

load_dotenv()

email_sender = EmailSender(
    email=os.getenv('EMAIL_ADDRESS'),
    password=os.getenv('EMAIL_PASSWORD'),
    provider=os.getenv('EMAIL_PROVIDER')
)
```

### 邮件模板

```python
def create_welcome_email(username):
    return f"""
    <html>
    <body>
        <h2>欢迎 {username}！</h2>
        <p>感谢您注册我们的服务。</p>
        <p>如有问题，请随时联系我们。</p>
    </body>
    </html>
    """

html_content = create_welcome_email("张三")
```

## 🔄 版本历史

- **v1.0.0** - 初始版本，支持基本邮件发送功能
- 支持纯文本、HTML、附件、群发邮件
- 支持主流邮箱服务商
- 包含完整的错误处理和示例

## 📄 许可证

本项目采用 MIT 许可证。

## 🤝 贡献

欢迎提交Issue和Pull Request来改进这个项目！

---

**注意**: 使用前请确保已正确配置邮箱设置，并替换示例中的邮箱地址和密码。