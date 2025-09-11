#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
情感分析系统测试示例
演示如何使用情感分析器分析不同类型的用户输入
"""

from sentiment_analysis import SentimentAnalyzer
import json


def test_sentiment_analysis():
    """测试情感分析功能"""
    analyzer = SentimentAnalyzer()
    
    # 测试用例
    test_cases = [
        # 积极情感
        "这个产品真的太棒了！我很满意！",
        "感谢你们的帮助，服务很好！",
        "完美解决了我的问题，非常开心！",
        
        # 消极情感
        "这个功能有问题，我很失望",
        "太糟糕了，完全不能用",
        "我对这个结果很不满意",
        
        # 中性问句
        "请问这个功能怎么使用？",
        "能告诉我操作步骤吗？",
        "这个问题如何解决？",
        
        # 帮助请求
        "能帮我解决一下这个问题吗？",
        "请协助我处理这个事情",
        "我需要你的指导",
        
        # 投诉类型
        "我要投诉这个服务质量",
        "这个系统有严重的bug",
        "你们的产品存在很多问题",
        
        # 情感混合
        "虽然有些小问题，但整体还是不错的",
        "功能很好，就是界面需要改进",
        
        # 特定情感
        "我很担心这个会出错",
        "太惊讶了！没想到这么快",
        "这让我感到很愤怒",
        "真的很伤心，没有达到预期"
    ]
    
    print("=== 情感分析测试结果 ===\n")
    
    for i, text in enumerate(test_cases, 1):
        print(f"测试案例 {i}: {text}")
        result = analyzer.process_user_input(text)
        
        print(f"  情感倾向: {result['sentiment']} (置信度: {result['confidence']:.2f})")
        print(f"  具体情感: {result['emotion']} (置信度: {result['emotion_confidence']:.2f})")
        print(f"  特征: ", end="")
        
        features = []
        if result['is_question']:
            features.append("问句")
        if result['is_help_request']:
            features.append("求助")
        if result['is_complaint']:
            features.append("投诉")
        
        print(", ".join(features) if features else "无特殊特征")
        print(f"  系统回复: {result['reply']}")
        print("-" * 60)


def interactive_demo():
    """交互式演示"""
    analyzer = SentimentAnalyzer()
    
    print("\n=== 交互式情感分析演示 ===")
    print("请输入一些文本来测试情感分析功能")
    print("输入 'quit' 退出演示\n")
    
    while True:
        try:
            user_input = input("您的输入: ").strip()
            
            if user_input.lower() in ['quit', 'exit', '退出']:
                break
                
            if not user_input:
                continue
            
            result = analyzer.process_user_input(user_input)
            
            print(f"\n📊 分析结果:")
            print(f"   情感: {result['sentiment']} ({result['confidence']:.1%})")
            print(f"   情绪: {result['emotion']} ({result['emotion_confidence']:.1%})")
            print(f"   积极词: {result['positive_score']} | 消极词: {result['negative_score']}")
            
            features = []
            if result['is_question']:
                features.append("❓问句")
            if result['is_help_request']:
                features.append("🆘求助") 
            if result['is_complaint']:
                features.append("😠投诉")
            
            if features:
                print(f"   特征: {' '.join(features)}")
            
            print(f"\n🤖 智能回复: {result['reply']}\n")
            print("-" * 50)
            
        except KeyboardInterrupt:
            break
    
    print("\n感谢使用情感分析演示！")


def analyze_batch_texts(texts: list):
    """批量分析文本"""
    analyzer = SentimentAnalyzer()
    results = []
    
    for text in texts:
        result = analyzer.process_user_input(text)
        results.append(result)
    
    return results


def export_analysis_results(results: list, filename: str = "analysis_results.json"):
    """导出分析结果到JSON文件"""
    with open(filename, 'w', encoding='utf-8') as f:
        json.dump(results, f, ensure_ascii=False, indent=2)
    print(f"分析结果已导出到 {filename}")


if __name__ == "__main__":
    # 运行测试
    test_sentiment_analysis()
    
    # 运行交互式演示
    try:
        interactive_demo()
    except KeyboardInterrupt:
        print("\n程序已退出")