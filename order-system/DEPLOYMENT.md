# 订单系统部署指南

## 系统要求

### 最低配置
- **CPU**: 2核心
- **内存**: 4GB RAM
- **存储**: 20GB 可用空间
- **网络**: 100Mbps

### 推荐配置
- **CPU**: 4核心
- **内存**: 8GB RAM
- **存储**: 50GB SSD
- **网络**: 1Gbps

## 环境准备

### 1. 操作系统
推荐使用以下操作系统之一：
- Ubuntu 20.04 LTS
- CentOS 8
- Debian 11
- Windows Server 2019

### 2. 软件依赖

#### Node.js 安装
```bash
# Ubuntu/Debian
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# CentOS/RHEL
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs

# 验证安装
node --version
npm --version
```

#### MySQL 安装
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install mysql-server
sudo mysql_secure_installation

# CentOS/RHEL
sudo yum install mysql-server
sudo systemctl start mysqld
sudo systemctl enable mysqld
sudo mysql_secure_installation

# 验证安装
mysql --version
```

#### Nginx 安装（可选）
```bash
# Ubuntu/Debian
sudo apt install nginx

# CentOS/RHEL
sudo yum install nginx

# 启动服务
sudo systemctl start nginx
sudo systemctl enable nginx
```

## 数据库配置

### 1. 创建数据库
```sql
-- 登录MySQL
mysql -u root -p

-- 创建数据库
CREATE DATABASE order_system CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 创建用户（可选）
CREATE USER 'order_user'@'localhost' IDENTIFIED BY 'your_secure_password';
GRANT ALL PRIVILEGES ON order_system.* TO 'order_user'@'localhost';
FLUSH PRIVILEGES;
```

### 2. 导入数据库结构
```bash
mysql -u root -p order_system < database/schema.sql
```

### 3. 配置MySQL
编辑 `/etc/mysql/mysql.conf.d/mysqld.cnf`：
```ini
[mysqld]
# 基本配置
port = 3306
bind-address = 127.0.0.1

# 字符集配置
character-set-server = utf8mb4
collation-server = utf8mb4_unicode_ci

# 性能优化
max_connections = 200
innodb_buffer_pool_size = 1G
innodb_log_file_size = 256M

# 安全配置
sql_mode = STRICT_TRANS_TABLES,NO_ZERO_DATE,NO_ZERO_IN_DATE,ERROR_FOR_DIVISION_BY_ZERO
```

重启MySQL服务：
```bash
sudo systemctl restart mysql
```

## 后端部署

### 1. 下载项目
```bash
# 克隆项目
git clone <repository-url>
cd order-system

# 或下载压缩包
wget <download-url>
unzip order-system.zip
cd order-system
```

### 2. 安装依赖
```bash
cd backend
npm install --production
```

### 3. 配置环境变量
```bash
cp .env.example .env
nano .env
```

编辑 `.env` 文件：
```env
# 数据库配置
DB_HOST=localhost
DB_PORT=3306
DB_NAME=order_system
DB_USER=root
DB_PASSWORD=your_mysql_password

# JWT配置
JWT_SECRET=your_very_secure_jwt_secret_key_here
JWT_EXPIRES_IN=24h

# 服务器配置
PORT=3000
NODE_ENV=production

# 支付配置（可选）
PAYMENT_GATEWAY_URL=https://api.payment-gateway.com
PAYMENT_API_KEY=your_payment_api_key

# 邮件配置（可选）
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
```

### 4. 测试配置
```bash
# 测试数据库连接
node -e "
const { testConnection } = require('./config/database');
testConnection().then(() => console.log('数据库连接成功')).catch(console.error);
"
```

### 5. 启动服务

#### 开发模式
```bash
npm run dev
```

#### 生产模式
```bash
npm start
```

#### 使用PM2（推荐）
```bash
# 安装PM2
npm install -g pm2

# 启动应用
pm2 start server.js --name "order-system"

# 保存配置
pm2 save

# 设置开机自启
pm2 startup
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u $USER --hp $HOME

# 查看状态
pm2 status
pm2 logs order-system
```

## 前端部署

### 1. 配置API地址
编辑 `frontend/js/api.js`：
```javascript
// 修改API基础URL
const API_BASE_URL = 'http://your-domain.com:3000/api';
```

### 2. 部署到Web服务器

#### 使用Nginx
```bash
# 复制前端文件到Web目录
sudo cp -r frontend/* /var/www/html/

# 配置Nginx
sudo nano /etc/nginx/sites-available/order-system
```

Nginx配置：
```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /var/www/html;
    index index.html;

    # 前端路由
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API代理
    location /api {
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

    # 静态文件缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

启用站点：
```bash
sudo ln -s /etc/nginx/sites-available/order-system /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

#### 使用Apache
```bash
# 复制前端文件
sudo cp -r frontend/* /var/www/html/

# 配置Apache
sudo nano /etc/apache2/sites-available/order-system.conf
```

Apache配置：
```apache
<VirtualHost *:80>
    ServerName your-domain.com
    DocumentRoot /var/www/html
    
    # API代理
    ProxyPreserveHost On
    ProxyPass /api http://localhost:3000/api
    ProxyPassReverse /api http://localhost:3000/api
    
    # 静态文件
    <Directory /var/www/html>
        AllowOverride All
        Require all granted
    </Directory>
</VirtualHost>
```

启用站点：
```bash
sudo a2ensite order-system
sudo a2enmod proxy
sudo a2enmod proxy_http
sudo systemctl reload apache2
```

## SSL证书配置

### 使用Let's Encrypt（免费）
```bash
# 安装Certbot
sudo apt install certbot python3-certbot-nginx

# 获取证书
sudo certbot --nginx -d your-domain.com

# 自动续期
sudo crontab -e
# 添加：0 12 * * * /usr/bin/certbot renew --quiet
```

### 使用自签名证书（测试）
```bash
# 生成私钥
sudo openssl genrsa -out /etc/ssl/private/order-system.key 2048

# 生成证书
sudo openssl req -new -x509 -key /etc/ssl/private/order-system.key -out /etc/ssl/certs/order-system.crt -days 365

# 配置Nginx
sudo nano /etc/nginx/sites-available/order-system
```

添加SSL配置：
```nginx
server {
    listen 443 ssl http2;
    server_name your-domain.com;
    
    ssl_certificate /etc/ssl/certs/order-system.crt;
    ssl_certificate_key /etc/ssl/private/order-system.key;
    
    # SSL配置
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    
    # 其他配置...
}

# HTTP重定向到HTTPS
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}
```

## 监控和日志

### 1. 系统监控
```bash
# 安装htop
sudo apt install htop

# 监控系统资源
htop

# 监控磁盘使用
df -h

# 监控内存使用
free -h
```

### 2. 应用监控
```bash
# PM2监控
pm2 monit

# 查看日志
pm2 logs order-system

# 重启应用
pm2 restart order-system
```

### 3. 数据库监控
```sql
-- 查看连接数
SHOW STATUS LIKE 'Threads_connected';

-- 查看查询缓存
SHOW STATUS LIKE 'Qcache%';

-- 查看慢查询
SHOW VARIABLES LIKE 'slow_query_log';
```

## 备份策略

### 1. 数据库备份
```bash
# 创建备份脚本
sudo nano /usr/local/bin/backup-db.sh
```

备份脚本：
```bash
#!/bin/bash
BACKUP_DIR="/var/backups/order-system"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="order_system"
DB_USER="root"
DB_PASS="your_password"

mkdir -p $BACKUP_DIR

mysqldump -u$DB_USER -p$DB_PASS $DB_NAME > $BACKUP_DIR/backup_$DATE.sql

# 压缩备份
gzip $BACKUP_DIR/backup_$DATE.sql

# 删除7天前的备份
find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +7 -delete

echo "数据库备份完成: backup_$DATE.sql.gz"
```

设置定时任务：
```bash
sudo chmod +x /usr/local/bin/backup-db.sh
sudo crontab -e
# 添加：0 2 * * * /usr/local/bin/backup-db.sh
```

### 2. 应用备份
```bash
# 备份应用文件
tar -czf /var/backups/order-system-app-$(date +%Y%m%d).tar.gz /path/to/order-system

# 备份配置文件
cp /path/to/order-system/backend/.env /var/backups/
```

## 性能优化

### 1. 数据库优化
```sql
-- 添加索引
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at);

-- 优化查询
EXPLAIN SELECT * FROM orders WHERE user_id = 1 AND status = 'pending';
```

### 2. 应用优化
```javascript
// 启用压缩
const compression = require('compression');
app.use(compression());

// 启用缓存
const redis = require('redis');
const client = redis.createClient();
```

### 3. 前端优化
```html
<!-- 启用Gzip压缩 -->
<!-- 使用CDN -->
<!-- 压缩图片 -->
<!-- 合并CSS/JS文件 -->
```

## 故障排除

### 常见问题

1. **数据库连接失败**
   ```bash
   # 检查MySQL服务
   sudo systemctl status mysql
   
   # 检查端口
   netstat -tlnp | grep 3306
   
   # 检查防火墙
   sudo ufw status
   ```

2. **应用启动失败**
   ```bash
   # 检查端口占用
   netstat -tlnp | grep 3000
   
   # 检查日志
   pm2 logs order-system
   
   # 检查环境变量
   pm2 show order-system
   ```

3. **前端无法访问API**
   ```bash
   # 检查CORS配置
   # 检查代理配置
   # 检查防火墙规则
   ```

### 日志位置
- 应用日志：`pm2 logs order-system`
- Nginx日志：`/var/log/nginx/`
- MySQL日志：`/var/log/mysql/`
- 系统日志：`/var/log/syslog`

## 安全建议

1. **定期更新系统**
   ```bash
   sudo apt update && sudo apt upgrade
   ```

2. **配置防火墙**
   ```bash
   sudo ufw enable
   sudo ufw allow 22
   sudo ufw allow 80
   sudo ufw allow 443
   ```

3. **使用强密码**
4. **定期备份数据**
5. **监控异常访问**
6. **使用HTTPS**
7. **限制数据库访问**

## 维护计划

### 日常维护
- 检查系统资源使用情况
- 查看应用日志
- 监控数据库性能

### 周维护
- 清理日志文件
- 检查备份状态
- 更新安全补丁

### 月维护
- 性能优化分析
- 安全审计
- 容量规划

## 联系支持

如遇到部署问题，请联系：
- 邮箱：support@example.com
- 文档：https://docs.example.com
- 社区：https://community.example.com