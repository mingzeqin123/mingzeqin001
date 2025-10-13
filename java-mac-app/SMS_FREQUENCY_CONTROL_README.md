# SMS频率控制系统

## 概述

本系统实现了Java短信发送的频率控制功能，确保：
1. **10分钟间隔限制**：同一手机号在10分钟内只能发送一条短信
2. **每日发送限制**：同一手机号每天最多发送10条短信

## 系统架构

### 核心类结构

```
com.example.app.sms/
├── SmsFrequencyController.java    # 频率控制核心逻辑
├── SmsService.java                # SMS服务主入口
├── SmsRecord.java                 # 短信记录实体
├── SmsValidationResult.java       # 验证结果类
├── SmsSendResult.java             # 发送结果类
├── SmsBatchSendResult.java        # 批量发送结果类
├── SmsStatistics.java             # 统计信息类
├── SmsTestApp.java                # JavaFX测试应用
└── SmsFrequencyTest.java          # 命令行测试类
```

## 主要功能

### 1. 频率控制 (SmsFrequencyController)

- **10分钟间隔控制**：使用 `Map<String, LocalDateTime>` 记录每个手机号的最后发送时间
- **每日发送限制**：使用 `Map<String, Map<LocalDate, Integer>>` 记录每个手机号每天的发送数量
- **自动清理**：定期清理30天前的历史数据，避免内存泄漏

### 2. SMS服务 (SmsService)

- **发送验证**：发送前自动检查频率限制
- **批量发送**：支持批量发送多个手机号
- **统计查询**：提供发送统计信息查询
- **模拟发送**：内置模拟发送功能（95%成功率）

### 3. 数据管理

- **手机号标准化**：自动处理手机号格式（支持+86国家代码）
- **线程安全**：使用 `ConcurrentHashMap` 确保多线程安全
- **内存管理**：自动清理过期数据，保持系统性能

## 使用方法

### 基本使用

```java
// 创建SMS服务实例
SmsService smsService = new SmsService();

// 发送单条短信
SmsSendResult result = smsService.sendSms("13800138000", "测试短信内容");
if (result.isSuccess()) {
    System.out.println("发送成功，消息ID: " + result.getMessageId());
} else {
    System.out.println("发送失败: " + result.getMessage());
}

// 检查发送状态
SmsValidationResult validation = smsService.canSendSms("13800138000");
System.out.println("状态: " + validation.getMessage());

// 查看统计信息
SmsStatistics stats = smsService.getStatistics("13800138000");
System.out.println("今日已发送: " + stats.getTodayCount() + "/10");
```

### 批量发送

```java
List<String> phoneNumbers = Arrays.asList(
    "13800138001", "13800138002", "13800138003"
);

SmsBatchSendResult result = smsService.batchSendSms(phoneNumbers, "批量短信内容");
System.out.println("批量发送结果: 成功 " + result.getSuccessCount() + 
                  " 条, 失败 " + result.getFailureCount() + " 条");
```

## 测试运行

### 1. 命令行测试

```bash
cd java-mac-app
javac -d build/classes src/main/java/com/example/app/sms/*.java
java -cp build/classes com.example.app.sms.SmsFrequencyTest
```

### 2. JavaFX图形界面测试

如果有JavaFX环境，可以运行图形界面测试应用：

```java
// 运行SmsTestApp.java
// 提供完整的GUI测试界面，包括：
// - 发送短信功能
// - 统计信息查看
// - 系统日志
// - 快速测试功能
```

## 测试结果示例

```
=== SMS频率控制功能测试 ===

1. 测试基本发送功能
----------------------------------------
发送前检查: 可以发送，今日已发送 0/10 条
发送结果: 成功
消息: 短信发送成功
消息ID: SMS_1760340082981_f96ce9df

2. 测试10分钟频率限制
----------------------------------------
第1次发送: 成功
第2次发送: 失败 - 距离上次发送不足10分钟，请等待 11 分钟后再试
统计信息: 手机号: 13900139000, 今日发送: 1/10, 总计发送: 1

3. 测试每日发送限制
----------------------------------------
[测试发送12条短信，验证每日10条限制]
测试结果: 成功 10 条, 失败 2 条

4. 测试批量发送
----------------------------------------
批量发送结果:
  成功: 5 条
  失败: 0 条
  成功率: 100.0%
```

## 配置参数

可以通过修改 `SmsFrequencyController` 中的常量来调整限制：

```java
// 10分钟的间隔时间（毫秒）
private static final long INTERVAL_MINUTES = 10;

// 每天最大短信数量
private static final int MAX_DAILY_SMS = 10;
```

## 集成到现有项目

### 1. 复制SMS包

将 `com.example.app.sms` 包复制到你的项目中。

### 2. 修改包名

根据你的项目结构修改包名：

```java
package your.project.package.sms;
```

### 3. 集成真实SMS服务

修改 `SmsService.simulateSendSms()` 方法，调用真实的SMS服务提供商API：

```java
private boolean simulateSendSms(String phoneNumber, String content, String messageId) {
    // 替换为真实的SMS API调用
    // 例如：阿里云短信服务、腾讯云短信服务等
    return realSmsProvider.send(phoneNumber, content, messageId);
}
```

## 特性说明

### 1. 线程安全
- 使用 `ConcurrentHashMap` 保证多线程环境下的数据安全
- 使用 `Collections.synchronizedList` 保护SMS记录列表

### 2. 内存优化
- 自动清理30天前的历史数据
- 避免内存泄漏和无限增长

### 3. 手机号标准化
- 自动处理不同格式的手机号
- 支持+86国家代码自动转换
- 移除非数字字符

### 4. 灵活配置
- 可以轻松调整时间间隔和每日限制
- 支持管理员重置功能
- 提供详细的统计信息

### 5. 错误处理
- 完善的输入验证
- 详细的错误消息
- 优雅的异常处理

## 扩展建议

1. **持久化存储**：将数据存储到数据库而不是内存中
2. **分布式支持**：使用Redis等缓存系统支持分布式部署
3. **更多限制规则**：添加小时级别、周级别的发送限制
4. **白名单功能**：为特殊手机号设置白名单，不受限制
5. **监控告警**：添加发送量监控和异常告警功能

## 注意事项

1. **数据丢失**：当前实现基于内存存储，应用重启后数据会丢失
2. **时区问题**：使用系统默认时区，在跨时区部署时需要注意
3. **性能考虑**：大量手机号时可能需要优化数据结构和清理策略
4. **并发限制**：高并发场景下可能需要添加限流机制

## 总结

本SMS频率控制系统提供了完整的短信发送频率管理功能，包括：
- ✅ 10分钟间隔限制
- ✅ 每日10条发送限制  
- ✅ 线程安全设计
- ✅ 内存优化管理
- ✅ 完整的测试用例
- ✅ 图形界面测试工具
- ✅ 详细的统计信息

系统设计灵活，易于集成和扩展，适合在生产环境中使用。