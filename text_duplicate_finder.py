#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
文本重复片段检测器
提取两段文字中连续重复超过10个字符的片段
"""

def find_duplicate_segments(text1, text2, min_length=10):
    """
    查找两段文本中连续重复超过指定长度的片段
    
    Args:
        text1 (str): 第一段文本
        text2 (str): 第二段文本
        min_length (int): 最小重复长度，默认为10
    
    Returns:
        list: 包含重复片段信息的列表
    """
    duplicates = []
    
    # 遍历第一段文本的所有可能子串
    for i in range(len(text1)):
        for j in range(i + min_length, len(text1) + 1):
            segment = text1[i:j]
            
            # 在第二段文本中查找相同的片段
            if segment in text2:
                # 记录重复片段的详细信息
                duplicate_info = {
                    'segment': segment,
                    'length': len(segment),
                    'text1_position': (i, j-1),
                    'text2_positions': []
                }
                
                # 查找在第二段文本中的所有出现位置
                start = 0
                while True:
                    pos = text2.find(segment, start)
                    if pos == -1:
                        break
                    duplicate_info['text2_positions'].append((pos, pos + len(segment) - 1))
                    start = pos + 1
                
                duplicates.append(duplicate_info)
    
    # 去除重复项并按长度排序
    unique_duplicates = []
    seen_segments = set()
    
    for dup in duplicates:
        if dup['segment'] not in seen_segments:
            seen_segments.add(dup['segment'])
            unique_duplicates.append(dup)
    
    # 按长度降序排序
    unique_duplicates.sort(key=lambda x: x['length'], reverse=True)
    
    return unique_duplicates

def find_longest_common_substrings(text1, text2, min_length=10):
    """
    使用动态规划方法查找最长公共子串
    
    Args:
        text1 (str): 第一段文本
        text2 (str): 第二段文本
        min_length (int): 最小长度要求
    
    Returns:
        list: 长度超过min_length的公共子串列表
    """
    m, n = len(text1), len(text2)
    
    # 创建DP表
    dp = [[0] * (n + 1) for _ in range(m + 1)]
    common_substrings = []
    
    for i in range(1, m + 1):
        for j in range(1, n + 1):
            if text1[i-1] == text2[j-1]:
                dp[i][j] = dp[i-1][j-1] + 1
                
                # 如果找到了足够长的公共子串
                if dp[i][j] >= min_length:
                    substring = text1[i-dp[i][j]:i]
                    
                    # 避免重复添加
                    if substring not in [cs['segment'] for cs in common_substrings]:
                        common_substrings.append({
                            'segment': substring,
                            'length': len(substring),
                            'text1_position': (i-dp[i][j], i-1),
                            'text2_position': (j-dp[i][j], j-1)
                        })
            else:
                dp[i][j] = 0
    
    # 按长度降序排序
    common_substrings.sort(key=lambda x: x['length'], reverse=True)
    
    return common_substrings

def print_results(duplicates, method_name):
    """
    打印结果
    
    Args:
        duplicates (list): 重复片段列表
        method_name (str): 方法名称
    """
    print(f"\n=== {method_name} ===")
    if not duplicates:
        print("未找到连续重复超过10个字符的片段。")
        return
    
    print(f"找到 {len(duplicates)} 个重复片段：\n")
    
    for i, dup in enumerate(duplicates, 1):
        print(f"{i}. 重复片段: \"{dup['segment']}\"")
        print(f"   长度: {dup['length']} 字符")
        
        if 'text1_position' in dup:
            print(f"   在文本1中的位置: {dup['text1_position'][0]}-{dup['text1_position'][1]}")
        
        if 'text2_positions' in dup:
            positions = ', '.join([f"{pos[0]}-{pos[1]}" for pos in dup['text2_positions']])
            print(f"   在文本2中的位置: {positions}")
        elif 'text2_position' in dup:
            print(f"   在文本2中的位置: {dup['text2_position'][0]}-{dup['text2_position'][1]}")
        
        print()

def main():
    """
    主函数 - 用户交互界面
    """
    print("文本重复片段检测器")
    print("=" * 50)
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
    
    # 方法1：简单字符串匹配
    duplicates1 = find_duplicate_segments(text1, text2)
    print_results(duplicates1, "方法1：字符串匹配")
    
    # 方法2：动态规划最长公共子串
    duplicates2 = find_longest_common_substrings(text1, text2)
    print_results(duplicates2, "方法2：最长公共子串")

def demo():
    """
    演示函数 - 使用示例数据
    """
    print("演示模式 - 使用示例数据")
    print("=" * 50)
    
    # 示例文本
    text1 = "这是一个测试文本，包含一些重复的内容。这个程序可以检测重复片段。"
    text2 = "另一个测试文本，也包含一些重复的内容。这个程序非常有用。"
    
    print(f"文本1: {text1}")
    print(f"文本2: {text2}")
    print(f"\n文本1长度: {len(text1)} 字符")
    print(f"文本2长度: {len(text2)} 字符")
    
    # 方法1：简单字符串匹配
    duplicates1 = find_duplicate_segments(text1, text2)
    print_results(duplicates1, "方法1：字符串匹配")
    
    # 方法2：动态规划最长公共子串
    duplicates2 = find_longest_common_substrings(text1, text2)
    print_results(duplicates2, "方法2：最长公共子串")

if __name__ == "__main__":
    import sys
    
    if len(sys.argv) > 1 and sys.argv[1] == "demo":
        demo()
    else:
        main()