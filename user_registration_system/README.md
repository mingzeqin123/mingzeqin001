# 用户注册系统

一个完整的用户注册系统，支持自动生成随机密码并通过邮件发送给用户。

## 功能特性

- ✅ 用户注册（用户名 + 邮箱）
- ✅ 自动生成安全的随机密码
- ✅ 自动发送包含登录信息的欢迎邮件
- ✅ 用户重复检测
- ✅ 美观的HTML邮件模板
- ✅ Web界面注册表单
- ✅ SQLite数据库存储
- ✅ 完整的测试套件

## 系统架构

```
user_registration_system/
├── app.py              # 主应用程序
├── config.py           # 配置文件
├── test_system.py      # 测试脚本
├── requirements.txt    # 依赖列表
├── README.md          # 说明文档
└── data/              # 数据库文件目录
    └── users.db       # 用户数据库（自动创建）
```

## 快速开始

### 1. 安装依赖

```bash
cd user_registration_system
pip install flask
```

### 2. 配置邮件服务

编辑 `app.py` 文件中的 `EMAIL_CONFIG` 部分：

```python
EMAIL_CONFIG = {
    'smtp_server': 'smtp.gmail.com',          # SMTP服务器
    'smtp_port': 587,                         # SMTP端口
    'sender_email': 'your-email@gmail.com',   # 发送邮箱
    'sender_password': 'your-app-password',   # 邮箱密码/授权码
    'sender_name': '平台管理员'                # 发送者名称
}
```

### 3. 配置系统信息

编辑 `app.py` 文件中的 `SYSTEM_CONFIG` 部分：

```python
SYSTEM_CONFIG = {
    'login_url': 'https://yourplatform.com/login',  # 登录地址
    'platform_name': '您的平台名称',                 # 平台名称
    'admin_email': 'admin@yourplatform.com'        # 管理员邮箱
}
```

### 4. 启动服务

```bash
python app.py
```

服务启动后访问：http://localhost:5000

### 5. 运行测试

```bash
python test_system.py
```

## 邮件服务配置

### Gmail配置
1. 启用两步验证
2. 生成应用专用密码
3. 使用应用专用密码作为 `sender_password`

### QQ邮箱配置
```python
EMAIL_CONFIG = {
    'smtp_server': 'smtp.qq.com',
    'smtp_port': 587,
    'sender_email': 'your-email@qq.com',
    'sender_password': 'your-authorization-code',  # QQ邮箱授权码
    'sender_name': '平台管理员'
}
```

### 163邮箱配置
```python
EMAIL_CONFIG = {
    'smtp_server': 'smtp.163.com',
    'smtp_port': 25,
    'sender_email': 'your-email@163.com',
    'sender_password': 'your-authorization-code',  # 163邮箱授权码
    'sender_name': '平台管理员'
}
```

## API接口

### 用户注册
- **URL**: `/register`
- **方法**: POST
- **参数**: 
  ```json
  {
    "username": "用户名",
    "email": "邮箱地址"
  }
  ```
- **返回**:
  ```json
  {
    "success": true,
    "message": "注册成功！登录信息已发送到邮箱",
    "user_id": 1
  }
  ```

### 测试邮件
- **URL**: `/test-email`
- **方法**: POST
- **参数**:
  ```json
  {
    "email": "测试邮箱地址"
  }
  ```

## 密码生成规则

- 长度：12位（可配置）
- 包含：大写字母、小写字母、数字、特殊字符
- 确保每种字符类型至少包含一个
- 使用安全随机生成器

## 数据库结构

```sql
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    raw_password TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    email_sent BOOLEAN DEFAULT FALSE
);
```

## 安全特性

- 密码哈希存储（SHA256）
- 用户名和邮箱唯一性检查
- 输入验证和过滤
- 安全的随机密码生成
- 防止重复注册

## 邮件模板

系统使用美观的HTML邮件模板，包含：
- 欢迎信息
- 用户登录信息（用户名、密码、登录地址）
- 安全提醒
- 平台品牌信息
- 联系方式

## 自定义配置

可以通过修改以下配置来定制系统：

1. **邮件模板**: 修改 `EmailService.get_email_template()` 方法
2. **密码规则**: 修改 `PasswordGenerator.generate_password()` 方法
3. **数据库结构**: 修改 `DatabaseManager.init_database()` 方法
4. **验证规则**: 修改注册接口的验证逻辑

## 故障排除

### 邮件发送失败
1. 检查SMTP服务器配置
2. 确认邮箱密码/授权码正确
3. 检查防火墙设置
4. 查看应用日志获取详细错误信息

### 数据库错误
1. 确保有写入权限
2. 检查磁盘空间
3. 重新初始化数据库

### 端口占用
```bash
# 查看端口占用
lsof -i :5000

# 或使用其他端口
python app.py --port 8080
```

## 生产环境部署

1. 使用WSGI服务器（如Gunicorn）
2. 配置反向代理（如Nginx）
3. 使用环境变量管理敏感配置
4. 启用HTTPS
5. 配置日志轮转
6. 设置数据库备份

## 许可证

MIT License

## 贡献

欢迎提交Issue和Pull Request来改进此项目。