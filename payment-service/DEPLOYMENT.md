# 支付服务部署指南

本文档介绍如何部署支付服务到不同环境。

## 目录

1. [本地开发环境](#本地开发环境)
2. [Docker部署](#docker部署)
3. [生产环境部署](#生产环境部署)
4. [监控和日志](#监控和日志)
5. [故障排除](#故障排除)

## 本地开发环境

### 前置要求
- Node.js >= 14.0.0
- MongoDB >= 4.0
- npm >= 6.0.0

### 安装步骤

1. **克隆代码**
```bash
git clone <repository_url>
cd payment-service
```

2. **安装依赖**
```bash
npm install
```

3. **配置环境变量**
```bash
cp .env.example .env
# 编辑 .env 文件
```

4. **启动 MongoDB**
```bash
# 使用 Docker
docker run -d --name mongodb -p 27017:27017 mongo:7.0

# 或使用本地安装的 MongoDB
mongod --dbpath /path/to/data/db
```

5. **启动服务**
```bash
# 开发模式（自动重启）
npm run dev

# 或普通启动
npm start
```

6. **验证部署**
```bash
curl http://localhost:3000/health
```

## Docker部署

### 使用 Docker Compose（推荐）

1. **启动所有服务**
```bash
docker-compose up -d
```

2. **查看服务状态**
```bash
docker-compose ps
```

3. **查看日志**
```bash
# 查看所有服务日志
docker-compose logs -f

# 查看特定服务日志
docker-compose logs -f payment_service
```

4. **停止服务**
```bash
docker-compose down
```

### 单独使用 Docker

1. **构建镜像**
```bash
docker build -t payment-service .
```

2. **运行容器**
```bash
docker run -d \
  --name payment-service \
  -p 3000:3000 \
  -e MONGODB_URI=mongodb://host.docker.internal:27017/payment_service \
  payment-service
```

## 生产环境部署

### 环境准备

1. **服务器要求**
   - CPU: 2核心以上
   - 内存: 4GB以上
   - 存储: 50GB以上
   - 操作系统: Ubuntu 20.04+ / CentOS 8+

2. **安装依赖**
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install -y nodejs npm mongodb nginx

# CentOS/RHEL
sudo yum install -y nodejs npm mongodb-org nginx
```

### 部署步骤

1. **创建用户**
```bash
sudo useradd -m -s /bin/bash payment
sudo su - payment
```

2. **部署代码**
```bash
git clone <repository_url>
cd payment-service
npm ci --only=production
```

3. **配置环境变量**
```bash
cp .env.example .env
# 编辑生产环境配置
nano .env
```

生产环境 `.env` 示例：
```env
NODE_ENV=production
PORT=3000
MONGODB_URI=mongodb://payment_user:password@localhost:27017/payment_service
LOG_LEVEL=info

# 支付网关配置
ALIPAY_APP_ID=your_production_alipay_app_id
ALIPAY_PRIVATE_KEY=your_production_private_key
# ... 其他配置
```

4. **配置 PM2（进程管理）**
```bash
npm install -g pm2

# 创建 PM2 配置文件
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'payment-service',
    script: './app.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    max_memory_restart: '1G',
    node_args: '--max-old-space-size=1024'
  }]
};
EOF

# 启动服务
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

5. **配置 Nginx**
```bash
sudo cp nginx/nginx.conf /etc/nginx/sites-available/payment-service
sudo ln -s /etc/nginx/sites-available/payment-service /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

6. **配置防火墙**
```bash
sudo ufw allow 80
sudo ufw allow 443
sudo ufw allow 22
sudo ufw enable
```

### SSL证书配置

1. **使用 Let's Encrypt**
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

2. **手动配置SSL**
```bash
# 将证书文件放到 /etc/nginx/ssl/
sudo mkdir -p /etc/nginx/ssl
sudo cp cert.pem /etc/nginx/ssl/
sudo cp key.pem /etc/nginx/ssl/
sudo chmod 600 /etc/nginx/ssl/*
```

## 监控和日志

### 应用监控

1. **PM2 监控**
```bash
# 查看进程状态
pm2 status

# 查看详细信息
pm2 show payment-service

# 查看实时日志
pm2 logs payment-service

# 重启服务
pm2 restart payment-service
```

2. **系统监控**
```bash
# 查看系统资源使用
htop

# 查看磁盘使用
df -h

# 查看内存使用
free -h
```

### 日志管理

1. **应用日志**
```bash
# 查看应用日志
tail -f logs/combined.log

# 查看错误日志
tail -f logs/err.log

# 查看访问日志
sudo tail -f /var/log/nginx/access.log
```

2. **日志轮转配置**
```bash
# 创建 logrotate 配置
sudo tee /etc/logrotate.d/payment-service << EOF
/home/payment/payment-service/logs/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 payment payment
    postrotate
        pm2 reloadLogs
    endscript
}
EOF
```

### 健康检查脚本

创建健康检查脚本：
```bash
cat > health-check.sh << 'EOF'
#!/bin/bash

HEALTH_URL="http://localhost:3000/health"
RESPONSE=$(curl -s -w "%{http_code}" "$HEALTH_URL")
HTTP_CODE="${RESPONSE: -3}"

if [ "$HTTP_CODE" -eq 200 ]; then
    echo "$(date): 服务健康 ✓"
    exit 0
else
    echo "$(date): 服务异常 ✗ (HTTP $HTTP_CODE)"
    # 发送告警通知
    # send_alert "支付服务健康检查失败"
    exit 1
fi
EOF

chmod +x health-check.sh

# 添加到 crontab（每分钟检查一次）
echo "* * * * * /home/payment/payment-service/health-check.sh >> /home/payment/health-check.log 2>&1" | crontab -
```

## 数据库管理

### 备份策略

1. **自动备份脚本**
```bash
cat > backup.sh << 'EOF'
#!/bin/bash

BACKUP_DIR="/home/payment/backups"
DB_NAME="payment_service"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p "$BACKUP_DIR"

# 创建备份
mongodump --db "$DB_NAME" --out "$BACKUP_DIR/dump_$DATE"

# 压缩备份
tar -czf "$BACKUP_DIR/payment_service_$DATE.tar.gz" -C "$BACKUP_DIR" "dump_$DATE"
rm -rf "$BACKUP_DIR/dump_$DATE"

# 删除7天前的备份
find "$BACKUP_DIR" -name "*.tar.gz" -mtime +7 -delete

echo "$(date): 数据库备份完成: payment_service_$DATE.tar.gz"
EOF

chmod +x backup.sh

# 每天凌晨2点执行备份
echo "0 2 * * * /home/payment/payment-service/backup.sh >> /home/payment/backup.log 2>&1" | crontab -
```

2. **恢复数据**
```bash
# 解压备份
tar -xzf payment_service_YYYYMMDD_HHMMSS.tar.gz

# 恢复数据
mongorestore --db payment_service --drop dump_YYYYMMDD_HHMMSS/payment_service/
```

## 性能优化

### 数据库优化

1. **索引优化**
```javascript
// 连接 MongoDB
mongosh payment_service

// 查看索引使用情况
db.payments.getIndexes()

// 分析查询性能
db.payments.find({userId: "user_123"}).explain("executionStats")
```

2. **连接池配置**
```javascript
// 在 app.js 中优化 MongoDB 连接
mongoose.connect(process.env.MONGODB_URI, {
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  bufferCommands: false,
  bufferMaxEntries: 0
});
```

### 应用优化

1. **缓存配置**
```bash
# 安装 Redis
sudo apt install redis-server

# 启动 Redis
sudo systemctl start redis-server
sudo systemctl enable redis-server
```

2. **负载均衡**
```nginx
# 在 nginx.conf 中配置负载均衡
upstream payment_service {
    server 127.0.0.1:3000;
    server 127.0.0.1:3001;
    server 127.0.0.1:3002;
}
```

## 故障排除

### 常见问题

1. **服务无法启动**
```bash
# 检查端口占用
sudo netstat -tlnp | grep :3000

# 检查日志
pm2 logs payment-service
tail -f logs/err.log
```

2. **数据库连接失败**
```bash
# 检查 MongoDB 状态
sudo systemctl status mongodb

# 测试连接
mongosh $MONGODB_URI
```

3. **内存使用过高**
```bash
# 查看内存使用
pm2 monit

# 重启服务
pm2 restart payment-service
```

4. **磁盘空间不足**
```bash
# 清理日志文件
sudo logrotate -f /etc/logrotate.d/payment-service

# 清理 PM2 日志
pm2 flush payment-service
```

### 紧急处理

1. **服务降级**
```bash
# 临时禁用非核心功能
export MAINTENANCE_MODE=true
pm2 restart payment-service
```

2. **数据库只读模式**
```javascript
// 在 MongoDB 中设置只读
db.fsyncLock()

// 恢复读写
db.fsyncUnlock()
```

3. **回滚部署**
```bash
# 使用 PM2 回滚
pm2 reload ecosystem.config.js --update-env

# 或手动回滚代码
git checkout <previous_commit>
npm ci --only=production
pm2 restart payment-service
```

## 安全加固

### 系统安全

1. **更新系统**
```bash
sudo apt update && sudo apt upgrade -y
```

2. **配置防火墙**
```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable
```

3. **禁用不必要的服务**
```bash
sudo systemctl disable apache2
sudo systemctl disable sendmail
```

### 应用安全

1. **环境变量保护**
```bash
# 设置文件权限
chmod 600 .env
chown payment:payment .env
```

2. **日志脱敏**
```javascript
// 在代码中避免记录敏感信息
console.log('支付创建', { paymentId, amount }); // ✓
console.log('支付创建', paymentData); // ✗ 可能包含敏感信息
```

3. **定期更新依赖**
```bash
npm audit
npm audit fix
```

## 监控告警

### 配置告警

1. **创建告警脚本**
```bash
cat > alert.sh << 'EOF'
#!/bin/bash

send_alert() {
    local message="$1"
    
    # 发送邮件告警
    echo "$message" | mail -s "支付服务告警" admin@example.com
    
    # 发送钉钉/企业微信告警
    # curl -X POST "webhook_url" -d "{\"text\":\"$message\"}"
}

# 检查服务状态
if ! pm2 describe payment-service > /dev/null 2>&1; then
    send_alert "支付服务进程异常"
fi

# 检查数据库连接
if ! mongosh --eval "db.adminCommand('ismaster')" > /dev/null 2>&1; then
    send_alert "数据库连接异常"
fi

# 检查磁盘空间
DISK_USAGE=$(df / | awk 'NR==2 {print $5}' | sed 's/%//')
if [ "$DISK_USAGE" -gt 80 ]; then
    send_alert "磁盘空间不足: ${DISK_USAGE}%"
fi
EOF

chmod +x alert.sh

# 每5分钟执行一次检查
echo "*/5 * * * * /home/payment/payment-service/alert.sh" | crontab -
```

通过以上部署指南，您可以安全、稳定地将支付服务部署到生产环境。记住定期备份数据、监控系统状态，并及时更新安全补丁。