#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Excel行列转置工具
将Excel文件的行列进行转置（行列互换）
"""

import pandas as pd
import sys
import os
from pathlib import Path

def transpose_excel(input_file, output_file=None):
    """
    转置Excel文件的行列
    
    Args:
        input_file (str): 输入Excel文件路径
        output_file (str): 输出Excel文件路径，如果为None则自动生成
    
    Returns:
        str: 输出文件路径
    """
    try:
        # 检查输入文件是否存在
        if not os.path.exists(input_file):
            raise FileNotFoundError(f"输入文件不存在: {input_file}")
        
        # 读取Excel文件
        print(f"正在读取文件: {input_file}")
        df = pd.read_excel(input_file)
        
        print(f"原始数据形状: {df.shape} (行数: {df.shape[0]}, 列数: {df.shape[1]})")
        
        # 转置数据
        df_transposed = df.T
        
        print(f"转置后数据形状: {df_transposed.shape} (行数: {df_transposed.shape[0]}, 列数: {df_transposed.shape[1]})")
        
        # 生成输出文件名
        if output_file is None:
            input_path = Path(input_file)
            output_file = input_path.parent / f"{input_path.stem}_transposed{input_path.suffix}"
        
        # 保存转置后的数据
        print(f"正在保存到: {output_file}")
        df_transposed.to_excel(output_file, index=True, header=True)
        
        print("转置完成！")
        return str(output_file)
        
    except Exception as e:
        print(f"错误: {e}")
        return None

def main():
    """主函数"""
    if len(sys.argv) < 2:
        print("使用方法:")
        print("  python excel_transpose.py <输入文件> [输出文件]")
        print("")
        print("示例:")
        print("  python excel_transpose.py data.xlsx")
        print("  python excel_transpose.py data.xlsx output.xlsx")
        return
    
    input_file = sys.argv[1]
    output_file = sys.argv[2] if len(sys.argv) > 2 else None
    
    result = transpose_excel(input_file, output_file)
    
    if result:
        print(f"转置成功！输出文件: {result}")
    else:
        print("转置失败！")
        sys.exit(1)

if __name__ == "__main__":
    main()