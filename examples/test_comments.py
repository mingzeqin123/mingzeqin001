#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
测试评论数据和使用示例
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from comment_classifier import CommentClassifier
import json

# 测试评论数据
TEST_COMMENTS = {
    "正常评论": [
        "这个产品真的很不错，推荐大家购买！",
        "感谢分享，学到了很多东西，对我很有帮助。",
        "这篇文章写得很好，分析得很透彻，给我很多启发。",
        "我也遇到过类似的问题，你的解决方案很实用。",
        "非常详细的教程，按照步骤操作成功了，谢谢！",
        "质量不错，物流也很快，满意的一次购物体验。",
        "客服态度很好，耐心解答了我的问题，赞一个！",
        "界面设计很美观，功能也很实用，值得推荐。"
    ],
    
    "灌水评论": [
        "哈哈哈哈哈哈哈哈哈哈",
        "顶顶顶顶顶",
        "支持！！！！！",
        "沙发",
        "板凳",
        "路过",
        "嗯嗯嗯嗯嗯",
        "呵呵呵呵呵呵",
        "😂😂😂😂😂",
        "👍👍👍👍👍",
        "好的好的好的好的"
    ],
    
    "广告评论": [
        "微信：abc123，有需要的联系我",
        "QQ：123456789，专业代购",
        "电话：13812345678，优质服务",
        "www.example.com 点击查看详情",
        "代购正品，价格优惠，欢迎咨询",
        "加盟代理，月入过万，微信联系",
        "批发零售，厂家直销，价格便宜",
        "投资理财，高收益低风险，加我了解",
        "兼职赚钱，在家就能做，联系方式私聊",
        "特价促销，限时优惠，点击链接购买"
    ],
    
    "恶意评论": [
        "你这个傻逼，滚蛋！",
        "垃圾产品，骗钱的！",
        "智障才会买这种东西",
        "废物一个，没用的",
        "去死吧，讨厌死了",
        "打死你这个骗子"
    ],
    
    "无意义评论": [
        "111111111",
        "aaaaaaaaa",
        ".........",
        "？？？？？？",
        "！！！！！！",
        "12345",
        "abcdef",
        "呃呃呃呃呃",
        "额额额额额"
    ],
    
    "重复评论": [
        "这个产品真的很不错，推荐大家购买！",  # 与正常评论中的第一条重复
        "感谢分享，学到了很多东西，对我很有帮助。",  # 与正常评论中的第二条重复
    ]
}

def test_single_classification():
    """测试单条评论分类"""
    print("=" * 60)
    print("单条评论分类测试")
    print("=" * 60)
    
    classifier = CommentClassifier()
    
    for category, comments in TEST_COMMENTS.items():
        print(f"\n【{category}】测试:")
        print("-" * 40)
        
        for i, comment in enumerate(comments[:3]):  # 每类只测试前3条
            result = classifier.classify_comment(comment)
            
            print(f"评论: {comment}")
            print(f"预期: {category}")
            print(f"分类: {classifier.CATEGORIES[result.category]}")
            print(f"置信度: {result.confidence:.2f}")
            print(f"原因: {', '.join(result.reasons)}")
            if result.keywords:
                print(f"关键词: {', '.join(result.keywords)}")
            
            # 判断分类是否正确
            is_correct = (
                (category == "正常评论" and result.category == "normal") or
                (category == "灌水评论" and result.category == "spam") or
                (category == "广告评论" and result.category == "advertisement") or
                (category == "恶意评论" and result.category == "offensive") or
                (category == "无意义评论" and result.category == "meaningless") or
                (category == "重复评论" and result.category == "duplicate")
            )
            
            status = "✓ 正确" if is_correct else "✗ 错误"
            print(f"结果: {status}")
            print()

def test_batch_classification():
    """测试批量评论分类"""
    print("=" * 60)
    print("批量评论分类测试")
    print("=" * 60)
    
    classifier = CommentClassifier()
    
    # 收集所有测试评论
    all_comments = []
    expected_categories = []
    
    for category, comments in TEST_COMMENTS.items():
        for comment in comments:
            all_comments.append(comment)
            expected_categories.append(category)
    
    # 批量分类
    results = classifier.batch_classify(all_comments)
    
    # 统计准确率
    correct_count = 0
    total_count = len(results)
    
    category_mapping = {
        "正常评论": "normal",
        "灌水评论": "spam", 
        "广告评论": "advertisement",
        "恶意评论": "offensive",
        "无意义评论": "meaningless",
        "重复评论": "duplicate"
    }
    
    print("分类结果详情:")
    print("-" * 40)
    
    for i, (comment, result, expected) in enumerate(zip(all_comments, results, expected_categories)):
        expected_code = category_mapping.get(expected, "unknown")
        is_correct = result.category == expected_code
        
        if is_correct:
            correct_count += 1
            
        status = "✓" if is_correct else "✗"
        print(f"{i+1:2d}. {status} {comment[:30]}... -> {result.category} ({result.confidence:.2f})")
    
    # 显示统计信息
    accuracy = correct_count / total_count * 100
    print(f"\n准确率: {correct_count}/{total_count} = {accuracy:.1f}%")
    
    # 显示分类统计
    stats = classifier.get_statistics(results)
    print(f"\n分类统计:")
    print("-" * 40)
    for category, count in stats['category_counts'].items():
        category_name = stats['category_names'][category]
        percentage = stats['category_percentages'][category]
        print(f"{category_name}: {count} 条 ({percentage:.1f}%)")

def test_api_examples():
    """API调用示例"""
    print("=" * 60)
    print("API调用示例")
    print("=" * 60)
    
    # 单条评论分类API示例
    single_api_example = {
        "url": "POST /classify",
        "request": {
            "comment": "这个产品真的很不错，推荐大家购买！",
            "user_id": "user123"
        },
        "response": {
            "success": True,
            "data": {
                "comment": "这个产品真的很不错，推荐大家购买！",
                "category": "normal",
                "category_name": "正常评论",
                "confidence": 0.8,
                "reasons": ["未发现异常特征"],
                "keywords": [],
                "timestamp": "2024-01-15T10:30:00"
            }
        }
    }
    
    # 批量评论分类API示例
    batch_api_example = {
        "url": "POST /classify/batch",
        "request": {
            "comments": [
                "这个产品真的很不错！",
                "哈哈哈哈哈哈哈哈哈哈",
                "微信：abc123，有需要联系我"
            ]
        },
        "response": {
            "success": True,
            "data": {
                "results": [
                    {
                        "comment": "这个产品真的很不错！",
                        "category": "normal",
                        "category_name": "正常评论",
                        "confidence": 0.8,
                        "reasons": ["未发现异常特征"],
                        "keywords": [],
                        "timestamp": "2024-01-15T10:30:00"
                    }
                ],
                "statistics": {
                    "total_comments": 3,
                    "category_counts": {
                        "normal": 1,
                        "spam": 1,
                        "advertisement": 1
                    }
                }
            }
        }
    }
    
    print("1. 单条评论分类API:")
    print(json.dumps(single_api_example, ensure_ascii=False, indent=2))
    
    print("\n2. 批量评论分类API:")
    print(json.dumps(batch_api_example, ensure_ascii=False, indent=2))

def test_performance():
    """性能测试"""
    print("=" * 60)
    print("性能测试")
    print("=" * 60)
    
    import time
    
    classifier = CommentClassifier()
    
    # 准备测试数据
    test_comments = []
    for comments in TEST_COMMENTS.values():
        test_comments.extend(comments)
    
    # 重复数据以增加测试量
    test_comments = test_comments * 10  # 总共约300条评论
    
    print(f"测试评论数量: {len(test_comments)}")
    
    # 单条分类性能测试
    start_time = time.time()
    for comment in test_comments:
        classifier.classify_comment(comment)
    single_time = time.time() - start_time
    
    print(f"单条分类总时间: {single_time:.2f}秒")
    print(f"单条分类平均时间: {single_time/len(test_comments)*1000:.2f}毫秒")
    
    # 批量分类性能测试
    classifier = CommentClassifier()  # 重新初始化
    start_time = time.time()
    classifier.batch_classify(test_comments)
    batch_time = time.time() - start_time
    
    print(f"批量分类总时间: {batch_time:.2f}秒")
    print(f"批量分类平均时间: {batch_time/len(test_comments)*1000:.2f}毫秒")
    
    # 性能对比
    speedup = single_time / batch_time if batch_time > 0 else 1
    print(f"批量处理加速比: {speedup:.2f}x")

def main():
    """主函数"""
    import sys
    
    print("AI评论分类器 - 测试和示例")
    
    # 如果是自动运行，直接运行所有测试
    if len(sys.argv) > 1 and sys.argv[1] == '--auto':
        print("自动运行所有测试...")
        test_single_classification()
        test_batch_classification()
        test_api_examples()
        test_performance()
        return
    
    while True:
        print("\n" + "=" * 60)
        print("请选择测试类型:")
        print("1. 单条评论分类测试")
        print("2. 批量评论分类测试")
        print("3. API调用示例")
        print("4. 性能测试")
        print("5. 运行所有测试")
        print("0. 退出")
        print("=" * 60)
        
        try:
            choice = input("请输入选择 (0-5): ").strip()
        except EOFError:
            # 如果无法获取输入，自动运行所有测试
            print("检测到自动运行模式，运行所有测试...")
            choice = '5'
        
        if choice == '1':
            test_single_classification()
        elif choice == '2':
            test_batch_classification()
        elif choice == '3':
            test_api_examples()
        elif choice == '4':
            test_performance()
        elif choice == '5':
            test_single_classification()
            test_batch_classification()
            test_api_examples()
            test_performance()
            break  # 运行完所有测试后退出
        elif choice == '0':
            print("退出测试程序")
            break
        else:
            print("无效选择，请重新输入")

if __name__ == "__main__":
    main()