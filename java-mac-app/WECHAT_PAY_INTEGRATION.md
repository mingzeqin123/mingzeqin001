# 微信扫码支付集成指南

本项目已集成微信扫码支付功能，支持创建支付订单、生成二维码、查询支付状态等完整的支付流程。

## 功能特性

- ✅ 微信扫码支付（Native支付）
- ✅ 支付二维码生成和显示
- ✅ 实时支付状态监控
- ✅ 订单查询和管理
- ✅ 支付结果回调处理
- ✅ 完整的错误处理机制
- ✅ 现代化的JavaFX用户界面

## 项目结构

```
src/main/java/com/example/app/
├── config/
│   └── WeChatPayConfig.java          # 微信支付配置类
├── controller/
│   └── PaymentController.java        # 支付控制器
├── model/
│   ├── PaymentRequest.java           # 支付请求实体
│   ├── PaymentResponse.java          # 支付响应实体
│   └── QRCodePaymentRequest.java     # 扫码支付请求实体
├── service/
│   └── WeChatPayService.java         # 微信支付服务类
├── util/
│   └── WeChatPayUtil.java            # 微信支付工具类
└── MacJavaApp.java                   # 主应用程序
```

## 快速开始

### 1. 配置微信支付参数

在使用微信支付功能之前，需要配置以下参数：

```java
WeChatPayConfig config = new WeChatPayConfig();
config.setMerchantId("YOUR_MERCHANT_ID");           // 商户号
config.setAppId("YOUR_APP_ID");                     // 应用ID
config.setPrivateKeyPath("path/to/private_key.pem"); // 私钥文件路径
config.setMerchantSerialNumber("YOUR_SERIAL_NUMBER"); // 证书序列号
config.setApiV3Key("YOUR_API_V3_KEY");              // API密钥v3
config.setNotifyUrl("https://your-domain.com/notify"); // 回调地址
```

### 2. 创建支付订单

```java
PaymentController paymentController = new PaymentController(config);

// 创建支付订单
PaymentResponse response = paymentController.createPayment(
    "测试商品",     // 商品描述
    1.00,          // 支付金额（元）
    callback       // 支付状态回调
);

if (response.isSuccess()) {
    String codeUrl = response.getCodeUrl();
    // 生成二维码供用户扫码支付
}
```

### 3. 生成支付二维码

```java
// 生成二维码图片
BufferedImage qrImage = paymentController.generatePaymentQRCode(codeUrl, 200);

// 或者生成二维码字节数组
byte[] qrBytes = paymentController.generatePaymentQRCodeBytes(codeUrl, 200);
```

### 4. 查询支付状态

```java
PaymentResponse status = paymentController.queryPaymentStatus(outTradeNo);

if (status.isPaid()) {
    // 支付成功
    System.out.println("支付成功，微信订单号: " + status.getTransactionId());
}
```

## 微信支付配置

### 获取配置参数

1. **商户号 (mchid)**: 在微信商户平台获取
2. **应用ID (appid)**: 公众号或小程序的AppId
3. **商户私钥**: 在微信商户平台生成并下载
4. **证书序列号**: 商户证书的序列号
5. **API密钥v3**: 在微信商户平台设置

### 证书配置

微信支付需要使用商户私钥进行签名，私钥文件格式为PEM：

```
-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...
-----END PRIVATE KEY-----
```

### 回调地址配置

支付结果会通过回调地址通知商户系统，回调地址必须：
- 使用HTTPS协议
- 能够正常访问
- 正确处理微信支付的回调请求

## 支付流程

1. **创建订单**: 调用微信支付API创建预支付订单
2. **生成二维码**: 根据返回的code_url生成支付二维码
3. **用户扫码**: 用户使用微信扫码支付
4. **状态监控**: 系统自动轮询查询支付状态
5. **支付完成**: 收到支付成功通知，更新订单状态

## 错误处理

系统提供完整的错误处理机制：

- **网络异常**: 自动重试机制
- **签名验证**: 严格的签名验证
- **参数验证**: 完整的参数校验
- **状态码处理**: 详细的错误码说明

## 安全注意事项

1. **私钥安全**: 商户私钥文件必须妥善保管，不能泄露
2. **API密钥**: API密钥v3要定期更换
3. **回调验证**: 必须验证回调请求的签名
4. **HTTPS**: 生产环境必须使用HTTPS
5. **日志脱敏**: 日志中不能包含敏感信息

## 测试环境

微信支付提供沙箱环境用于测试：

1. 申请沙箱环境
2. 获取沙箱配置参数
3. 使用沙箱环境进行测试
4. 测试完成后切换到生产环境

## 常见问题

### 1. 签名验证失败
- 检查私钥文件格式
- 确认证书序列号正确
- 验证API密钥v3

### 2. 订单创建失败
- 检查商户号和应用ID
- 确认订单号唯一性
- 验证金额格式

### 3. 二维码无法支付
- 确认code_url有效性
- 检查订单是否已过期
- 验证支付环境

## 技术支持

- 微信支付官方文档: https://pay.weixin.qq.com/wiki/doc/apiv3/
- 微信支付SDK: https://github.com/wechatpay-apiv3/wechatpay-java
- 技术交流群: 请联系微信支付技术支持

## 更新日志

### v1.0.0 (2024-10-17)
- 集成微信扫码支付功能
- 实现支付订单创建和查询
- 添加二维码生成和显示
- 完善错误处理和日志记录
- 提供完整的JavaFX用户界面

---

**注意**: 在生产环境使用前，请确保所有配置参数正确，并进行充分的测试。