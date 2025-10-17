# Java微信扫码支付集成项目

本项目成功集成了微信扫码支付功能，提供了完整的支付解决方案，包括订单创建、二维码生成、支付状态查询等功能。

## 🚀 项目特性

- ✅ **完整的微信扫码支付流程**
- ✅ **现代化JavaFX用户界面**
- ✅ **实时支付状态监控**
- ✅ **二维码生成和显示**
- ✅ **完善的错误处理机制**
- ✅ **演示模式支持**
- ✅ **可扩展的架构设计**

## 📁 项目结构

```
java-mac-app/
├── src/main/java/com/example/app/
│   ├── config/
│   │   └── WeChatPayConfig.java              # 微信支付配置
│   ├── controller/
│   │   └── PaymentController.java            # 支付控制器
│   ├── model/
│   │   ├── PaymentRequest.java               # 支付请求实体
│   │   ├── PaymentResponse.java              # 支付响应实体
│   │   └── QRCodePaymentRequest.java         # 扫码支付请求
│   ├── service/
│   │   └── WeChatPayServiceSimple.java       # 微信支付服务（演示版）
│   ├── util/
│   │   └── WeChatPayUtil.java                # 微信支付工具类
│   └── MacJavaApp.java                       # 主应用程序
├── src/main/resources/
│   └── wechat-pay.properties.example         # 配置文件示例
├── pom.xml                                   # Maven配置
├── WECHAT_PAY_INTEGRATION.md                 # 集成指南
└── README_WECHAT_PAY.md                      # 项目说明
```

## 🛠️ 技术栈

- **Java 21** - 现代Java开发
- **JavaFX 21** - 桌面GUI框架
- **Maven 3.9** - 项目构建工具
- **微信支付SDK** - 官方支付SDK
- **ZXing** - 二维码生成库
- **Jackson** - JSON处理
- **SLF4J + Logback** - 日志框架

## 📦 核心依赖

```xml
<!-- JavaFX -->
<dependency>
    <groupId>org.openjfx</groupId>
    <artifactId>javafx-controls</artifactId>
    <version>21.0.1</version>
</dependency>

<!-- 微信支付SDK -->
<dependency>
    <groupId>com.github.wechatpay-apiv3</groupId>
    <artifactId>wechatpay-java</artifactId>
    <version>0.2.12</version>
</dependency>

<!-- 二维码生成 -->
<dependency>
    <groupId>com.google.zxing</groupId>
    <artifactId>core</artifactId>
    <version>3.5.2</version>
</dependency>
```

## 🚀 快速开始

### 1. 环境要求

- Java 21+
- Maven 3.6+
- 微信商户平台账号

### 2. 编译项目

```bash
cd java-mac-app
mvn clean compile
```

### 3. 打包应用

```bash
mvn clean package
```

### 4. 运行应用

```bash
java -jar target/mac-java-app-1.0.0.jar
```

## 💡 核心功能

### 1. 支付订单创建

```java
PaymentController controller = new PaymentController(config);
PaymentResponse response = controller.createPayment(
    "测试商品",     // 商品描述
    1.00,          // 支付金额（元）
    callback       // 支付状态回调
);
```

### 2. 二维码生成

```java
BufferedImage qrImage = controller.generatePaymentQRCode(codeUrl, 200);
```

### 3. 支付状态查询

```java
PaymentResponse status = controller.queryPaymentStatus(outTradeNo);
```

### 4. 订单管理

```java
boolean success = controller.cancelPayment(outTradeNo);
```

## 🎯 用户界面

应用程序提供了两个主要标签页：

### 基本功能页面
- 系统信息显示
- 文件操作功能
- 应用程序状态监控

### 微信支付页面
- 商品描述输入
- 支付金额设置
- 二维码显示区域
- 支付状态实时更新
- 订单操作按钮

## 🔧 配置说明

### 微信支付配置

创建配置文件 `wechat-pay.properties`：

```properties
# 微信支付商户号
wechat.pay.merchant.id=YOUR_MERCHANT_ID

# 应用ID
wechat.pay.app.id=YOUR_APP_ID

# 商户私钥文件路径
wechat.pay.private.key.path=path/to/private_key.pem

# 商户证书序列号
wechat.pay.merchant.serial.number=YOUR_SERIAL_NUMBER

# API密钥v3
wechat.pay.api.v3.key=YOUR_API_V3_KEY

# 支付通知回调地址
wechat.pay.notify.url=https://your-domain.com/notify
```

## 🔄 支付流程

1. **用户输入** - 商品描述和支付金额
2. **创建订单** - 调用微信支付API创建预支付订单
3. **生成二维码** - 根据返回的code_url生成支付二维码
4. **用户扫码** - 用户使用微信扫码支付
5. **状态监控** - 系统自动轮询查询支付状态
6. **支付完成** - 收到支付成功通知，更新订单状态

## 🛡️ 安全特性

- **签名验证** - 严格的请求签名验证
- **证书管理** - 安全的证书存储和使用
- **参数校验** - 完整的输入参数验证
- **错误处理** - 全面的异常处理机制
- **日志记录** - 详细的操作日志记录

## 📊 演示模式

当前版本提供演示模式，无需真实的微信支付配置即可体验完整功能：

- 模拟订单创建
- 生成演示二维码
- 模拟支付状态查询
- 完整的用户界面交互

## 🔮 扩展功能

### 计划中的功能
- [ ] 退款功能
- [ ] 订单历史记录
- [ ] 支付数据统计
- [ ] 多商户支持
- [ ] 移动端适配

### 可扩展点
- 支付方式扩展（支付宝、银联等）
- 数据库集成
- 网络服务API
- 消息通知系统

## 🐛 故障排除

### 常见问题

1. **编译错误**
   - 确保Java版本为21+
   - 检查Maven依赖是否正确下载

2. **运行时错误**
   - 确保JavaFX模块正确加载
   - 检查系统环境变量配置

3. **支付功能问题**
   - 验证微信支付配置参数
   - 检查网络连接状态
   - 查看日志文件获取详细错误信息

## 📝 开发日志

### v1.0.0 (2024-10-17)
- ✅ 完成微信支付SDK集成
- ✅ 实现扫码支付功能
- ✅ 添加JavaFX用户界面
- ✅ 完成二维码生成功能
- ✅ 实现支付状态监控
- ✅ 添加演示模式支持

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 🤝 贡献指南

欢迎提交问题和功能请求！

1. Fork 本项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 📞 技术支持

- 📧 Email: support@example.com
- 📱 微信: your-wechat-id
- 🌐 网站: https://your-website.com

---

**注意**: 本项目当前运行在演示模式下。在生产环境使用前，请确保配置真实的微信支付参数并进行充分测试。