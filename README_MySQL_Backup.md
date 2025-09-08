# MySQL数据库定期备份到阿里云OSS

这是一个完整的MySQL数据库自动备份解决方案，支持将MySQL数据定期备份并上传到阿里云OSS存储桶中。

## 功能特性

- ✅ **自动备份**: 支持全量备份MySQL数据库
- ✅ **压缩存储**: 自动压缩备份文件，节省存储空间
- ✅ **阿里云OSS**: 安全上传到阿里云对象存储
- ✅ **定时执行**: 支持多种定时备份策略
- ✅ **日志记录**: 完整的操作日志和错误处理
- ✅ **自动清理**: 自动清理过期备份文件
- ✅ **配置灵活**: JSON配置文件，易于管理
- ✅ **连接测试**: 内置测试工具验证配置

## 文件说明

| 文件名 | 说明 |
|--------|------|
| `mysql_backup_to_oss.py` | 主备份脚本 |
| `backup_config.json` | 配置文件 |
| `backup_config.example.json` | 配置文件示例 |
| `test_backup.py` | 配置测试脚本 |
| `install_dependencies.sh` | 依赖安装脚本 |
| `setup_cron.sh` | 定时任务设置脚本 |
| `requirements.txt` | Python依赖包 |

## 快速开始

### 1. 安装依赖

```bash
# 运行自动安装脚本
bash install_dependencies.sh

# 或手动安装
sudo apt update
sudo apt install -y mysql-client python3-pip
pip3 install -r requirements.txt
```

### 2. 配置参数

```bash
# 复制配置文件模板
cp backup_config.example.json backup_config.json

# 编辑配置文件
nano backup_config.json
```

配置文件参数说明：

```json
{
  "mysql": {
    "host": "localhost",           // MySQL服务器地址
    "port": 3306,                  // MySQL端口
    "user": "backup_user",         // MySQL用户名
    "password": "your_password",   // MySQL密码
    "databases": ["db1", "db2"]    // 要备份的数据库列表，空数组表示备份所有数据库
  },
  "oss": {
    "access_key_id": "LTAI5t...",       // 阿里云AccessKey ID
    "access_key_secret": "your_secret", // 阿里云AccessKey Secret
    "endpoint": "oss-cn-hangzhou.aliyuncs.com", // OSS端点
    "bucket_name": "your-bucket",       // OSS桶名
    "prefix": "mysql_backup"            // 备份文件前缀
  },
  "backup_dir": "/tmp/mysql_backup",    // 本地临时备份目录
  "compress": true,                     // 是否压缩备份文件
  "auto_cleanup": true,                 // 是否自动清理过期备份
  "cleanup_local": true,                // 是否清理本地临时文件
  "retention_days": 30,                 // 备份保留天数
  "log_level": "INFO",                  // 日志级别
  "log_file": "/var/log/mysql_backup.log",           // 日志文件路径
  "backup_log_file": "/var/log/mysql_backup_history.json" // 备份历史记录
}
```

### 3. 测试配置

```bash
# 运行配置测试
python3 test_backup.py

# 测试成功后手动执行一次备份
python3 mysql_backup_to_oss.py
```

### 4. 设置定时任务

```bash
# 运行定时任务设置脚本
bash setup_cron.sh
```

选择备份频率：
- 每天凌晨2点
- 每天凌晨2点和下午2点
- 每12小时
- 每6小时
- 每周日凌晨1点
- 自定义时间

## 使用方法

### 手动执行备份

```bash
# 使用默认配置文件
python3 mysql_backup_to_oss.py

# 使用指定配置文件
python3 mysql_backup_to_oss.py /path/to/config.json
```

### 查看备份日志

```bash
# 查看实时日志
tail -f /var/log/mysql_backup.log

# 查看cron执行日志
tail -f /var/log/mysql_backup_cron.log

# 查看备份历史
cat /var/log/mysql_backup_history.json
```

### 管理定时任务

```bash
# 查看当前定时任务
crontab -l

# 重新设置定时任务
bash setup_cron.sh

# 删除定时任务（选择选项8）
bash setup_cron.sh
```

## 阿里云OSS配置

### 1. 创建OSS桶

1. 登录阿里云控制台
2. 进入对象存储OSS服务
3. 创建新的存储桶
4. 选择合适的地域和存储类型

### 2. 获取访问密钥

1. 进入RAM访问控制
2. 创建用户并生成AccessKey
3. 为用户授予OSS读写权限

推荐的权限策略：

```json
{
  "Version": "1",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "oss:PutObject",
        "oss:GetObject",
        "oss:DeleteObject",
        "oss:ListObjects"
      ],
      "Resource": [
        "acs:oss:*:*:your-bucket-name/*"
      ]
    }
  ]
}
```

## MySQL用户权限

为备份创建专用的MySQL用户：

```sql
-- 创建备份用户
CREATE USER 'backup_user'@'localhost' IDENTIFIED BY 'strong_password';

-- 授予备份所需的权限
GRANT SELECT, LOCK TABLES, SHOW VIEW, EVENT, TRIGGER ON *.* TO 'backup_user'@'localhost';

-- 刷新权限
FLUSH PRIVILEGES;
```

## 备份文件结构

OSS中的备份文件按以下结构组织：

```
your-bucket-name/
└── mysql_backup/
    └── 2024/
        └── 01/
            └── 15/
                ├── mysql_backup_20240115_020001.sql.gz
                ├── mysql_backup_20240115_140001.sql.gz
                └── ...
```

## 故障排除

### 常见问题

1. **MySQL连接失败**
   - 检查MySQL服务是否运行
   - 验证用户名和密码
   - 确认用户有足够权限

2. **OSS上传失败**
   - 检查AccessKey是否正确
   - 验证桶名和端点
   - 确认网络连接正常

3. **权限不足**
   - 确保脚本有执行权限
   - 检查日志目录写入权限
   - 验证MySQL用户权限

4. **磁盘空间不足**
   - 检查临时目录空间
   - 调整备份目录位置
   - 启用自动清理功能

### 日志分析

```bash
# 查看错误日志
grep "ERROR" /var/log/mysql_backup.log

# 查看最近的备份记录
tail -20 /var/log/mysql_backup_history.json

# 检查cron任务执行情况
grep "mysql_backup" /var/log/cron.log
```

## 安全建议

1. **配置文件安全**
   ```bash
   # 设置配置文件权限
   chmod 600 backup_config.json
   ```

2. **密码管理**
   - 使用强密码
   - 定期更换密码
   - 考虑使用环境变量

3. **网络安全**
   - 使用HTTPS端点
   - 配置防火墙规则
   - 限制访问来源

## 监控和告警

可以结合以下工具进行监控：

1. **日志监控**: 使用logwatch或类似工具监控备份日志
2. **OSS监控**: 在阿里云控制台配置OSS事件通知
3. **磁盘监控**: 监控备份目录磁盘使用情况
4. **邮件通知**: 在脚本中添加邮件通知功能

## 高级配置

### 增量备份

可以修改脚本支持增量备份：

```bash
# 使用binlog进行增量备份
mysqldump --single-transaction --flush-logs --master-data=2 --all-databases
```

### 多数据库实例

支持备份多个MySQL实例：

```json
{
  "instances": [
    {
      "name": "instance1",
      "mysql": { "host": "host1", "port": 3306, ... }
    },
    {
      "name": "instance2", 
      "mysql": { "host": "host2", "port": 3307, ... }
    }
  ]
}
```

## 许可证

此项目使用MIT许可证。

## 支持

如有问题或建议，请查看日志文件或联系系统管理员。