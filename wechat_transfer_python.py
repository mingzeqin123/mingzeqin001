#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
微信商家转账到零钱 - Python示例代码

依赖包：
pip install requests cryptography

使用前请确保：
1. 已开通商家转账到零钱功能
2. 已配置API证书和密钥
3. 已安装必要的依赖包
"""

import json
import time
import random
import string
import base64
import hashlib
import requests
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import rsa, padding
from cryptography.hazmat.backends import default_backend


class WechatTransfer:
    def __init__(self, config):
        """
        初始化微信转账客户端
        
        Args:
            config (dict): 配置信息
                - appid: 应用ID
                - mch_id: 商户号
                - api_key_v3: APIv3密钥
                - cert_path: 证书路径
                - key_path: 私钥路径
                - serial_no: 证书序列号
        """
        self.appid = config['appid']
        self.mch_id = config['mch_id']
        self.api_key_v3 = config['api_key_v3']
        self.cert_path = config['cert_path']
        self.key_path = config['key_path']
        self.serial_no = config['serial_no']
        
        # 加载私钥
        with open(self.key_path, 'rb') as key_file:
            self.private_key = serialization.load_pem_private_key(
                key_file.read(),
                password=None,
                backend=default_backend()
            )
    
    def transfer(self, transfer_data):
        """
        发起转账
        
        Args:
            transfer_data (dict): 转账数据
                - out_batch_no: 商家批次单号
                - batch_name: 转账名称
                - batch_remark: 转账备注
                - total_amount: 转账总金额（分）
                - transfer_detail_list: 转账明细列表
        
        Returns:
            dict: 转账结果
        """
        url = 'https://api.mch.weixin.qq.com/v3/transfer/batches'
        
        # 构建请求数据
        data = {
            'appid': self.appid,
            'out_batch_no': transfer_data['out_batch_no'],
            'batch_name': transfer_data['batch_name'],
            'batch_remark': transfer_data['batch_remark'],
            'total_amount': transfer_data['total_amount'],
            'total_num': len(transfer_data['transfer_detail_list']),
            'transfer_detail_list': transfer_data['transfer_detail_list']
        }
        
        json_data = json.dumps(data, ensure_ascii=False, separators=(',', ':'))
        
        # 生成签名
        timestamp = int(time.time())
        nonce = self._generate_nonce()
        signature = self._generate_signature('POST', '/v3/transfer/batches', timestamp, nonce, json_data)
        
        # 构建Authorization头
        authorization = (
            f'WECHATPAY2-SHA256-RSA2048 '
            f'mchid="{self.mch_id}",'
            f'nonce_str="{nonce}",'
            f'signature="{signature}",'
            f'timestamp="{timestamp}",'
            f'serial_no="{self.serial_no}"'
        )
        
        # 发送请求
        headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': authorization,
            'User-Agent': 'YourApp/1.0'
        }
        
        try:
            response = requests.post(
                url, 
                data=json_data.encode('utf-8'), 
                headers=headers,
                cert=(self.cert_path, self.key_path),
                timeout=30
            )
            
            return {
                'http_code': response.status_code,
                'response': response.json() if response.text else None,
                'success': response.status_code == 200
            }
        except requests.exceptions.RequestException as e:
            return {
                'http_code': 0,
                'response': {'error': str(e)},
                'success': False
            }
    
    def query_batch(self, out_batch_no, need_query_detail=True, offset=0, limit=20):
        """
        查询转账批次
        
        Args:
            out_batch_no (str): 商家批次单号
            need_query_detail (bool): 是否查询转账明细
            offset (int): 偏移量
            limit (int): 限制数量
        
        Returns:
            dict: 查询结果
        """
        url = f'https://api.mch.weixin.qq.com/v3/transfer/batches/out-batch-no/{out_batch_no}'
        params = {
            'need_query_detail': 'true' if need_query_detail else 'false',
            'offset': offset,
            'limit': limit
        }
        
        query_string = '&'.join([f'{k}={v}' for k, v in params.items()])
        full_url = f'{url}?{query_string}'
        url_path = f'/v3/transfer/batches/out-batch-no/{out_batch_no}?{query_string}'
        
        timestamp = int(time.time())
        nonce = self._generate_nonce()
        signature = self._generate_signature('GET', url_path, timestamp, nonce, '')
        
        authorization = (
            f'WECHATPAY2-SHA256-RSA2048 '
            f'mchid="{self.mch_id}",'
            f'nonce_str="{nonce}",'
            f'signature="{signature}",'
            f'timestamp="{timestamp}",'
            f'serial_no="{self.serial_no}"'
        )
        
        headers = {
            'Accept': 'application/json',
            'Authorization': authorization,
            'User-Agent': 'YourApp/1.0'
        }
        
        try:
            response = requests.get(
                full_url,
                headers=headers,
                cert=(self.cert_path, self.key_path),
                timeout=30
            )
            
            return {
                'http_code': response.status_code,
                'response': response.json() if response.text else None,
                'success': response.status_code == 200
            }
        except requests.exceptions.RequestException as e:
            return {
                'http_code': 0,
                'response': {'error': str(e)},
                'success': False
            }
    
    def query_detail(self, out_batch_no, out_detail_no):
        """
        查询转账明细
        
        Args:
            out_batch_no (str): 商家批次单号
            out_detail_no (str): 商家明细单号
        
        Returns:
            dict: 查询结果
        """
        url = f'https://api.mch.weixin.qq.com/v3/transfer/batches/out-batch-no/{out_batch_no}/details/out-detail-no/{out_detail_no}'
        url_path = f'/v3/transfer/batches/out-batch-no/{out_batch_no}/details/out-detail-no/{out_detail_no}'
        
        timestamp = int(time.time())
        nonce = self._generate_nonce()
        signature = self._generate_signature('GET', url_path, timestamp, nonce, '')
        
        authorization = (
            f'WECHATPAY2-SHA256-RSA2048 '
            f'mchid="{self.mch_id}",'
            f'nonce_str="{nonce}",'
            f'signature="{signature}",'
            f'timestamp="{timestamp}",'
            f'serial_no="{self.serial_no}"'
        )
        
        headers = {
            'Accept': 'application/json',
            'Authorization': authorization,
            'User-Agent': 'YourApp/1.0'
        }
        
        try:
            response = requests.get(
                url,
                headers=headers,
                cert=(self.cert_path, self.key_path),
                timeout=30
            )
            
            return {
                'http_code': response.status_code,
                'response': response.json() if response.text else None,
                'success': response.status_code == 200
            }
        except requests.exceptions.RequestException as e:
            return {
                'http_code': 0,
                'response': {'error': str(e)},
                'success': False
            }
    
    def _generate_nonce(self, length=32):
        """生成随机字符串"""
        chars = string.ascii_letters + string.digits
        return ''.join(random.choice(chars) for _ in range(length))
    
    def _generate_signature(self, method, url_path, timestamp, nonce, body):
        """生成签名"""
        message = f'{method}\n{url_path}\n{timestamp}\n{nonce}\n{body}\n'
        message_bytes = message.encode('utf-8')
        
        signature = self.private_key.sign(
            message_bytes,
            padding.PKCS1v15(),
            hashes.SHA256()
        )
        
        return base64.b64encode(signature).decode('utf-8')


def main():
    """使用示例"""
    # 配置信息
    config = {
        'appid': 'your_appid',
        'mch_id': 'your_mch_id',
        'api_key_v3': 'your_api_key_v3',
        'cert_path': '/path/to/apiclient_cert.pem',
        'key_path': '/path/to/apiclient_key.pem',
        'serial_no': 'your_cert_serial_no'
    }
    
    try:
        # 创建转账客户端
        wechat_transfer = WechatTransfer(config)
        
        # 构建转账数据
        current_time = int(time.time())
        transfer_data = {
            'out_batch_no': f'batch_{current_time}_{random.randint(1000, 9999)}',
            'batch_name': '测试转账',
            'batch_remark': '测试转账备注',
            'total_amount': 100,  # 1元，单位为分
            'transfer_detail_list': [
                {
                    'out_detail_no': f'detail_{current_time}_{random.randint(1000, 9999)}',
                    'transfer_amount': 100,
                    'transfer_remark': '转账备注',
                    'openid': 'user_openid_here',
                    # 'user_name': '张三'  # 实名转账时需要
                }
            ]
        }
        
        # 发起转账
        print("正在发起转账...")
        result = wechat_transfer.transfer(transfer_data)
        
        if result['success']:
            print("✅ 转账发起成功")
            print("响应数据:", json.dumps(result['response'], indent=2, ensure_ascii=False))
            
            # 等待2秒后查询转账结果
            print("\n等待2秒后查询转账结果...")
            time.sleep(2)
            
            query_result = wechat_transfer.query_batch(transfer_data['out_batch_no'])
            if query_result['success']:
                print("✅ 查询成功")
                print("查询结果:", json.dumps(query_result['response'], indent=2, ensure_ascii=False))
                
                # 如果有转账明细，可以进一步查询单个明细
                if query_result['response'].get('transfer_detail_list'):
                    detail_no = transfer_data['transfer_detail_list'][0]['out_detail_no']
                    detail_result = wechat_transfer.query_detail(transfer_data['out_batch_no'], detail_no)
                    print("\n转账明细:", json.dumps(detail_result['response'], indent=2, ensure_ascii=False))
            else:
                print("❌ 查询失败")
                print("错误信息:", query_result['response'])
        else:
            print("❌ 转账发起失败")
            print(f"HTTP状态码: {result['http_code']}")
            print("错误信息:", result['response'])
            
    except Exception as e:
        print(f"❌ 程序执行出错: {str(e)}")


if __name__ == '__main__':
    main()