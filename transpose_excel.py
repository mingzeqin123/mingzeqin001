#!/usr/bin/env python3
"""
Excel文件转置工具 - 将Excel文件的行列互换
Excel File Transpose Tool - Transpose rows and columns in Excel files
"""

import pandas as pd
import sys
import os
from pathlib import Path

def transpose_excel(input_file, output_file=None):
    """
    转置Excel文件 (将行变为列，列变为行)
    Transpose Excel file (convert rows to columns and columns to rows)
    
    Args:
        input_file (str): 输入Excel文件路径 / Input Excel file path
        output_file (str): 输出Excel文件路径 / Output Excel file path (optional)
    """
    try:
        # 检查输入文件是否存在
        if not os.path.exists(input_file):
            print(f"错误: 文件 '{input_file}' 不存在")
            print(f"Error: File '{input_file}' does not exist")
            return False
        
        print(f"正在读取文件: {input_file}")
        print(f"Reading file: {input_file}")
        
        # 读取Excel文件
        # 尝试读取所有工作表
        excel_file = pd.ExcelFile(input_file)
        sheet_names = excel_file.sheet_names
        
        print(f"找到 {len(sheet_names)} 个工作表: {sheet_names}")
        print(f"Found {len(sheet_names)} worksheets: {sheet_names}")
        
        # 如果没有指定输出文件名，自动生成
        if output_file is None:
            input_path = Path(input_file)
            output_file = str(input_path.parent / f"{input_path.stem}_transposed{input_path.suffix}")
        
        # 创建ExcelWriter对象
        with pd.ExcelWriter(output_file, engine='openpyxl') as writer:
            for sheet_name in sheet_names:
                print(f"正在处理工作表: {sheet_name}")
                print(f"Processing worksheet: {sheet_name}")
                
                # 读取当前工作表
                df = pd.read_excel(input_file, sheet_name=sheet_name, header=None)
                
                print(f"原始数据形状: {df.shape} (行数: {df.shape[0]}, 列数: {df.shape[1]})")
                print(f"Original data shape: {df.shape} (rows: {df.shape[0]}, columns: {df.shape[1]})")
                
                # 转置数据
                df_transposed = df.transpose()
                
                print(f"转置后数据形状: {df_transposed.shape} (行数: {df_transposed.shape[0]}, 列数: {df_transposed.shape[1]})")
                print(f"Transposed data shape: {df_transposed.shape} (rows: {df_transposed.shape[0]}, columns: {df_transposed.shape[1]})")
                
                # 写入到新的Excel文件
                df_transposed.to_excel(writer, sheet_name=sheet_name, index=False, header=False)
        
        print(f"转置完成! 输出文件: {output_file}")
        print(f"Transpose completed! Output file: {output_file}")
        return True
        
    except Exception as e:
        print(f"错误: {str(e)}")
        print(f"Error: {str(e)}")
        return False

def main():
    """主函数 / Main function"""
    if len(sys.argv) < 2:
        print("使用方法 / Usage:")
        print("  python transpose_excel.py <input_file> [output_file]")
        print("  python transpose_excel.py input.xlsx")
        print("  python transpose_excel.py input.xlsx output.xlsx")
        print()
        print("说明 / Description:")
        print("  - 将Excel文件的行列互换 / Transpose rows and columns in Excel file")
        print("  - 支持多个工作表 / Supports multiple worksheets")
        print("  - 如果不指定输出文件，会自动生成文件名 / Output filename is auto-generated if not specified")
        return
    
    input_file = sys.argv[1]
    output_file = sys.argv[2] if len(sys.argv) > 2 else None
    
    success = transpose_excel(input_file, output_file)
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    main()