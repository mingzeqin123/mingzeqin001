#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
微信转账使用示例
"""

from wechat_transfer import WeChatTransfer
from config import WECHAT_PAY_CONFIG, TRANSFER_CONFIG
import time


def main():
    """主函数"""
    print("=== 微信转账到零钱示例 ===\n")
    
    # 创建转账实例
    transfer = WeChatTransfer(**WECHAT_PAY_CONFIG)
    
    # 示例1: 基本转账
    print("1. 基本转账示例")
    partner_trade_no = f"transfer_{int(time.time())}"
    openid = "test_openid_123456"  # 请替换为真实的openid
    amount = 100  # 1元
    desc = "测试转账"
    
    print(f"商户订单号: {partner_trade_no}")
    print(f"用户openid: {openid}")
    print(f"转账金额: {amount}分")
    print(f"转账描述: {desc}")
    
    success, result = transfer.transfer_to_balance(
        partner_trade_no=partner_trade_no,
        openid=openid,
        amount=amount,
        desc=desc
    )
    
    if success:
        print("✅ 转账成功！")
        print(f"   微信单号: {result.get('payment_no')}")
        print(f"   转账时间: {result.get('payment_time')}")
    else:
        print("❌ 转账失败！")
        print(f"   错误信息: {result}")
    
    print("\n" + "="*50 + "\n")
    
    # 示例2: 带姓名校验的转账
    print("2. 带姓名校验的转账示例")
    partner_trade_no2 = f"transfer_{int(time.time()) + 1}"
    openid2 = "test_openid_789012"  # 请替换为真实的openid
    amount2 = 200  # 2元
    desc2 = "带姓名校验的转账"
    user_name = "张三"
    
    print(f"商户订单号: {partner_trade_no2}")
    print(f"用户openid: {openid2}")
    print(f"转账金额: {amount2}分")
    print(f"转账描述: {desc2}")
    print(f"收款人姓名: {user_name}")
    
    success2, result2 = transfer.transfer_to_balance(
        partner_trade_no=partner_trade_no2,
        openid=openid2,
        amount=amount2,
        desc=desc2,
        check_name="FORCE_CHECK",
        re_user_name=user_name
    )
    
    if success2:
        print("✅ 转账成功！")
        print(f"   微信单号: {result2.get('payment_no')}")
        print(f"   转账时间: {result2.get('payment_time')}")
    else:
        print("❌ 转账失败！")
        print(f"   错误信息: {result2}")
    
    print("\n" + "="*50 + "\n")
    
    # 示例3: 查询转账结果
    print("3. 查询转账结果示例")
    print(f"查询订单号: {partner_trade_no}")
    
    success3, result3 = transfer.query_transfer(partner_trade_no)
    
    if success3:
        print("✅ 查询成功！")
        print(f"   转账状态: {result3.get('status')}")
        print(f"   转账金额: {result3.get('transfer_amount')}")
        print(f"   转账时间: {result3.get('transfer_time')}")
        print(f"   失败原因: {result3.get('reason', '无')}")
    else:
        print("❌ 查询失败！")
        print(f"   错误信息: {result3}")


def validate_config():
    """验证配置"""
    print("=== 配置验证 ===\n")
    
    required_fields = ['mch_id', 'app_id', 'api_key']
    missing_fields = []
    
    for field in required_fields:
        if not WECHAT_PAY_CONFIG.get(field) or WECHAT_PAY_CONFIG[field] == f'your_{field}':
            missing_fields.append(field)
    
    if missing_fields:
        print("❌ 配置不完整，请检查以下字段：")
        for field in missing_fields:
            print(f"   - {field}")
        print("\n请修改 config.py 文件中的配置信息")
        return False
    else:
        print("✅ 配置验证通过")
        return True


if __name__ == "__main__":
    # 验证配置
    if validate_config():
        print("\n")
        main()
    else:
        print("\n请先完成配置后再运行示例")