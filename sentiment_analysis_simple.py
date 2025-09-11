#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
简化版情感分析系统
不依赖外部库，使用内置的字符串处理功能
针对用户提问进行情感分析，并给出特定的回复
"""

import re
import random
from typing import Dict, List, Tuple, Any


class SimpleSentimentAnalyzer:
    """简化版情感分析器"""
    
    def __init__(self):
        """初始化情感分析器"""
        self.positive_words = self._load_positive_words()
        self.negative_words = self._load_negative_words()
        self.emotion_words = self._load_emotion_words()
        self.reply_templates = self._load_reply_templates()
        self.question_patterns = self._load_question_patterns()
        
    def _load_positive_words(self) -> set:
        """加载积极词汇"""
        return {
            '好', '棒', '优秀', '完美', '满意', '开心', '高兴', '快乐', '喜欢', '爱',
            '赞', '不错', '很好', '太好了', '厉害', '牛', '给力', '优质', '满分',
            '惊喜', '感谢', '谢谢', '赞美', '称赞', '夸奖', '表扬', '认可',
            '支持', '同意', '赞同', '肯定', '确定', '正确', '对的', '没错',
            '成功', '胜利', '顺利', '完成', '达成', '实现', '解决', '搞定',
            '喜悦', '愉快', '兴奋', '激动', '欣喜', '舒服', '舒心', '温暖'
        }
    
    def _load_negative_words(self) -> set:
        """加载消极词汇"""
        return {
            '不好', '差', '糟糕', '失望', '难过', '伤心', '生气', '愤怒', '讨厌', '恨',
            '烦', '烦躁', '郁闷', '沮丧', '无聊', '累', '疲惫', '困难', '麻烦',
            '问题', '错误', '失败', '不行', '不对', '错了', '不会', '不懂',
            '担心', '害怕', '紧张', '焦虑', '压力', '痛苦', '难受', '不舒服',
            '抱怨', '投诉', '批评', '指责', '质疑', '怀疑', '反对', '拒绝',
            '悲伤', '恐惧', '恶心', '厌恶', '恼火', '气愤', '暴怒', '发火'
        }
    
    def _load_emotion_words(self) -> Dict[str, set]:
        """加载情感词汇分类"""
        return {
            'joy': {'开心', '高兴', '快乐', '愉快', '兴奋', '激动', '欣喜', '喜悦', '满足', '幸福'},
            'anger': {'生气', '愤怒', '恼火', '气愤', '暴怒', '发火', '火大', '怒', '恨', '讨厌'},
            'sadness': {'难过', '伤心', '悲伤', '沮丧', '失落', '郁闷', '忧伤', '痛苦', '哭', '眼泪'},
            'fear': {'害怕', '恐惧', '担心', '紧张', '焦虑', '不安', '忧虑', '慌张', '恐慌', '胆怯'},
            'surprise': {'惊讶', '震惊', '意外', '吃惊', '惊奇', '诧异', '惊喜', '惊叹', '想不到', '没想到'},
            'disgust': {'厌恶', '讨厌', '恶心', '反感', '嫌弃', '排斥', '憎恨', '憎恶', '恶心', '呕吐'}
        }
    
    def _load_reply_templates(self) -> Dict[str, List[str]]:
        """加载回复模板"""
        return {
            'positive': [
                "很高兴听到您的积极反馈！😊",
                "您的满意是我们最大的动力！",
                "感谢您的认可，我们会继续努力！",
                "太棒了！很开心能帮到您！",
                "您的支持让我们倍感温暖！❤️",
                "真是太好了！感谢您的信任！",
                "您的好评是对我们最好的鼓励！"
            ],
            'negative': [
                "很抱歉给您带来了不好的体验 😔",
                "我理解您的困扰，让我们一起解决这个问题",
                "感谢您的反馈，我们会认真改进",
                "对不起，请告诉我们如何能做得更好",
                "您的意见对我们很重要，我们会努力改善",
                "非常抱歉让您失望了，我们会立即处理",
                "我们深表歉意，会尽快为您解决问题"
            ],
            'neutral': [
                "感谢您的提问，我来为您详细解答",
                "我明白了您的需求，让我来帮助您",
                "这是一个很好的问题，我来为您分析",
                "我理解您的疑问，让我们一起探讨",
                "您提出了一个有趣的话题",
                "好的，我来为您提供相关信息",
                "我会认真回答您的问题"
            ],
            'question': [
                "这是一个很好的问题！让我来为您解答",
                "我来帮您分析这个问题",
                "关于您的问题，我的建议是...",
                "让我为您详细说明一下",
                "这个问题确实值得深入讨论",
                "我很乐意为您解答这个疑问",
                "这是个不错的问题，让我来回答"
            ],
            'help_request': [
                "我很乐意帮助您解决这个问题！",
                "让我来协助您处理这个事情",
                "我会尽我所能为您提供帮助",
                "别担心，我们一起来解决这个问题",
                "我来为您提供详细的指导",
                "当然可以帮您，请告诉我具体需要什么",
                "我随时为您提供帮助和支持"
            ],
            'complaint': [
                "非常抱歉给您带来了困扰 😔",
                "我完全理解您的不满，让我们来解决这个问题",
                "感谢您向我们反映这个问题",
                "您的投诉我们会认真对待",
                "我们会立即着手改善这个情况",
                "对于给您造成的不便，我们深表歉意",
                "我们会认真调查并给您一个满意的答复"
            ]
        }
    
    def _load_question_patterns(self) -> List[str]:
        """加载问句模式"""
        return [
            r'.*[？?]$',  # 以问号结尾
            r'^(什么|怎么|如何|为什么|哪里|哪个|谁|何时|多少|几)',  # 疑问词开头
            r'.*(怎么办|怎么做|如何|方法|步骤).*',  # 询问方法
            r'.*(能否|可以|是否|会不会|能不能|行不行).*',  # 询问可能性
            r'.*(帮助|帮忙|协助|指导|教|告诉).*',  # 请求帮助
            r'(请问|想问|问一下|咨询).*',  # 礼貌询问
        ]
    
    def simple_tokenize(self, text: str) -> List[str]:
        """简单分词 - 不依赖外部库"""
        # 清理文本
        text = re.sub(r'[^\u4e00-\u9fa5a-zA-Z0-9\s？?！!。，,、；;：:]', '', text)
        
        # 简单的中文分词逻辑：按标点符号和空格分割
        # 然后提取中文词汇和英文单词
        words = []
        
        # 提取中文词汇（2-4字的组合）
        chinese_chars = re.findall(r'[\u4e00-\u9fa5]+', text)
        for chars in chinese_chars:
            # 提取可能的词汇组合
            for i in range(len(chars)):
                for j in range(i+2, min(i+5, len(chars)+1)):
                    word = chars[i:j]
                    if len(word) >= 2:
                        words.append(word)
            # 也添加单个字符
            words.extend(list(chars))
        
        # 提取英文单词
        english_words = re.findall(r'[a-zA-Z]+', text)
        words.extend(english_words)
        
        # 去重并过滤
        unique_words = list(set(words))
        filtered_words = [word for word in unique_words if len(word) >= 1]
        
        return filtered_words
    
    def detect_emotion(self, text: str) -> Tuple[str, float]:
        """检测具体情感类型"""
        words = self.simple_tokenize(text)
        emotion_scores = {}
        
        for emotion, emotion_words in self.emotion_words.items():
            score = 0
            for word in words:
                for emotion_word in emotion_words:
                    if emotion_word in word or word in emotion_word:
                        score += 1
            if score > 0:
                emotion_scores[emotion] = score
        
        if emotion_scores:
            dominant_emotion = max(emotion_scores, key=emotion_scores.get)
            total_words = len(words) if words else 1
            confidence = min(emotion_scores[dominant_emotion] / total_words, 1.0)
            return dominant_emotion, confidence
        
        return 'neutral', 0.0
    
    def analyze_sentiment(self, text: str) -> Dict[str, Any]:
        """分析文本情感"""
        words = self.simple_tokenize(text)
        
        # 计算情感分数
        positive_score = 0
        negative_score = 0
        
        for word in words:
            # 检查积极词汇
            for pos_word in self.positive_words:
                if pos_word in word or word in pos_word:
                    positive_score += 1
                    break
            
            # 检查消极词汇
            for neg_word in self.negative_words:
                if neg_word in word or word in neg_word:
                    negative_score += 1
                    break
        
        # 检测问句
        is_question = any(re.search(pattern, text) for pattern in self.question_patterns)
        
        # 检测帮助请求
        help_keywords = ['帮助', '帮忙', '协助', '指导', '教', '告诉', '解决', '处理']
        is_help_request = any(keyword in text for keyword in help_keywords)
        
        # 检测投诉
        complaint_keywords = ['投诉', '抱怨', '不满', '问题', '故障', '错误', '失败', '差劲', '垃圾']
        is_complaint = any(keyword in text for keyword in complaint_keywords)
        
        # 计算总体情感倾向
        total_score = positive_score - negative_score
        total_words = len(words) if words else 1
        
        if total_score > 0:
            sentiment = 'positive'
            confidence = min(positive_score / total_words, 1.0)
        elif total_score < 0:
            sentiment = 'negative' 
            confidence = min(negative_score / total_words, 1.0)
        else:
            sentiment = 'neutral'
            confidence = 0.5
        
        # 检测具体情感
        emotion, emotion_confidence = self.detect_emotion(text)
        
        return {
            'text': text,
            'sentiment': sentiment,
            'confidence': confidence,
            'emotion': emotion,
            'emotion_confidence': emotion_confidence,
            'positive_score': positive_score,
            'negative_score': negative_score,
            'is_question': is_question,
            'is_help_request': is_help_request,
            'is_complaint': is_complaint,
            'word_count': total_words
        }
    
    def generate_reply(self, analysis: Dict[str, Any]) -> str:
        """根据情感分析结果生成回复"""
        # 根据不同情况选择回复模板
        if analysis['is_complaint']:
            templates = self.reply_templates['complaint']
        elif analysis['is_help_request']:
            templates = self.reply_templates['help_request']
        elif analysis['is_question']:
            templates = self.reply_templates['question']
        elif analysis['sentiment'] == 'positive':
            templates = self.reply_templates['positive']
        elif analysis['sentiment'] == 'negative':
            templates = self.reply_templates['negative']
        else:
            templates = self.reply_templates['neutral']
        
        # 随机选择一个模板
        reply = random.choice(templates)
        
        # 根据具体情感添加额外信息
        if analysis['emotion'] != 'neutral' and analysis['emotion_confidence'] > 0.2:
            emotion_responses = {
                'joy': "看得出您很开心！",
                'anger': "我能感受到您的不满，",
                'sadness': "我理解您的难过，",
                'fear': "请不要担心，",
                'surprise': "确实令人意外！",
                'disgust': "我理解您的感受，"
            }
            
            if analysis['emotion'] in emotion_responses:
                emotion_response = emotion_responses[analysis['emotion']]
                if analysis['emotion'] in ['anger', 'sadness', 'fear', 'disgust']:
                    reply = emotion_response + reply.lower()
                else:
                    reply = emotion_response + " " + reply
        
        return reply
    
    def process_user_input(self, user_input: str) -> Dict[str, Any]:
        """处理用户输入的完整流程"""
        # 情感分析
        analysis = self.analyze_sentiment(user_input)
        
        # 生成回复
        reply = self.generate_reply(analysis)
        
        # 返回完整结果
        result = analysis.copy()
        result['reply'] = reply
        
        return result


def main():
    """主函数 - 演示情感分析系统"""
    analyzer = SimpleSentimentAnalyzer()
    
    print("=== 简化版情感分析系统 ===")
    print("输入 'quit' 或 'exit' 退出程序")
    print("本版本不依赖外部库，使用内置功能进行分析\n")
    
    # 预设一些测试用例
    test_cases = [
        "这个产品真的太棒了！我很满意！",
        "太糟糕了，完全不能用，我很失望",
        "请问这个功能怎么使用？",
        "能帮我解决一下这个问题吗？",
        "我要投诉这个服务质量",
        "虽然有些小问题，但整体还是不错的",
        "我很担心这个会出错",
        "太惊讶了！没想到这么快"
    ]
    
    print("=== 测试用例演示 ===")
    for i, test_text in enumerate(test_cases, 1):
        print(f"\n测试 {i}: {test_text}")
        result = analyzer.process_user_input(test_text)
        print(f"  情感: {result['sentiment']} ({result['confidence']:.2f})")
        print(f"  情绪: {result['emotion']} ({result['emotion_confidence']:.2f})")
        print(f"  特征: ", end="")
        
        features = []
        if result['is_question']:
            features.append("问句")
        if result['is_help_request']:
            features.append("求助")
        if result['is_complaint']:
            features.append("投诉")
        
        print(", ".join(features) if features else "无")
        print(f"  回复: {result['reply']}")
    
    print(f"\n{'='*50}")
    print("=== 交互模式 ===")
    
    while True:
        try:
            user_input = input("\n请输入您的问题或评论: ").strip()
            
            if user_input.lower() in ['quit', 'exit', '退出']:
                print("感谢使用情感分析系统！再见！")
                break
            
            if not user_input:
                print("请输入有效的文本内容")
                continue
            
            # 处理用户输入
            result = analyzer.process_user_input(user_input)
            
            # 显示分析结果
            print(f"\n--- 分析结果 ---")
            print(f"情感倾向: {result['sentiment']} (置信度: {result['confidence']:.2f})")
            print(f"具体情感: {result['emotion']} (置信度: {result['emotion_confidence']:.2f})")
            print(f"积极词汇: {result['positive_score']} | 消极词汇: {result['negative_score']}")
            print(f"文本特征: ", end="")
            
            features = []
            if result['is_question']:
                features.append("问句")
            if result['is_help_request']:
                features.append("求助")
            if result['is_complaint']:
                features.append("投诉")
            
            print(", ".join(features) if features else "普通陈述")
            print(f"\n--- 智能回复 ---")
            print(f"🤖 {result['reply']}")
            print("-" * 50)
            
        except KeyboardInterrupt:
            print("\n\n感谢使用情感分析系统！再见！")
            break
        except Exception as e:
            print(f"处理过程中发生错误: {e}")


if __name__ == "__main__":
    main()