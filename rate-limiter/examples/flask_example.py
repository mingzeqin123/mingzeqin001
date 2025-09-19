"""
Flask集成示例
演示如何在Flask应用中使用接口防刷系统
"""

import time
import json
import hashlib
import redis
from datetime import datetime, timedelta
from functools import wraps
from flask import Flask, request, jsonify, g
from werkzeug.exceptions import TooManyRequests
import logging

# 配置日志
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)

# 配置
app.config.update({
    'REDIS_URL': 'redis://localhost:6379/0',  # Redis连接URL
    'RATE_LIMIT_ENABLED': True,               # 是否启用限流
    'RATE_LIMIT_STORAGE': 'redis',            # 存储类型: redis 或 memory
    'MAX_CONTENT_LENGTH': 10 * 1024 * 1024,   # 最大请求体大小 10MB
})

class RateLimiter:
    """Python版本的限流器"""
    
    def __init__(self, app=None, redis_client=None):
        self.app = app
        self.redis_client = redis_client
        self.memory_store = {}
        self.violations = {}
        
        # 可疑用户代理列表
        self.suspicious_user_agents = [
            'bot', 'crawler', 'spider', 'scraper', 'curl', 
            'wget', 'python', 'java', 'go-http'
        ]
        
        # 蜜罐路径
        self.honeypot_paths = [
            '/admin', '/wp-admin', '/.env', '/config', 
            '/phpmyadmin', '/mysql', '/database'
        ]
        
        # 黑名单和白名单
        self.blacklist = set()
        self.whitelist = set()
        
        if app:
            self.init_app(app)
    
    def init_app(self, app):
        """初始化Flask应用"""
        self.app = app
        
        # 初始化Redis连接
        if app.config.get('RATE_LIMIT_STORAGE') == 'redis':
            try:
                self.redis_client = redis.from_url(app.config['REDIS_URL'])
                self.redis_client.ping()
                logger.info("Redis连接成功")
            except Exception as e:
                logger.error(f"Redis连接失败: {e}")
                logger.info("降级使用内存存储")
                self.redis_client = None
        
        # 注册请求钩子
        app.before_request(self.before_request)
    
    def get_client_ip(self):
        """获取客户端IP地址"""
        if request.headers.get('X-Forwarded-For'):
            return request.headers.get('X-Forwarded-For').split(',')[0].strip()
        elif request.headers.get('X-Real-IP'):
            return request.headers.get('X-Real-IP')
        else:
            return request.remote_addr or 'unknown'
    
    def is_suspicious_user_agent(self, user_agent):
        """检查是否是可疑的用户代理"""
        if not user_agent:
            return True
        
        user_agent_lower = user_agent.lower()
        return any(pattern in user_agent_lower for pattern in self.suspicious_user_agents)
    
    def is_honeypot_path(self, path):
        """检查是否是蜜罐路径"""
        path_lower = path.lower()
        return any(honeypot in path_lower for honeypot in self.honeypot_paths)
    
    def generate_request_fingerprint(self):
        """生成请求指纹"""
        elements = [
            request.method,
            request.path,
            self.get_client_ip(),
            request.headers.get('User-Agent', ''),
            request.headers.get('Accept', ''),
            request.headers.get('Accept-Language', '')
        ]
        
        # 对于POST请求，包含部分请求体信息
        if request.method == 'POST' and request.is_json:
            try:
                body_str = json.dumps(request.get_json(), sort_keys=True)
                body_hash = hashlib.md5(body_str.encode()).hexdigest()
                elements.append(body_hash)
            except:
                pass
        
        fingerprint_str = '|'.join(str(e) for e in elements)
        return hashlib.sha256(fingerprint_str.encode()).hexdigest()
    
    def check_rate_limit(self, key, limit, window_seconds, strategy='sliding_window'):
        """检查限流"""
        now = time.time()
        
        if self.redis_client:
            return self._check_rate_limit_redis(key, limit, window_seconds, now, strategy)
        else:
            return self._check_rate_limit_memory(key, limit, window_seconds, now, strategy)
    
    def _check_rate_limit_redis(self, key, limit, window_seconds, now, strategy):
        """Redis版本的限流检查"""
        try:
            if strategy == 'sliding_window':
                # 滑动窗口算法
                pipe = self.redis_client.pipeline()
                
                # 清理过期的时间戳
                pipe.zremrangebyscore(key, 0, now - window_seconds)
                
                # 获取当前计数
                pipe.zcard(key)
                
                # 执行pipeline
                results = pipe.execute()
                current_count = results[1]
                
                if current_count < limit:
                    # 添加当前时间戳
                    self.redis_client.zadd(key, {str(now): now})
                    self.redis_client.expire(key, int(window_seconds) + 60)
                    current_count += 1
                
                # 计算重置时间
                oldest_scores = self.redis_client.zrange(key, 0, 0, withscores=True)
                reset_time = now + window_seconds
                if oldest_scores:
                    reset_time = oldest_scores[0][1] + window_seconds
                
                return {
                    'allowed': current_count <= limit,
                    'limit': limit,
                    'current': current_count,
                    'remaining': max(0, limit - current_count),
                    'reset_time': reset_time
                }
                
            elif strategy == 'fixed_window':
                # 固定窗口算法
                window_start = int(now // window_seconds) * window_seconds
                window_key = f"{key}:{window_start}"
                
                current_count = self.redis_client.incr(window_key)
                if current_count == 1:
                    self.redis_client.expire(window_key, int(window_seconds) + 1)
                
                reset_time = window_start + window_seconds
                
                return {
                    'allowed': current_count <= limit,
                    'limit': limit,
                    'current': current_count,
                    'remaining': max(0, limit - current_count),
                    'reset_time': reset_time
                }
                
        except Exception as e:
            logger.error(f"Redis限流检查失败: {e}")
            # Redis出错时允许请求通过
            return {
                'allowed': True,
                'limit': limit,
                'current': 0,
                'remaining': limit,
                'reset_time': now + window_seconds
            }
    
    def _check_rate_limit_memory(self, key, limit, window_seconds, now, strategy):
        """内存版本的限流检查"""
        if strategy == 'sliding_window':
            if key not in self.memory_store:
                self.memory_store[key] = []
            
            # 清理过期的时间戳
            self.memory_store[key] = [
                timestamp for timestamp in self.memory_store[key] 
                if now - timestamp < window_seconds
            ]
            
            current_count = len(self.memory_store[key])
            
            if current_count < limit:
                self.memory_store[key].append(now)
                current_count += 1
            
            # 计算重置时间
            reset_time = now + window_seconds
            if self.memory_store[key]:
                reset_time = self.memory_store[key][0] + window_seconds
            
            return {
                'allowed': current_count <= limit,
                'limit': limit,
                'current': current_count,
                'remaining': max(0, limit - current_count),
                'reset_time': reset_time
            }
        
        elif strategy == 'fixed_window':
            window_start = int(now // window_seconds) * window_seconds
            window_key = f"{key}:{window_start}"
            
            if window_key not in self.memory_store:
                self.memory_store[window_key] = 0
            
            self.memory_store[window_key] += 1
            current_count = self.memory_store[window_key]
            
            reset_time = window_start + window_seconds
            
            return {
                'allowed': current_count <= limit,
                'limit': limit,
                'current': current_count,
                'remaining': max(0, limit - current_count),
                'reset_time': reset_time
            }
    
    def record_violation(self, ip, reason):
        """记录违规"""
        if ip not in self.violations:
            self.violations[ip] = {
                'count': 0,
                'first_violation': datetime.now(),
                'last_violation': datetime.now(),
                'reasons': []
            }
        
        self.violations[ip]['count'] += 1
        self.violations[ip]['last_violation'] = datetime.now()
        self.violations[ip]['reasons'].append(reason)
        
        logger.warning(f"违规记录: IP={ip}, 原因={reason}, 次数={self.violations[ip]['count']}")
        
        # 自动封禁
        if self.violations[ip]['count'] >= 5:
            self.blacklist.add(ip)
            logger.warning(f"IP {ip} 因多次违规被自动加入黑名单")
    
    def before_request(self):
        """请求前检查"""
        if not app.config.get('RATE_LIMIT_ENABLED', True):
            return
        
        ip = self.get_client_ip()
        path = request.path
        user_agent = request.headers.get('User-Agent', '')
        
        # 黑名单检查
        if ip in self.blacklist:
            logger.warning(f"黑名单IP访问被拒绝: {ip}")
            return jsonify({
                'error': '访问被拒绝',
                'message': 'IP在黑名单中'
            }), 403
        
        # 白名单检查
        if self.whitelist and ip not in self.whitelist:
            logger.warning(f"非白名单IP访问被拒绝: {ip}")
            return jsonify({
                'error': '访问被拒绝', 
                'message': 'IP不在白名单中'
            }), 403
        
        # 蜜罐检查
        if self.is_honeypot_path(path):
            self.record_violation(ip, f'honeypot-access:{path}')
            logger.warning(f"蜜罐访问: IP={ip}, 路径={path}")
            # 返回404而不是403，避免暴露蜜罐
            return jsonify({'error': '页面未找到'}), 404
        
        # 可疑用户代理检查
        if self.is_suspicious_user_agent(user_agent):
            self.record_violation(ip, f'suspicious-user-agent:{user_agent}')
            logger.warning(f"可疑用户代理: IP={ip}, UA={user_agent}")
        
        # 请求体大小检查
        content_length = request.content_length
        if content_length and content_length > app.config.get('MAX_CONTENT_LENGTH', 10 * 1024 * 1024):
            return jsonify({
                'error': '请求体过大',
                'max_size': app.config.get('MAX_CONTENT_LENGTH')
            }), 413
        
        # 存储请求信息供装饰器使用
        g.client_ip = ip
        g.request_fingerprint = self.generate_request_fingerprint()

# 创建限流器实例
rate_limiter = RateLimiter(app)

def rate_limit(limit=100, window=60, strategy='sliding_window', key_func=None):
    """限流装饰器"""
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            if not app.config.get('RATE_LIMIT_ENABLED', True):
                return f(*args, **kwargs)
            
            # 生成限流key
            if key_func:
                key = key_func()
            else:
                key = f"rate_limit:{g.client_ip}:{request.endpoint}"
            
            # 检查限流
            result = rate_limiter.check_rate_limit(key, limit, window, strategy)
            
            # 设置响应头
            response = None
            if not result['allowed']:
                response = jsonify({
                    'error': '请求过于频繁',
                    'message': f'每{window}秒最多允许{limit}次请求',
                    'retry_after': int(result['reset_time'] - time.time())
                }), 429
            else:
                response = f(*args, **kwargs)
            
            # 如果response是tuple，说明是(data, status_code)格式
            if isinstance(response, tuple):
                data, status_code = response
                flask_response = app.make_response((data, status_code))
            else:
                flask_response = app.make_response(response)
            
            # 添加限流头部
            flask_response.headers['X-RateLimit-Limit'] = str(result['limit'])
            flask_response.headers['X-RateLimit-Remaining'] = str(result['remaining'])
            flask_response.headers['X-RateLimit-Reset'] = str(int(result['reset_time']))
            
            return flask_response
        
        return decorated_function
    return decorator

def anti_brush(window=5, max_duplicates=3):
    """防刷装饰器"""
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            if not app.config.get('RATE_LIMIT_ENABLED', True):
                return f(*args, **kwargs)
            
            fingerprint = g.request_fingerprint
            key = f"anti_brush:{fingerprint}"
            
            # 检查重复请求
            result = rate_limiter.check_rate_limit(key, max_duplicates, window, 'sliding_window')
            
            if not result['allowed']:
                rate_limiter.record_violation(g.client_ip, 'duplicate-requests')
                return jsonify({
                    'error': '重复请求过于频繁',
                    'message': f'{window}秒内最多允许{max_duplicates}次相同请求'
                }), 429
            
            return f(*args, **kwargs)
        
        return decorated_function
    return decorator

# 路由示例

@app.route('/api/users')
@rate_limit(limit=50, window=60)
def get_users():
    """获取用户列表"""
    return jsonify({
        'users': [
            {'id': 1, 'name': '用户1'},
            {'id': 2, 'name': '用户2'}
        ]
    })

@app.route('/api/login', methods=['POST'])
@rate_limit(limit=5, window=900)  # 15分钟内最多5次
def login():
    """用户登录"""
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    
    # 模拟登录验证
    if username == 'admin' and password == 'password':
        return jsonify({
            'success': True,
            'message': '登录成功',
            'token': 'mock-jwt-token'
        })
    else:
        # 记录失败的登录尝试
        rate_limiter.record_violation(g.client_ip, 'login-failed')
        return jsonify({
            'success': False,
            'message': '用户名或密码错误'
        }), 401

@app.route('/api/register', methods=['POST'])
@rate_limit(limit=3, window=3600)  # 1小时内最多3次
def register():
    """用户注册"""
    data = request.get_json()
    return jsonify({
        'success': True,
        'message': '注册成功',
        'user': {
            'username': data.get('username'),
            'email': data.get('email')
        }
    })

@app.route('/api/search')
@rate_limit(limit=30, window=60)
@anti_brush(window=5, max_duplicates=3)
def search():
    """搜索接口"""
    query = request.args.get('q', '')
    return jsonify({
        'query': query,
        'results': [
            {'id': 1, 'title': '搜索结果1'},
            {'id': 2, 'title': '搜索结果2'}
        ]
    })

@app.route('/api/upload', methods=['POST'])
@rate_limit(limit=5, window=60)  # 每分钟最多5次上传
def upload():
    """文件上传"""
    return jsonify({
        'success': True,
        'message': '文件上传成功',
        'file_id': int(time.time())
    })

@app.route('/api/data')
@rate_limit(
    limit=1000, 
    window=60, 
    strategy='sliding_window',
    key_func=lambda: f"api_key:{request.headers.get('X-API-Key', g.client_ip)}"
)
def get_data():
    """API数据接口"""
    api_key = request.headers.get('X-API-Key')
    
    if not api_key:
        return jsonify({'error': '缺少API密钥'}), 401
    
    if api_key != 'valid-api-key':
        return jsonify({'error': '无效的API密钥'}), 403
    
    return jsonify({
        'data': 'API数据',
        'timestamp': datetime.now().isoformat()
    })

# 管理接口

@app.route('/admin/stats')
def get_stats():
    """获取统计信息"""
    return jsonify({
        'blacklisted_ips': len(rate_limiter.blacklist),
        'whitelisted_ips': len(rate_limiter.whitelist),
        'violation_records': len(rate_limiter.violations),
        'memory_store_keys': len(rate_limiter.memory_store),
        'redis_connected': rate_limiter.redis_client is not None
    })

@app.route('/admin/blacklist', methods=['POST'])
def add_to_blacklist():
    """添加IP到黑名单"""
    data = request.get_json()
    ip = data.get('ip')
    reason = data.get('reason', 'manual')
    
    if not ip:
        return jsonify({'error': '缺少IP地址'}), 400
    
    rate_limiter.blacklist.add(ip)
    logger.info(f"IP {ip} 已手动添加到黑名单，原因: {reason}")
    
    return jsonify({
        'success': True,
        'message': f'IP {ip} 已添加到黑名单'
    })

@app.route('/admin/blacklist/<ip>', methods=['DELETE'])
def remove_from_blacklist(ip):
    """从黑名单移除IP"""
    rate_limiter.blacklist.discard(ip)
    logger.info(f"IP {ip} 已从黑名单移除")
    
    return jsonify({
        'success': True,
        'message': f'IP {ip} 已从黑名单移除'
    })

@app.route('/health')
def health_check():
    """健康检查"""
    redis_status = 'connected' if rate_limiter.redis_client else 'disconnected'
    
    return jsonify({
        'status': 'healthy',
        'redis': redis_status,
        'rate_limit_enabled': app.config.get('RATE_LIMIT_ENABLED', True),
        'timestamp': datetime.now().isoformat()
    })

# 错误处理

@app.errorhandler(404)
def not_found(error):
    """404错误处理"""
    ip = rate_limiter.get_client_ip()
    path = request.path
    
    # 检查是否是扫描行为
    scan_paths = ['/admin', '/wp-admin', '/.env', '/config', '/phpmyadmin']
    if any(scan_path in path.lower() for scan_path in scan_paths):
        rate_limiter.record_violation(ip, f'scan-attempt:{path}')
    
    return jsonify({
        'error': '页面未找到',
        'path': path
    }), 404

@app.errorhandler(413)
def request_entity_too_large(error):
    """请求体过大错误处理"""
    return jsonify({
        'error': '请求体过大',
        'max_size': app.config.get('MAX_CONTENT_LENGTH')
    }), 413

@app.errorhandler(429)
def ratelimit_handler(error):
    """限流错误处理"""
    return jsonify({
        'error': '请求过于频繁',
        'message': '请稍后再试'
    }), 429

if __name__ == '__main__':
    # 开发环境配置
    app.config['DEBUG'] = True
    app.run(host='0.0.0.0', port=5000)