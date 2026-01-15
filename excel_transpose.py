#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Excel行列转置工具
将Excel文件的行列进行转置（行列互换）
"""

import argparse
from datetime import datetime
import os
from pathlib import Path
import sys

import pandas as pd
from openpyxl import load_workbook

def build_watermark_text(custom_text=None):
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    if custom_text:
        return custom_text.replace("{timestamp}", timestamp)
    return f"导出水印 {timestamp}"


def apply_watermark(output_file, watermark_text):
    workbook = load_workbook(output_file)
    for sheet in workbook.worksheets:
        sheet.oddHeader.center.text = watermark_text
        sheet.oddFooter.center.text = watermark_text
    workbook.properties.comments = watermark_text
    workbook.save(output_file)


def transpose_excel(input_file, output_file=None, watermark_text=None):
    """
    转置Excel文件的行列
    
    Args:
        input_file (str): 输入Excel文件路径
        output_file (str): 输出Excel文件路径，如果为None则自动生成
        watermark_text (str): 水印文字内容，None则不添加水印
    
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

        if watermark_text:
            print(f"正在添加水印: {watermark_text}")
            apply_watermark(output_file, watermark_text)
        
        print("转置完成！")
        return str(output_file)
        
    except Exception as e:
        print(f"错误: {e}")
        return None


def parse_args():
    parser = argparse.ArgumentParser(description="Excel行列转置工具")
    parser.add_argument("input_file", help="输入Excel文件路径")
    parser.add_argument("output_file", nargs="?", default=None, help="输出Excel文件路径")
    parser.add_argument(
        "-w",
        "--watermark",
        default=None,
        help="水印文字，可用 {timestamp} 占位符"
    )
    parser.add_argument(
        "--no-watermark",
        action="store_true",
        help="禁用导出水印"
    )
    return parser.parse_args()


def main():
    """主函数"""
    args = parse_args()
    watermark_text = None
    if not args.no_watermark:
        watermark_text = build_watermark_text(args.watermark)
    
    result = transpose_excel(args.input_file, args.output_file, watermark_text)
    
    if result:
        print(f"转置成功！输出文件: {result}")
    else:
        print("转置失败！")
        sys.exit(1)

if __name__ == "__main__":
    main()