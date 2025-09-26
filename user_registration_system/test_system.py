#!/usr/bin/env python3
"""
用户注册系统测试脚本
"""

import requests
import json
import time

# 测试配置
BASE_URL = 'http://localhost:5000'
TEST_EMAIL = 'test@example.com'  # 修改为有效的测试邮箱

def test_registration():
    """测试用户注册功能"""
    print("🔄 开始测试用户注册功能...")
    
    # 测试数据
    test_data = {
        'username': f'testuser_{int(time.time())}',
        'email': f'test_{int(time.time())}@example.com'
    }
    
    try:
        # 发送注册请求
        response = requests.post(
            f'{BASE_URL}/register',
            headers={'Content-Type': 'application/json'},
            json=test_data
        )
        
        result = response.json()
        
        if response.status_code == 200 and result.get('success'):
            print(f"✅ 注册测试成功！")
            print(f"   用户名: {test_data['username']}")
            print(f"   邮箱: {test_data['email']}")
            print(f"   消息: {result.get('message')}")
            return True
        else:
            print(f"❌ 注册测试失败: {result.get('message', '未知错误')}")
            return False
            
    except requests.RequestException as e:
        print(f"❌ 网络请求失败: {str(e)}")
        return False
    except Exception as e:
        print(f"❌ 测试过程中发生错误: {str(e)}")
        return False

def test_duplicate_registration():
    """测试重复注册处理"""
    print("\n🔄 开始测试重复注册处理...")
    
    # 使用相同的测试数据
    test_data = {
        'username': 'duplicate_test_user',
        'email': 'duplicate@example.com'
    }
    
    try:
        # 第一次注册
        response1 = requests.post(
            f'{BASE_URL}/register',
            headers={'Content-Type': 'application/json'},
            json=test_data
        )
        
        # 第二次注册（应该失败）
        response2 = requests.post(
            f'{BASE_URL}/register',
            headers={'Content-Type': 'application/json'},
            json=test_data
        )
        
        result2 = response2.json()
        
        if not result2.get('success'):
            print("✅ 重复注册检测正常！")
            print(f"   错误消息: {result2.get('message')}")
            return True
        else:
            print("❌ 重复注册检测失败，系统允许了重复注册")
            return False
            
    except Exception as e:
        print(f"❌ 重复注册测试失败: {str(e)}")
        return False

def test_email_sending():
    """测试邮件发送功能"""
    print(f"\n🔄 开始测试邮件发送功能...")
    print(f"注意：请确保已正确配置邮件服务参数")
    
    try:
        # 发送测试邮件
        response = requests.post(
            f'{BASE_URL}/test-email',
            headers={'Content-Type': 'application/json'},
            json={'email': TEST_EMAIL}
        )
        
        result = response.json()
        
        if response.status_code == 200 and result.get('success'):
            print(f"✅ 邮件发送测试成功！")
            print(f"   测试邮箱: {TEST_EMAIL}")
            print(f"   请检查邮箱收件箱")
            return True
        else:
            print(f"❌ 邮件发送测试失败: {result.get('message')}")
            print("💡 请检查邮件配置是否正确")
            return False
            
    except Exception as e:
        print(f"❌ 邮件发送测试失败: {str(e)}")
        return False

def test_invalid_input():
    """测试无效输入处理"""
    print("\n🔄 开始测试无效输入处理...")
    
    invalid_cases = [
        {'username': '', 'email': 'test@example.com', 'desc': '空用户名'},
        {'username': 'testuser', 'email': '', 'desc': '空邮箱'},
        {'username': '', 'email': '', 'desc': '空用户名和邮箱'},
        {'username': 'testuser', 'email': 'invalid-email', 'desc': '无效邮箱格式'}
    ]
    
    success_count = 0
    
    for case in invalid_cases:
        try:
            response = requests.post(
                f'{BASE_URL}/register',
                headers={'Content-Type': 'application/json'},
                json={'username': case['username'], 'email': case['email']}
            )
            
            result = response.json()
            
            if not result.get('success'):
                print(f"✅ {case['desc']} - 正确拒绝")
                success_count += 1
            else:
                print(f"❌ {case['desc']} - 应该被拒绝但被接受了")
                
        except Exception as e:
            print(f"❌ 测试 {case['desc']} 时发生错误: {str(e)}")
    
    return success_count == len(invalid_cases)

def check_server_status():
    """检查服务器状态"""
    print("🔄 检查服务器状态...")
    
    try:
        response = requests.get(BASE_URL, timeout=5)
        if response.status_code == 200:
            print("✅ 服务器运行正常")
            return True
        else:
            print(f"❌ 服务器响应异常，状态码: {response.status_code}")
            return False
    except requests.RequestException:
        print("❌ 无法连接到服务器")
        print("💡 请确保服务器已启动 (python app.py)")
        return False

def main():
    """主测试函数"""
    print("=" * 50)
    print("🚀 用户注册系统测试开始")
    print("=" * 50)
    
    # 检查服务器状态
    if not check_server_status():
        return
    
    # 运行测试
    tests = [
        ("用户注册功能", test_registration),
        ("重复注册处理", test_duplicate_registration),
        ("无效输入处理", test_invalid_input),
        ("邮件发送功能", test_email_sending)
    ]
    
    passed = 0
    total = len(tests)
    
    for test_name, test_func in tests:
        try:
            if test_func():
                passed += 1
        except Exception as e:
            print(f"❌ {test_name} 测试失败: {str(e)}")
    
    print("\n" + "=" * 50)
    print(f"📊 测试结果: {passed}/{total} 项测试通过")
    
    if passed == total:
        print("🎉 所有测试通过！系统运行正常")
    else:
        print("⚠️  部分测试失败，请检查系统配置")
    
    print("=" * 50)

if __name__ == '__main__':
    main()