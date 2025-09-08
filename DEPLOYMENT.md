# 部署指南

## 部署方式

### 1. 直接部署

#### 环境要求
- Node.js 18+
- MySQL 8.0+
- 阿里云OSS账号

#### 部署步骤

```bash
# 1. 克隆代码
git clone <repository-url>
cd data-aggregation-service

# 2. 安装依赖
npm install

# 3. 配置环境变量
cp .env.example .env
# 编辑 .env 文件

# 4. 初始化数据库
mysql -u root -p < init.sql

# 5. 启动服务
npm start
```

### 2. Docker部署

#### 使用Docker Compose（推荐）

```bash
# 1. 配置环境变量
cp .env.example .env
# 编辑 .env 文件

# 2. 启动服务
docker-compose up -d

# 3. 查看日志
docker-compose logs -f data-aggregation
```

#### 使用Docker

```bash
# 1. 构建镜像
docker build -t data-aggregation .

# 2. 运行容器
docker run -d \
  --name data-aggregation \
  -p 3000:3000 \
  --env-file .env \
  -v $(pwd)/logs:/app/logs \
  -v $(pwd)/temp:/app/temp \
  data-aggregation
```

### 3. 云服务器部署

#### 使用PM2（推荐）

```bash
# 1. 安装PM2
npm install -g pm2

# 2. 启动服务
pm2 start server.js --name data-aggregation

# 3. 设置开机自启
pm2 startup
pm2 save
```

#### 使用systemd

创建服务文件 `/etc/systemd/system/data-aggregation.service`：

```ini
[Unit]
Description=Data Aggregation Service
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/path/to/data-aggregation-service
ExecStart=/usr/bin/node server.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

启动服务：

```bash
sudo systemctl enable data-aggregation
sudo systemctl start data-aggregation
```

## 配置说明

### 环境变量配置

| 变量名 | 说明 | 默认值 | 必需 |
|--------|------|--------|------|
| `DB_HOST` | 数据库主机 | localhost | 是 |
| `DB_PORT` | 数据库端口 | 3306 | 否 |
| `DB_USER` | 数据库用户名 | - | 是 |
| `DB_PASSWORD` | 数据库密码 | - | 是 |
| `DB_NAME` | 数据库名 | - | 是 |
| `OSS_REGION` | OSS区域 | - | 是 |
| `OSS_ACCESS_KEY_ID` | OSS访问密钥ID | - | 是 |
| `OSS_ACCESS_KEY_SECRET` | OSS访问密钥 | - | 是 |
| `OSS_BUCKET` | OSS存储桶名 | - | 是 |
| `CRON_SCHEDULE` | 定时任务表达式 | 0 0 2 * * * | 否 |
| `AGGREGATION_TABLES` | 要汇总的表 | users,orders,products | 否 |
| `OUTPUT_FORMAT` | 输出格式 | json | 否 |
| `LOG_LEVEL` | 日志级别 | info | 否 |

### 定时任务配置

支持标准的cron表达式：

```bash
# 每天凌晨2点
0 0 2 * * *

# 每小时执行
0 * * * * *

# 每周一凌晨3点
0 0 3 * * 1

# 每月1号凌晨4点
0 0 4 1 * *
```

## 监控和维护

### 日志监控

```bash
# 查看实时日志
tail -f logs/combined.log

# 查看错误日志
tail -f logs/error.log

# 使用Docker查看日志
docker-compose logs -f data-aggregation
```

### 健康检查

```bash
# 检查服务状态
curl http://localhost:3000/health

# 检查任务状态
curl http://localhost:3000/status
```

### 手动触发

```bash
# 手动执行数据汇总
curl -X POST http://localhost:3000/aggregate
```

## 故障排除

### 常见问题

1. **服务启动失败**
   - 检查端口是否被占用
   - 检查环境变量配置
   - 查看错误日志

2. **数据库连接失败**
   - 检查数据库服务状态
   - 验证连接参数
   - 检查网络连接

3. **OSS上传失败**
   - 检查OSS配置
   - 验证访问权限
   - 检查存储桶状态

4. **定时任务不执行**
   - 检查cron表达式格式
   - 查看服务日志
   - 确认时区设置

### 性能优化

1. **数据库优化**
   - 添加适当的索引
   - 优化查询语句
   - 调整连接池参数

2. **内存优化**
   - 调整Node.js内存限制
   - 优化数据处理逻辑
   - 及时清理临时文件

3. **网络优化**
   - 使用CDN加速
   - 优化文件压缩
   - 调整超时参数

## 安全考虑

1. **环境变量安全**
   - 不要将敏感信息提交到代码仓库
   - 使用环境变量管理配置
   - 定期轮换访问密钥

2. **网络安全**
   - 使用HTTPS
   - 配置防火墙规则
   - 限制访问IP

3. **数据安全**
   - 加密敏感数据
   - 定期备份数据
   - 监控异常访问

## 备份和恢复

### 数据备份

```bash
# 备份数据库
mysqldump -u root -p database_name > backup.sql

# 备份配置文件
tar -czf config-backup.tar.gz .env config/
```

### 服务恢复

```bash
# 恢复数据库
mysql -u root -p database_name < backup.sql

# 恢复配置
tar -xzf config-backup.tar.gz

# 重启服务
systemctl restart data-aggregation
```

## 升级指南

1. **备份现有数据**
2. **停止服务**
3. **更新代码**
4. **更新依赖**
5. **测试配置**
6. **启动服务**
7. **验证功能**