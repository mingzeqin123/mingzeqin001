#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
提取两段文字中连续重复超过10个字符的片段 - 优化版本
只显示最长的重复片段，避免显示重复的子串
"""

def find_longest_common_substrings(text1, text2, min_length=10):
    """
    找到两段文字中最长的连续重复片段（避免重复的子串）
    
    Args:
        text1 (str): 第一段文字
        text2 (str): 第二段文字
        min_length (int): 最小重复长度，默认为10
    
    Returns:
        list: 包含最长重复片段的列表
    """
    common_substrings = []
    
    # 遍历第一段文字的所有可能子串
    for i in range(len(text1)):
        for j in range(i + min_length, len(text1) + 1):
            substring = text1[i:j]
            
            # 在第二段文字中查找这个子串
            if substring in text2:
                start_pos2 = text2.find(substring)
                end_pos2 = start_pos2 + len(substring)
                
                # 检查是否已经存在包含这个子串的更长子串
                is_substring_of_existing = False
                for existing in common_substrings:
                    if (existing['pos1'] <= i and existing['end1'] >= j and
                        existing['pos2'] <= start_pos2 and existing['end2'] >= end_pos2):
                        is_substring_of_existing = True
                        break
                
                if not is_substring_of_existing:
                    # 移除被这个子串包含的现有子串
                    common_substrings = [item for item in common_substrings 
                                       if not (i <= item['pos1'] and j >= item['end1'] and
                                               start_pos2 <= item['pos2'] and end_pos2 >= item['end2'])]
                    
                    common_substrings.append({
                        'text': substring,
                        'length': len(substring),
                        'pos1': i,
                        'end1': j,
                        'pos2': start_pos2,
                        'end2': end_pos2
                    })
    
    # 按长度降序排序
    common_substrings.sort(key=lambda x: x['length'], reverse=True)
    
    return common_substrings

def find_all_longest_common_substrings(text1, text2, min_length=10):
    """
    找到两段文字中所有最长的连续重复片段（包括所有出现位置）
    
    Args:
        text1 (str): 第一段文字
        text2 (str): 第二段文字
        min_length (int): 最小重复长度，默认为10
    
    Returns:
        list: 包含所有最长重复片段的列表
    """
    all_common_substrings = []
    
    # 遍历第一段文字的所有可能子串
    for i in range(len(text1)):
        for j in range(i + min_length, len(text1) + 1):
            substring = text1[i:j]
            
            # 在第二段文字中查找这个子串的所有出现位置
            start = 0
            while True:
                pos = text2.find(substring, start)
                if pos == -1:
                    break
                
                all_common_substrings.append({
                    'text': substring,
                    'length': len(substring),
                    'pos1': i,
                    'end1': j,
                    'pos2': pos,
                    'end2': pos + len(substring)
                })
                
                start = pos + 1
    
    # 按长度降序排序
    all_common_substrings.sort(key=lambda x: x['length'], reverse=True)
    
    # 只保留最长的片段
    if not all_common_substrings:
        return []
    
    max_length = all_common_substrings[0]['length']
    longest_substrings = [item for item in all_common_substrings if item['length'] == max_length]
    
    return longest_substrings

def print_results(common_substrings, text1, text2, show_context=True):
    """
    打印结果
    """
    if not common_substrings:
        print("没有找到连续重复超过10个字符的片段")
        return
    
    print(f"找到 {len(common_substrings)} 个最长连续重复片段：\n")
    
    for i, item in enumerate(common_substrings, 1):
        print(f"片段 {i}:")
        print(f"  内容: \"{item['text']}\"")
        print(f"  长度: {item['length']} 个字符")
        print(f"  在第一段文字中的位置: {item['pos1']}-{item['end1']}")
        print(f"  在第二段文字中的位置: {item['pos2']}-{item['end2']}")
        
        if show_context:
            # 显示上下文
            context1_start = max(0, item['pos1']-20)
            context1_end = min(len(text1), item['end1']+20)
            context2_start = max(0, item['pos2']-20)
            context2_end = min(len(text2), item['end2']+20)
            
            print(f"  上下文1: ...{text1[context1_start:context1_end]}...")
            print(f"  上下文2: ...{text2[context2_start:context2_end]}...")
        print()

def main():
    """
    主函数 - 示例用法
    """
    print("=== 提取两段文字中连续重复超过10个字符的片段（优化版） ===\n")
    
    # 示例文字1
    text1 = """人工智能（Artificial Intelligence，简称AI）是计算机科学的一个分支，
它企图了解智能的实质，并生产出一种新的能以人类智能相似的方式做出反应的智能机器。
该领域的研究包括机器人、语言识别、图像识别、自然语言处理和专家系统等。
人工智能从诞生以来，理论和技术日益成熟，应用领域也不断扩大。"""
    
    # 示例文字2
    text2 = """人工智能是计算机科学的一个重要分支，它致力于研究、开发用于模拟、
延伸和扩展人的智能的理论、方法、技术及应用系统。人工智能从诞生以来，
理论和技术日益成熟，应用领域也不断扩大，可以设想，未来人工智能带来的科技产品，
将会是人类智慧的"容器"。人工智能可以对人的意识、思维的信息过程的模拟。
人工智能不是人的智能，但能像人那样思考、也可能超过人的智能。"""
    
    print("第一段文字:")
    print(text1)
    print("\n第二段文字:")
    print(text2)
    print("\n" + "="*60 + "\n")
    
    # 查找最长重复片段
    common_substrings = find_longest_common_substrings(text1, text2, min_length=10)
    
    # 打印结果
    print("最长重复片段（去重后）:")
    print_results(common_substrings, text1, text2)
    
    # 查找所有最长重复片段
    all_longest = find_all_longest_common_substrings(text1, text2, min_length=10)
    print("\n" + "="*60)
    print("所有最长重复片段（包括重复位置）:")
    print_results(all_longest, text1, text2, show_context=False)

if __name__ == "__main__":
    main()