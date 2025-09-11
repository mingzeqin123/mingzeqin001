# 情感分析系统

一个基于Python的中文情感分析系统，能够分析用户提问的情感倾向并给出相应的智能回复。

## 功能特性

### 🎯 核心功能
- **情感倾向分析**: 识别文本的积极、消极或中性情感
- **具体情感识别**: 检测喜悦、愤怒、悲伤、恐惧、惊讶、厌恶等具体情感
- **智能分类**: 自动识别问句、求助请求、投诉等不同类型的文本
- **个性化回复**: 根据情感分析结果生成相应的回复模板

### 📊 分析维度
- 情感极性（积极/消极/中性）
- 情感置信度
- 具体情感类型
- 文本特征识别（问句、求助、投诉等）
- 情感词汇统计

## 安装与使用

### 环境要求
- Python 3.6+
- jieba 分词库

### 安装依赖
```bash
pip install -r requirements.txt
```

### 基本使用

#### 1. 交互式使用
```bash
python sentiment_analysis.py
```

#### 2. 编程接口使用
```python
from sentiment_analysis import SentimentAnalyzer

# 创建分析器实例
analyzer = SentimentAnalyzer()

# 分析单个文本
result = analyzer.process_user_input("这个产品真的很棒！")

# 查看分析结果
print(f"情感倾向: {result['sentiment']}")
print(f"置信度: {result['confidence']}")
print(f"智能回复: {result['reply']}")
```

#### 3. 运行测试示例
```bash
python sentiment_test.py
```

## API 说明

### SentimentAnalyzer 类

#### 主要方法

**`process_user_input(text: str) -> Dict[str, Any]`**
- 处理用户输入的完整流程
- 返回包含分析结果和智能回复的字典

**`analyze_sentiment(text: str) -> Dict[str, Any]`**  
- 分析文本情感
- 返回详细的情感分析结果

**`generate_reply(analysis: Dict[str, Any]) -> str`**
- 根据分析结果生成智能回复

#### 返回结果格式
```python
{
    'text': '原始文本',
    'sentiment': '情感倾向',  # positive/negative/neutral
    'confidence': 0.85,      # 置信度 0-1
    'emotion': '具体情感',    # joy/anger/sadness/fear/surprise/disgust/neutral
    'emotion_confidence': 0.6, # 情感置信度
    'positive_score': 2,     # 积极词汇数量
    'negative_score': 0,     # 消极词汇数量
    'is_question': True,     # 是否为问句
    'is_help_request': False, # 是否为求助
    'is_complaint': False,   # 是否为投诉
    'word_count': 8,         # 词汇总数
    'reply': '智能回复内容'
}
```

## 测试用例

系统包含多种测试场景：

### 积极情感
- "这个产品真的太棒了！我很满意！"
- "感谢你们的帮助，服务很好！"

### 消极情感  
- "这个功能有问题，我很失望"
- "太糟糕了，完全不能用"

### 问句类型
- "请问这个功能怎么使用？"
- "能告诉我操作步骤吗？"

### 求助请求
- "能帮我解决一下这个问题吗？"
- "我需要你的指导"

### 投诉类型
- "我要投诉这个服务质量"
- "这个系统有严重的bug"

## 回复模板

系统根据不同情况提供个性化回复：

- **积极情感**: 表达感谢和鼓励
- **消极情感**: 表示理解和改进意愿  
- **问句**: 提供专业解答
- **求助**: 主动提供帮助
- **投诉**: 表示歉意和解决方案

## 扩展功能

### 自定义词典
可以通过修改以下方法来扩展词典：
- `_load_positive_words()`: 添加积极词汇
- `_load_negative_words()`: 添加消极词汇  
- `_load_emotion_words()`: 添加情感词汇

### 自定义回复模板
修改 `_load_reply_templates()` 方法来自定义回复内容。

### 批量处理
```python
# 批量分析多个文本
texts = ["文本1", "文本2", "文本3"]
results = []
for text in texts:
    result = analyzer.process_user_input(text)
    results.append(result)
```

## 技术特点

- **中文优化**: 基于jieba分词，针对中文文本优化
- **多维度分析**: 不仅分析情感极性，还识别具体情感类型
- **智能分类**: 自动识别文本类型和用户意图
- **灵活扩展**: 易于添加新的词汇和回复模板
- **高效处理**: 快速响应，适合实时应用

## 应用场景

- 客服系统智能回复
- 社交媒体情感监控
- 用户反馈分析
- 产品评价分析
- 在线教育互动系统

## 注意事项

1. 分词效果会影响分析准确性
2. 建议根据具体应用场景调整词典
3. 复杂语境可能需要更高级的NLP技术
4. 建议结合实际使用情况不断优化模板

## 许可证

本项目采用 MIT 许可证，详见 LICENSE 文件。