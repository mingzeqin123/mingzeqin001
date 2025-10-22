#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
AI评论分类器演示脚本
"""

from comment_classifier import CommentClassifier

def main():
    print("=" * 60)
    print("AI评论分类器演示")
    print("=" * 60)
    
    # 创建分类器实例
    classifier = CommentClassifier()
    
    # 测试评论示例
    test_comments = [
        ("这个产品真的很不错，推荐大家购买！", "正常评论"),
        ("哈哈哈哈哈哈哈哈哈哈", "灌水评论"),
        ("微信：abc123，有需要的联系我", "广告评论"),
        ("你这个傻逼，滚蛋！", "恶意评论"),
        ("111111111", "无意义评论"),
        ("支持！！！！！", "灌水评论"),
        ("www.example.com 点击查看详情", "广告评论"),
        ("感谢分享，学到了很多东西。", "正常评论")
    ]
    
    print("测试评论分类结果：")
    print("-" * 60)
    
    correct = 0
    total = len(test_comments)
    
    for i, (comment, expected) in enumerate(test_comments, 1):
        result = classifier.classify_comment(comment)
        category_name = classifier.CATEGORIES[result.category]
        
        # 简单的正确性判断
        is_correct = (
            (expected == "正常评论" and result.category == "normal") or
            (expected == "灌水评论" and result.category == "spam") or
            (expected == "广告评论" and result.category == "advertisement") or
            (expected == "恶意评论" and result.category == "offensive") or
            (expected == "无意义评论" and result.category == "meaningless")
        )
        
        if is_correct:
            correct += 1
            status = "✓"
        else:
            status = "✗"
        
        print(f"{i:2d}. {status} 评论: {comment}")
        print(f"    预期: {expected} | 实际: {category_name} | 置信度: {result.confidence:.2f}")
        if result.reasons:
            print(f"    原因: {', '.join(result.reasons)}")
        print()
    
    accuracy = correct / total * 100
    print(f"准确率: {correct}/{total} = {accuracy:.1f}%")
    
    print("\n" + "=" * 60)
    print("功能特点:")
    print("✓ 支持6种评论类型分类")
    print("✓ 基于多维特征分析")
    print("✓ 提供置信度和分类原因")
    print("✓ 支持重复评论检测")
    print("✓ 可配置关键词和规则")
    print("✓ 提供HTTP API接口")
    print("=" * 60)

if __name__ == "__main__":
    main()