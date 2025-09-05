# Mac 邮件关键字抓取机器人

一个专为 Mac 系统设计的邮件关键字抓取机器人，能够定期连接邮箱服务器，抓取邮件内容并提取关键字，生成分析报告。

## 功能特性

- 🔐 **安全认证**: 支持 Gmail、QQ邮箱、163邮箱等主流邮箱服务
- 🔍 **智能关键字提取**: 支持中英文关键字匹配和分类
- 📊 **多格式输出**: 支持 Excel、CSV、JSON 格式的结果导出
- ⏰ **定时执行**: 支持按时间间隔或特定时间点执行
- 🖥️ **Mac 原生集成**: 使用 macOS Keychain 安全存储密码
- 📁 **多文件夹支持**: 可同时处理收件箱、发件箱等多个文件夹
- 📈 **统计分析**: 提供详细的关键字统计和分类报告

## 系统要求

- macOS 10.15 或更高版本
- Python 3.8 或更高版本
- Homebrew (安装脚本会自动安装)

## 快速安装

### 自动安装 (推荐)

1. 下载项目文件到本地
2. 运行安装脚本:

```bash
chmod +x install_mac.sh
./install_mac.sh
```

安装脚本会自动完成以下操作:
- 安装 Homebrew (如果未安装)
- 安装 Python 3 和必要依赖
- 创建项目目录和虚拟环境
- 配置启动脚本和系统服务
- 设置命令别名

### 手动安装

1. 安装 Python 依赖:
```bash
pip3 install -r requirements.txt
```

2. 创建配置文件:
```bash
cp .env.example .env
```

3. 编辑配置文件并填入邮箱信息

## 配置说明

### 邮箱配置

编辑 `.env` 文件:

```bash
# Gmail 配置示例
EMAIL_ADDRESS=your_email@gmail.com
EMAIL_PASSWORD=your_app_password
```

**重要提示:**
- Gmail 需要开启两步验证并使用应用密码
- QQ邮箱需要开启IMAP服务并使用授权码
- 163邮箱需要开启IMAP服务并使用授权码

#### Gmail 应用密码设置步骤:
1. 登录 Google 账户
2. 进入"安全性"设置
3. 开启"两步验证"
4. 生成"应用密码"
5. 使用生成的应用密码替代账户密码

### 关键字配置

编辑 `config.yaml` 文件中的关键字设置:

```yaml
keywords:
  urgent: ["紧急", "urgent", "asap", "立即", "马上"]
  work: ["工作", "会议", "项目", "任务", "work", "meeting", "project"]
  finance: ["账单", "付款", "发票", "财务", "bill", "payment", "invoice"]
  personal: ["家庭", "朋友", "个人", "family", "friend", "personal"]
  custom: []  # 添加自定义关键字
```

### 抓取配置

```yaml
fetch_config:
  folders: ["INBOX", "Sent"]    # 要抓取的邮箱文件夹
  days_back: 7                  # 抓取最近几天的邮件
  unread_only: false            # 是否只抓取未读邮件
  max_emails: 100               # 最大邮件数量限制
```

### 调度配置

```yaml
schedule_config:
  interval_minutes: 30          # 执行间隔 (分钟)
  specific_times: []            # 特定执行时间 (如 ["09:00", "14:30"])
  run_on_start: true            # 启动时立即执行一次
```

## 使用方法

### 基本命令

```bash
# 执行一次抓取
python3 email_bot.py --once

# 守护进程模式 (持续运行)
python3 email_bot.py --daemon

# 使用自定义配置文件
python3 email_bot.py --config my_config.yaml --once
```

### 使用别名 (安装脚本会自动设置)

```bash
# 执行一次
emailbot --once

# 守护进程模式
emailbot --daemon
```

### 密码管理 (使用 macOS Keychain)

```bash
# 存储邮箱密码到 Keychain
python3 setup_keychain.py store --email your_email@gmail.com

# 获取存储的密码
python3 setup_keychain.py get --email your_email@gmail.com

# 删除存储的密码
python3 setup_keychain.py delete --email your_email@gmail.com
```

## 输出结果

### 文件位置
- 输出目录: `./output/`
- 日志文件: `./logs/email_bot.log`

### Excel 报告内容
- **邮件关键字**: 详细的邮件信息和关键字匹配结果
- **汇总报告**: 整体统计信息和分类汇总

### 输出字段说明
- `邮件ID`: 邮件的唯一标识
- `主题`: 邮件主题
- `发件人`: 发件人地址
- `日期`: 邮件发送时间
- `主要类别`: 根据关键字确定的主要分类
- `关键字总数`: 匹配到的关键字总数
- `[类别]_关键字数量`: 各类别的关键字数量
- `[类别]_关键字`: 各类别匹配到的具体关键字

## 系统服务设置

### 使用 launchd 设置自动启动

安装脚本会自动创建 launchd 配置文件，手动管理命令:

```bash
# 加载服务 (启动自动运行)
launchctl load ~/Library/LaunchAgents/com.emailbot.daemon.plist

# 卸载服务 (停止自动运行)
launchctl unload ~/Library/LaunchAgents/com.emailbot.daemon.plist

# 查看服务状态
launchctl list | grep emailbot
```

## 常见问题

### 1. Gmail 连接失败
- 确认已开启两步验证
- 使用应用密码而不是账户密码
- 检查IMAP是否已启用

### 2. 中文关键字无法识别
- 确保配置文件使用UTF-8编码
- 检查jieba分词是否正常工作

### 3. 权限问题
- 确保脚本有执行权限: `chmod +x script_name`
- 检查日志和输出目录的写入权限

### 4. 依赖安装失败
```bash
# 升级pip
pip3 install --upgrade pip

# 重新安装依赖
pip3 install -r requirements.txt
```

## 安全建议

1. **密码安全**: 建议使用 macOS Keychain 存储密码
2. **应用密码**: 使用邮箱服务商提供的应用密码
3. **权限控制**: 确保配置文件权限设置正确
4. **定期更新**: 定期更新依赖包和配置

## 目录结构

```
email_bot/
├── email_bot.py           # 主程序
├── email_client.py        # 邮件客户端模块
├── keyword_extractor.py   # 关键字提取模块
├── setup_keychain.py      # Keychain 密码管理
├── config.yaml           # 配置文件
├── requirements.txt      # Python 依赖
├── .env                  # 环境变量 (需要创建)
├── install_mac.sh        # Mac 安装脚本
├── start_email_bot.sh    # 启动脚本 (自动生成)
├── logs/                 # 日志目录
├── output/               # 输出目录
└── README.md            # 说明文档
```

## 开发和贡献

### 添加新的关键字类别

1. 编辑 `config.yaml` 文件
2. 在 `keywords` 部分添加新的类别
3. 重启机器人以应用更改

### 支持新的邮箱服务商

1. 在 `config.yaml` 中添加IMAP服务器配置
2. 测试连接和认证
3. 更新文档

## 许可证

MIT License

## 更新日志

### v1.0.0
- 初始版本发布
- 支持 Gmail、QQ邮箱、163邮箱
- 中英文关键字提取
- Excel、CSV、JSON 输出格式
- macOS 系统集成