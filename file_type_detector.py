#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Base64文件类型检测工具
根据base64编码的数据判断原始文件的类型
"""

import base64
import binascii
from typing import Optional, Dict, Tuple


class FileTypeDetector:
    """文件类型检测器"""
    
    # 常见文件类型的魔数（文件头）
    FILE_SIGNATURES = {
        # 图片格式
        'JPEG': [b'\xff\xd8\xff'],
        'PNG': [b'\x89\x50\x4e\x47\x0d\x0a\x1a\x0a'],
        'GIF': [b'\x47\x49\x46\x38\x37\x61', b'\x47\x49\x46\x38\x39\x61'],  # GIF87a, GIF89a
        'BMP': [b'\x42\x4d'],
        'WEBP': [b'\x52\x49\x46\x46', b'\x57\x45\x42\x50'],  # RIFF + WEBP
        'TIFF': [b'\x49\x49\x2a\x00', b'\x4d\x4d\x00\x2a'],  # Little endian, Big endian
        'ICO': [b'\x00\x00\x01\x00'],
        'SVG': [b'\x3c\x73\x76\x67'],  # <svg
        
        # 文档格式
        'PDF': [b'\x25\x50\x44\x46'],  # %PDF
        'DOC': [b'\xd0\xcf\x11\xe0\xa1\xb1\x1a\xe1'],  # Microsoft Office
        'XLS': [b'\xd0\xcf\x11\xe0\xa1\xb1\x1a\xe1'],  # Microsoft Office
        'PPT': [b'\xd0\xcf\x11\xe0\xa1\xb1\x1a\xe1'],  # Microsoft Office
        
        # 压缩文件
        'ZIP': [b'\x50\x4b\x03\x04', b'\x50\x4b\x05\x06', b'\x50\x4b\x07\x08'],
        'RAR': [b'\x52\x61\x72\x21\x1a\x07\x00', b'\x52\x61\x72\x21\x1a\x07\x01\x00'],
        '7Z': [b'\x37\x7a\xbc\xaf\x27\x1c'],
        'TAR': [b'\x75\x73\x74\x61\x72'],
        'GZIP': [b'\x1f\x8b'],
        
        # 音频格式
        'MP3': [b'\xff\xfb', b'\xff\xf3', b'\xff\xf2', b'\x49\x44\x33'],  # ID3 tag
        'WAV': [b'\x52\x49\x46\x46', b'\x57\x41\x56\x45'],  # RIFF + WAVE
        'FLAC': [b'\x66\x4c\x61\x43'],
        'OGG': [b'\x4f\x67\x67\x53'],
        'AAC': [b'\xff\xf1', b'\xff\xf9'],
        
        # 视频格式
        'MP4': [b'\x00\x00\x00\x18\x66\x74\x79\x70', b'\x00\x00\x00\x20\x66\x74\x79\x70'],
        'AVI': [b'\x52\x49\x46\x46', b'\x41\x56\x49\x20'],  # RIFF + AVI
        'MOV': [b'\x00\x00\x00\x14\x66\x74\x79\x70'],
        'WMV': [b'\x30\x26\xb2\x75\x8e\x66\xcf\x11'],
        'FLV': [b'\x46\x4c\x56\x01'],
        'MKV': [b'\x1a\x45\xdf\xa3'],
        
        # 文本格式
        'TXT': [b'\xef\xbb\xbf'],  # UTF-8 BOM
        'XML': [b'\x3c\x3f\x78\x6d\x6c'],  # <?xml
        'HTML': [b'\x3c\x68\x74\x6d\x6c', b'\x3c\x48\x54\x4d\x4c'],  # <html, <HTML
        'CSS': [b'\x40\x69\x6d\x70\x6f\x72\x74', b'\x40\x6d\x65\x64\x69\x61'],  # @import, @media
        
        # 可执行文件
        'EXE': [b'\x4d\x5a'],  # MZ
        'ELF': [b'\x7f\x45\x4c\x46'],
        'MACHO': [b'\xfe\xed\xfa\xce', b'\xfe\xed\xfa\xcf', b'\xce\xfa\xed\xfe', b'\xcf\xfa\xed\xfe'],
        
        # 其他格式
        'SQLITE': [b'\x53\x51\x4c\x69\x74\x65\x20\x66\x6f\x72\x6d\x61\x74\x20\x33\x00'],
        'SWF': [b'\x43\x57\x53', b'\x46\x57\x53'],  # CWS, FWS
        'PSD': [b'\x38\x42\x50\x53'],
        'EPS': [b'\x25\x21\x50\x53'],
    }
    
    @staticmethod
    def detect_file_type(base64_data: str) -> Tuple[Optional[str], str, Dict]:
        """
        根据base64数据检测文件类型
        
        Args:
            base64_data: base64编码的字符串
            
        Returns:
            Tuple[文件类型, 详细信息, 检测结果]
        """
        try:
            # 解码base64数据
            binary_data = base64.b64decode(base64_data)
            
            # 获取文件头信息
            file_header = binary_data[:32]  # 取前32字节进行分析
            
            # 检测文件类型
            detected_type = FileTypeDetector._detect_by_signature(file_header)
            
            # 获取详细信息
            file_size = len(binary_data)
            header_hex = file_header[:16].hex().upper()  # 前16字节的十六进制表示
            
            details = {
                'file_size': file_size,
                'header_hex': header_hex,
                'is_valid_base64': True,
                'binary_data_length': len(binary_data)
            }
            
            return detected_type, f"检测到文件类型: {detected_type or '未知'}", details
            
        except binascii.Error:
            return None, "无效的base64数据", {'is_valid_base64': False}
        except Exception as e:
            return None, f"检测过程中发生错误: {str(e)}", {'error': str(e)}
    
    @staticmethod
    def _detect_by_signature(file_header: bytes) -> Optional[str]:
        """
        根据文件头魔数检测文件类型
        
        Args:
            file_header: 文件头字节数据
            
        Returns:
            检测到的文件类型，如果未检测到则返回None
        """
        # 特殊处理：检查ZIP格式（需要区分ZIP和Office文档）
        if file_header.startswith(b'\x50\x4b\x03\x04'):
            # 检查是否为Office文档
            if FileTypeDetector._is_office_document(file_header):
                return 'DOCX'  # 默认为DOCX，实际应用中可能需要更详细的检测
            else:
                return 'ZIP'
        
        for file_type, signatures in FileTypeDetector.FILE_SIGNATURES.items():
            for signature in signatures:
                if file_header.startswith(signature):
                    return file_type
        
        # 特殊处理：检查是否为纯文本
        if FileTypeDetector._is_text_file(file_header):
            return 'TXT'
        
        return None
    
    @staticmethod
    def _is_office_document(file_header: bytes) -> bool:
        """
        检查是否为Office文档（基于ZIP格式）
        
        Args:
            file_header: 文件头字节数据
            
        Returns:
            是否为Office文档
        """
        # Office文档通常包含特定的内部结构标识
        # 这里简化处理，实际应用中需要更复杂的检测逻辑
        # 对于测试目的，我们假设包含特定字节序列的是Office文档
        return False  # 简化处理，默认返回False（即认为是ZIP）
    
    @staticmethod
    def _is_text_file(file_header: bytes) -> bool:
        """
        检查是否为文本文件
        
        Args:
            file_header: 文件头字节数据
            
        Returns:
            是否为文本文件
        """
        try:
            # 尝试解码为UTF-8
            file_header.decode('utf-8')
            return True
        except UnicodeDecodeError:
            # 检查是否包含可打印ASCII字符
            return all(32 <= byte <= 126 or byte in [9, 10, 13] for byte in file_header)
    
    @staticmethod
    def get_supported_types() -> list:
        """
        获取支持的文件类型列表
        
        Returns:
            支持的文件类型列表
        """
        return list(FileTypeDetector.FILE_SIGNATURES.keys())
    
    @staticmethod
    def analyze_base64_detailed(base64_data: str) -> Dict:
        """
        详细分析base64数据
        
        Args:
            base64_data: base64编码的字符串
            
        Returns:
            详细分析结果
        """
        try:
            binary_data = base64.b64decode(base64_data)
            file_header = binary_data[:32]
            
            result = {
                'is_valid_base64': True,
                'file_size': len(binary_data),
                'header_hex': file_header.hex().upper(),
                'header_ascii': ''.join(chr(b) if 32 <= b <= 126 else '.' for b in file_header),
                'detected_type': FileTypeDetector._detect_by_signature(file_header),
                'is_text_file': FileTypeDetector._is_text_file(file_header),
                'first_16_bytes': file_header[:16].hex().upper(),
                'mime_type_hint': FileTypeDetector._get_mime_type_hint(file_header)
            }
            
            return result
            
        except Exception as e:
            return {
                'is_valid_base64': False,
                'error': str(e)
            }
    
    @staticmethod
    def _get_mime_type_hint(file_header: bytes) -> Optional[str]:
        """
        根据文件头获取MIME类型提示
        
        Args:
            file_header: 文件头字节数据
            
        Returns:
            MIME类型提示
        """
        mime_map = {
            b'\xff\xd8\xff': 'image/jpeg',
            b'\x89\x50\x4e\x47': 'image/png',
            b'\x47\x49\x46\x38': 'image/gif',
            b'\x42\x4d': 'image/bmp',
            b'\x25\x50\x44\x46': 'application/pdf',
            b'\x50\x4b\x03\x04': 'application/zip',
            b'\x1f\x8b': 'application/gzip',
            b'\x4d\x5a': 'application/x-msdownload',
        }
        
        for signature, mime_type in mime_map.items():
            if file_header.startswith(signature):
                return mime_type
        
        return None


def main():
    """主函数 - 命令行使用示例"""
    import sys
    
    if len(sys.argv) != 2:
        print("使用方法: python file_type_detector.py <base64_data>")
        print("或者: python file_type_detector.py --supported-types")
        sys.exit(1)
    
    if sys.argv[1] == '--supported-types':
        print("支持的文件类型:")
        for file_type in FileTypeDetector.get_supported_types():
            print(f"  - {file_type}")
        return
    
    base64_data = sys.argv[1]
    
    # 检测文件类型
    file_type, message, details = FileTypeDetector.detect_file_type(base64_data)
    
    print(f"检测结果: {message}")
    print(f"详细信息: {details}")
    
    # 详细分析
    print("\n详细分析:")
    detailed_result = FileTypeDetector.analyze_base64_detailed(base64_data)
    for key, value in detailed_result.items():
        print(f"  {key}: {value}")


if __name__ == "__main__":
    main()