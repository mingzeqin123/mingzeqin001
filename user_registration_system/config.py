"""
配置文件 - 请根据实际情况修改这些配置
"""

# 系统配置
SYSTEM_CONFIG = {
    'login_url': 'https://yourplatform.com/login',  # 修改为您的实际登录地址
    'platform_name': '您的平台名称',  # 修改为您的平台名称
    'admin_email': 'admin@yourplatform.com'  # 修改为管理员邮箱
}

# 邮件配置
EMAIL_CONFIG = {
    # Gmail 配置示例
    'smtp_server': 'smtp.gmail.com',
    'smtp_port': 587,
    'sender_email': 'your-email@gmail.com',  # 修改为您的发送邮箱
    'sender_password': 'your-app-password',   # 修改为您的邮箱应用专用密码
    'sender_name': '平台管理员'
}

# 其他邮件服务商配置示例：

# QQ邮箱配置
QQ_EMAIL_CONFIG = {
    'smtp_server': 'smtp.qq.com',
    'smtp_port': 587,
    'sender_email': 'your-email@qq.com',
    'sender_password': 'your-authorization-code',  # QQ邮箱授权码
    'sender_name': '平台管理员'
}

# 163邮箱配置
NETEASE_EMAIL_CONFIG = {
    'smtp_server': 'smtp.163.com',
    'smtp_port': 25,
    'sender_email': 'your-email@163.com',
    'sender_password': 'your-authorization-code',  # 163邮箱授权码
    'sender_name': '平台管理员'
}

# 企业邮箱配置示例
ENTERPRISE_EMAIL_CONFIG = {
    'smtp_server': 'smtp.exmail.qq.com',  # 腾讯企业邮箱
    'smtp_port': 587,
    'sender_email': 'your-email@yourcompany.com',
    'sender_password': 'your-password',
    'sender_name': '平台管理员'
}

# 密码生成配置
PASSWORD_CONFIG = {
    'length': 12,  # 密码长度
    'include_uppercase': True,  # 包含大写字母
    'include_lowercase': True,  # 包含小写字母
    'include_digits': True,     # 包含数字
    'include_special': True     # 包含特殊字符
}

# 数据库配置
DATABASE_CONFIG = {
    'db_path': 'data/users.db',  # 数据库文件路径
    'backup_enabled': True,      # 是否启用数据库备份
    'backup_interval': 24        # 备份间隔（小时）
}