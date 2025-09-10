# 微信支付 - 商家转账到零钱

本项目实现了微信支付"商家转账到零钱"功能的完整接口接入，支持向个人微信用户转账。

## 功能特性

- ✅ 转账到零钱
- ✅ 转账结果查询
- ✅ 签名验证
- ✅ 沙箱环境支持
- ✅ 错误处理
- ✅ 证书支持

## 前置条件

1. **商户号要求**：
   - 商户号已入驻90日
   - 最近30天内保持连续不间断的交易

2. **开通功能**：
   - 在微信支付商户平台开通"商家转账到零钱"功能

3. **获取证书**：
   - 下载API证书（apiclient_cert.pem）
   - 下载私钥文件（apiclient_key.pem）
   - 设置API密钥

## 安装依赖

```bash
pip install -r requirements.txt
```

## 配置说明

1. 修改 `config.py` 中的配置信息：

```python
WECHAT_PAY_CONFIG = {
    'mch_id': 'your_mch_id',        # 您的商户号
    'app_id': 'your_app_id',        # 您的应用ID
    'api_key': 'your_api_key',      # 您的API密钥
    'cert_path': 'cert/apiclient_cert.pem',  # 证书路径
    'key_path': 'cert/apiclient_key.pem',    # 私钥路径
    'sandbox': True,                # 是否使用沙箱环境
}
```

2. 将证书文件放在 `cert/` 目录下

## 使用方法

### 基本转账

```python
from wechat_transfer import WeChatTransfer
from config import WECHAT_PAY_CONFIG

# 创建转账实例
transfer = WeChatTransfer(**WECHAT_PAY_CONFIG)

# 执行转账
success, result = transfer.transfer_to_balance(
    partner_trade_no="transfer_20241201_001",  # 商户订单号
    openid="user_openid_here",                # 用户openid
    amount=100,                               # 转账金额（分）
    desc="测试转账"                           # 转账描述
)

if success:
    print("转账成功！")
    print(f"微信单号: {result.get('payment_no')}")
else:
    print(f"转账失败: {result}")
```

### 带姓名校验的转账

```python
success, result = transfer.transfer_to_balance(
    partner_trade_no="transfer_20241201_002",
    openid="user_openid_here",
    amount=100,
    desc="测试转账",
    check_name="FORCE_CHECK",  # 强制校验姓名
    re_user_name="张三"        # 收款人姓名
)
```

### 查询转账结果

```python
success, result = transfer.query_transfer("transfer_20241201_001")

if success:
    print(f"转账状态: {result.get('status')}")
    print(f"转账金额: {result.get('transfer_amount')}")
```

## API 接口说明

### 转账到零钱

**接口地址**: `/mmpaymkttransfers/promotion/transfers`

**请求参数**:
- `mch_appid`: 应用ID
- `mchid`: 商户号
- `nonce_str`: 随机字符串
- `partner_trade_no`: 商户订单号
- `openid`: 用户openid
- `amount`: 转账金额（分）
- `desc`: 转账描述
- `check_name`: 校验用户姓名选项
- `re_user_name`: 收款用户姓名（可选）
- `sign`: 签名

**响应参数**:
- `return_code`: 返回状态码
- `return_msg`: 返回信息
- `result_code`: 业务结果
- `payment_no`: 微信单号
- `payment_time`: 转账时间

### 查询转账结果

**接口地址**: `/mmpaymkttransfers/gettransferinfo`

**请求参数**:
- `appid`: 应用ID
- `mch_id`: 商户号
- `partner_trade_no`: 商户订单号
- `nonce_str`: 随机字符串
- `sign`: 签名

## 错误处理

常见错误码：

- `NOAUTH`: 商户无此接口权限
- `AMOUNT_LIMIT`: 金额超限
- `PARAM_ERROR`: 参数错误
- `OPENID_ERROR`: OpenID错误
- `NOTENOUGH`: 余额不足
- `SYSTEMERROR`: 系统错误

## 安全注意事项

1. **API密钥安全**：
   - 妥善保管API密钥，不要硬编码在代码中
   - 建议使用环境变量或配置文件管理

2. **证书安全**：
   - 证书文件要妥善保管
   - 不要将证书文件提交到版本控制系统

3. **签名验证**：
   - 所有接口调用都要验证返回签名
   - 使用HTTPS传输

4. **金额校验**：
   - 转账前要校验金额范围
   - 防止重复转账

## 测试

使用沙箱环境进行测试：

```python
config = WECHAT_PAY_CONFIG.copy()
config['sandbox'] = True
transfer = WeChatTransfer(**config)
```

## 许可证

MIT License