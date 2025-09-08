# 数据汇总定时任务服务

这是一个用于定时汇总多张表数据并上传到阿里云OSS的Node.js服务。

## 功能特性

- 🕐 **定时任务**: 支持cron表达式配置的定时执行
- 📊 **数据汇总**: 支持多表数据聚合和统计
- ☁️ **OSS上传**: 自动上传汇总结果到阿里云OSS
- 📁 **多格式支持**: 支持JSON、CSV、Excel格式输出
- 🔧 **灵活配置**: 支持自定义表聚合规则
- 📝 **日志记录**: 完整的操作日志和错误处理
- 🐳 **Docker支持**: 提供Docker和Docker Compose部署

## 快速开始

### 1. 环境准备

```bash
# 克隆项目
git clone <repository-url>
cd data-aggregation-service

# 安装依赖
npm install
```

### 2. 配置环境变量

```bash
# 复制环境变量模板
cp .env.example .env

# 编辑配置文件
vim .env
```

配置以下环境变量：

```env
# 数据库配置
DB_HOST=localhost
DB_PORT=3306
DB_USER=your_username
DB_PASSWORD=your_password
DB_NAME=your_database

# OSS配置
OSS_REGION=oss-cn-hangzhou
OSS_ACCESS_KEY_ID=your_access_key_id
OSS_ACCESS_KEY_SECRET=your_access_key_secret
OSS_BUCKET=your_bucket_name

# 定时任务配置
CRON_SCHEDULE=0 0 2 * * *
AGGREGATION_TABLES=users,orders,products
OUTPUT_FORMAT=json
```

### 3. 启动服务

```bash
# 开发模式
npm run dev

# 生产模式
npm start
```

### 4. Docker部署

```bash
# 使用Docker Compose
docker-compose up -d

# 查看日志
docker-compose logs -f data-aggregation
```

## API接口

### 健康检查
```http
GET /health
```

### 手动触发汇总
```http
POST /aggregate
```

### 查看任务状态
```http
GET /status
```

## 配置说明

### 定时任务配置

通过`CRON_SCHEDULE`环境变量配置执行时间：

```env
# 每天凌晨2点执行
CRON_SCHEDULE=0 0 2 * * *

# 每小时执行一次
CRON_SCHEDULE=0 * * * * *

# 每周一凌晨3点执行
CRON_SCHEDULE=0 0 3 * * 1
```

### 表聚合配置

在`config/aggregation.js`中配置每个表的聚合规则：

```javascript
tableConfigs: {
  users: {
    groupBy: ['status', 'DATE(created_at)'],
    selectFields: ['id', 'username', 'email', 'status'],
    aggregations: [
      { function: 'COUNT', field: 'id', alias: 'user_count' },
      { function: 'AVG', field: 'age', alias: 'avg_age' }
    ],
    where: 'created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)',
    limit: 1000
  }
}
```

### 输出格式

支持以下输出格式：

- `json`: JSON格式（默认）
- `csv`: CSV格式
- `excel`: Excel格式
- `all`: 所有格式

## 目录结构

```
├── services/           # 服务层
│   ├── DatabaseService.js    # 数据库服务
│   ├── OSSService.js         # OSS上传服务
│   ├── DataAggregator.js     # 数据汇总服务
│   └── SchedulerService.js   # 定时任务服务
├── config/             # 配置文件
│   ├── database.js           # 数据库配置
│   └── aggregation.js        # 聚合配置
├── logs/               # 日志目录
├── temp/               # 临时文件目录
├── server.js           # 主服务文件
├── package.json        # 依赖配置
├── docker-compose.yml  # Docker Compose配置
├── Dockerfile          # Docker镜像配置
└── README.md          # 说明文档
```

## 监控和日志

### 日志文件

- `logs/combined.log`: 所有日志
- `logs/error.log`: 错误日志
- `logs/app.log`: 应用日志

### 监控指标

- 任务执行状态
- 数据汇总统计
- 文件上传结果
- 错误率统计

## 故障排除

### 常见问题

1. **数据库连接失败**
   - 检查数据库配置
   - 确认数据库服务运行状态
   - 验证网络连接

2. **OSS上传失败**
   - 检查OSS配置
   - 验证访问密钥
   - 确认存储桶权限

3. **定时任务不执行**
   - 检查cron表达式格式
   - 查看服务日志
   - 确认时区设置

### 调试模式

```bash
# 启用调试日志
LOG_LEVEL=debug npm start

# 查看详细日志
tail -f logs/combined.log
```

## 扩展开发

### 添加新的聚合规则

1. 在`config/aggregation.js`中添加表配置
2. 实现自定义聚合逻辑
3. 更新输出格式处理

### 添加新的数据源

1. 扩展`DatabaseService`类
2. 实现新的连接器
3. 更新配置管理

## 许可证

MIT License

## 贡献

欢迎提交Issue和Pull Request！