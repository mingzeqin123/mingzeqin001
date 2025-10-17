# 微信扫码支付集成指南

## 概述

本指南详细说明如何在Java应用程序中集成微信扫码支付功能。项目使用JavaFX构建图形界面，集成了完整的微信支付SDK。

## 快速开始

### 1. 环境要求

- Java 21+
- Maven 3.6+
- 微信商户账号
- 微信公众账号

### 2. 项目结构

```
java-mac-app/
├── src/main/java/com/example/app/
│   ├── MacJavaApp.java                    # 主应用程序
│   └── payment/                           # 支付模块
│       ├── WeChatPayConfig.java           # 配置类
│       ├── WeChatPayUtils.java            # 工具类
│       ├── model/                         # 数据模型
│       │   ├── UnifiedOrderRequest.java
│       │   ├── UnifiedOrderResponse.java
│       │   └── PaymentResult.java
│       ├── service/                       # 服务层
│       │   └── WeChatPayService.java
│       └── controller/                    # 控制器
│           └── PaymentController.java
├── src/main/resources/
│   ├── wechat-pay.properties             # 配置文件
│   └── logback.xml                       # 日志配置
└── pom.xml                               # Maven配置
```

### 3. 配置步骤

#### 步骤1: 修改配置文件

编辑 `src/main/resources/wechat-pay.properties`:

```properties
# 替换为您的实际参数
wechat.pay.app.id=wx1234567890abcdef
wechat.pay.mch.id=1234567890
wechat.pay.api.key=your_32_character_api_key
wechat.pay.notify.url=http://your-domain.com/notify
```

#### 步骤2: 获取微信支付参数

1. **AppID**: 
   - 登录微信公众平台
   - 在"开发" -> "基本配置"中获取

2. **商户号**: 
   - 登录微信商户平台
   - 在"账户中心" -> "商户信息"中获取

3. **API密钥**: 
   - 在微信商户平台
   - "账户中心" -> "API安全" -> "设置API密钥"

4. **通知地址**: 
   - 您的服务器接收支付结果的URL
   - 必须是公网可访问的HTTPS地址

#### 步骤3: 运行应用程序

```bash
# 编译项目
mvn clean compile

# 运行应用程序
mvn javafx:run
```

## 功能使用

### 1. 创建支付订单

1. 启动应用程序
2. 点击"微信扫码支付"按钮
3. 填写商品信息：
   - 商品名称：如"测试商品"
   - 支付金额：如"0.01"（元）
   - 商品ID：如"test_001"
4. 点击"创建支付订单"
5. 获取二维码链接

### 2. 支付流程

1. 复制二维码链接
2. 在浏览器中打开链接
3. 使用微信扫描二维码
4. 完成支付

### 3. 查询订单状态

```java
// 在代码中查询订单状态
String tradeState = paymentController.queryOrderStatus("out_trade_no");
```

## 核心API

### 创建扫码支付订单

```java
// 构建请求参数
Map<String, Object> requestData = new HashMap<>();
requestData.put("body", "商品名称");
requestData.put("totalFee", 100); // 金额（分）
requestData.put("productId", "product_001");
requestData.put("attach", "附加数据");

// 创建支付订单
String response = paymentController.createNativePayOrder(requestData);

// 解析响应
ObjectMapper mapper = new ObjectMapper();
Map<String, Object> result = mapper.readValue(response, Map.class);
```

### 查询订单状态

```java
String response = paymentController.queryOrderStatus("out_trade_no");
Map<String, Object> result = mapper.readValue(response, Map.class);
String tradeState = (String) result.get("tradeState");
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

## 交易状态

| 状态 | 说明 |
|------|------|
| SUCCESS | 支付成功 |
| REFUND | 转入退款 |
| NOTPAY | 未支付 |
| CLOSED | 已关闭 |
| REVOKED | 已撤销 |
| USERPAYING | 用户支付中 |
| PAYERROR | 支付失败 |

## 常见问题

### 1. 签名验证失败

**原因**: API密钥不正确或参数格式错误
**解决**: 检查API密钥配置和参数格式

### 2. 商户无权限

**原因**: 商户号未开通相应接口权限
**解决**: 在微信商户平台申请相应权限

### 3. 订单已存在

**原因**: 商户订单号重复
**解决**: 使用唯一的订单号

### 4. 金额错误

**原因**: 金额格式不正确
**解决**: 确保金额以分为单位，且为整数

## 安全注意事项

1. **API密钥安全**: 不要将API密钥提交到版本控制系统
2. **HTTPS**: 生产环境必须使用HTTPS
3. **签名验证**: 始终验证微信返回的签名
4. **订单号唯一性**: 确保商户订单号全局唯一
5. **金额校验**: 在服务端验证支付金额

## 测试环境

### 沙箱环境

1. 申请微信支付沙箱环境
2. 获取沙箱参数
3. 修改配置文件
4. 进行测试

### 测试数据

```properties
# 沙箱环境配置示例
wechat.pay.app.id=sandbox_app_id
wechat.pay.mch.id=sandbox_mch_id
wechat.pay.api.key=sandbox_api_key
```

## 扩展功能

### 1. 退款功能

```java
// 实现退款
public RefundResult refund(String outTradeNo, int refundFee) {
    // 退款逻辑
}
```

### 2. 企业付款

```java
// 企业付款到零钱
public TransferResult transferToWallet(String openid, int amount) {
    // 企业付款逻辑
}
```

### 3. 分账功能

```java
// 分账
public ProfitSharingResult profitSharing(String transactionId, List<Receiver> receivers) {
    // 分账逻辑
}
```

## 部署说明

### 1. 打包应用程序

```bash
# 创建可执行JAR
mvn clean package

# 运行JAR文件
java -jar target/mac-java-app-1.0.0.jar
```

### 2. 配置文件管理

- 开发环境：使用 `wechat-pay.properties`
- 生产环境：使用环境变量或外部配置文件

### 3. 日志配置

日志文件位置：`logs/wechat-pay.log`

## 技术支持

- [微信支付开发文档](https://pay.weixin.qq.com/wiki/doc/api/index.html)
- [微信支付API文档](https://pay.weixin.qq.com/wiki/doc/api/index.html)
- [微信支付常见问题](https://pay.weixin.qq.com/wiki/tools/qa.html)

## 更新日志

### v1.0.0
- 初始版本
- 支持微信扫码支付
- 集成JavaFX图形界面
- 完整的错误处理
- 日志记录功能