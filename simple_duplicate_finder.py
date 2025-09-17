#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
简化版文本重复片段检测器
提取两段文字中连续重复超过10个字符的片段
"""

def find_duplicates(text1, text2, min_length=10):
    """
    查找两段文本中连续重复超过指定长度的片段（去重后的最优结果）
    
    Args:
        text1 (str): 第一段文本
        text2 (str): 第二段文本
        min_length (int): 最小重复长度，默认为10
    
    Returns:
        list: 去重后的最长重复片段列表
    """
    if not text1 or not text2:
        return []
    
    # 使用动态规划找到所有公共子串
    m, n = len(text1), len(text2)
    dp = [[0] * (n + 1) for _ in range(m + 1)]
    
    # 存储所有找到的公共子串
    common_substrings = set()
    
    for i in range(1, m + 1):
        for j in range(1, n + 1):
            if text1[i-1] == text2[j-1]:
                dp[i][j] = dp[i-1][j-1] + 1
                
                # 如果长度达到要求，记录这个子串
                if dp[i][j] >= min_length:
                    substring = text1[i-dp[i][j]:i]
                    common_substrings.add(substring)
            else:
                dp[i][j] = 0
    
    # 去除被包含的较短子串，只保留最长的独立片段
    filtered_substrings = []
    sorted_substrings = sorted(common_substrings, key=len, reverse=True)
    
    for substring in sorted_substrings:
        # 检查是否被其他更长的子串包含
        is_contained = False
        for existing in filtered_substrings:
            if substring in existing:
                is_contained = True
                break
        
        if not is_contained:
            filtered_substrings.append(substring)
    
    # 为每个片段添加位置信息
    result = []
    for segment in filtered_substrings:
        # 在text1中的位置
        pos1 = text1.find(segment)
        # 在text2中的位置  
        pos2 = text2.find(segment)
        
        result.append({
            'segment': segment,
            'length': len(segment),
            'text1_position': (pos1, pos1 + len(segment) - 1),
            'text2_position': (pos2, pos2 + len(segment) - 1)
        })
    
    # 按长度降序排序
    result.sort(key=lambda x: x['length'], reverse=True)
    return result

def print_results(duplicates):
    """
    打印结果
    """
    print("\n" + "="*60)
    print("连续重复超过10个字符的片段检测结果")
    print("="*60)
    
    if not duplicates:
        print("未找到连续重复超过10个字符的片段。")
        return
    
    print(f"找到 {len(duplicates)} 个独立的重复片段：\n")
    
    for i, dup in enumerate(duplicates, 1):
        print(f"{i}. 重复片段: \"{dup['segment']}\"")
        print(f"   长度: {dup['length']} 字符")
        print(f"   在文本1中的位置: {dup['text1_position'][0]}-{dup['text1_position'][1]}")
        print(f"   在文本2中的位置: {dup['text2_position'][0]}-{dup['text2_position'][1]}")
        print()

def main():
    """
    主函数
    """
    print("文本重复片段检测器 (简化版)")
    print("=" * 60)
    print("请输入两段文字，程序将找出连续重复超过10个字符的片段。")
    print()
    
    # 获取用户输入
    print("请输入第一段文字:")
    text1 = input().strip()
    
    print("\n请输入第二段文字:")
    text2 = input().strip()
    
    if not text1 or not text2:
        print("错误：两段文字都不能为空！")
        return
    
    print(f"\n文本1长度: {len(text1)} 字符")
    print(f"文本2长度: {len(text2)} 字符")
    
    # 查找重复片段
    duplicates = find_duplicates(text1, text2)
    print_results(duplicates)

def test_with_examples():
    """
    使用多个示例进行测试
    """
    examples = [
        {
            "name": "示例1：中文文本",
            "text1": "这是一个测试文本，包含一些重复的内容。这个程序可以检测重复片段。",
            "text2": "另一个测试文本，也包含一些重复的内容。这个程序非常有用。"
        },
        {
            "name": "示例2：英文文本", 
            "text1": "This is a sample text with some duplicate content. This program can detect duplicate segments.",
            "text2": "Another sample text that also contains some duplicate content. This program is very useful."
        },
        {
            "name": "示例3：长文本",
            "text1": "人工智能技术的发展正在改变我们的生活方式。机器学习和深度学习算法使得计算机能够处理复杂的任务。",
            "text2": "随着人工智能技术的发展，我们看到了许多创新应用。机器学习和深度学习算法在各个领域都有应用。"
        },
        {
            "name": "示例4：无重复",
            "text1": "这是第一段完全不同的文字内容。",
            "text2": "这里是另外一段毫无关联的句子。"
        }
    ]
    
    for example in examples:
        print(f"\n{'='*80}")
        print(f"测试 {example['name']}")
        print(f"{'='*80}")
        print(f"文本1: {example['text1']}")
        print(f"文本2: {example['text2']}")
        print(f"文本1长度: {len(example['text1'])} 字符")
        print(f"文本2长度: {len(example['text2'])} 字符")
        
        duplicates = find_duplicates(example['text1'], example['text2'])
        print_results(duplicates)

if __name__ == "__main__":
    import sys
    
    if len(sys.argv) > 1 and sys.argv[1] == "test":
        test_with_examples()
    else:
        main()