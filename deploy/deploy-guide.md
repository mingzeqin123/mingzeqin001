# 直播系统部署指南

## 📋 部署前准备

### 服务器要求

**最低配置：**
- CPU: 2核心
- 内存: 4GB
- 硬盘: 50GB SSD
- 带宽: 5Mbps

**推荐配置：**
- CPU: 4核心
- 内存: 8GB
- 硬盘: 100GB SSD
- 带宽: 10Mbps

### 软件环境

- **操作系统**: Ubuntu 20.04 LTS 或 CentOS 8
- **Node.js**: 16.0+
- **Redis**: 6.0+
- **Nginx**: 1.18+
- **PM2**: 最新版本

## 🚀 快速部署

### 1. 服务器环境准备

```bash
# 更新系统
sudo apt update && sudo apt upgrade -y

# 安装必要工具
sudo apt install -y curl wget git vim

# 安装Node.js
curl -fsSL https://deb.nodesource.com/setup_16.x | sudo -E bash -
sudo apt-get install -y nodejs

# 安装Redis
sudo apt install -y redis-server
sudo systemctl start redis-server
sudo systemctl enable redis-server

# 安装Nginx
sudo apt install -y nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# 安装PM2
sudo npm install -g pm2
```

### 2. 项目部署

```bash
# 克隆项目
git clone <your-repo-url> /var/www/live-system
cd /var/www/live-system

# 安装依赖
cd server
npm install --production

# 配置环境变量
cp .env.example .env
vim .env
```

### 3. 环境变量配置

编辑 `.env` 文件：

```bash
# 服务器配置
PORT=3000
NODE_ENV=production

# 数据库配置
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your-redis-password

# JWT配置
JWT_SECRET=your-super-secret-jwt-key
JWT_REFRESH_SECRET=your-super-secret-refresh-key

# 微信小程序配置
WECHAT_APPID=your-wechat-appid
WECHAT_SECRET=your-wechat-secret

# 网易云推流配置
NETEASE_APP_KEY=your-netease-app-key
NETEASE_APP_SECRET=your-netease-app-secret
NETEASE_BASE_URL=https://vcloud.163.com

# 文件上传配置
UPLOAD_PATH=/var/www/live-system/server/uploads
MAX_FILE_SIZE=10485760

# 安全配置
CORS_ORIGIN=https://yourdomain.com
RATE_LIMIT_WINDOW=900000
RATE_LIMIT_MAX=100
```

### 4. 启动服务

```bash
# 使用PM2启动服务
pm2 start ecosystem.config.js

# 保存PM2配置
pm2 save

# 设置开机自启
pm2 startup
```

### 5. Nginx配置

创建Nginx配置文件：

```bash
sudo vim /etc/nginx/sites-available/live-system
```

配置内容：

```nginx
server {
    listen 80;
    server_name yourdomain.com;
    
    # 重定向到HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;
    
    # SSL证书配置
    ssl_certificate /path/to/your/certificate.crt;
    ssl_certificate_key /path/to/your/private.key;
    
    # SSL安全配置
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    
    # 文件上传大小限制
    client_max_body_size 10M;
    
    # API代理
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    # WebSocket代理
    location /socket.io/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # 静态文件服务
    location /uploads/ {
        alias /var/www/live-system/server/uploads/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # 健康检查
    location /health {
        proxy_pass http://localhost:3000;
        access_log off;
    }
    
    # 安全头
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
}
```

启用配置：

```bash
sudo ln -s /etc/nginx/sites-available/live-system /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## 🔧 高级配置

### 1. PM2配置

创建 `ecosystem.config.js`：

```javascript
module.exports = {
  apps: [{
    name: 'live-streaming-server',
    script: 'app.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'development',
      PORT: 3000
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: '/var/log/pm2/live-system-error.log',
    out_file: '/var/log/pm2/live-system-out.log',
    log_file: '/var/log/pm2/live-system.log',
    time: true,
    max_memory_restart: '1G',
    node_args: '--max-old-space-size=1024'
  }]
};
```

### 2. Redis配置

编辑Redis配置文件：

```bash
sudo vim /etc/redis/redis.conf
```

重要配置项：

```conf
# 绑定地址
bind 127.0.0.1

# 端口
port 6379

# 密码
requirepass your-redis-password

# 持久化
save 900 1
save 300 10
save 60 10000

# 内存策略
maxmemory 2gb
maxmemory-policy allkeys-lru

# 日志
loglevel notice
logfile /var/log/redis/redis-server.log
```

重启Redis：

```bash
sudo systemctl restart redis-server
```

### 3. 防火墙配置

```bash
# 安装UFW
sudo apt install -y ufw

# 配置防火墙规则
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

### 4. SSL证书配置

使用Let's Encrypt免费SSL证书：

```bash
# 安装Certbot
sudo apt install -y certbot python3-certbot-nginx

# 获取证书
sudo certbot --nginx -d yourdomain.com

# 自动续期
sudo crontab -e
# 添加以下行
0 12 * * * /usr/bin/certbot renew --quiet
```

## 📊 监控和日志

### 1. 系统监控

安装监控工具：

```bash
# 安装htop
sudo apt install -y htop

# 安装iotop
sudo apt install -y iotop

# 安装nethogs
sudo apt install -y nethogs
```

### 2. 应用监控

使用PM2监控：

```bash
# 查看应用状态
pm2 status

# 查看日志
pm2 logs live-streaming-server

# 监控面板
pm2 monit
```

### 3. 日志管理

配置日志轮转：

```bash
sudo vim /etc/logrotate.d/live-system
```

配置内容：

```
/var/log/pm2/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 www-data www-data
    postrotate
        pm2 reloadLogs
    endscript
}
```

## 🔒 安全加固

### 1. 系统安全

```bash
# 更新系统
sudo apt update && sudo apt upgrade -y

# 安装fail2ban
sudo apt install -y fail2ban

# 配置fail2ban
sudo vim /etc/fail2ban/jail.local
```

fail2ban配置：

```ini
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 3

[sshd]
enabled = true
port = ssh
logpath = /var/log/auth.log
maxretry = 3
```

### 2. 应用安全

- 定期更新依赖包
- 使用强密码
- 启用HTTPS
- 配置CORS
- 设置访问频率限制

### 3. 数据安全

- 定期备份数据
- 加密敏感信息
- 限制数据库访问
- 监控异常访问

## 🚀 性能优化

### 1. Node.js优化

```bash
# 设置Node.js环境变量
export NODE_ENV=production
export NODE_OPTIONS="--max-old-space-size=2048"
```

### 2. Redis优化

```conf
# 在redis.conf中添加
tcp-keepalive 300
timeout 0
tcp-backlog 511
```

### 3. Nginx优化

```nginx
# 在nginx.conf中添加
worker_processes auto;
worker_connections 1024;

# 启用gzip压缩
gzip on;
gzip_vary on;
gzip_min_length 1024;
gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
```

## 📈 扩容方案

### 1. 水平扩容

- 使用负载均衡器
- 部署多个应用实例
- 使用Redis集群
- 配置CDN加速

### 2. 垂直扩容

- 增加服务器配置
- 优化应用性能
- 使用SSD存储
- 增加带宽

## 🔄 备份和恢复

### 1. 数据备份

```bash
# 创建备份脚本
vim /usr/local/bin/backup-live-system.sh
```

备份脚本：

```bash
#!/bin/bash
BACKUP_DIR="/var/backups/live-system"
DATE=$(date +%Y%m%d_%H%M%S)

# 创建备份目录
mkdir -p $BACKUP_DIR

# 备份Redis数据
redis-cli --rdb $BACKUP_DIR/redis_$DATE.rdb

# 备份应用文件
tar -czf $BACKUP_DIR/app_$DATE.tar.gz /var/www/live-system

# 清理旧备份（保留7天）
find $BACKUP_DIR -name "*.rdb" -mtime +7 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete
```

设置定时任务：

```bash
# 编辑crontab
sudo crontab -e

# 添加备份任务（每天凌晨2点执行）
0 2 * * * /usr/local/bin/backup-live-system.sh
```

### 2. 数据恢复

```bash
# 恢复Redis数据
redis-cli --rdb /var/backups/live-system/redis_20240115_020000.rdb

# 恢复应用文件
tar -xzf /var/backups/live-system/app_20240115_020000.tar.gz -C /
```

## 🐛 故障排除

### 1. 常见问题

**问题1：服务启动失败**
```bash
# 检查端口占用
sudo netstat -tlnp | grep :3000

# 检查日志
pm2 logs live-streaming-server
```

**问题2：Redis连接失败**
```bash
# 检查Redis状态
sudo systemctl status redis-server

# 检查Redis日志
sudo tail -f /var/log/redis/redis-server.log
```

**问题3：Nginx配置错误**
```bash
# 检查配置语法
sudo nginx -t

# 重新加载配置
sudo systemctl reload nginx
```

### 2. 性能问题

**问题1：高CPU使用率**
- 检查PM2进程数
- 优化代码逻辑
- 增加服务器配置

**问题2：内存不足**
- 增加服务器内存
- 优化内存使用
- 配置内存限制

**问题3：网络延迟**
- 使用CDN加速
- 优化网络配置
- 检查带宽使用

## 📞 技术支持

如果在部署过程中遇到问题，请：

1. 查看日志文件
2. 检查配置文件
3. 参考故障排除指南
4. 联系技术支持

---

**注意**：本部署指南仅供参考，实际部署时请根据具体环境进行调整。