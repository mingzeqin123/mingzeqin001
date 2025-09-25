# 百度翻译API调用程序

这是一个使用百度翻译API的Python程序，支持中文到英文的翻译，以及其他多种语言的互译。

## 功能特点

- ✅ 支持中文到英文翻译
- ✅ 支持多种语言互译（中文、英文、日文、韩文、法文、德文、俄文等）
- ✅ 提供命令行界面和图形用户界面
- ✅ 完整的错误处理和状态提示
- ✅ 支持批量翻译
- ✅ 线程安全的GUI界面

## 文件说明

- `baidu_translate_config.py` - API配置文件
- `baidu_translator.py` - 核心翻译功能模块
- `translate_gui.py` - 图形用户界面程序
- `requirements.txt` - Python依赖包列表

## 安装依赖

```bash
pip install -r requirements.txt
```

## 配置API密钥

1. 访问 [百度翻译开放平台](https://fanyi-api.baidu.com/)
2. 注册账号并创建应用
3. 获取APP ID和密钥
4. 编辑 `baidu_translate_config.py` 文件：

```python
BAIDU_APP_ID = "你的APP_ID"  # 替换为你的APP ID
BAIDU_SECRET_KEY = "你的密钥"  # 替换为你的密钥
```

## 使用方法

### 方法1：命令行界面

```bash
python baidu_translator.py
```

运行后按提示输入要翻译的中文文本，程序会自动翻译成英文。

### 方法2：图形用户界面

```bash
python translate_gui.py
```

启动图形界面，可以：
- 选择源语言和目标语言
- 输入要翻译的文本
- 查看翻译结果
- 交换源语言和目标语言
- 清空输入和输出

### 方法3：作为模块使用

```python
from baidu_translator import BaiduTranslator

# 创建翻译器实例
translator = BaiduTranslator()

# 翻译中文到英文
result = translator.translate_chinese_to_english("你好，世界！")
if result.get("success"):
    print(f"翻译结果: {result['translated_text']}")
else:
    print(f"翻译失败: {result['error']}")

# 其他语言翻译
result = translator.translate("Hello", from_lang='en', to_lang='zh')
```

## 支持的语言

| 语言名称 | 语言代码 |
|---------|---------|
| 中文     | zh      |
| 英文     | en      |
| 日文     | jp      |
| 韩文     | kor     |
| 法文     | fra     |
| 德文     | de      |
| 俄文     | ru      |
| 西班牙文 | spa     |
| 意大利文 | it      |
| 葡萄牙文 | pt      |
| 阿拉伯文 | ara     |
| 泰文     | th      |
| 越南文   | vie     |

## 错误代码说明

| 错误代码 | 说明 |
|---------|------|
| 52001   | 请求超时，请重试 |
| 52002   | 系统错误，请重试 |
| 52003   | 未授权用户，请检查APP ID和密钥 |
| 54000   | 必填参数为空 |
| 54001   | 签名错误 |
| 54003   | 访问频率受限 |
| 54004   | 账户余额不足 |
| 54005   | 长query请求频繁 |
| 58000   | 客户端IP非法 |
| 90107   | 认证未通过或未生效 |

## 快捷键

- `Ctrl + Enter`: 在GUI界面中执行翻译
- `quit` 或 `exit`: 在命令行界面中退出程序

## 注意事项

1. 请确保网络连接正常
2. 百度翻译API有调用频率限制，请合理使用
3. 请妥善保管你的API密钥，不要泄露给他人
4. 翻译结果仅供参考，重要内容请人工校对

## 示例

### 命令行使用示例

```
$ python baidu_translator.py
==================================================
百度翻译API调用程序
==================================================
✓ 翻译器初始化成功

支持的语言:
  中文: zh
  英文: en
  日文: jp
  ...

==================================================
开始翻译 (输入 'quit' 或 'exit' 退出)
==================================================

请输入要翻译的中文文本: 你好，世界！

原文: 你好，世界！
译文: Hello, world!

请输入要翻译的中文文本: quit
感谢使用，再见！
```

### 程序化使用示例

```python
from baidu_translator import BaiduTranslator

translator = BaiduTranslator()

# 翻译单个句子
result = translator.translate_chinese_to_english("今天天气很好")
print(result['translated_text'])  # 输出: The weather is very nice today

# 翻译多个句子
texts = ["你好", "谢谢", "再见"]
for text in texts:
    result = translator.translate_chinese_to_english(text)
    if result.get("success"):
        print(f"{text} -> {result['translated_text']}")
```

## 许可证

本项目采用MIT许可证，详见LICENSE文件。