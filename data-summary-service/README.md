# 数据汇总服务 (Data Summary Service)

一个功能完整的定时任务服务，用于汇总数据库表数据并上传到阿里云OSS。

## 🚀 功能特性

- **定时任务调度**：支持灵活的cron表达式配置
- **多表数据汇总**：可配置多张表的数据查询和汇总
- **多格式导出**：支持JSON和Excel格式数据导出
- **阿里云OSS集成**：自动上传汇总结果到OSS
- **完整日志系统**：详细的操作日志和错误追踪
- **优雅关闭**：支持安全的服务关闭和资源清理
- **环境配置**：完善的环境变量配置管理

## 📦 项目结构

```
data-summary-service/
├── src/
│   ├── app.js                    # 主应用程序
│   ├── config/
│   │   ├── database.js           # 数据库配置和连接
│   │   └── oss.js               # OSS配置和服务
│   ├── services/
│   │   ├── dataSummaryService.js # 数据汇总核心服务
│   │   └── schedulerService.js   # 定时任务调度服务
│   └── utils/
│       └── logger.js            # 日志工具
├── logs/                        # 日志文件目录
├── temp/                        # 临时文件目录
├── exports/                     # 导出文件目录
├── .env.example                 # 环境变量示例
├── package.json                 # 项目依赖配置
└── README.md                    # 项目说明文档
```

## 🛠️ 安装和配置

### 1. 安装依赖

```bash
cd data-summary-service
npm install
```

### 2. 环境配置

复制环境变量模板文件：

```bash
cp .env.example .env
```

编辑 `.env` 文件，配置以下参数：

```env
# 数据库配置
DB_HOST=localhost
DB_PORT=3306
DB_USER=your_username
DB_PASSWORD=your_password
DB_NAME=your_database

# 阿里云OSS配置
OSS_REGION=oss-cn-hangzhou
OSS_ACCESS_KEY_ID=your_access_key_id
OSS_ACCESS_KEY_SECRET=your_access_key_secret
OSS_BUCKET=your_bucket_name

# 定时任务配置
CRON_SCHEDULE=0 2 * * *

# 日志配置
LOG_LEVEL=info
LOG_FILE=logs/app.log
```

### 3. 数据库表配置

在 `src/services/dataSummaryService.js` 中配置需要汇总的表：

```javascript
this.tableConfigs = [
  {
    name: 'users',
    query: 'SELECT * FROM users WHERE created_at >= ? AND created_at < ?',
    filename: 'users_summary'
  },
  {
    name: 'orders',
    query: 'SELECT * FROM orders WHERE order_date >= ? AND order_date < ?',
    filename: 'orders_summary'
  }
  // 添加更多表配置...
];
```

## 🚀 运行服务

### 开发模式
```bash
npm run dev
```

### 生产模式
```bash
npm start
```

## 📅 定时任务配置

服务默认包含以下定时任务：

- **每日汇总**：每天凌晨2点执行 (`0 2 * * *`)
- **每周汇总**：每周一凌晨3点执行 (`0 3 * * 1`)
- **每月汇总**：每月1号凌晨4点执行 (`0 4 1 * *`)

### Cron表达式格式

```
* * * * *
│ │ │ │ │
│ │ │ │ └─── 星期几 (0-7, 0和7都表示星期日)
│ │ │ └───── 月份 (1-12)
│ │ └─────── 日期 (1-31)
│ └───────── 小时 (0-23)
└─────────── 分钟 (0-59)
```

### 常用Cron表达式示例

- `0 2 * * *` - 每天凌晨2点
- `0 0 * * 0` - 每周日午夜
- `0 0 1 * *` - 每月1号午夜
- `*/30 * * * *` - 每30分钟
- `0 9-17 * * 1-5` - 工作日9点到17点每小时

## 📊 数据导出格式

### JSON格式
```json
{
  "data": [...],
  "count": 100,
  "queryTime": "2024-01-15 10:30:00"
}
```

### Excel格式
- 每个表的数据作为单独的工作表
- 包含所有字段和记录
- 自动生成时间戳

## 📁 OSS文件组织结构

```
your-bucket/
├── data-summary/
│   ├── daily/
│   │   └── 2024-01-15/
│   │       ├── users_103000.json
│   │       ├── orders_103000.json
│   │       ├── summary_103000.xlsx
│   │       └── report_103000.json
│   ├── weekly/
│   │   └── 2024-01-15/
│   └── monthly/
│       └── 2024-01-01/
└── custom-queries/
    ├── special_report_20240115_103000.json
    └── special_report_20240115_103000.xlsx
```

## 🔧 API使用示例

```javascript
const DataSummaryApp = require('./src/app');
const app = new DataSummaryApp();

// 启动服务
await app.start();

// 手动执行汇总
const result = await app.executeManualSummary('daily');

// 获取服务状态
const status = app.getStatus();
```

## 📝 日志系统

日志文件位置：
- `logs/combined.log` - 所有日志
- `logs/error.log` - 错误日志

日志级别：
- `error` - 错误信息
- `warn` - 警告信息
- `info` - 一般信息
- `debug` - 调试信息

## 🔍 监控和维护

### 检查服务状态
```bash
# 查看日志
tail -f logs/combined.log

# 检查进程
ps aux | grep node
```

### 常见问题排查

1. **数据库连接失败**
   - 检查数据库服务是否运行
   - 验证连接参数是否正确
   - 检查网络连接

2. **OSS上传失败**
   - 验证OSS配置参数
   - 检查访问权限
   - 确认bucket存在

3. **定时任务未执行**
   - 检查cron表达式格式
   - 查看错误日志
   - 验证系统时区设置

## 🔒 安全注意事项

1. **环境变量安全**
   - 不要将`.env`文件提交到版本控制
   - 使用强密码和复杂的访问密钥
   - 定期轮换访问密钥

2. **数据库安全**
   - 使用最小权限原则
   - 启用SSL连接
   - 定期备份数据

3. **OSS安全**
   - 配置适当的访问策略
   - 启用访问日志
   - 定期检查存储使用情况

## 📈 性能优化建议

1. **数据库优化**
   - 为查询字段添加索引
   - 使用连接池管理连接
   - 分批处理大量数据

2. **内存优化**
   - 及时释放大对象
   - 使用流式处理大文件
   - 监控内存使用情况

3. **网络优化**
   - 启用gzip压缩
   - 使用CDN加速
   - 合理设置超时时间

## 🤝 贡献指南

1. Fork 项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 📞 支持

如有问题或建议，请通过以下方式联系：
- 创建 Issue
- 发送邮件至：support@example.com

---

⭐ 如果这个项目对您有帮助，请给个星星支持一下！