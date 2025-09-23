# 部署指南

本文档提供了API代理服务器在不同环境中的部署指南。

## 🚀 部署方式

### 1. Node.js 直接部署

#### 环境要求
- Node.js 16.0.0+
- npm 或 yarn
- 操作系统：Linux, macOS, Windows

#### 部署步骤

```bash
# 1. 克隆项目
git clone <repository-url>
cd api-proxy

# 2. 安装依赖
npm install --production

# 3. 配置环境变量
cp .env.example .env
nano .env

# 4. 创建日志目录
mkdir -p logs

# 5. 启动服务
npm start
```

#### 使用PM2管理进程

```bash
# 安装PM2
npm install -g pm2

# 创建PM2配置文件
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'api-proxy',
    script: 'src/index.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    log_file: 'logs/pm2.log',
    out_file: 'logs/pm2-out.log',
    error_file: 'logs/pm2-error.log',
    max_memory_restart: '1G'
  }]
};
EOF

# 启动
pm2 start ecosystem.config.js

# 设置开机自启
pm2 startup
pm2 save
```

### 2. Docker 部署

#### Dockerfile

创建 `Dockerfile`：

```dockerfile
FROM node:18-alpine

# 设置工作目录
WORKDIR /app

# 复制package文件
COPY package*.json ./

# 安装依赖
RUN npm install --production

# 复制源代码
COPY . .

# 创建日志目录
RUN mkdir -p logs

# 暴露端口
EXPOSE 3000

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# 启动应用
CMD ["npm", "start"]
```

#### Docker Compose

创建 `docker-compose.yml`：

```yaml
version: '3.8'

services:
  api-proxy:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - PORT=3000
      - LOG_LEVEL=info
    volumes:
      - ./logs:/app/logs
      - ./config:/app/config
      - ./examples/protos:/app/protos
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
    networks:
      - api-proxy-network

  # 可选：添加Redis用于缓存
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    restart: unless-stopped
    networks:
      - api-proxy-network

volumes:
  redis_data:

networks:
  api-proxy-network:
    driver: bridge
```

#### 构建和运行

```bash
# 构建镜像
docker-compose build

# 启动服务
docker-compose up -d

# 查看日志
docker-compose logs -f api-proxy

# 停止服务
docker-compose down
```

### 3. Kubernetes 部署

#### Deployment

创建 `k8s/deployment.yaml`：

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: api-proxy
  labels:
    app: api-proxy
spec:
  replicas: 3
  selector:
    matchLabels:
      app: api-proxy
  template:
    metadata:
      labels:
        app: api-proxy
    spec:
      containers:
      - name: api-proxy
        image: api-proxy:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
        - name: PORT
          value: "3000"
        - name: LOG_LEVEL
          value: "info"
        - name: JWT_SECRET
          valueFrom:
            secretKeyRef:
              name: api-proxy-secrets
              key: jwt-secret
        resources:
          limits:
            cpu: 500m
            memory: 512Mi
          requests:
            cpu: 200m
            memory: 256Mi
        livenessProbe:
          httpGet:
            path: /health/live
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health/ready
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
        volumeMounts:
        - name: config-volume
          mountPath: /app/config
          readOnly: true
        - name: proto-volume
          mountPath: /app/protos
          readOnly: true
      volumes:
      - name: config-volume
        configMap:
          name: api-proxy-config
      - name: proto-volume
        configMap:
          name: api-proxy-protos
```

#### Service

创建 `k8s/service.yaml`：

```yaml
apiVersion: v1
kind: Service
metadata:
  name: api-proxy-service
  labels:
    app: api-proxy
spec:
  selector:
    app: api-proxy
  ports:
  - port: 80
    targetPort: 3000
    protocol: TCP
  type: ClusterIP
```

#### Ingress

创建 `k8s/ingress.yaml`：

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: api-proxy-ingress
  annotations:
    nginx.ingress.kubernetes.io/rewrite-target: /
    nginx.ingress.kubernetes.io/rate-limit: "100"
    nginx.ingress.kubernetes.io/rate-limit-window: "1m"
spec:
  rules:
  - host: api-proxy.yourdomain.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: api-proxy-service
            port:
              number: 80
```

#### ConfigMap

创建 `k8s/configmap.yaml`：

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: api-proxy-config
data:
  default.json: |
    {
      "server": {
        "port": 3000,
        "host": "0.0.0.0",
        "timeout": 30000
      },
      "apis": {
        "endpoints": [
          {
            "name": "example-api",
            "type": "http",
            "baseUrl": "https://api.example.com",
            "path": "/api/v1/example/*"
          }
        ]
      }
    }
```

#### Secret

创建 `k8s/secret.yaml`：

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: api-proxy-secrets
type: Opaque
data:
  jwt-secret: <base64-encoded-jwt-secret>
```

#### 部署到Kubernetes

```bash
# 创建命名空间
kubectl create namespace api-proxy

# 应用配置
kubectl apply -f k8s/ -n api-proxy

# 查看部署状态
kubectl get pods -n api-proxy
kubectl get services -n api-proxy

# 查看日志
kubectl logs -f deployment/api-proxy -n api-proxy
```

### 4. 云平台部署

#### AWS ECS

1. 创建ECR仓库
2. 构建并推送Docker镜像
3. 创建ECS任务定义
4. 部署到ECS服务

#### Google Cloud Run

```bash
# 构建镜像
gcloud builds submit --tag gcr.io/PROJECT-ID/api-proxy

# 部署到Cloud Run
gcloud run deploy api-proxy \
  --image gcr.io/PROJECT-ID/api-proxy \
  --port 3000 \
  --allow-unauthenticated \
  --memory 512Mi \
  --cpu 1 \
  --min-instances 1 \
  --max-instances 10
```

#### Azure Container Instances

```bash
# 创建资源组
az group create --name api-proxy-rg --location eastus

# 部署容器
az container create \
  --resource-group api-proxy-rg \
  --name api-proxy \
  --image api-proxy:latest \
  --dns-name-label api-proxy \
  --ports 3000 \
  --environment-variables NODE_ENV=production
```

## 🔧 生产环境配置

### 环境变量

```bash
# 服务配置
NODE_ENV=production
PORT=3000
HOST=0.0.0.0

# 认证
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRATION=1h

# 日志
LOG_LEVEL=info

# 安全
ENABLE_CORS=true
ENABLE_HELMET=true
ENABLE_RATE_LIMIT=true

# 外部服务API密钥
GITHUB_TOKEN=your-github-token
OPENAI_API_KEY=your-openai-key
```

### 反向代理配置

#### Nginx

```nginx
upstream api_proxy {
    server 127.0.0.1:3000;
    server 127.0.0.1:3001;
    server 127.0.0.1:3002;
}

server {
    listen 80;
    server_name api-proxy.yourdomain.com;
    
    # 重定向到HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api-proxy.yourdomain.com;
    
    ssl_certificate /path/to/certificate.crt;
    ssl_certificate_key /path/to/private.key;
    
    # 安全配置
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    
    # 代理配置
    location / {
        proxy_pass http://api_proxy;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # 超时设置
        proxy_connect_timeout 30s;
        proxy_send_timeout 30s;
        proxy_read_timeout 30s;
        
        # 缓冲设置
        proxy_buffering on;
        proxy_buffer_size 4k;
        proxy_buffers 8 4k;
    }
    
    # 健康检查
    location /health {
        proxy_pass http://api_proxy;
        access_log off;
    }
    
    # 静态文件缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

#### Apache

```apache
<VirtualHost *:80>
    ServerName api-proxy.yourdomain.com
    Redirect permanent / https://api-proxy.yourdomain.com/
</VirtualHost>

<VirtualHost *:443>
    ServerName api-proxy.yourdomain.com
    
    SSLEngine on
    SSLCertificateFile /path/to/certificate.crt
    SSLCertificateKeyFile /path/to/private.key
    
    # 代理配置
    ProxyPreserveHost On
    ProxyRequests Off
    
    ProxyPass / http://localhost:3000/
    ProxyPassReverse / http://localhost:3000/
    
    # 安全头
    Header always set X-Frame-Options DENY
    Header always set X-Content-Type-Options nosniff
    Header always set X-XSS-Protection "1; mode=block"
    
    # 日志
    ErrorLog logs/api-proxy-error.log
    CustomLog logs/api-proxy-access.log combined
</VirtualHost>
```

## 📊 监控和日志

### 日志聚合

#### ELK Stack

```yaml
# docker-compose.yml 添加
services:
  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:8.8.0
    environment:
      - discovery.type=single-node
      - xpack.security.enabled=false
    ports:
      - "9200:9200"
    
  logstash:
    image: docker.elastic.co/logstash/logstash:8.8.0
    volumes:
      - ./logstash/pipeline:/usr/share/logstash/pipeline
    depends_on:
      - elasticsearch
      
  kibana:
    image: docker.elastic.co/kibana/kibana:8.8.0
    ports:
      - "5601:5601"
    depends_on:
      - elasticsearch
```

#### Prometheus监控

添加监控端点到应用：

```javascript
// src/routes/metrics.js
const express = require('express');
const client = require('prom-client');

const register = new client.Registry();
client.collectDefaultMetrics({ register });

const httpRequestsTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code']
});

const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route']
});

register.registerMetric(httpRequestsTotal);
register.registerMetric(httpRequestDuration);

const router = express.Router();

router.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

module.exports = router;
```

### Grafana仪表板

创建Grafana仪表板监控关键指标：
- 请求率 (RPS)
- 响应时间
- 错误率
- 系统资源使用情况

## 🔒 安全配置

### SSL/TLS

```bash
# 使用Let's Encrypt获取证书
certbot --nginx -d api-proxy.yourdomain.com

# 或使用Cloudflare
```

### 防火墙

```bash
# ufw配置
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS
ufw deny 3000/tcp   # 阻止直接访问应用端口
ufw --force enable
```

### 速率限制

在Nginx中添加速率限制：

```nginx
http {
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    
    server {
        location /api/ {
            limit_req zone=api burst=20 nodelay;
        }
    }
}
```

## 🚨 故障排除

### 常见问题

1. **端口占用**
   ```bash
   sudo lsof -i :3000
   sudo kill -9 <PID>
   ```

2. **内存不足**
   ```bash
   # 增加swap空间
   sudo fallocate -l 2G /swapfile
   sudo chmod 600 /swapfile
   sudo mkswap /swapfile
   sudo swapon /swapfile
   ```

3. **文件描述符限制**
   ```bash
   # 增加限制
   echo "* soft nofile 65536" >> /etc/security/limits.conf
   echo "* hard nofile 65536" >> /etc/security/limits.conf
   ```

### 性能调优

1. **Node.js参数**
   ```bash
   node --max-old-space-size=2048 src/index.js
   ```

2. **集群模式**
   ```javascript
   // cluster.js
   const cluster = require('cluster');
   const numCPUs = require('os').cpus().length;

   if (cluster.isMaster) {
     for (let i = 0; i < numCPUs; i++) {
       cluster.fork();
     }
   } else {
     require('./src/index.js');
   }
   ```

### 备份和恢复

1. **配置备份**
   ```bash
   tar -czf backup-$(date +%Y%m%d).tar.gz config/ logs/
   ```

2. **自动备份脚本**
   ```bash
   #!/bin/bash
   # backup.sh
   DATE=$(date +%Y%m%d_%H%M%S)
   tar -czf /backup/api-proxy-$DATE.tar.gz /app/config /app/logs
   find /backup -name "api-proxy-*.tar.gz" -mtime +7 -delete
   ```

## 📈 扩展性

### 水平扩展

1. **负载均衡器**
   - AWS Application Load Balancer
   - Google Cloud Load Balancer
   - Nginx负载均衡

2. **容器编排**
   - Kubernetes HPA (Horizontal Pod Autoscaler)
   - Docker Swarm

3. **数据库分离**
   - 配置存储到数据库
   - Redis缓存
   - MongoDB文档存储

### 高可用部署

1. **多区域部署**
2. **故障转移**
3. **健康检查和自动恢复**

---

选择适合您环境的部署方式，确保在生产环境中进行充分的测试和监控配置。