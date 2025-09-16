# 中文到英文翻译程序

一个功能强大的中文到英文翻译工具，支持多种翻译服务，包括Google翻译、百度翻译、DeepL和有道翻译。

## 功能特点

- 🌐 **多翻译服务支持**: Google翻译、百度翻译、DeepL、有道翻译
- 🔄 **自动故障转移**: 如果一个服务失败，自动尝试其他服务
- 💻 **多种使用模式**: 命令行参数、交互模式、管道输入
- 🎯 **简单易用**: 无需复杂配置即可使用
- 🚀 **高性能**: 支持网络重试和错误处理

## 安装依赖

```bash
pip install -r requirements.txt
```

或者手动安装：

```bash
pip install requests urllib3
```

## 使用方法

### 1. 命令行模式

直接翻译单个文本：

```bash
python chinese_translator.py "你好世界"
```

指定翻译服务：

```bash
python chinese_translator.py "你好世界" -s google
python chinese_translator.py "你好世界" -s youdao
python chinese_translator.py "你好世界" -s deepl
```

自动选择最佳翻译服务：

```bash
python chinese_translator.py "你好世界" -s auto
```

### 2. 交互模式

启动交互模式，可以连续翻译多个文本：

```bash
python chinese_translator.py -i
```

在交互模式中：
- 直接输入中文文本进行翻译
- 输入 `help` 查看帮助
- 输入 `quit` 或 `exit` 退出程序

### 3. 管道输入

从文件或其他程序读取文本：

```bash
echo "你好世界" | python chinese_translator.py
cat chinese_text.txt | python chinese_translator.py
```

### 4. 百度翻译API配置

如果要使用百度翻译API，需要先注册获取App ID和Secret Key：

```bash
python chinese_translator.py "你好世界" -s baidu --baidu-app-id YOUR_APP_ID --baidu-secret-key YOUR_SECRET_KEY
```

## 支持的翻译服务

| 服务 | 说明 | 需要配置 |
|------|------|----------|
| Google翻译 | 免费，稳定性好 | 否 |
| 有道翻译 | 免费，国内访问快 | 否 |
| DeepL | 翻译质量高 | 否 |
| 百度翻译 | 需要API密钥，有免费额度 | 是 |

## 命令行参数

```
usage: chinese_translator.py [-h] [-s {google,baidu,deepl,youdao,auto}] [-i]
                             [--baidu-app-id BAIDU_APP_ID]
                             [--baidu-secret-key BAIDU_SECRET_KEY]
                             [text]

中文到英文翻译程序

positional arguments:
  text                  要翻译的中文文本

optional arguments:
  -h, --help            show this help message and exit
  -s {google,baidu,deepl,youdao,auto}, --service {google,baidu,deepl,youdao,auto}
                        选择翻译服务 (默认: google)
  -i, --interactive     交互模式
  --baidu-app-id BAIDU_APP_ID
                        百度翻译App ID
  --baidu-secret-key BAIDU_SECRET_KEY
                        百度翻译Secret Key
```

## 使用示例

### 基础翻译

```bash
$ python chinese_translator.py "人工智能正在改变世界"

原文: 人工智能正在改变世界
--------------------------------------------------
正在使用 google 翻译...
翻译成功（使用 google）
译文: Artificial intelligence is changing the world
--------------------------------------------------
```

### 交互模式

```bash
$ python chinese_translator.py -i
=== 中文到英文翻译程序 ===
输入 'quit' 或 'exit' 退出程序
输入 'help' 查看帮助

请输入要翻译的中文: 机器学习是人工智能的一个分支

原文: 机器学习是人工智能的一个分支
--------------------------------------------------
正在使用 google 翻译...
翻译成功（使用 google）
译文: Machine learning is a branch of artificial intelligence
--------------------------------------------------

请输入要翻译的中文: quit
再见！
```

### 自动故障转移

```bash
$ python chinese_translator.py "深度学习" -s auto
正在使用 google 翻译...
翻译成功（使用 google）
译文: Deep learning
```

## 错误处理

程序具备完善的错误处理机制：

- **网络错误**: 自动重试和服务切换
- **API限制**: 提供多个备选服务
- **输入验证**: 检查空输入和无效参数
- **超时处理**: 设置合理的请求超时时间

## 注意事项

1. **网络连接**: 需要稳定的网络连接访问翻译服务
2. **API限制**: 某些服务可能有使用频率限制
3. **翻译质量**: 不同服务的翻译质量可能有差异
4. **隐私保护**: 文本会发送到第三方翻译服务

## 故障排除

### 常见问题

1. **网络连接错误**
   - 检查网络连接
   - 尝试使用不同的翻译服务

2. **翻译失败**
   - 使用 `-s auto` 参数自动选择服务
   - 检查输入文本是否为有效的中文

3. **百度翻译配置**
   - 确保App ID和Secret Key正确
   - 检查百度翻译API余额

### 获取帮助

如果遇到问题，可以：
1. 使用 `python chinese_translator.py -h` 查看帮助
2. 在交互模式中输入 `help` 查看使用说明
3. 检查网络连接和防火墙设置

## 开发者信息

这是一个开源项目，欢迎贡献代码和提出建议。

### 技术栈

- Python 3.6+
- requests库用于HTTP请求
- argparse用于命令行参数解析
- 支持多种翻译API接口

### 扩展功能

可以轻松扩展支持更多翻译服务，只需实现对应的翻译方法即可。