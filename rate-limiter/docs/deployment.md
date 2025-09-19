# 部署指南

本文档详细说明如何在不同环境中部署接口防刷系统。

## 🚀 快速部署

### Docker 部署

#### 1. 创建 Dockerfile

```dockerfile
# Node.js 版本
FROM node:18-alpine

WORKDIR /app

# 复制依赖文件
COPY package*.json ./

# 安装依赖
RUN npm ci --only=production

# 复制源码
COPY . .

# 暴露端口
EXPOSE 3000

# 启动应用
CMD ["node", "examples/express-example.js"]
```

#### 2. 创建 docker-compose.yml

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - REDIS_URL=redis://redis:6379
    depends_on:
      - redis
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    command: redis-server --appendonly yes
    restart: unless-stopped

volumes:
  redis_data:
```

#### 3. 启动服务

```bash
# 构建并启动
docker-compose up -d

# 查看日志
docker-compose logs -f app

# 停止服务
docker-compose down
```

### Kubernetes 部署

#### 1. 创建 ConfigMap

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: rate-limiter-config
data:
  config.js: |
    module.exports = {
      redis: {
        url: process.env.REDIS_URL || 'redis://redis-service:6379'
      },
      apiProtection: {
        rateLimit: {
          windowMs: 60000,
          max: 100
        }
      }
    };
```

#### 2. 创建 Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: rate-limiter
spec:
  replicas: 3
  selector:
    matchLabels:
      app: rate-limiter
  template:
    metadata:
      labels:
        app: rate-limiter
    spec:
      containers:
      - name: rate-limiter
        image: your-registry/rate-limiter:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
        - name: REDIS_URL
          value: "redis://redis-service:6379"
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
```

#### 3. 创建 Service

```yaml
apiVersion: v1
kind: Service
metadata:
  name: rate-limiter-service
spec:
  selector:
    app: rate-limiter
  ports:
  - protocol: TCP
    port: 80
    targetPort: 3000
  type: ClusterIP
```

## 🔧 环境配置

### 生产环境

#### 1. 环境变量配置

```bash
# .env 文件
NODE_ENV=production
PORT=3000
REDIS_URL=redis://your-redis-host:6379
LOG_LEVEL=info

# 安全配置
RATE_LIMIT_ENABLED=true
MAX_REQUESTS_PER_MINUTE=100
BLOCK_DURATION_HOURS=24

# 监控配置
METRICS_ENABLED=true
HEALTH_CHECK_ENABLED=true

# 通知配置
WEBHOOK_URL=https://your-webhook-url.com/alerts
EMAIL_NOTIFICATIONS=true
SMTP_HOST=smtp.your-provider.com
SMTP_USER=your-email@domain.com
SMTP_PASS=your-password
```

#### 2. Redis 集群配置

```javascript
// config/production.js
module.exports = {
  redis: {
    cluster: {
      enableReadyCheck: false,
      redisOptions: {
        password: process.env.REDIS_PASSWORD
      },
      nodes: [
        { host: 'redis-1.cluster.local', port: 6379 },
        { host: 'redis-2.cluster.local', port: 6379 },
        { host: 'redis-3.cluster.local', port: 6379 }
      ]
    }
  }
};
```

#### 3. 负载均衡配置

```nginx
# nginx.conf
upstream rate_limiter_backend {
    server 127.0.0.1:3001 weight=1 max_fails=3 fail_timeout=30s;
    server 127.0.0.1:3002 weight=1 max_fails=3 fail_timeout=30s;
    server 127.0.0.1:3003 weight=1 max_fails=3 fail_timeout=30s;
}

server {
    listen 80;
    server_name your-domain.com;

    # 获取真实IP
    set_real_ip_from 10.0.0.0/8;
    set_real_ip_from 172.16.0.0/12;
    set_real_ip_from 192.168.0.0/16;
    real_ip_header X-Forwarded-For;
    real_ip_recursive on;

    location / {
        proxy_pass http://rate_limiter_backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # 超时设置
        proxy_connect_timeout 5s;
        proxy_send_timeout 10s;
        proxy_read_timeout 10s;
    }

    # 健康检查
    location /health {
        proxy_pass http://rate_limiter_backend/health;
        access_log off;
    }
}
```

### 开发环境

#### 1. 本地开发配置

```javascript
// config/development.js
module.exports = {
  app: {
    port: 3000,
    env: 'development'
  },
  
  redis: {
    url: 'redis://localhost:6379'
  },
  
  apiProtection: {
    enabled: true,
    logLevel: 'debug',
    
    rateLimit: {
      max: 1000,  // 开发时更宽松的限制
      windowMs: 60 * 1000
    },
    
    ipFilter: {
      autoBlock: false,  // 开发时不自动封禁
      maxViolations: 100
    }
  },
  
  logging: {
    level: 'debug',
    format: 'simple'
  }
};
```

#### 2. 开发启动脚本

```json
{
  "scripts": {
    "dev": "nodemon --inspect examples/express-example.js",
    "dev:redis": "docker run --rm -p 6379:6379 redis:alpine",
    "dev:full": "docker-compose -f docker-compose.dev.yml up"
  }
}
```

## 📊 监控部署

### Prometheus 监控

#### 1. 添加 Prometheus 指标

```javascript
// monitoring/prometheus.js
const prometheus = require('prom-client');

// 创建指标
const rateLimitCounter = new prometheus.Counter({
  name: 'rate_limit_requests_total',
  help: 'Total number of rate limited requests',
  labelNames: ['method', 'route', 'status']
});

const blockedIpsGauge = new prometheus.Gauge({
  name: 'blocked_ips_total',
  help: 'Total number of blocked IPs'
});

// 导出指标
app.get('/metrics', (req, res) => {
  res.set('Content-Type', prometheus.register.contentType);
  res.end(prometheus.register.metrics());
});
```

#### 2. Grafana 仪表板配置

```json
{
  "dashboard": {
    "title": "Rate Limiter Dashboard",
    "panels": [
      {
        "title": "Request Rate",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(rate_limit_requests_total[5m])"
          }
        ]
      },
      {
        "title": "Blocked IPs",
        "type": "stat",
        "targets": [
          {
            "expr": "blocked_ips_total"
          }
        ]
      }
    ]
  }
}
```

### ELK Stack 日志监控

#### 1. Logstash 配置

```ruby
# logstash.conf
input {
  file {
    path => "/var/log/rate-limiter/*.log"
    codec => "json"
  }
}

filter {
  if [type] == "security" {
    mutate {
      add_tag => ["security_event"]
    }
  }
}

output {
  elasticsearch {
    hosts => ["elasticsearch:9200"]
    index => "rate-limiter-%{+YYYY.MM.dd}"
  }
}
```

#### 2. Kibana 仪表板

- 创建索引模式：`rate-limiter-*`
- 配置可视化：
  - 请求频率趋势图
  - 被阻止的IP地理分布
  - 安全事件时间线
  - 错误率统计

## 🔒 安全加固

### 1. 系统级安全

```bash
# 创建专用用户
sudo useradd -r -s /bin/false rate-limiter

# 设置文件权限
sudo chown -R rate-limiter:rate-limiter /opt/rate-limiter
sudo chmod -R 750 /opt/rate-limiter

# 防火墙配置
sudo ufw allow 3000/tcp
sudo ufw enable
```

### 2. 应用级安全

```javascript
// 安全中间件
const helmet = require('helmet');
const compression = require('compression');

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"]
    }
  }
}));

app.use(compression());

// 隐藏服务器信息
app.disable('x-powered-by');
```

### 3. 数据加密

```javascript
// Redis 连接加密
const redis = require('redis');

const client = redis.createClient({
  url: 'rediss://your-redis-host:6380',  // 使用 SSL
  tls: {
    cert: fs.readFileSync('path/to/cert.pem'),
    key: fs.readFileSync('path/to/key.pem'),
    ca: fs.readFileSync('path/to/ca.pem')
  }
});
```

## 🚀 性能优化

### 1. 应用优化

```javascript
// 启用集群模式
const cluster = require('cluster');
const numCPUs = require('os').cpus().length;

if (cluster.isMaster) {
  console.log(`Master ${process.pid} is running`);

  // Fork workers
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  cluster.on('exit', (worker, code, signal) => {
    console.log(`Worker ${worker.process.pid} died`);
    cluster.fork();
  });
} else {
  // Workers can share any TCP port
  require('./app.js');
  console.log(`Worker ${process.pid} started`);
}
```

### 2. Redis 优化

```redis
# redis.conf 优化配置
maxmemory 2gb
maxmemory-policy allkeys-lru
save 900 1
save 300 10
save 60 10000

# 网络优化
tcp-keepalive 300
timeout 0

# 持久化优化
appendonly yes
appendfsync everysec
```

### 3. 系统优化

```bash
# 增加文件描述符限制
echo "* soft nofile 65535" >> /etc/security/limits.conf
echo "* hard nofile 65535" >> /etc/security/limits.conf

# 优化内核参数
echo "net.core.somaxconn = 65535" >> /etc/sysctl.conf
echo "net.ipv4.tcp_max_syn_backlog = 65535" >> /etc/sysctl.conf
sysctl -p
```

## 🔄 备份和恢复

### 1. Redis 数据备份

```bash
#!/bin/bash
# backup-redis.sh

BACKUP_DIR="/backup/redis"
DATE=$(date +%Y%m%d_%H%M%S)

# 创建备份目录
mkdir -p $BACKUP_DIR

# 备份 Redis 数据
redis-cli --rdb $BACKUP_DIR/dump_$DATE.rdb

# 压缩备份文件
gzip $BACKUP_DIR/dump_$DATE.rdb

# 删除7天前的备份
find $BACKUP_DIR -name "*.rdb.gz" -mtime +7 -delete
```

### 2. 配置备份

```bash
#!/bin/bash
# backup-config.sh

CONFIG_DIR="/opt/rate-limiter/config"
BACKUP_DIR="/backup/config"
DATE=$(date +%Y%m%d_%H%M%S)

# 备份配置文件
tar -czf $BACKUP_DIR/config_$DATE.tar.gz $CONFIG_DIR

# 备份黑白名单数据
curl -s http://localhost:3000/admin/export-lists > $BACKUP_DIR/ip_lists_$DATE.json
```

## 🔍 故障排除

### 常见问题及解决方案

#### 1. Redis 连接问题

```bash
# 检查 Redis 状态
redis-cli ping

# 检查网络连接
telnet redis-host 6379

# 查看 Redis 日志
tail -f /var/log/redis/redis-server.log
```

#### 2. 内存使用过高

```javascript
// 监控内存使用
setInterval(() => {
  const used = process.memoryUsage();
  console.log('Memory usage:', {
    rss: Math.round(used.rss / 1024 / 1024) + 'MB',
    heapTotal: Math.round(used.heapTotal / 1024 / 1024) + 'MB',
    heapUsed: Math.round(used.heapUsed / 1024 / 1024) + 'MB'
  });
}, 30000);
```

#### 3. 性能问题诊断

```bash
# 使用 Node.js 性能分析
node --prof examples/express-example.js

# 生成性能报告
node --prof-process isolate-*.log > profile.txt

# 使用 clinic.js 诊断
npx clinic doctor -- node examples/express-example.js
```

## 📋 部署检查清单

### 部署前检查

- [ ] 配置文件已正确设置
- [ ] Redis 连接正常
- [ ] 环境变量已配置
- [ ] 安全设置已启用
- [ ] 监控系统已配置
- [ ] 备份策略已制定

### 部署后验证

- [ ] 健康检查接口正常
- [ ] 限流功能工作正常
- [ ] 日志记录正常
- [ ] 监控指标正常
- [ ] 性能表现符合预期
- [ ] 安全功能有效

### 运维检查

- [ ] 定期检查系统资源使用
- [ ] 监控错误日志
- [ ] 定期更新黑白名单
- [ ] 备份数据完整性检查
- [ ] 安全事件响应流程测试

通过遵循这个部署指南，您可以在各种环境中安全、高效地部署接口防刷系统。