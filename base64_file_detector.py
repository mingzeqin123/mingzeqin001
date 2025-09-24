#!/usr/bin/env python3
"""
Base64 File Type Detector

This module provides functionality to determine the original file type from a base64 encoded string
by analyzing the magic bytes (file signatures) of the decoded data.
"""

import base64
import binascii
from typing import Optional, Dict, Tuple


class Base64FileDetector:
    """
    A class to detect file types from base64 encoded strings using magic bytes.
    """
    
    # Magic bytes for common file types
    FILE_SIGNATURES = {
        # Images
        b'\xFF\xD8\xFF': 'jpeg',
        b'\x89PNG\r\n\x1a\n': 'png',
        b'GIF87a': 'gif',
        b'GIF89a': 'gif',
        b'BM': 'bmp',
        b'RIFF': 'webp',  # WebP files start with RIFF, need additional check
        b'\x00\x00\x01\x00': 'ico',
        b'\x00\x00\x02\x00': 'cur',
        
        # Documents
        b'%PDF': 'pdf',
        b'\xD0\xCF\x11\xE0\xA1\xB1\x1A\xE1': 'doc',  # MS Office (DOC, XLS, PPT)
        b'PK\x03\x04': 'zip',  # Also used by DOCX, XLSX, PPTX, JAR, APK
        b'\x50\x4B\x05\x06': 'zip',  # Empty ZIP
        b'\x50\x4B\x07\x08': 'zip',  # ZIP with different header
        
        # Archives
        b'\x1f\x8b': 'gzip',
        b'Rar!\x1a\x07\x00': 'rar',
        b'Rar!\x1a\x07\x01\x00': 'rar',
        b'7z\xBC\xAF\x27\x1C': '7z',
        b'\xFD7zXZ\x00': 'xz',
        
        # Audio
        b'ID3': 'mp3',
        b'\xFF\xFB': 'mp3',
        b'\xFF\xF3': 'mp3',
        b'\xFF\xF2': 'mp3',
        b'OggS': 'ogg',
        b'fLaC': 'flac',
        b'RIFF': 'wav',  # WAV files also start with RIFF
        
        # Video
        b'\x00\x00\x00\x14ftyp': 'mp4',
        b'\x00\x00\x00\x18ftyp': 'mp4',
        b'\x00\x00\x00\x1cftyp': 'mp4',
        b'\x00\x00\x00\x20ftyp': 'mp4',
        b'FLV': 'flv',
        b'\x1a\x45\xdf\xa3': 'mkv',
        
        # Executables
        b'MZ': 'exe',
        b'\x7fELF': 'elf',
        b'\xfe\xed\xfa\xce': 'macho',  # macOS executable (32-bit)
        b'\xfe\xed\xfa\xcf': 'macho',  # macOS executable (64-bit)
        b'\xcf\xfa\xed\xfe': 'macho',  # macOS executable (little-endian)
        
        # Other
        b'<?xml': 'xml',
        b'\x89HDF': 'hdf5',
        b'\x42\x5A\x68': 'bzip2',
        b'\xCA\xFE\xBA\xBE': 'class',  # Java class file
    }
    
    @staticmethod
    def decode_base64(base64_string: str) -> Optional[bytes]:
        """
        Decode a base64 string to bytes.
        
        Args:
            base64_string: The base64 encoded string
            
        Returns:
            Decoded bytes or None if decoding fails
        """
        try:
            # Remove potential data URI prefix
            if base64_string.startswith('data:'):
                base64_string = base64_string.split(',', 1)[1]
            
            # Remove whitespace and newlines
            base64_string = base64_string.strip().replace('\n', '').replace('\r', '')
            
            # Decode base64
            decoded_data = base64.b64decode(base64_string)
            return decoded_data
        except (binascii.Error, ValueError) as e:
            print(f"Base64 decoding error: {e}")
            return None
    
    @classmethod
    def detect_file_type(cls, base64_string: str) -> Tuple[Optional[str], Dict[str, any]]:
        """
        Detect the file type from a base64 encoded string.
        
        Args:
            base64_string: The base64 encoded string
            
        Returns:
            Tuple of (detected_file_type, additional_info)
        """
        decoded_data = cls.decode_base64(base64_string)
        if not decoded_data:
            return None, {'error': 'Failed to decode base64 string'}
        
        # Get file info
        file_size = len(decoded_data)
        additional_info = {
            'file_size_bytes': file_size,
            'first_bytes_hex': decoded_data[:16].hex(),
            'detected_signatures': []
        }
        
        # Check for magic bytes
        for signature, file_type in cls.FILE_SIGNATURES.items():
            if decoded_data.startswith(signature):
                additional_info['detected_signatures'].append({
                    'signature': signature.hex(),
                    'file_type': file_type
                })
        
        # Special handling for files with RIFF header
        if decoded_data.startswith(b'RIFF') and len(decoded_data) > 12:
            if b'WEBP' in decoded_data[:12]:
                return 'webp', additional_info
            elif b'WAVE' in decoded_data[:12]:
                return 'wav', additional_info
            elif b'AVI ' in decoded_data[:12]:
                return 'avi', additional_info
        
        # Special handling for Office files (DOCX, XLSX, PPTX)
        if decoded_data.startswith(b'PK\x03\x04'):
            # These are ZIP files, but could be Office documents
            if b'word/' in decoded_data[:1000] or b'[Content_Types].xml' in decoded_data[:1000]:
                return 'docx', additional_info
            elif b'xl/' in decoded_data[:1000]:
                return 'xlsx', additional_info
            elif b'ppt/' in decoded_data[:1000]:
                return 'pptx', additional_info
            else:
                return 'zip', additional_info
        
        # Return the first detected file type
        if additional_info['detected_signatures']:
            return additional_info['detected_signatures'][0]['file_type'], additional_info
        
        # Try to detect text files
        try:
            decoded_data.decode('utf-8')
            if decoded_data.startswith(b'{') and decoded_data.rstrip().endswith(b'}'):
                return 'json', additional_info
            elif b'<html' in decoded_data.lower()[:100]:
                return 'html', additional_info
            elif b'<svg' in decoded_data.lower()[:100]:
                return 'svg', additional_info
            else:
                return 'text', additional_info
        except UnicodeDecodeError:
            pass
        
        return 'unknown', additional_info
    
    @classmethod
    def get_mime_type(cls, file_type: str) -> str:
        """
        Get MIME type for a detected file type.
        
        Args:
            file_type: The detected file type
            
        Returns:
            MIME type string
        """
        mime_types = {
            # Images
            'jpeg': 'image/jpeg',
            'png': 'image/png',
            'gif': 'image/gif',
            'bmp': 'image/bmp',
            'webp': 'image/webp',
            'ico': 'image/x-icon',
            'cur': 'image/x-cursor',
            'svg': 'image/svg+xml',
            
            # Documents
            'pdf': 'application/pdf',
            'doc': 'application/msword',
            'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            'xml': 'application/xml',
            'html': 'text/html',
            'json': 'application/json',
            'text': 'text/plain',
            
            # Archives
            'zip': 'application/zip',
            'gzip': 'application/gzip',
            'rar': 'application/x-rar-compressed',
            '7z': 'application/x-7z-compressed',
            'xz': 'application/x-xz',
            'bzip2': 'application/x-bzip2',
            
            # Audio
            'mp3': 'audio/mpeg',
            'ogg': 'audio/ogg',
            'flac': 'audio/flac',
            'wav': 'audio/wav',
            
            # Video
            'mp4': 'video/mp4',
            'flv': 'video/x-flv',
            'mkv': 'video/x-matroska',
            'avi': 'video/x-msvideo',
            
            # Executables
            'exe': 'application/x-msdownload',
            'elf': 'application/x-executable',
            'macho': 'application/x-mach-binary',
            'class': 'application/java-vm',
            
            # Other
            'hdf5': 'application/x-hdf',
        }
        
        return mime_types.get(file_type, 'application/octet-stream')


def analyze_base64_file(base64_string: str) -> Dict[str, any]:
    """
    Analyze a base64 encoded file and return comprehensive information.
    
    Args:
        base64_string: The base64 encoded string
        
    Returns:
        Dictionary with file analysis results
    """
    detector = Base64FileDetector()
    file_type, additional_info = detector.detect_file_type(base64_string)
    
    result = {
        'detected_file_type': file_type,
        'mime_type': detector.get_mime_type(file_type) if file_type else None,
        'file_size_bytes': additional_info.get('file_size_bytes', 0),
        'first_bytes_hex': additional_info.get('first_bytes_hex', ''),
        'detected_signatures': additional_info.get('detected_signatures', []),
        'error': additional_info.get('error')
    }
    
    return result


if __name__ == '__main__':
    # Example usage
    import sys
    
    if len(sys.argv) > 1:
        base64_input = sys.argv[1]
        result = analyze_base64_file(base64_input)
        
        print("=== Base64 File Analysis Results ===")
        print(f"Detected File Type: {result['detected_file_type']}")
        print(f"MIME Type: {result['mime_type']}")
        print(f"File Size: {result['file_size_bytes']} bytes")
        print(f"First 16 bytes (hex): {result['first_bytes_hex']}")
        
        if result['detected_signatures']:
            print("\nDetected Signatures:")
            for sig in result['detected_signatures']:
                print(f"  - {sig['file_type']}: {sig['signature']}")
        
        if result['error']:
            print(f"Error: {result['error']}")
    else:
        print("Usage: python base64_file_detector.py <base64_string>")
        print("\nExample:")
        print("python base64_file_detector.py 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=='")