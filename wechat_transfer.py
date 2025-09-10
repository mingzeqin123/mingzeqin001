#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
微信支付 - 商家转账到零钱接口
支持向个人微信用户转账功能
"""

import hashlib
import hmac
import json
import time
import uuid
import requests
from datetime import datetime
from typing import Dict, Optional, Tuple
import xml.etree.ElementTree as ET


class WeChatTransfer:
    """微信转账到零钱类"""
    
    def __init__(self, 
                 mch_id: str,
                 app_id: str, 
                 api_key: str,
                 cert_path: str = None,
                 key_path: str = None,
                 sandbox: bool = False):
        """
        初始化微信转账配置
        
        Args:
            mch_id: 商户号
            app_id: 应用ID
            api_key: API密钥
            cert_path: 证书文件路径（用于退款等需要证书的操作）
            key_path: 私钥文件路径
            sandbox: 是否使用沙箱环境
        """
        self.mch_id = mch_id
        self.app_id = app_id
        self.api_key = api_key
        self.cert_path = cert_path
        self.key_path = key_path
        self.sandbox = sandbox
        
        # API地址
        if sandbox:
            self.base_url = "https://api.mch.weixin.qq.com/sandboxnew"
        else:
            self.base_url = "https://api.mch.weixin.qq.com"
    
    def _generate_nonce_str(self) -> str:
        """生成随机字符串"""
        return str(uuid.uuid4()).replace('-', '')
    
    def _generate_sign(self, params: Dict) -> str:
        """
        生成微信支付签名
        
        Args:
            params: 参数字典
            
        Returns:
            签名字符串
        """
        # 1. 参数名ASCII码从小到大排序
        sorted_params = sorted(params.items())
        
        # 2. 拼接成字符串
        string_a = '&'.join([f"{k}={v}" for k, v in sorted_params if v])
        
        # 3. 拼接API密钥
        string_sign_temp = f"{string_a}&key={self.api_key}"
        
        # 4. MD5加密并转大写
        sign = hashlib.md5(string_sign_temp.encode('utf-8')).hexdigest().upper()
        
        return sign
    
    def _xml_to_dict(self, xml_str: str) -> Dict:
        """XML转字典"""
        root = ET.fromstring(xml_str)
        result = {}
        for child in root:
            result[child.tag] = child.text
        return result
    
    def _dict_to_xml(self, data: Dict) -> str:
        """字典转XML"""
        xml = "<xml>"
        for k, v in data.items():
            xml += f"<{k}><![CDATA[{v}]]></{k}>"
        xml += "</xml>"
        return xml
    
    def transfer_to_balance(self, 
                          partner_trade_no: str,
                          openid: str,
                          amount: int,
                          desc: str,
                          check_name: str = "NO_CHECK",
                          re_user_name: str = None) -> Tuple[bool, Dict]:
        """
        转账到零钱
        
        Args:
            partner_trade_no: 商户订单号
            openid: 用户openid
            amount: 转账金额（分）
            desc: 转账描述
            check_name: 校验用户姓名选项（NO_CHECK, FORCE_CHECK, OPTION_CHECK）
            re_user_name: 收款用户姓名（当check_name为FORCE_CHECK或OPTION_CHECK时必填）
            
        Returns:
            (是否成功, 响应数据)
        """
        # 构建请求参数
        params = {
            'mch_appid': self.app_id,
            'mchid': self.mch_id,
            'nonce_str': self._generate_nonce_str(),
            'partner_trade_no': partner_trade_no,
            'openid': openid,
            'amount': amount,
            'desc': desc,
            'check_name': check_name,
        }
        
        # 如果需要校验姓名
        if check_name in ['FORCE_CHECK', 'OPTION_CHECK'] and re_user_name:
            params['re_user_name'] = re_user_name
        
        # 生成签名
        params['sign'] = self._generate_sign(params)
        
        # 转换为XML
        xml_data = self._dict_to_xml(params)
        
        # 发送请求
        url = f"{self.base_url}/mmpaymkttransfers/promotion/transfers"
        
        try:
            # 如果有证书，使用证书请求
            if self.cert_path and self.key_path:
                response = requests.post(
                    url, 
                    data=xml_data.encode('utf-8'),
                    cert=(self.cert_path, self.key_path),
                    timeout=30
                )
            else:
                response = requests.post(
                    url, 
                    data=xml_data.encode('utf-8'),
                    timeout=30
                )
            
            response.raise_for_status()
            
            # 解析响应
            result = self._xml_to_dict(response.text)
            
            # 验证返回签名
            if self._verify_sign(result):
                if result.get('return_code') == 'SUCCESS' and result.get('result_code') == 'SUCCESS':
                    return True, result
                else:
                    return False, result
            else:
                return False, {'error': '签名验证失败'}
                
        except Exception as e:
            return False, {'error': str(e)}
    
    def _verify_sign(self, data: Dict) -> bool:
        """验证返回签名"""
        if 'sign' not in data:
            return False
        
        sign = data.pop('sign')
        calculated_sign = self._generate_sign(data)
        return sign == calculated_sign
    
    def query_transfer(self, partner_trade_no: str) -> Tuple[bool, Dict]:
        """
        查询转账结果
        
        Args:
            partner_trade_no: 商户订单号
            
        Returns:
            (是否成功, 响应数据)
        """
        params = {
            'appid': self.app_id,
            'mch_id': self.mch_id,
            'partner_trade_no': partner_trade_no,
            'nonce_str': self._generate_nonce_str(),
        }
        
        # 生成签名
        params['sign'] = self._generate_sign(params)
        
        # 转换为XML
        xml_data = self._dict_to_xml(params)
        
        # 发送请求
        url = f"{self.base_url}/mmpaymkttransfers/gettransferinfo"
        
        try:
            if self.cert_path and self.key_path:
                response = requests.post(
                    url, 
                    data=xml_data.encode('utf-8'),
                    cert=(self.cert_path, self.key_path),
                    timeout=30
                )
            else:
                response = requests.post(
                    url, 
                    data=xml_data.encode('utf-8'),
                    timeout=30
                )
            
            response.raise_for_status()
            
            # 解析响应
            result = self._xml_to_dict(response.text)
            
            # 验证返回签名
            if self._verify_sign(result):
                if result.get('return_code') == 'SUCCESS':
                    return True, result
                else:
                    return False, result
            else:
                return False, {'error': '签名验证失败'}
                
        except Exception as e:
            return False, {'error': str(e)}


# 使用示例
if __name__ == "__main__":
    # 配置信息（请替换为您的实际配置）
    config = {
        'mch_id': 'your_mch_id',           # 商户号
        'app_id': 'your_app_id',           # 应用ID
        'api_key': 'your_api_key',         # API密钥
        'cert_path': 'path/to/cert.pem',   # 证书路径（可选）
        'key_path': 'path/to/key.pem',     # 私钥路径（可选）
        'sandbox': True                    # 是否使用沙箱环境
    }
    
    # 创建转账实例
    transfer = WeChatTransfer(**config)
    
    # 转账示例
    partner_trade_no = f"transfer_{int(time.time())}"  # 商户订单号
    openid = "user_openid_here"                        # 用户openid
    amount = 100                                       # 转账金额（1元 = 100分）
    desc = "测试转账"                                   # 转账描述
    
    print("开始转账...")
    success, result = transfer.transfer_to_balance(
        partner_trade_no=partner_trade_no,
        openid=openid,
        amount=amount,
        desc=desc
    )
    
    if success:
        print("转账成功！")
        print(f"微信单号: {result.get('payment_no')}")
        print(f"转账时间: {result.get('payment_time')}")
    else:
        print("转账失败！")
        print(f"错误信息: {result}")
    
    # 查询转账结果
    print("\n查询转账结果...")
    success, result = transfer.query_transfer(partner_trade_no)
    
    if success:
        print("查询成功！")
        print(f"转账状态: {result.get('status')}")
        print(f"转账金额: {result.get('transfer_amount')}")
    else:
        print("查询失败！")
        print(f"错误信息: {result}")