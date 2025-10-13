# SMS短信频率限制系统

## 功能概述

本系统实现了Java短信发送的频率限制功能，满足以下要求：

1. **10分钟内不重复发送**：同一个手机号在10分钟内只能发送一次短信
2. **每日发送限制**：每个手机号每天最多发送10条短信

## 核心组件

### 1. SmsRecord (短信记录模型)
- 记录手机号、发送时间、短信内容和发送状态
- 用于跟踪和统计短信发送历史

### 2. SmsRateLimiter (频率限制器)
- 实现核心的频率限制逻辑
- 提供10分钟冷却期检查
- 提供每日发送数量统计
- 支持记录清理和统计查询

### 3. SmsService (短信服务)
- 集成频率限制器的短信发送服务
- 提供异步发送功能
- 包含模拟短信发送逻辑（可替换为真实API）

## 主要特性

### 频率限制规则
- **冷却期限制**：同一手机号10分钟内只能发送一次
- **每日限制**：每个手机号每天最多10条短信
- **自动清理**：每小时自动清理超过1天的历史记录

### 统计功能
- 实时查询手机号发送统计
- 查看所有手机号的发送情况
- 显示下次可发送时间

### 用户界面
- 现代化的JavaFX图形界面
- 手机号格式验证（11位数字，1开头）
- 实时状态显示和结果反馈
- 异步发送避免界面阻塞

## 使用方法

### 1. 运行应用程序
```bash
cd java-mac-app
mvn clean compile
mvn javafx:run
```

### 2. 发送短信
1. 在"手机号"字段输入11位手机号
2. 在"短信内容"区域输入要发送的内容
3. 点击"发送短信"按钮

### 3. 查看统计
- 点击"查看统计"查看当前手机号的发送情况
- 点击"查看所有统计"查看所有手机号的统计信息

### 4. 运行测试
```bash
mvn exec:java -Dexec.mainClass="com.example.app.test.SmsRateLimiterTest"
```

## 技术实现

### 数据结构
- 使用`ConcurrentHashMap`存储手机号到发送记录的映射
- 使用`LocalDateTime`进行时间计算和比较
- 线程安全的设计支持并发访问

### 时间计算
- 使用`ChronoUnit.MINUTES.between()`计算时间间隔
- 使用`LocalDateTime.now()`获取当前时间
- 支持跨日期的统计计算

### 异步处理
- 短信发送在独立线程中执行
- 使用`Platform.runLater()`更新UI
- 避免界面冻结，提供良好的用户体验

## 配置参数

可以在`SmsRateLimiter`类中修改以下参数：

```java
// 10分钟冷却期（分钟）
private static final long COOLDOWN_MINUTES = 10;

// 每日最大发送数量
private static final int DAILY_MAX_COUNT = 10;
```

## 扩展功能

### 集成真实短信API
替换`SmsService.simulateSmsSending()`方法：

```java
private boolean simulateSmsSending(String phoneNumber, String content) {
    // 调用真实的短信API
    // 例如：阿里云短信、腾讯云短信等
    return yourSmsApi.send(phoneNumber, content);
}
```

### 数据持久化
可以添加数据库支持来持久化短信记录：

```java
// 使用JPA或MyBatis保存到数据库
@Repository
public class SmsRecordRepository {
    public void save(SmsRecord record) { ... }
    public List<SmsRecord> findByPhoneNumber(String phoneNumber) { ... }
}
```

### 配置管理
可以添加配置文件支持：

```properties
# application.properties
sms.cooldown.minutes=10
sms.daily.max.count=10
sms.cleanup.interval.hours=1
```

## 注意事项

1. **内存使用**：系统在内存中存储发送记录，长时间运行可能占用较多内存
2. **时间同步**：确保系统时间准确，频率限制基于系统时间
3. **并发安全**：使用线程安全的数据结构，支持多线程环境
4. **错误处理**：包含完整的异常处理和用户友好的错误提示

## 测试建议

1. **功能测试**：测试正常发送、重复发送限制、每日限制
2. **边界测试**：测试边界时间点、最大发送数量
3. **并发测试**：多线程同时发送短信
4. **性能测试**：大量数据下的性能表现

## 许可证

本项目使用MIT许可证，详见LICENSE文件。