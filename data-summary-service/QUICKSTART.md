# 快速启动指南

## 🚀 5分钟快速部署

### 1. 环境准备

确保您的系统已安装：
- Node.js 14+ 
- MySQL 5.7+ 或 MariaDB 10.3+
- 阿里云OSS账户

### 2. 快速安装

```bash
# 进入项目目录
cd data-summary-service

# 自动安装
npm run install:service
```

### 3. 配置环境变量

编辑 `.env` 文件：

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

# 定时任务配置 (每天凌晨2点)
CRON_SCHEDULE=0 2 * * *
```

### 4. 测试连接

```bash
npm run cli test
```

### 5. 启动服务

**开发模式：**
```bash
npm run dev
```

**生产模式：**
```bash
npm run deploy
```

## 📊 立即体验

### 手动执行汇总

```bash
# 今日汇总
npm run cli summary

# 本周汇总
npm run cli summary -r weekly

# 指定日期汇总
npm run cli summary -r daily -d 2024-01-15
```

### 自定义查询

```bash
npm run cli query \
  -q "SELECT * FROM users WHERE created_at >= ?" \
  -p '["2024-01-01"]' \
  -f "new_users_2024"
```

### 查看任务状态

```bash
npm run cli schedule --list
```

## 🔧 常用命令

| 命令 | 说明 |
|------|------|
| `npm run cli test` | 测试连接 |
| `npm run cli summary` | 手动汇总 |
| `npm run cli logs -f` | 实时查看日志 |
| `npm run cli status` | 查看服务状态 |
| `npm run cli schedule --list` | 查看定时任务 |

## 📁 数据表配置

编辑 `src/services/dataSummaryService.js`：

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
  // 添加更多表...
];
```

## 🎯 定时任务配置

默认任务：
- **每日汇总**：每天凌晨2点
- **每周汇总**：每周一凌晨3点  
- **每月汇总**：每月1号凌晨4点

### 自定义定时任务

```bash
# 添加每小时汇总任务
npm run cli schedule --add hourly-summary --cron "0 * * * *" --range daily
```

## 📊 查看结果

汇总完成后，文件将上传到OSS：

```
your-bucket/
└── data-summary/
    ├── daily/2024-01-15/
    │   ├── users_103000.json
    │   ├── orders_103000.json
    │   ├── summary_103000.xlsx
    │   └── report_103000.json
    └── weekly/2024-01-15/
        └── ...
```

## 🚨 故障排除

### 数据库连接失败
```bash
# 检查数据库服务
sudo systemctl status mysql

# 测试连接
npm run cli test
```

### OSS上传失败
```bash
# 检查OSS配置
cat .env | grep OSS

# 测试连接
npm run cli test
```

### 查看详细日志
```bash
# 实时日志
npm run cli logs -f

# 错误日志
tail -f logs/error.log
```

## 📞 获取帮助

```bash
# 查看所有命令
npm run cli --help

# 查看特定命令帮助
npm run cli summary --help
```

---

🎉 恭喜！您的数据汇总服务已经运行起来了！