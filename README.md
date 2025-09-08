# MySQL数据库备份到阿里云OSS

这是一个自动化的MySQL数据库备份工具，可以将数据库定期备份到阿里云OSS存储桶中。

## 功能特性

- ✅ 支持备份所有数据库或指定数据库
- ✅ 自动压缩备份文件（gzip）
- ✅ 上传到阿里云OSS存储桶
- ✅ 自动清理过期备份文件（本地和远程）
- ✅ 支持定时任务（crontab）
- ✅ 详细的日志记录
- ✅ 配置文件管理
- ✅ 错误处理和重试机制

## 系统要求

- Python 3.6+
- MySQL客户端工具（mysqldump）
- 阿里云OSS账号和存储桶
- Linux/Unix系统

## 快速开始

### 1. 安装

```bash
# 克隆或下载项目文件
# 运行安装脚本
sudo ./install.sh
```

### 2. 配置

编辑配置文件 `/opt/mysql_backup/backup_config.json`：

```json
{
    "mysql": {
        "host": "localhost",
        "port": 3306,
        "username": "root",
        "password": "your_mysql_password",
        "databases": ["all"],
        "exclude_databases": ["information_schema", "performance_schema", "mysql", "sys"]
    },
    "oss": {
        "endpoint": "https://oss-cn-hangzhou.aliyuncs.com",
        "bucket_name": "your-bucket-name",
        "access_key_id": "your_access_key_id",
        "access_key_secret": "your_access_key_secret",
        "backup_path": "mysql_backups/"
    },
    "backup": {
        "local_backup_dir": "/tmp/mysql_backups",
        "compress": true,
        "keep_local_days": 7,
        "keep_remote_days": 30,
        "backup_timeout": 3600,
        "keep_local": false
    },
    "logging": {
        "level": "INFO",
        "file": "/var/log/mysql_backup.log"
    }
}
```

### 3. 设置定时任务

```bash
# 运行定时任务设置脚本
sudo ./setup_cron.sh
```

### 4. 手动测试

```bash
# 测试备份功能
python3 /opt/mysql_backup/mysql_backup_to_oss.py /opt/mysql_backup/backup_config.json
```

## 配置说明

### MySQL配置

- `host`: MySQL服务器地址
- `port`: MySQL端口（默认3306）
- `username`: MySQL用户名
- `password`: MySQL密码
- `databases`: 要备份的数据库列表，`["all"]`表示备份所有数据库
- `exclude_databases`: 排除的数据库列表

### OSS配置

- `endpoint`: 阿里云OSS端点地址
- `bucket_name`: OSS存储桶名称
- `access_key_id`: 阿里云访问密钥ID
- `access_key_secret`: 阿里云访问密钥Secret
- `backup_path`: OSS中的备份文件路径前缀

### 备份配置

- `local_backup_dir`: 本地临时备份目录
- `compress`: 是否压缩备份文件
- `keep_local_days`: 本地备份文件保留天数（0表示不保留）
- `keep_remote_days`: 远程备份文件保留天数（0表示不删除）
- `backup_timeout`: 备份超时时间（秒）
- `keep_local`: 是否保留本地备份文件

### 日志配置

- `level`: 日志级别（DEBUG, INFO, WARNING, ERROR）
- `file`: 日志文件路径

## 阿里云OSS设置

### 1. 创建存储桶

1. 登录阿里云控制台
2. 进入对象存储OSS服务
3. 创建存储桶，选择合适的地域
4. 记录存储桶名称和endpoint地址

### 2. 创建访问密钥

1. 进入RAM访问控制
2. 创建用户并分配OSS权限
3. 创建访问密钥对
4. 记录AccessKey ID和AccessKey Secret

### 3. 权限配置

确保用户具有以下权限：
- `oss:PutObject` - 上传文件
- `oss:DeleteObject` - 删除文件
- `oss:ListObjects` - 列出对象

## 定时任务设置

### 使用提供的脚本

```bash
sudo ./setup_cron.sh
```

### 手动设置crontab

```bash
# 编辑crontab
crontab -e

# 添加以下行（每天凌晨2点执行）
0 2 * * * /usr/bin/python3 /opt/mysql_backup/mysql_backup_to_oss.py /opt/mysql_backup/backup_config.json >> /var/log/mysql_backup_cron.log 2>&1
```

### 常用时间设置

- `0 2 * * *` - 每天凌晨2点
- `0 2 * * 0` - 每周日凌晨2点
- `0 2 1 * *` - 每月1日凌晨2点
- `0 */6 * * *` - 每6小时执行一次

## 监控和维护

### 查看日志

```bash
# 查看备份日志
tail -f /var/log/mysql_backup.log

# 查看定时任务日志
tail -f /var/log/mysql_backup_cron.log
```

### 检查定时任务

```bash
# 查看当前定时任务
crontab -l

# 查看定时任务执行历史
grep "mysql_backup" /var/log/syslog
```

### 手动执行备份

```bash
# 使用默认配置
python3 /opt/mysql_backup/mysql_backup_to_oss.py

# 使用指定配置
python3 /opt/mysql_backup/mysql_backup_to_oss.py /path/to/config.json
```

## 故障排除

### 常见问题

1. **mysqldump命令未找到**
   ```bash
   # Ubuntu/Debian
   sudo apt-get install mysql-client
   
   # CentOS/RHEL
   sudo yum install mysql
   ```

2. **权限不足**
   ```bash
   # 确保脚本有执行权限
   sudo chmod +x /opt/mysql_backup/mysql_backup_to_oss.py
   
   # 确保配置文件可读
   sudo chmod 600 /opt/mysql_backup/backup_config.json
   ```

3. **OSS连接失败**
   - 检查endpoint地址是否正确
   - 验证AccessKey ID和Secret
   - 确认存储桶名称正确
   - 检查网络连接

4. **MySQL连接失败**
   - 验证MySQL服务是否运行
   - 检查用户名和密码
   - 确认数据库权限

### 日志分析

```bash
# 查看错误日志
grep "ERROR" /var/log/mysql_backup.log

# 查看最近的备份记录
grep "备份完成" /var/log/mysql_backup.log | tail -10
```

## 安全建议

1. **配置文件权限**
   ```bash
   sudo chmod 600 /opt/mysql_backup/backup_config.json
   ```

2. **使用环境变量**
   ```bash
   export OSS_ACCESS_KEY_ID="your_key_id"
   export OSS_ACCESS_KEY_SECRET="your_key_secret"
   ```

3. **定期轮换访问密钥**

4. **监控备份状态**
   - 设置日志监控
   - 定期检查备份文件
   - 测试恢复流程

## 文件结构

```
/opt/mysql_backup/
├── mysql_backup_to_oss.py    # 主备份脚本
├── backup_config.json        # 配置文件
└── README.md                 # 说明文档

/var/log/
├── mysql_backup.log          # 备份日志
└── mysql_backup_cron.log     # 定时任务日志

/tmp/mysql_backups/           # 临时备份目录（可选）
```

## 许可证

MIT License

## 支持

如有问题，请检查日志文件或提交issue。