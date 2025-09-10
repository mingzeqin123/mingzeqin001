# 微信转账给个人用户接口接入指南

本项目提供了微信支付"商家转账到零钱"功能的完整接入方案，包含多种编程语言的示例代码。

## 📋 前置条件

### 商户资质要求
- ✅ 商户号已入驻90天以上
- ✅ 最近30天内有连续不间断的交易记录
- ✅ 已开通"商家转账到零钱"功能

### 必需材料
- 🔑 微信支付商户号 (mch_id)
- 🆔 应用ID (appid)
- 📜 API证书文件 (apiclient_cert.pem/p12)
- 🔐 API私钥文件 (apiclient_key.pem)
- 🔢 证书序列号 (serial_no)
- 🗝️ APIv3密钥 (api_key_v3)

## 🚀 快速开始

### 1. 开通功能
1. 登录 [微信支付商户平台](https://pay.weixin.qq.com)
2. 进入"产品中心" → 找到"商家转账到零钱"
3. 申请开通该功能

### 2. 配置证书和密钥
1. 进入"账户中心" → "API安全"
2. 下载API证书（证书密码为商户号）
3. 设置APIv3密钥并妥善保存

### 3. 选择编程语言实现

#### PHP 实现
```bash
# 安装依赖
composer require guzzlehttp/guzzle

# 运行示例
php wechat_transfer_php.php
```

#### Python 实现
```bash
# 安装依赖
pip install requests cryptography

# 运行示例
python wechat_transfer_python.py
```

#### Node.js 实现
```bash
# 安装依赖
npm install axios crypto fs

# 运行示例
node wechat_transfer_nodejs.js
```

#### Java 实现
```bash
# 添加依赖到pom.xml或build.gradle
# gson库用于JSON处理

# 编译运行
javac WechatTransfer.java
java WechatTransfer
```

## 🔧 配置说明

在使用任何示例代码前，请修改以下配置信息：

```javascript
const config = {
    appid: 'your_appid',              // 替换为您的应用ID
    mch_id: 'your_mch_id',           // 替换为您的商户号
    api_key_v3: 'your_api_key_v3',   // 替换为您的APIv3密钥
    cert_path: '/path/to/cert.pem',   // 证书文件路径
    key_path: '/path/to/key.pem',     // 私钥文件路径
    serial_no: 'your_serial_no'       // 证书序列号
};
```

## 📡 核心接口

### 转账接口
- **URL**: `https://api.mch.weixin.qq.com/v3/transfer/batches`
- **方法**: POST
- **认证**: 双向SSL + 签名验证

### 查询接口
- **批次查询**: `GET /v3/transfer/batches/out-batch-no/{out_batch_no}`
- **明细查询**: `GET /v3/transfer/batches/out-batch-no/{out_batch_no}/details/out-detail-no/{out_detail_no}`

## 🔐 安全注意事项

1. **证书安全**: API证书和私钥文件请妥善保管，不要泄露
2. **密钥安全**: APIv3密钥一旦设置无法查看，遗失后只能重置
3. **签名验证**: 所有请求都需要进行签名验证
4. **HTTPS通信**: 必须使用HTTPS协议进行通信
5. **双向认证**: 需要配置客户端证书进行双向SSL认证

## 💰 转账限制

- **单笔限额**: 根据商户等级和用户实名状态有不同限制
- **日累计限额**: 根据商户资质有不同限制
- **批次限制**: 单次最多可向1000名用户转账
- **实名要求**: 某些情况下需要收款用户实名信息

## 🔄 转账流程

1. **发起转账** → 调用转账接口
2. **获取受理结果** → 受理成功≠转账成功
3. **查询转账状态** → 通过查询接口确认最终状态
4. **处理异常** → 根据错误码进行相应处理

## 📊 状态说明

| 状态 | 说明 |
|------|------|
| ACCEPTED | 已受理，等待处理 |
| PROCESSING | 转账中 |
| FINISHED | 已完成 |
| CLOSED | 已关闭 |

## 🆘 常见问题

### Q: 转账失败怎么办？
A: 检查错误码，常见原因包括：
- 余额不足
- 收款用户信息错误
- 超出转账限额
- 证书或签名错误

### Q: 如何获取用户openid？
A: 需要用户通过微信授权登录您的应用获取

### Q: 是否支持批量转账？
A: 支持，单次最多1000笔

### Q: 转账是否可以撤销？
A: 已成功的转账无法撤销，只能通过其他方式处理

## 📞 技术支持

- [微信支付开发文档](https://pay.weixin.qq.com/wiki/doc/apiv3/index.shtml)
- [商户平台](https://pay.weixin.qq.com)
- 微信支付技术支持

## ⚠️ 免责声明

本示例代码仅供参考，生产环境使用前请：
1. 充分测试所有功能
2. 添加完善的错误处理
3. 实施必要的安全措施
4. 遵守相关法律法规

---

*最后更新: 2025年9月*