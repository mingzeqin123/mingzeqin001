#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
提取两段文字中连续重复超过10个字符的片段 - 交互式版本
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

def print_results(common_substrings, text1, text2, min_length=10):
    """
    打印结果
    """
    if not common_substrings:
        print(f"没有找到连续重复超过{min_length}个字符的片段")
        return
    
    print(f"找到 {len(common_substrings)} 个连续重复超过{min_length}个字符的片段：\n")
    
    for i, item in enumerate(common_substrings, 1):
        print(f"片段 {i}:")
        print(f"  内容: \"{item['text']}\"")
        print(f"  长度: {item['length']} 个字符")
        print(f"  在第一段文字中的位置: {item['pos1']}-{item['end1']}")
        print(f"  在第二段文字中的位置: {item['pos2']}-{item['end2']}")
        
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
    主函数 - 交互式版本
    """
    print("=== 提取两段文字中连续重复超过指定字符数的片段 ===\n")
    
    # 获取最小长度
    try:
        min_length = int(input("请输入最小重复长度（默认10）: ") or "10")
    except ValueError:
        min_length = 10
        print("输入无效，使用默认值10")
    
    print(f"\n请输入两段文字（最小重复长度: {min_length}个字符）:")
    print("-" * 50)
    
    # 获取第一段文字
    print("第一段文字:")
    text1 = input().strip()
    while not text1:
        print("文字不能为空，请重新输入:")
        text1 = input().strip()
    
    # 获取第二段文字
    print("\n第二段文字:")
    text2 = input().strip()
    while not text2:
        print("文字不能为空，请重新输入:")
        text2 = input().strip()
    
    print("\n" + "="*60)
    print("分析结果:")
    print("="*60)
    
    # 查找重复片段
    common_substrings = find_longest_common_substrings(text1, text2, min_length)
    
    # 打印结果
    print_results(common_substrings, text1, text2, min_length)

if __name__ == "__main__":
    main()