#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
提取两段文字中连续重复超过10个字符的片段
"""

def find_common_substrings(text1, text2, min_length=10):
    """
    找到两段文字中连续重复超过指定长度的片段
    
    Args:
        text1 (str): 第一段文字
        text2 (str): 第二段文字
        min_length (int): 最小重复长度，默认为10
    
    Returns:
        list: 包含所有重复片段的列表，每个片段包含内容和位置信息
    """
    common_substrings = []
    
    # 遍历第一段文字的所有可能子串
    for i in range(len(text1)):
        for j in range(i + min_length, len(text1) + 1):
            substring = text1[i:j]
            
            # 在第二段文字中查找这个子串
            if substring in text2:
                # 找到在第二段文字中的位置
                start_pos2 = text2.find(substring)
                end_pos2 = start_pos2 + len(substring)
                
                # 检查是否已经存在相同的片段（避免重复）
                is_duplicate = False
                for existing in common_substrings:
                    if (existing['text'] == substring and 
                        existing['pos1'] == i and 
                        existing['pos2'] == start_pos2):
                        is_duplicate = True
                        break
                
                if not is_duplicate:
                    common_substrings.append({
                        'text': substring,
                        'length': len(substring),
                        'pos1': i,  # 在第一段文字中的起始位置
                        'end1': j,  # 在第一段文字中的结束位置
                        'pos2': start_pos2,  # 在第二段文字中的起始位置
                        'end2': end_pos2  # 在第二段文字中的结束位置
                    })
    
    # 按长度降序排序
    common_substrings.sort(key=lambda x: x['length'], reverse=True)
    
    return common_substrings

def find_all_occurrences(text1, text2, min_length=10):
    """
    找到两段文字中所有连续重复超过指定长度的片段（包括所有出现位置）
    
    Args:
        text1 (str): 第一段文字
        text2 (str): 第二段文字
        min_length (int): 最小重复长度，默认为10
    
    Returns:
        list: 包含所有重复片段的列表
    """
    common_substrings = []
    
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
                
                common_substrings.append({
                    'text': substring,
                    'length': len(substring),
                    'pos1': i,
                    'end1': j,
                    'pos2': pos,
                    'end2': pos + len(substring)
                })
                
                start = pos + 1
    
    # 按长度降序排序
    common_substrings.sort(key=lambda x: x['length'], reverse=True)
    
    return common_substrings

def print_results(common_substrings, text1, text2):
    """
    打印结果
    """
    if not common_substrings:
        print("没有找到连续重复超过10个字符的片段")
        return
    
    print(f"找到 {len(common_substrings)} 个连续重复超过10个字符的片段：\n")
    
    for i, item in enumerate(common_substrings, 1):
        print(f"片段 {i}:")
        print(f"  内容: \"{item['text']}\"")
        print(f"  长度: {item['length']} 个字符")
        print(f"  在第一段文字中的位置: {item['pos1']}-{item['end1']}")
        print(f"  在第二段文字中的位置: {item['pos2']}-{item['end2']}")
        print(f"  上下文1: ...{text1[max(0, item['pos1']-10):item['end1']+10]}...")
        print(f"  上下文2: ...{text2[max(0, item['pos2']-10):item['end2']+10]}...")
        print()

def main():
    """
    主函数 - 示例用法
    """
    print("=== 提取两段文字中连续重复超过10个字符的片段 ===\n")
    
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
    
    # 查找重复片段
    common_substrings = find_common_substrings(text1, text2, min_length=10)
    
    # 打印结果
    print_results(common_substrings, text1, text2)
    
    # 如果需要查找所有出现位置（包括重复的）
    print("\n" + "="*60)
    print("查找所有出现位置（包括重复的）:")
    all_occurrences = find_all_occurrences(text1, text2, min_length=10)
    print(f"总共找到 {len(all_occurrences)} 个重复片段")

if __name__ == "__main__":
    main()