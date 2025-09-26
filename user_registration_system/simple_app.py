#!/usr/bin/env python3
"""
简化版用户注册系统 - 不依赖外部库的版本
使用Python内置模块实现用户注册和邮件发送功能
"""

import http.server
import socketserver
import json
import sqlite3
import hashlib
import secrets
import string
import smtplib
import urllib.parse
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os
from datetime import datetime
import logging

# 配置日志
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
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
    
    def __init__(self, db_path='data/users.db'):
        self.db_path = db_path
        # 确保数据目录存在
        os.makedirs(os.path.dirname(db_path), exist_ok=True)
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
        logger.info(f"数据库初始化完成: {self.db_path}")
    
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
            
            logger.info(f"用户创建成功: {username} (ID: {user_id})")
            return user_id
        except sqlite3.IntegrityError:
            conn.close()
            logger.warning(f"用户创建失败，用户名或邮箱已存在: {username}, {email}")
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

class RegistrationHandler(http.server.SimpleHTTPRequestHandler):
    """HTTP请求处理器"""
    
    def __init__(self, *args, **kwargs):
        # 初始化数据库和邮件服务
        self.db_manager = DatabaseManager()
        self.email_service = EmailService(EMAIL_CONFIG)
        super().__init__(*args, **kwargs)
    
    def do_GET(self):
        """处理GET请求"""
        if self.path == '/' or self.path == '/index.html':
            self.send_response(200)
            self.send_header('Content-type', 'text/html; charset=utf-8')
            self.end_headers()
            
            html_content = self.get_index_page()
            self.wfile.write(html_content.encode('utf-8'))
        else:
            self.send_error(404, "页面未找到")
    
    def do_POST(self):
        """处理POST请求"""
        content_length = int(self.headers['Content-Length'])
        post_data = self.rfile.read(content_length)
        
        if self.path == '/register':
            self.handle_registration(post_data)
        elif self.path == '/test-email':
            self.handle_test_email(post_data)
        else:
            self.send_error(404, "接口未找到")
    
    def handle_registration(self, post_data):
        """处理用户注册"""
        try:
            # 解析JSON数据
            data = json.loads(post_data.decode('utf-8'))
            username = data.get('username', '').strip()
            email = data.get('email', '').strip()
            
            # 验证输入
            if not username or not email:
                self.send_json_response({
                    'success': False,
                    'message': '用户名和邮箱地址不能为空'
                })
                return
            
            # 简单的邮箱格式验证
            if '@' not in email or '.' not in email:
                self.send_json_response({
                    'success': False,
                    'message': '邮箱地址格式不正确'
                })
                return
            
            # 检查用户是否已存在
            if self.db_manager.user_exists(username, email):
                self.send_json_response({
                    'success': False,
                    'message': '用户名或邮箱已存在'
                })
                return
            
            # 生成随机密码
            password = PasswordGenerator.generate_password()
            
            # 创建用户
            user_id = self.db_manager.create_user(username, email, password)
            
            if user_id is None:
                self.send_json_response({
                    'success': False,
                    'message': '注册失败，请稍后重试'
                })
                return
            
            # 发送欢迎邮件
            email_sent = self.email_service.send_welcome_email(
                email, username, password, SYSTEM_CONFIG['login_url']
            )
            
            if email_sent:
                self.db_manager.update_email_sent_status(user_id)
                message = f'注册成功！登录信息已发送到 {email}，请查收邮件。'
            else:
                message = f'注册成功！但邮件发送失败，您的临时密码是：{password}'
            
            logger.info(f'用户注册成功: {username} ({email})')
            
            self.send_json_response({
                'success': True,
                'message': message,
                'user_id': user_id
            })
            
        except json.JSONDecodeError:
            self.send_json_response({
                'success': False,
                'message': '请求数据格式错误'
            })
        except Exception as e:
            logger.error(f'注册过程中发生错误: {str(e)}')
            self.send_json_response({
                'success': False,
                'message': '系统错误，请稍后重试'
            })
    
    def handle_test_email(self, post_data):
        """处理测试邮件"""
        try:
            data = json.loads(post_data.decode('utf-8'))
            test_email = data.get('email')
            
            if not test_email:
                self.send_json_response({
                    'success': False,
                    'message': '请提供测试邮箱地址'
                })
                return
            
            # 发送测试邮件
            success = self.email_service.send_welcome_email(
                test_email, 
                'test_user', 
                'TestPassword123!', 
                SYSTEM_CONFIG['login_url']
            )
            
            self.send_json_response({
                'success': success,
                'message': '测试邮件发送成功' if success else '测试邮件发送失败'
            })
            
        except Exception as e:
            logger.error(f'测试邮件发送失败: {str(e)}')
            self.send_json_response({
                'success': False,
                'message': f'测试失败: {str(e)}'
            })
    
    def send_json_response(self, data):
        """发送JSON响应"""
        self.send_response(200)
        self.send_header('Content-type', 'application/json; charset=utf-8')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, GET, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
        
        json_data = json.dumps(data, ensure_ascii=False)
        self.wfile.write(json_data.encode('utf-8'))
    
    def get_index_page(self):
        """获取主页HTML"""
        return '''
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>用户注册系统</title>
            <style>
                body { 
                    font-family: Arial, sans-serif; 
                    max-width: 800px; 
                    margin: 0 auto; 
                    padding: 20px; 
                    background-color: #f5f5f5; 
                }
                .container {
                    background-color: white;
                    padding: 30px;
                    border-radius: 10px;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                }
                h1 { color: #4CAF50; text-align: center; }
                .form-group { margin-bottom: 20px; }
                label { 
                    display: block; 
                    margin-bottom: 8px; 
                    font-weight: bold; 
                    color: #333;
                }
                input[type="text"], input[type="email"] { 
                    width: 100%; 
                    padding: 12px; 
                    border: 2px solid #ddd; 
                    border-radius: 6px; 
                    font-size: 16px;
                    box-sizing: border-box;
                }
                input[type="text"]:focus, input[type="email"]:focus {
                    border-color: #4CAF50;
                    outline: none;
                }
                button { 
                    background-color: #4CAF50; 
                    color: white; 
                    padding: 12px 30px; 
                    border: none; 
                    border-radius: 6px; 
                    cursor: pointer; 
                    font-size: 16px;
                    width: 100%;
                }
                button:hover { background-color: #45a049; }
                button:disabled { background-color: #cccccc; cursor: not-allowed; }
                .message { 
                    padding: 15px; 
                    margin: 20px 0; 
                    border-radius: 6px; 
                    font-weight: bold;
                }
                .success { 
                    background-color: #d4edda; 
                    color: #155724; 
                    border: 2px solid #c3e6cb; 
                }
                .error { 
                    background-color: #f8d7da; 
                    color: #721c24; 
                    border: 2px solid #f5c6cb; 
                }
                .loading {
                    text-align: center;
                    color: #666;
                }
                .info {
                    background-color: #e7f3ff;
                    padding: 20px;
                    border-radius: 6px;
                    margin-bottom: 20px;
                    border-left: 4px solid #2196F3;
                }
                .test-section {
                    margin-top: 30px;
                    padding-top: 20px;
                    border-top: 2px solid #eee;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>🚀 用户注册系统</h1>
                
                <div class="info">
                    <strong>功能说明：</strong>
                    <ul>
                        <li>✅ 自动生成安全的随机密码</li>
                        <li>✅ 发送包含登录信息的欢迎邮件</li>
                        <li>✅ 防止重复注册</li>
                        <li>✅ 数据安全存储</li>
                    </ul>
                </div>
                
                <p><strong>请填写以下信息完成注册，系统将自动生成密码并发送到您的邮箱。</strong></p>
                
                <form id="registrationForm">
                    <div class="form-group">
                        <label for="username">👤 用户名:</label>
                        <input type="text" id="username" name="username" required 
                               placeholder="请输入用户名（3-20个字符）">
                    </div>
                    
                    <div class="form-group">
                        <label for="email">📧 邮箱地址:</label>
                        <input type="email" id="email" name="email" required 
                               placeholder="请输入有效的邮箱地址">
                    </div>
                    
                    <button type="submit" id="submitBtn">立即注册</button>
                </form>
                
                <div id="message"></div>
                
                <div class="test-section">
                    <h3>📨 测试邮件发送</h3>
                    <div class="form-group">
                        <label for="testEmail">测试邮箱:</label>
                        <input type="email" id="testEmail" placeholder="输入邮箱地址测试邮件发送">
                    </div>
                    <button onclick="testEmail()" id="testBtn">发送测试邮件</button>
                </div>
            </div>
            
            <script>
                document.getElementById('registrationForm').addEventListener('submit', async function(e) {
                    e.preventDefault();
                    
                    const submitBtn = document.getElementById('submitBtn');
                    const messageDiv = document.getElementById('message');
                    
                    // 禁用按钮，显示加载状态
                    submitBtn.disabled = true;
                    submitBtn.textContent = '注册中...';
                    messageDiv.innerHTML = '<div class="message loading">⏳ 正在处理注册请求...</div>';
                    
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
                        
                        if (result.success) {
                            messageDiv.innerHTML = '<div class="message success">✅ ' + result.message + '</div>';
                            this.reset();
                        } else {
                            messageDiv.innerHTML = '<div class="message error">❌ ' + result.message + '</div>';
                        }
                    } catch (error) {
                        messageDiv.innerHTML = '<div class="message error">❌ 网络错误，请检查服务器状态。</div>';
                    }
                    
                    // 恢复按钮状态
                    submitBtn.disabled = false;
                    submitBtn.textContent = '立即注册';
                });
                
                async function testEmail() {
                    const testBtn = document.getElementById('testBtn');
                    const messageDiv = document.getElementById('message');
                    const testEmail = document.getElementById('testEmail').value;
                    
                    if (!testEmail) {
                        messageDiv.innerHTML = '<div class="message error">❌ 请输入测试邮箱地址</div>';
                        return;
                    }
                    
                    testBtn.disabled = true;
                    testBtn.textContent = '发送中...';
                    messageDiv.innerHTML = '<div class="message loading">⏳ 正在发送测试邮件...</div>';
                    
                    try {
                        const response = await fetch('/test-email', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({email: testEmail})
                        });
                        
                        const result = await response.json();
                        
                        if (result.success) {
                            messageDiv.innerHTML = '<div class="message success">✅ ' + result.message + '</div>';
                        } else {
                            messageDiv.innerHTML = '<div class="message error">❌ ' + result.message + '</div>';
                        }
                    } catch (error) {
                        messageDiv.innerHTML = '<div class="message error">❌ 发送失败，请检查网络连接。</div>';
                    }
                    
                    testBtn.disabled = false;
                    testBtn.textContent = '发送测试邮件';
                }
                
                // 实时验证
                document.getElementById('username').addEventListener('input', function() {
                    if (this.value.length < 3) {
                        this.style.borderColor = '#ff4444';
                    } else {
                        this.style.borderColor = '#4CAF50';
                    }
                });
                
                document.getElementById('email').addEventListener('input', function() {
                    const emailRegex = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;
                    if (emailRegex.test(this.value)) {
                        this.style.borderColor = '#4CAF50';
                    } else {
                        this.style.borderColor = '#ff4444';
                    }
                });
            </script>
        </body>
        </html>
        '''

def main():
    """主函数"""
    PORT = 8000
    
    print("=" * 60)
    print("🚀 用户注册系统启动中...")
    print("=" * 60)
    print(f"📅 启动时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"🌐 服务地址: http://localhost:{PORT}")
    print(f"📂 数据库路径: data/users.db")
    print()
    print("⚠️  重要提醒:")
    print("1. 请确保已正确配置邮件服务参数（在代码中的 EMAIL_CONFIG）")
    print("2. Gmail用户需要使用应用专用密码")
    print("3. 首次运行会自动创建数据库")
    print()
    print("🔧 配置说明:")
    print(f"   平台名称: {SYSTEM_CONFIG['platform_name']}")
    print(f"   登录地址: {SYSTEM_CONFIG['login_url']}")
    print(f"   发送邮箱: {EMAIL_CONFIG['sender_email']}")
    print()
    print("📖 使用说明:")
    print("   1. 在浏览器中访问上述地址")
    print("   2. 填写用户名和邮箱进行注册")
    print("   3. 系统将自动生成密码并发送邮件")
    print("   4. 可以使用'测试邮件'功能验证邮件配置")
    print()
    print("💡 停止服务: 按 Ctrl+C")
    print("=" * 60)
    
    try:
        with socketserver.TCPServer(("", PORT), RegistrationHandler) as httpd:
            print(f"✅ 服务器已启动，监听端口 {PORT}")
            print("🔗 请在浏览器中访问: http://localhost:8000")
            print()
            httpd.serve_forever()
    except KeyboardInterrupt:
        print("\\n\\n🛑 服务器已停止")
    except Exception as e:
        print(f"\\n❌ 服务器启动失败: {str(e)}")

if __name__ == '__main__':
    main()