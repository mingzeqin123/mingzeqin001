# 部署指南

## 📋 部署概述

本指南将帮助您将微信小程序订单管理系统部署到生产环境。系统支持多种部署方式，从简单的单机部署到高可用的分布式部署。

## 🏗️ 系统架构

### 推荐架构
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   微信小程序     │    │    CDN/OSS      │    │   负载均衡器     │
│   (前端界面)     │    │   (静态资源)     │    │   (Nginx)       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │   应用服务器     │
                    │   (Node.js)     │
                    └─────────────────┘
                                 │
                    ┌─────────────────┐    ┌─────────────────┐
                    │   数据库服务     │    │   缓存服务      │
                    │   (MySQL)       │    │   (Redis)       │
                    └─────────────────┘    └─────────────────┘
```

## 🔧 环境准备

### 服务器要求
- **操作系统**: Ubuntu 20.04 LTS / CentOS 8+
- **CPU**: 2核心以上
- **内存**: 4GB以上
- **存储**: 50GB以上SSD
- **网络**: 公网IP，支持HTTPS

### 软件依赖
- Node.js 16.x+
- MySQL 8.0+ / MongoDB 4.4+
- Redis 6.0+
- Nginx 1.18+
- PM2 (进程管理)

## 📦 安装依赖

### 1. 安装Node.js
```bash
# 使用NodeSource仓库安装Node.js 16.x
curl -fsSL https://deb.nodesource.com/setup_16.x | sudo -E bash -
sudo apt-get install -y nodejs

# 验证安装
node --version
npm --version
```

### 2. 安装MySQL
```bash
# 安装MySQL 8.0
sudo apt update
sudo apt install mysql-server

# 安全配置
sudo mysql_secure_installation

# 创建数据库和用户
mysql -u root -p
CREATE DATABASE order_system CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'order_user'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON order_system.* TO 'order_user'@'localhost';
FLUSH PRIVILEGES;
```

### 3. 安装Redis
```bash
# 安装Redis
sudo apt install redis-server

# 启动并启用Redis
sudo systemctl start redis-server
sudo systemctl enable redis-server

# 验证安装
redis-cli ping
```

### 4. 安装Nginx
```bash
# 安装Nginx
sudo apt install nginx

# 启动并启用Nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

### 5. 安装PM2
```bash
# 全局安装PM2
sudo npm install -g pm2

# 设置PM2开机自启
pm2 startup
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u $USER --hp $HOME
```

## 🚀 应用部署

### 1. 部署应用代码
```bash
# 创建应用目录
sudo mkdir -p /var/www/order-system
sudo chown $USER:$USER /var/www/order-system

# 克隆代码
cd /var/www/order-system
git clone https://github.com/your-username/order-system.git .

# 安装依赖
npm install --production

# 创建配置文件
cp config/config.example.js config/config.production.js
```

### 2. 配置环境变量
```bash
# 创建环境变量文件
cat > .env << EOF
NODE_ENV=production
PORT=3000

# 数据库配置
DB_HOST=localhost
DB_PORT=3306
DB_NAME=order_system
DB_USER=order_user
DB_PASSWORD=your_password

# Redis配置
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# 微信小程序配置
WECHAT_APP_ID=your_app_id
WECHAT_APP_SECRET=your_app_secret

# 支付配置
WECHAT_PAY_MCH_ID=your_mch_id
WECHAT_PAY_KEY=your_pay_key

# JWT密钥
JWT_SECRET=your_jwt_secret

# 文件上传
UPLOAD_PATH=/var/www/order-system/uploads
MAX_FILE_SIZE=10485760

# 日志配置
LOG_LEVEL=info
LOG_PATH=/var/log/order-system
EOF
```

### 3. 数据库迁移
```bash
# 创建数据库表结构
npm run db:migrate

# 初始化基础数据
npm run db:seed
```

### 4. 启动应用
```bash
# 使用PM2启动应用
pm2 start ecosystem.config.js --env production

# 保存PM2配置
pm2 save

# 查看应用状态
pm2 status
pm2 logs
```

### 5. PM2配置文件 (ecosystem.config.js)
```javascript
module.exports = {
  apps: [{
    name: 'order-system',
    script: './app.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'development'
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    log_file: '/var/log/order-system/combined.log',
    out_file: '/var/log/order-system/out.log',
    error_file: '/var/log/order-system/error.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    max_memory_restart: '1G',
    node_args: '--max_old_space_size=1024'
  }]
}
```

## 🌐 Nginx配置

### 1. 创建Nginx配置
```bash
sudo nano /etc/nginx/sites-available/order-system
```

### 2. Nginx配置文件
```nginx
upstream order_system {
    server 127.0.0.1:3000;
    keepalive 32;
}

server {
    listen 80;
    server_name your-domain.com www.your-domain.com;
    
    # 重定向到HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com www.your-domain.com;
    
    # SSL证书配置
    ssl_certificate /etc/ssl/certs/your-domain.crt;
    ssl_certificate_key /etc/ssl/private/your-domain.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;
    ssl_prefer_server_ciphers off;
    
    # 安全头
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload";
    
    # 日志配置
    access_log /var/log/nginx/order-system.access.log;
    error_log /var/log/nginx/order-system.error.log;
    
    # 静态文件
    location /static/ {
        alias /var/www/order-system/public/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # 文件上传
    location /uploads/ {
        alias /var/www/order-system/uploads/;
        expires 1y;
        add_header Cache-Control "public";
    }
    
    # API接口
    location /api/ {
        proxy_pass http://order_system;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # 超时设置
        proxy_connect_timeout 30s;
        proxy_send_timeout 30s;
        proxy_read_timeout 30s;
    }
    
    # 健康检查
    location /health {
        proxy_pass http://order_system;
        access_log off;
    }
    
    # 默认页面
    location / {
        root /var/www/order-system/public;
        index index.html;
        try_files $uri $uri/ /index.html;
    }
}
```

### 3. 启用配置
```bash
# 创建软链接
sudo ln -s /etc/nginx/sites-available/order-system /etc/nginx/sites-enabled/

# 测试配置
sudo nginx -t

# 重载Nginx
sudo systemctl reload nginx
```

## 🔒 SSL证书配置

### 使用Let's Encrypt (推荐)
```bash
# 安装Certbot
sudo apt install certbot python3-certbot-nginx

# 获取SSL证书
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# 设置自动续期
sudo crontab -e
# 添加以下行
0 12 * * * /usr/bin/certbot renew --quiet
```

### 使用自签名证书 (开发环境)
```bash
# 创建SSL目录
sudo mkdir -p /etc/ssl/private

# 生成私钥和证书
sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout /etc/ssl/private/your-domain.key \
    -out /etc/ssl/certs/your-domain.crt
```

## 📊 监控配置

### 1. 系统监控
```bash
# 安装系统监控工具
sudo apt install htop iotop nethogs

# 设置日志轮转
sudo nano /etc/logrotate.d/order-system
```

### 2. 日志轮转配置
```
/var/log/order-system/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 644 www-data www-data
    postrotate
        pm2 reload order-system
    endscript
}
```

### 3. 应用监控
```bash
# 安装监控工具
npm install -g pm2-logrotate

# 配置PM2日志轮转
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 30
pm2 set pm2-logrotate:compress true
```

## 🔄 自动化部署

### 1. 部署脚本 (deploy.sh)
```bash
#!/bin/bash

# 部署脚本
set -e

echo "开始部署订单系统..."

# 进入项目目录
cd /var/www/order-system

# 备份当前版本
if [ -d "backup" ]; then
    rm -rf backup
fi
mkdir backup
cp -r . backup/ 2>/dev/null || true

# 拉取最新代码
git fetch origin
git reset --hard origin/main

# 安装依赖
npm ci --production

# 数据库迁移
npm run db:migrate

# 重启应用
pm2 reload order-system

# 等待应用启动
sleep 10

# 健康检查
if curl -f http://localhost:3000/health; then
    echo "部署成功！"
    # 清理备份
    rm -rf backup
else
    echo "部署失败，正在回滚..."
    # 回滚
    rm -rf node_modules
    cp -r backup/* .
    npm ci --production
    pm2 reload order-system
    echo "回滚完成"
    exit 1
fi
```

### 2. GitHub Actions配置 (.github/workflows/deploy.yml)
```yaml
name: Deploy to Production

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '16'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run tests
      run: npm test
    
    - name: Deploy to server
      uses: appleboy/ssh-action@v0.1.5
      with:
        host: ${{ secrets.HOST }}
        username: ${{ secrets.USERNAME }}
        key: ${{ secrets.PRIVATE_KEY }}
        script: |
          cd /var/www/order-system
          ./deploy.sh
```

## 🔧 性能优化

### 1. 数据库优化
```sql
-- 创建索引
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_create_time ON orders(create_time);
CREATE INDEX idx_cart_items_user_id ON cart_items(user_id);

-- 配置MySQL
# /etc/mysql/mysql.conf.d/mysqld.cnf
[mysqld]
innodb_buffer_pool_size = 1G
innodb_log_file_size = 256M
max_connections = 200
query_cache_size = 64M
```

### 2. Redis配置
```bash
# /etc/redis/redis.conf
maxmemory 512mb
maxmemory-policy allkeys-lru
save 900 1
save 300 10
save 60 10000
```

### 3. Node.js优化
```javascript
// config/production.js
module.exports = {
  // 连接池配置
  database: {
    pool: {
      max: 20,
      min: 5,
      idle: 10000,
      acquire: 30000
    }
  },
  
  // 缓存配置
  cache: {
    ttl: 3600,
    max: 1000
  },
  
  // 限流配置
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15分钟
    max: 1000 // 限制每个IP 1000次请求
  }
}
```

## 🛡️ 安全配置

### 1. 防火墙配置
```bash
# 安装ufw
sudo apt install ufw

# 配置防火墙规则
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443

# 启用防火墙
sudo ufw enable
```

### 2. 系统安全
```bash
# 禁用root登录
sudo nano /etc/ssh/sshd_config
# PermitRootLogin no

# 配置fail2ban
sudo apt install fail2ban
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

### 3. 应用安全
```javascript
// 安全中间件
const helmet = require('helmet')
const rateLimit = require('express-rate-limit')

app.use(helmet())
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000
}))
```

## 📋 检查清单

### 部署前检查
- [ ] 服务器环境准备完成
- [ ] 域名DNS解析配置
- [ ] SSL证书申请和配置
- [ ] 数据库创建和配置
- [ ] 环境变量配置
- [ ] 微信小程序配置

### 部署后检查
- [ ] 应用正常启动
- [ ] 数据库连接正常
- [ ] Redis连接正常
- [ ] API接口可访问
- [ ] SSL证书有效
- [ ] 日志记录正常
- [ ] 监控告警配置

## 🆘 故障排查

### 常见问题

1. **应用无法启动**
   ```bash
   # 查看PM2日志
   pm2 logs order-system
   
   # 检查端口占用
   sudo netstat -tlnp | grep :3000
   ```

2. **数据库连接失败**
   ```bash
   # 检查MySQL状态
   sudo systemctl status mysql
   
   # 测试数据库连接
   mysql -h localhost -u order_user -p order_system
   ```

3. **Nginx配置错误**
   ```bash
   # 检查Nginx配置
   sudo nginx -t
   
   # 查看Nginx日志
   sudo tail -f /var/log/nginx/error.log
   ```

4. **SSL证书问题**
   ```bash
   # 检查证书有效期
   openssl x509 -in /etc/ssl/certs/your-domain.crt -text -noout
   
   # 测试SSL连接
   openssl s_client -connect your-domain.com:443
   ```

## 📞 技术支持

如果在部署过程中遇到问题，请：

1. 查看相关日志文件
2. 检查系统资源使用情况
3. 参考故障排查部分
4. 联系技术支持团队

---

**祝您部署顺利！** 🚀