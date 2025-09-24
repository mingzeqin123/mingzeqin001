#!/usr/bin/env python3
"""
Demo script for Base64 File Type Detection

This script demonstrates how to use the Base64FileDetector with various test cases.
"""

from base64_file_detector import analyze_base64_file
import base64
import json


def create_test_cases():
    """Create test cases with different file types."""
    
    # Small PNG image (1x1 transparent pixel)
    png_data = b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15\xc4\x89\x00\x00\x00\rIDATx\x9cc\xf8\x0f\x00\x01\x01\x01\x00\x18\xdd\x8d\xb4\x00\x00\x00\x00IEND\xaeB`\x82'
    
    # Simple JPEG header
    jpeg_data = b'\xff\xd8\xff\xe0\x00\x10JFIF\x00\x01\x01\x01\x00H\x00H\x00\x00\xff\xdb\x00C\x00\x08\x06\x06\x07\x06\x05\x08\x07\x07\x07\t\t\x08\n\x0c\x14\r\x0c\x0b\x0b\x0c\x19\x12\x13\x0f'
    
    # Simple PDF header
    pdf_data = b'%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj'
    
    # ZIP file header
    zip_data = b'PK\x03\x04\x14\x00\x00\x00\x08\x00\x00\x00!\x00'
    
    # JSON text
    json_data = b'{"name": "test", "type": "demo", "value": 123}'
    
    # XML data
    xml_data = b'<?xml version="1.0" encoding="UTF-8"?>\n<root>\n  <item>test</item>\n</root>'
    
    # HTML data
    html_data = b'<!DOCTYPE html>\n<html>\n<head>\n  <title>Test</title>\n</head>\n<body>\n  <h1>Hello World</h1>\n</body>\n</html>'
    
    # MP3 header
    mp3_data = b'ID3\x03\x00\x00\x00\x00\x00\x00\x00TALB\x00\x00\x00\x04\x00\x00\x00Test'
    
    test_cases = [
        {'name': 'PNG Image (1x1 pixel)', 'data': png_data},
        {'name': 'JPEG Image', 'data': jpeg_data},
        {'name': 'PDF Document', 'data': pdf_data},
        {'name': 'ZIP Archive', 'data': zip_data},
        {'name': 'JSON File', 'data': json_data},
        {'name': 'XML File', 'data': xml_data},
        {'name': 'HTML File', 'data': html_data},
        {'name': 'MP3 Audio', 'data': mp3_data},
        {'name': 'Invalid Base64', 'data': None, 'base64': 'invalid-base64-string!!!'},
        {'name': 'Unknown Binary', 'data': b'\x00\x01\x02\x03\x04\x05\x06\x07\x08\x09'},
    ]
    
    return test_cases


def run_demo():
    """Run the demo with test cases."""
    
    print("=== Base64 File Type Detection Demo ===\n")
    
    test_cases = create_test_cases()
    
    for i, test_case in enumerate(test_cases, 1):
        print(f"Test Case {i}: {test_case['name']}")
        print("-" * 50)
        
        try:
            if test_case.get('base64'):
                # Use provided base64 string
                base64_string = test_case['base64']
            else:
                # Encode data to base64
                base64_string = base64.b64encode(test_case['data']).decode('utf-8')
            
            print(f"Base64 (first 50 chars): {base64_string[:50]}{'...' if len(base64_string) > 50 else ''}")
            
            # Analyze the file
            result = analyze_base64_file(base64_string)
            
            print(f"Detected Type: {result['detected_file_type']}")
            print(f"MIME Type: {result['mime_type']}")
            print(f"File Size: {result['file_size_bytes']} bytes")
            print(f"First bytes (hex): {result['first_bytes_hex']}")
            
            if result['detected_signatures']:
                print("Detected Signatures:")
                for sig in result['detected_signatures']:
                    print(f"  - {sig['file_type']}: {sig['signature']}")
            
            if result['error']:
                print(f"Error: {result['error']}")
                
        except Exception as e:
            print(f"Error processing test case: {e}")
        
        print("\n")


def interactive_mode():
    """Interactive mode for testing custom base64 strings."""
    
    print("=== Interactive Base64 File Type Detection ===")
    print("Enter base64 strings to analyze. Type 'quit' to exit.\n")
    
    while True:
        try:
            base64_input = input("Enter base64 string (or 'quit'): ").strip()
            
            if base64_input.lower() in ['quit', 'exit', 'q']:
                break
            
            if not base64_input:
                continue
            
            print("\nAnalyzing...")
            result = analyze_base64_file(base64_input)
            
            print(f"Detected Type: {result['detected_file_type']}")
            print(f"MIME Type: {result['mime_type']}")
            print(f"File Size: {result['file_size_bytes']} bytes")
            print(f"First bytes (hex): {result['first_bytes_hex']}")
            
            if result['detected_signatures']:
                print("Detected Signatures:")
                for sig in result['detected_signatures']:
                    print(f"  - {sig['file_type']}: {sig['signature']}")
            
            if result['error']:
                print(f"Error: {result['error']}")
            
            print("\n" + "="*50 + "\n")
            
        except KeyboardInterrupt:
            print("\nExiting...")
            break
        except Exception as e:
            print(f"Error: {e}\n")


if __name__ == '__main__':
    import sys
    
    if len(sys.argv) > 1:
        if sys.argv[1] == 'interactive':
            interactive_mode()
        elif sys.argv[1] == 'demo':
            run_demo()
        else:
            # Analyze provided base64 string
            base64_input = sys.argv[1]
            result = analyze_base64_file(base64_input)
            print(json.dumps(result, indent=2))
    else:
        print("Usage:")
        print("  python demo_base64_detector.py demo           # Run demo with test cases")
        print("  python demo_base64_detector.py interactive    # Interactive mode")
        print("  python demo_base64_detector.py <base64>       # Analyze specific base64 string")
        print("\nExample:")
        print("  python demo_base64_detector.py 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=='")