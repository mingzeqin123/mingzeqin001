from flask import Flask, request, jsonify, render_template_string
import sqlite3
import hashlib
import secrets
import string
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os
from datetime import datetime
import logging

app = Flask(__name__)

# 配置日志
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# 系统配置
SYSTEM_CONFIG = {
    'login_url': 'https://yourplatform.com/login',
    'platform_name': '您的平台',
    'admin_email': 'admin@yourplatform.com'
}

# 邮件配置 (请根据实际情况修改)
EMAIL_CONFIG = {
    'smtp_server': 'smtp.gmail.com',
    'smtp_port': 587,
    'sender_email': 'your-email@gmail.com',
    'sender_password': 'your-app-password',  # 使用应用专用密码
    'sender_name': '平台管理员'
}

class PasswordGenerator:
    """随机密码生成器"""
    
    @staticmethod
    def generate_password(length=12):
        """生成指定长度的随机密码"""
        # 密码字符集：包含大写字母、小写字母、数字和特殊字符
        uppercase = string.ascii_uppercase
        lowercase = string.ascii_lowercase
        digits = string.digits
        special_chars = "!@#$%^&*"
        
        # 确保密码包含每种类型的字符
        password = [
            secrets.choice(uppercase),
            secrets.choice(lowercase),
            secrets.choice(digits),
            secrets.choice(special_chars)
        ]
        
        # 填充剩余长度
        all_chars = uppercase + lowercase + digits + special_chars
        for _ in range(length - 4):
            password.append(secrets.choice(all_chars))
        
        # 打乱密码字符顺序
        secrets.SystemRandom().shuffle(password)
        
        return ''.join(password)

class DatabaseManager:
    """数据库管理器"""
    
    def __init__(self, db_path='users.db'):
        self.db_path = db_path
        self.init_database()
    
    def init_database(self):
        """初始化数据库"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                email TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                raw_password TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                email_sent BOOLEAN DEFAULT FALSE
            )
        ''')
        
        conn.commit()
        conn.close()
    
    def user_exists(self, username, email):
        """检查用户是否已存在"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute(
            'SELECT COUNT(*) FROM users WHERE username = ? OR email = ?',
            (username, email)
        )
        
        exists = cursor.fetchone()[0] > 0
        conn.close()
        
        return exists
    
    def create_user(self, username, email, password):
        """创建新用户"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # 生成密码哈希
        password_hash = hashlib.sha256(password.encode()).hexdigest()
        
        try:
            cursor.execute('''
                INSERT INTO users (username, email, password_hash, raw_password)
                VALUES (?, ?, ?, ?)
            ''', (username, email, password_hash, password))
            
            user_id = cursor.lastrowid
            conn.commit()
            conn.close()
            
            return user_id
        except sqlite3.IntegrityError:
            conn.close()
            return None
    
    def update_email_sent_status(self, user_id):
        """更新邮件发送状态"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute(
            'UPDATE users SET email_sent = TRUE WHERE id = ?',
            (user_id,)
        )
        
        conn.commit()
        conn.close()

class EmailService:
    """邮件发送服务"""
    
    def __init__(self, config):
        self.config = config
    
    def send_welcome_email(self, user_email, username, password, login_url):
        """发送欢迎邮件"""
        try:
            # 创建邮件对象
            msg = MIMEMultipart('alternative')
            msg['Subject'] = f'欢迎加入{SYSTEM_CONFIG["platform_name"]}！'
            msg['From'] = f'{self.config["sender_name"]} <{self.config["sender_email"]}>'
            msg['To'] = user_email
            
            # 邮件内容
            html_content = self.get_email_template(username, password, login_url)
            
            # 添加HTML内容
            html_part = MIMEText(html_content, 'html', 'utf-8')
            msg.attach(html_part)
            
            # 发送邮件
            with smtplib.SMTP(self.config['smtp_server'], self.config['smtp_port']) as server:
                server.starttls()
                server.login(self.config['sender_email'], self.config['sender_password'])
                server.send_message(msg)
            
            logger.info(f'欢迎邮件已发送至: {user_email}')
            return True
            
        except Exception as e:
            logger.error(f'发送邮件失败: {str(e)}')
            return False
    
    def get_email_template(self, username, password, login_url):
        """获取邮件模板"""
        return f'''
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>欢迎加入{SYSTEM_CONFIG["platform_name"]}</title>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background-color: #4CAF50; color: white; padding: 20px; text-align: center; }}
                .content {{ background-color: #f9f9f9; padding: 30px; }}
                .credentials {{ background-color: #e8f5e8; padding: 20px; margin: 20px 0; border-radius: 5px; }}
                .button {{ display: inline-block; padding: 12px 24px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }}
                .footer {{ text-align: center; padding: 20px; color: #666; font-size: 12px; }}
                .important {{ color: #d32f2f; font-weight: bold; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>欢迎加入{SYSTEM_CONFIG["platform_name"]}！</h1>
                </div>
                
                <div class="content">
                    <h2>亲爱的 {username}，</h2>
                    
                    <p>恭喜您成功注册{SYSTEM_CONFIG["platform_name"]}！我们很高兴您加入我们的平台。</p>
                    
                    <div class="credentials">
                        <h3>您的登录信息：</h3>
                        <p><strong>用户名：</strong> {username}</p>
                        <p><strong>临时密码：</strong> <code>{password}</code></p>
                        <p><strong>登录地址：</strong> <a href="{login_url}">{login_url}</a></p>
                    </div>
                    
                    <p class="important">重要提醒：</p>
                    <ul>
                        <li>请妥善保管您的登录信息</li>
                        <li>建议您首次登录后立即修改密码</li>
                        <li>请勿将账号信息泄露给他人</li>
                    </ul>
                    
                    <center>
                        <a href="{login_url}" class="button">立即登录</a>
                    </center>
                    
                    <p>如果您有任何疑问，请随时联系我们的客服团队。</p>
                    
                    <p>祝您使用愉快！</p>
                    <p><strong>{SYSTEM_CONFIG["platform_name"]} 团队</strong></p>
                </div>
                
                <div class="footer">
                    <p>此邮件由系统自动发送，请勿回复。</p>
                    <p>如需帮助，请联系：{SYSTEM_CONFIG["admin_email"]}</p>
                    <p>&copy; 2024 {SYSTEM_CONFIG["platform_name"]}. 保留所有权利。</p>
                </div>
            </div>
        </body>
        </html>
        '''

# 初始化服务
db_manager = DatabaseManager()
email_service = EmailService(EMAIL_CONFIG)

@app.route('/')
def index():
    """主页"""
    return render_template_string('''
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>用户注册系统</title>
        <style>
            body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
            .form-group { margin-bottom: 15px; }
            label { display: block; margin-bottom: 5px; font-weight: bold; }
            input[type="text"], input[type="email"] { width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; }
            button { background-color: #4CAF50; color: white; padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer; }
            button:hover { background-color: #45a049; }
            .message { padding: 10px; margin: 10px 0; border-radius: 4px; }
            .success { background-color: #d4edda; color: #155724; border: 1px solid #c3e6cb; }
            .error { background-color: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; }
        </style>
    </head>
    <body>
        <h1>用户注册系统</h1>
        <p>填写以下信息完成注册，系统将自动生成密码并发送到您的邮箱。</p>
        
        <form id="registrationForm">
            <div class="form-group">
                <label for="username">用户名:</label>
                <input type="text" id="username" name="username" required>
            </div>
            
            <div class="form-group">
                <label for="email">邮箱地址:</label>
                <input type="email" id="email" name="email" required>
            </div>
            
            <button type="submit">注册</button>
        </form>
        
        <div id="message"></div>
        
        <script>
            document.getElementById('registrationForm').addEventListener('submit', async function(e) {
                e.preventDefault();
                
                const formData = new FormData(this);
                const data = Object.fromEntries(formData);
                
                try {
                    const response = await fetch('/register', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(data)
                    });
                    
                    const result = await response.json();
                    
                    const messageDiv = document.getElementById('message');
                    if (result.success) {
                        messageDiv.innerHTML = '<div class="message success">' + result.message + '</div>';
                        this.reset();
                    } else {
                        messageDiv.innerHTML = '<div class="message error">' + result.message + '</div>';
                    }
                } catch (error) {
                    document.getElementById('message').innerHTML = '<div class="message error">注册失败，请稍后重试。</div>';
                }
            });
        </script>
    </body>
    </html>
    ''')

@app.route('/register', methods=['POST'])
def register():
    """用户注册接口"""
    try:
        data = request.get_json()
        username = data.get('username', '').strip()
        email = data.get('email', '').strip()
        
        # 验证输入
        if not username or not email:
            return jsonify({
                'success': False,
                'message': '用户名和邮箱地址不能为空'
            })
        
        # 检查用户是否已存在
        if db_manager.user_exists(username, email):
            return jsonify({
                'success': False,
                'message': '用户名或邮箱已存在'
            })
        
        # 生成随机密码
        password = PasswordGenerator.generate_password()
        
        # 创建用户
        user_id = db_manager.create_user(username, email, password)
        
        if user_id is None:
            return jsonify({
                'success': False,
                'message': '注册失败，请稍后重试'
            })
        
        # 发送欢迎邮件
        email_sent = email_service.send_welcome_email(
            email, username, password, SYSTEM_CONFIG['login_url']
        )
        
        if email_sent:
            db_manager.update_email_sent_status(user_id)
            message = f'注册成功！登录信息已发送到 {email}，请查收邮件。'
        else:
            message = f'注册成功！但邮件发送失败，您的临时密码是：{password}'
        
        logger.info(f'用户注册成功: {username} ({email})')
        
        return jsonify({
            'success': True,
            'message': message,
            'user_id': user_id
        })
        
    except Exception as e:
        logger.error(f'注册过程中发生错误: {str(e)}')
        return jsonify({
            'success': False,
            'message': '系统错误，请稍后重试'
        })

@app.route('/test-email', methods=['POST'])
def test_email():
    """测试邮件发送"""
    try:
        data = request.get_json()
        test_email = data.get('email')
        
        if not test_email:
            return jsonify({
                'success': False,
                'message': '请提供测试邮箱地址'
            })
        
        # 发送测试邮件
        success = email_service.send_welcome_email(
            test_email, 
            'test_user', 
            'TestPassword123!', 
            SYSTEM_CONFIG['login_url']
        )
        
        return jsonify({
            'success': success,
            'message': '测试邮件发送成功' if success else '测试邮件发送失败'
        })
        
    except Exception as e:
        logger.error(f'测试邮件发送失败: {str(e)}')
        return jsonify({
            'success': False,
            'message': f'测试失败: {str(e)}'
        })

if __name__ == '__main__':
    # 创建数据库目录
    os.makedirs('/workspace/user_registration_system/data', exist_ok=True)
    
    print("用户注册系统启动中...")
    print("请确保已正确配置邮件服务参数")
    print("访问 http://localhost:5000 开始使用")
    
    app.run(debug=True, host='0.0.0.0', port=5000)