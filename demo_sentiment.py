#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
情感分析系统演示脚本
快速展示系统的主要功能
"""

from sentiment_analysis_simple import SimpleSentimentAnalyzer
import json


def demo_sentiment_analysis():
    """演示情感分析功能"""
    analyzer = SimpleSentimentAnalyzer()
    
    print("=== 情感分析系统演示 ===\n")
    
    # 测试用例
    test_cases = [
        "这个产品真的太棒了！我很满意！",
        "太糟糕了，完全不能用，我很失望", 
        "请问这个功能怎么使用？",
        "能帮我解决一下这个问题吗？",
        "我要投诉这个服务质量",
        "虽然有些小问题，但整体还是不错的",
        "我很担心这个会出错",
        "太惊讶了！没想到这么快",
        "感谢你们的帮助，服务很好！",
        "这个系统有严重的bug，我很生气"
    ]
    
    results = []
    
    for i, text in enumerate(test_cases, 1):
        print(f"【测试案例 {i}】: {text}")
        result = analyzer.process_user_input(text)
        
        # 显示分析结果
        print(f"  ✨ 情感倾向: {result['sentiment']} (置信度: {result['confidence']:.1%})")
        print(f"  😊 具体情感: {result['emotion']} (置信度: {result['emotion_confidence']:.1%})")
        print(f"  📊 情感分数: +{result['positive_score']} / -{result['negative_score']}")
        
        # 显示特征
        features = []
        if result['is_question']:
            features.append("❓问句")
        if result['is_help_request']:
            features.append("🆘求助")
        if result['is_complaint']:
            features.append("😠投诉")
        
        if features:
            print(f"  🏷️  文本特征: {' '.join(features)}")
        
        print(f"  🤖 智能回复: {result['reply']}")
        print(f"  {'─' * 60}")
        
        results.append(result)
    
    return results


def analyze_custom_text():
    """分析自定义文本"""
    analyzer = SimpleSentimentAnalyzer()
    
    print("\n=== 自定义文本分析 ===")
    
    custom_texts = [
        "今天天气真好，心情很愉快！",
        "工作压力太大了，感觉很疲惫",
        "你能教我怎么操作这个软件吗？",
        "这个bug让我很头疼，需要帮助",
        "产品质量有问题，我要退货"
    ]
    
    for text in custom_texts:
        result = analyzer.process_user_input(text)
        print(f"\n输入: {text}")
        print(f"情感: {result['sentiment']} | 情绪: {result['emotion']}")
        print(f"回复: {result['reply']}")


def sentiment_statistics(results):
    """统计情感分析结果"""
    print("\n=== 统计分析 ===")
    
    # 统计情感分布
    sentiment_count = {'positive': 0, 'negative': 0, 'neutral': 0}
    emotion_count = {}
    
    for result in results:
        sentiment_count[result['sentiment']] += 1
        emotion = result['emotion']
        emotion_count[emotion] = emotion_count.get(emotion, 0) + 1
    
    print("📈 情感倾向分布:")
    for sentiment, count in sentiment_count.items():
        percentage = count / len(results) * 100
        print(f"  {sentiment}: {count} ({percentage:.1f}%)")
    
    print("\n😊 具体情感分布:")
    for emotion, count in emotion_count.items():
        percentage = count / len(results) * 100
        print(f"  {emotion}: {count} ({percentage:.1f}%)")
    
    # 统计特征
    question_count = sum(1 for r in results if r['is_question'])
    help_count = sum(1 for r in results if r['is_help_request'])
    complaint_count = sum(1 for r in results if r['is_complaint'])
    
    print(f"\n🏷️  文本特征统计:")
    print(f"  问句: {question_count}")
    print(f"  求助: {help_count}")
    print(f"  投诉: {complaint_count}")


def export_results(results, filename="sentiment_demo_results.json"):
    """导出结果"""
    with open(filename, 'w', encoding='utf-8') as f:
        json.dump(results, f, ensure_ascii=False, indent=2)
    print(f"\n💾 结果已导出到: {filename}")


def main():
    """主演示函数"""
    print("🚀 启动情感分析系统演示...")
    
    # 运行演示
    results = demo_sentiment_analysis()
    
    # 自定义文本分析
    analyze_custom_text()
    
    # 统计分析
    sentiment_statistics(results)
    
    # 导出结果
    export_results(results)
    
    print(f"\n✅ 演示完成！")
    print("💡 提示: 运行 'python3 sentiment_analysis_simple.py' 可以进入交互模式")


if __name__ == "__main__":
    main()