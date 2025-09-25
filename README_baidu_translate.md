# 百度翻译API调用模块

这个模块提供了一个简单易用的接口来调用百度翻译API，将中文文本翻译成英文。

## 🚀 快速开始

### 1. 安装依赖

```bash
pip install -r requirements.txt
```

### 2. 获取百度翻译API配置

1. 访问 [百度翻译开放平台](https://fanyi-api.baidu.com/)
2. 注册账号并登录
3. 创建应用，获取APP ID和密钥
4. 设置环境变量或直接在代码中使用

### 3. 设置环境变量

```bash
export BAIDU_APP_ID=你的APP_ID
export BAIDU_SECRET_KEY=你的密钥
```

### 4. 基本使用

```python
from baidu_translate import translate_chinese_to_english

# 翻译中文文本
result = translate_chinese_to_english("你好，世界！")

if result['success']:
    print(f"原文: {result['original_text']}")
    print(f"译文: {result['translated_text']}")
else:
    print(f"翻译失败: {result['error_msg']}")
```

## 📖 详细用法

### 使用便捷函数

```python
from baidu_translate import translate_chinese_to_english

# 使用环境变量中的配置
result = translate_chinese_to_english("今天天气很好")

# 直接传入配置
result = translate_chinese_to_english(
    "今天天气很好", 
    app_id="你的APP_ID", 
    secret_key="你的密钥"
)
```

### 使用类接口

```python
from baidu_translate import BaiduTranslate

# 创建翻译器实例
translator = BaiduTranslate("你的APP_ID", "你的密钥")

# 翻译文本
result = translator.translate("我喜欢编程")

# 指定源语言和目标语言
result = translator.translate("Hello", from_lang="en", to_lang="zh")
```

### 批量翻译

```python
from baidu_translate import BaiduTranslate

translator = BaiduTranslate("你的APP_ID", "你的密钥")

texts = [
    "你好，世界！",
    "今天天气很好。",
    "我喜欢编程。"
]

for text in texts:
    result = translator.translate(text)
    if result['success']:
        print(f"{text} -> {result['translated_text']}")
```

## 🔧 API参考

### translate_chinese_to_english函数

```python
def translate_chinese_to_english(text: str, app_id: Optional[str] = None, secret_key: Optional[str] = None) -> Dict[str, Any]:
```

**参数:**
- `text`: 要翻译的中文文本
- `app_id`: 百度翻译API的APP ID（可选，会从环境变量读取）
- `secret_key`: 百度翻译API的密钥（可选，会从环境变量读取）

**返回值:**
```python
{
    'success': bool,              # 是否成功
    'original_text': str,         # 原文
    'translated_text': str,       # 译文（成功时）
    'translations': list,         # 所有翻译结果
    'from_lang': str,            # 源语言
    'to_lang': str,              # 目标语言
    'error_code': str,           # 错误代码（失败时）
    'error_msg': str             # 错误信息（失败时）
}
```

### BaiduTranslate类

#### 初始化
```python
def __init__(self, app_id: str, secret_key: str):
```

#### translate方法
```python
def translate(self, text: str, from_lang: str = "zh", to_lang: str = "en") -> Dict[str, Any]:
```

**参数:**
- `text`: 要翻译的文本
- `from_lang`: 源语言代码（默认：zh）
- `to_lang`: 目标语言代码（默认：en）

## 🌐 支持的语言代码

| 语言 | 代码 |
|------|------|
| 中文 | zh |
| 英文 | en |
| 日文 | jp |
| 韩文 | kor |
| 西班牙文 | spa |
| 法文 | fra |
| 德文 | de |
| 俄文 | ru |

## ⚠️ 错误处理

### 常见错误代码

| 错误代码 | 说明 |
|----------|------|
| 52001 | 请求超时 |
| 52002 | 系统错误 |
| 52003 | 未授权用户 |
| 54000 | 必填参数为空 |
| 54001 | 签名错误 |
| 54003 | 访问频率受限 |
| 54004 | 账户余额不足 |
| 54005 | 长query请求频繁 |
| 58000 | 客户端IP非法 |
| 58001 | 译文语言方向不支持 |
| 90107 | 认证未通过或未生效 |

### 错误处理示例

```python
result = translate_chinese_to_english("测试文本")

if not result['success']:
    error_code = result['error_code']
    if error_code == '54001':
        print("签名错误，请检查APP ID和密钥")
    elif error_code == '54003':
        print("访问频率受限，请稍后再试")
    elif error_code == '54004':
        print("账户余额不足")
    else:
        print(f"其他错误: {result['error_msg']}")
```

## 🔨 命令行使用

### 直接运行脚本

```bash
# 交互式输入
python baidu_translate.py

# 命令行参数
python baidu_translate.py "你好，世界！"
```

### 运行示例

```bash
python translate_example.py
```

## 📝 示例文件

- `baidu_translate.py`: 主要翻译模块
- `translate_example.py`: 使用示例和交互式工具
- `README_baidu_translate.md`: 使用说明文档

## 🔐 安全注意事项

1. **不要在代码中硬编码API密钥**，使用环境变量
2. **保护好你的APP ID和密钥**，不要提交到公共仓库
3. **注意API调用频率限制**，避免被封禁
4. **监控API使用量**，避免超出配额

## 💡 最佳实践

1. **使用环境变量**存储敏感配置
2. **添加重试机制**处理网络错误
3. **实现缓存机制**避免重复翻译
4. **批量处理**提高效率
5. **错误日志记录**便于调试

## 🔗 相关链接

- [百度翻译开放平台](https://fanyi-api.baidu.com/)
- [API文档](https://fanyi-api.baidu.com/doc/21)
- [错误码说明](https://fanyi-api.baidu.com/doc/24)

## 📄 许可证

本项目采用 MIT 许可证。