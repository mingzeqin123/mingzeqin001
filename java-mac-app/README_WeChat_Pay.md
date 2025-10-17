# 微信扫码支付集成说明

本项目已集成微信扫码支付功能，支持创建支付订单、查询订单状态等核心功能。

## 功能特性

- ✅ 微信扫码支付（NATIVE）
- ✅ 统一下单API
- ✅ 订单查询API
- ✅ 签名验证
- ✅ 图形化界面操作
- ✅ 完整的错误处理

## 项目结构

```
src/main/java/com/example/app/
├── MacJavaApp.java                    # 主应用程序
├── payment/
│   ├── WeChatPayConfig.java          # 支付配置类
│   ├── WeChatPayUtils.java           # 支付工具类
│   ├── model/
│   │   ├── UnifiedOrderRequest.java  # 统一下单请求
│   │   ├── UnifiedOrderResponse.java # 统一下单响应
│   │   └── PaymentResult.java        # 支付结果封装
│   ├── service/
│   │   └── WeChatPayService.java     # 支付服务类
│   └── controller/
│       └── PaymentController.java    # 支付控制器
└── resources/
    └── wechat-pay.properties         # 支付配置文件
```

## 配置说明

### 1. 修改配置文件

编辑 `src/main/resources/wechat-pay.properties` 文件：

```properties
# 微信分配的公众账号ID
wechat.pay.app.id=wx1234567890abcdef

# 微信支付分配的商户号
wechat.pay.mch.id=1234567890

# API密钥，在商户平台设置
wechat.pay.api.key=your_32_character_api_key_here

# 支付结果通知地址
wechat.pay.notify.url=http://your-domain.com/notify
```

### 2. 获取微信支付参数

1. **AppID**: 在微信公众平台获取
2. **商户号**: 在微信商户平台获取
3. **API密钥**: 在微信商户平台设置
4. **通知地址**: 您的服务器接收支付结果的URL

## 使用方法

### 1. 运行应用程序

```bash
# 编译项目
mvn clean compile

# 运行应用程序
mvn javafx:run
```

### 2. 创建支付订单

1. 点击"微信扫码支付"按钮
2. 填写商品信息：
   - 商品名称
   - 支付金额（元）
   - 商品ID
3. 点击"创建支付订单"
4. 获取二维码链接，使用微信扫描支付

### 3. 查询订单状态

```java
// 查询订单状态
String tradeState = paymentController.queryOrderStatus("your_out_trade_no");
```

## API 接口

### 创建扫码支付订单

```java
Map<String, Object> requestData = new HashMap<>();
requestData.put("body", "商品名称");
requestData.put("totalFee", 100); // 金额（分）
requestData.put("productId", "product_001");
requestData.put("attach", "附加数据");

String response = paymentController.createNativePayOrder(requestData);
```

### 查询订单状态

```java
String response = paymentController.queryOrderStatus("out_trade_no");
```

## 响应格式

### 成功响应

```json
{
  "success": true,
  "message": "支付订单创建成功",
  "codeUrl": "weixin://wxpay/bizpayurl?pr=xxx",
  "outTradeNo": "WX1234567890",
  "totalFee": 100,
  "tradeType": "NATIVE"
}
```

### 失败响应

```json
{
  "success": false,
  "message": "错误信息",
  "errorCode": "ERROR_CODE",
  "errorMessage": "详细错误信息"
}
```

## 交易状态说明

- `SUCCESS`: 支付成功
- `REFUND`: 转入退款
- `NOTPAY`: 未支付
- `CLOSED`: 已关闭
- `REVOKED`: 已撤销
- `USERPAYING`: 用户支付中
- `PAYERROR`: 支付失败

## 注意事项

1. **安全性**: 请妥善保管API密钥，不要提交到版本控制系统
2. **测试环境**: 建议先在微信支付沙箱环境测试
3. **证书**: 退款功能需要商户证书，请从微信商户平台下载
4. **通知地址**: 确保通知地址可以正常访问
5. **HTTPS**: 生产环境必须使用HTTPS

## 错误处理

常见错误及解决方案：

- `INVALID_REQUEST`: 请求参数错误，检查必填参数
- `NOAUTH`: 商户无此接口权限，检查商户号配置
- `NOTENOUGH`: 余额不足，检查账户余额
- `ORDERPAID`: 商户订单已支付，检查订单状态
- `ORDERCLOSED`: 订单已关闭，重新创建订单

## 开发调试

### 启用日志

在 `logback.xml` 中配置日志级别：

```xml
<logger name="com.example.app.payment" level="DEBUG"/>
```

### 测试数据

使用微信支付沙箱环境进行测试：

1. 申请沙箱环境
2. 获取沙箱参数
3. 修改配置文件
4. 进行测试

## 扩展功能

可以基于现有代码扩展以下功能：

- 退款功能
- 企业付款
- 红包功能
- 代金券功能
- 分账功能

## 技术支持

如有问题，请参考：

- [微信支付开发文档](https://pay.weixin.qq.com/wiki/doc/api/index.html)
- [微信支付API文档](https://pay.weixin.qq.com/wiki/doc/api/index.html)
- [微信支付常见问题](https://pay.weixin.qq.com/wiki/tools/qa.html)