# 百度翻译工具 - 快速开始

## 🚀 立即开始

### 1. 安装依赖
```bash
python3 -m pip install requests --break-system-packages
```

### 2. 配置API密钥
编辑 `baidu_translate_config.py` 文件：
```python
BAIDU_APP_ID = "你的APP_ID"        # 替换这里
BAIDU_SECRET_KEY = "你的密钥"       # 替换这里
```

### 3. 运行程序
```bash
# 命令行界面
python3 baidu_translator.py

# 图形界面
python3 translate_gui.py

# 快速启动菜单
python3 run_translate.py
```

## 📁 文件说明

| 文件名 | 功能 |
|--------|------|
| `baidu_translator.py` | 核心翻译模块 + 命令行界面 |
| `translate_gui.py` | 图形用户界面 |
| `run_translate.py` | 快速启动菜单 |
| `test_translate.py` | 功能测试 |
| `demo.py` | 使用演示 |
| `setup_translate.py` | 安装配置脚本 |

## 🔧 获取API密钥

1. 访问 [百度翻译开放平台](https://fanyi-api.baidu.com/)
2. 注册账号
3. 创建应用
4. 获取APP ID和密钥
5. 填入配置文件

## ✨ 功能特点

- ✅ 中文 ↔ 英文翻译
- ✅ 支持13种语言互译
- ✅ 命令行 + 图形界面
- ✅ 批量翻译
- ✅ 完整错误处理
- ✅ 详细使用文档

## 🎯 使用示例

### 命令行使用
```bash
$ python3 baidu_translator.py
请输入要翻译的中文文本: 你好，世界！
原文: 你好，世界！
译文: Hello, world!
```

### 程序化使用
```python
from baidu_translator import BaiduTranslator

translator = BaiduTranslator()
result = translator.translate_chinese_to_english("你好，世界！")
print(result['translated_text'])  # Hello, world!
```

## 📞 支持的语言

中文(zh)、英文(en)、日文(jp)、韩文(kor)、法文(fra)、德文(de)、俄文(ru)、西班牙文(spa)、意大利文(it)、葡萄牙文(pt)、阿拉伯文(ara)、泰文(th)、越南文(vie)

## ⚠️ 注意事项

1. 需要有效的百度翻译API密钥
2. 确保网络连接正常
3. 遵守API调用频率限制
4. 翻译结果仅供参考

---

**开始使用**: 配置API密钥后运行 `python3 run_translate.py`