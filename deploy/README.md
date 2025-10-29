# 直播系统部署文档

## 📋 概述

本目录包含了直播系统的完整部署配置，支持Docker容器化部署和传统服务器部署两种方式。

## 🚀 快速开始

### Docker部署（推荐）

1. **克隆项目**
```bash
git clone <your-repo-url>
cd live-system/deploy
```

2. **配置环境变量**
```bash
cp .env.example .env
# 编辑 .env 文件，配置必要的环境变量
```

3. **启动服务**
```bash
./start.sh
```

4. **停止服务**
```bash
./stop.sh
```

### 传统服务器部署

1. **安装依赖**
```bash
# 安装Node.js、Redis、Nginx等
# 参考 deploy-guide.md 中的详细说明
```

2. **配置服务**
```bash
# 配置环境变量
cp .env.example .env
# 编辑配置文件
```

3. **启动服务**
```bash
# 使用PM2启动
pm2 start ecosystem.config.js
```

## 📁 文件结构

```
deploy/
├── docker-compose.yml          # Docker Compose配置
├── docker-compose.prod.yml     # 生产环境配置
├── nginx.conf                  # Nginx配置
├── prometheus.yml              # Prometheus监控配置
├── filebeat.yml                # 日志收集配置
├── redis.conf                  # Redis配置
├── .env.example                # 环境变量示例
├── start.sh                    # 启动脚本
├── stop.sh                     # 停止脚本
└── README.md                   # 本文档
```

## 🔧 配置说明

### 环境变量

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| `PORT` | 服务端口 | 3000 |
| `NODE_ENV` | 运行环境 | production |
| `REDIS_HOST` | Redis主机 | redis |
| `REDIS_PORT` | Redis端口 | 6379 |
| `REDIS_PASSWORD` | Redis密码 | - |
| `JWT_SECRET` | JWT密钥 | - |
| `JWT_REFRESH_SECRET` | JWT刷新密钥 | - |
| `WECHAT_APPID` | 微信小程序AppID | - |
| `WECHAT_SECRET` | 微信小程序Secret | - |
| `NETEASE_APP_KEY` | 网易云AppKey | - |
| `NETEASE_APP_SECRET` | 网易云AppSecret | - |
| `CORS_ORIGIN` | CORS允许的域名 | - |
| `GRAFANA_PASSWORD` | Grafana密码 | - |

### 服务配置

#### 直播系统后端
- **端口**: 3000
- **健康检查**: `/health`
- **API文档**: `/api/docs`

#### Redis数据库
- **端口**: 6379
- **持久化**: AOF + RDB
- **内存策略**: allkeys-lru

#### Nginx反向代理
- **端口**: 80 (HTTP), 443 (HTTPS)
- **功能**: 负载均衡、SSL终止、静态文件服务

#### 监控服务
- **Prometheus**: 端口 9090
- **Grafana**: 端口 3001

## 🐳 Docker部署

### 开发环境

```bash
# 启动所有服务
docker-compose up -d

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down
```

### 生产环境

```bash
# 使用生产环境配置
docker-compose -f docker-compose.prod.yml up -d

# 查看服务状态
docker-compose -f docker-compose.prod.yml ps

# 停止服务
docker-compose -f docker-compose.prod.yml down
```

### 服务管理

```bash
# 重启特定服务
docker-compose restart live-server

# 查看服务日志
docker-compose logs live-server

# 进入容器
docker-compose exec live-server bash

# 更新服务
docker-compose pull
docker-compose up -d
```

## 📊 监控和日志

### 监控面板

- **Grafana**: http://localhost:3001
  - 用户名: admin
  - 密码: 在环境变量中配置

- **Prometheus**: http://localhost:9090

### 日志查看

```bash
# 查看所有服务日志
docker-compose logs -f

# 查看特定服务日志
docker-compose logs -f live-server

# 查看实时日志
docker-compose logs -f --tail=100 live-server
```

### 健康检查

```bash
# 检查服务健康状态
curl http://localhost/health

# 检查API状态
curl http://localhost/api/health

# 检查Redis连接
docker-compose exec redis redis-cli ping
```

## 🔒 安全配置

### SSL证书

1. **获取SSL证书**
```bash
# 使用Let's Encrypt
certbot --nginx -d yourdomain.com
```

2. **配置Nginx**
```bash
# 编辑nginx.conf，启用HTTPS配置
# 取消注释HTTPS server块
```

### 防火墙

```bash
# 开放必要端口
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 22/tcp
sudo ufw enable
```

### 访问控制

- 配置CORS允许的域名
- 设置访问频率限制
- 启用请求验证
- 配置安全头

## 🚀 性能优化

### 资源限制

在 `docker-compose.prod.yml` 中配置资源限制：

```yaml
deploy:
  resources:
    limits:
      cpus: '2.0'
      memory: 2G
    reservations:
      cpus: '1.0'
      memory: 1G
```

### 缓存配置

- Redis缓存配置
- Nginx静态文件缓存
- 应用层缓存

### 负载均衡

- 多实例部署
- Nginx负载均衡
- 数据库读写分离

## 🔄 备份和恢复

### 数据备份

```bash
# 备份Redis数据
docker-compose exec redis redis-cli --rdb /data/backup.rdb

# 备份应用数据
docker-compose exec live-server tar -czf /app/backup.tar.gz /app/uploads
```

### 数据恢复

```bash
# 恢复Redis数据
docker-compose exec redis redis-cli --rdb /data/backup.rdb

# 恢复应用数据
docker-compose exec live-server tar -xzf /app/backup.tar.gz -C /
```

## 🐛 故障排除

### 常见问题

1. **服务启动失败**
   - 检查端口占用
   - 查看服务日志
   - 验证环境变量配置

2. **数据库连接失败**
   - 检查Redis服务状态
   - 验证连接配置
   - 查看网络连接

3. **API访问失败**
   - 检查Nginx配置
   - 验证服务健康状态
   - 查看防火墙设置

### 调试命令

```bash
# 查看容器状态
docker-compose ps

# 查看资源使用
docker stats

# 查看网络连接
docker network ls
docker network inspect deploy_live-network

# 查看日志
docker-compose logs --tail=100 live-server
```

## 📞 技术支持

如果在部署过程中遇到问题：

1. 查看日志文件
2. 检查配置文件
3. 参考故障排除指南
4. 联系技术支持

---

**注意**: 本部署配置仅供参考，实际部署时请根据具体环境进行调整。