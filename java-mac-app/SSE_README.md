# Java SSE (Server-Sent Events) 消息处理系统

## 概述

这是一个完整的Java Server-Sent Events (SSE) 消息处理系统，基于Spring Boot框架实现。系统提供了服务器端SSE服务和客户端消息处理功能，支持实时消息推送、连接管理、心跳检测等特性。

## 功能特性

### 🚀 核心功能
- **实时消息推送**: 支持向单个客户端或所有客户端推送消息
- **连接管理**: 自动管理客户端连接状态和生命周期
- **心跳检测**: 定期发送心跳消息保持连接活跃
- **消息类型**: 支持多种预定义消息类型（系统、用户、数据、状态、进度等）
- **错误处理**: 完善的错误处理和重连机制
- **并发安全**: 线程安全的设计，支持高并发场景

### 📡 消息类型
- **系统消息**: 系统信息、错误、警告
- **用户消息**: 用户消息、通知、警告
- **数据消息**: 数据更新、同步、导出
- **状态消息**: 连接状态、重连状态
- **进度消息**: 任务进度、完成状态
- **心跳消息**: 连接保活检测

## 项目结构

```
src/main/java/com/example/app/sse/
├── model/
│   ├── SSEMessage.java          # SSE消息模型
│   ├── MessageType.java         # 消息类型枚举
│   └── SSEClient.java           # 客户端信息模型
├── service/
│   └── SSEService.java          # SSE服务类
├── controller/
│   └── SSEController.java       # SSE控制器
├── client/
│   └── SSEClientProcessor.java  # SSE客户端处理器
├── example/
│   └── SSEExample.java          # 使用示例
└── SSEApplication.java          # Spring Boot应用入口
```

## 快速开始

### 1. 启动服务器

```bash
# 编译项目
mvn clean compile

# 启动Spring Boot应用
mvn spring-boot:run
```

服务器将在 `http://localhost:8080` 启动。

### 2. 建立SSE连接

```bash
# 使用curl建立SSE连接
curl -N -H "Accept: text/event-stream" \
     "http://localhost:8080/api/sse/connect?clientId=my_client&sessionId=my_session"
```

### 3. 发送消息

```bash
# 向指定客户端发送消息
curl -X POST "http://localhost:8080/api/sse/send/my_client" \
     -d "event=user.message&data=Hello World!"

# 广播消息到所有客户端
curl -X POST "http://localhost:8080/api/sse/broadcast" \
     -d "event=system.info&data=系统维护通知"
```

## API 接口

### SSE连接端点
- **GET** `/api/sse/connect` - 建立SSE连接
  - 参数: `clientId` (可选), `sessionId` (可选)
  - 返回: `text/event-stream` 格式的SSE流

### 消息发送端点
- **POST** `/api/sse/send/{clientId}` - 向指定客户端发送消息
  - 参数: `event`, `data`, `retry` (可选)
  
- **POST** `/api/sse/broadcast` - 广播消息到所有客户端
  - 参数: `event`, `data`, `retry` (可选)

### 管理端点
- **GET** `/api/sse/status/{clientId}` - 获取客户端状态
- **GET** `/api/sse/clients` - 获取所有客户端信息
- **DELETE** `/api/sse/disconnect/{clientId}` - 断开指定客户端

## 使用示例

### Java客户端示例

```java
import com.example.app.sse.client.SSEClientProcessor;
import com.example.app.sse.model.SSEMessage;

// 创建客户端
SSEClientProcessor client = new SSEClientProcessor(
    "http://localhost:8080", 
    "my_client", 
    "my_session"
);

// 设置消息处理器
client.setMessageHandler(message -> {
    System.out.println("收到消息: " + message.getEvent() + " - " + message.getData());
});

// 设置错误处理器
client.setErrorHandler(error -> {
    System.err.println("连接错误: " + error);
});

// 连接并开始接收消息
client.connect();

// 关闭连接
client.close();
```

### 运行示例程序

```bash
# 编译并运行示例
mvn compile exec:java -Dexec.mainClass="com.example.app.sse.example.SSEExample"
```

## 配置说明

### 服务器配置

在 `application.properties` 中可以配置以下参数：

```properties
# 服务器端口
server.port=8080

# SSE相关配置
sse.heartbeat.interval=30
sse.connection.timeout=5
sse.max.connections=1000
```

### 客户端配置

```java
// 自定义客户端ID和会话ID
String clientId = "custom_client_id";
String sessionId = "custom_session_id";

SSEClientProcessor client = new SSEClientProcessor(serverUrl, clientId, sessionId);
```

## 消息格式

### SSE消息格式

```
id: message_id
event: message_type
data: message_content
retry: 3000

```

### JSON消息格式

```json
{
  "id": "message_id",
  "event": "user.message",
  "data": "Hello World!",
  "retry": 3000,
  "timestamp": "2024-01-01 12:00:00",
  "metadata": {
    "priority": "high",
    "category": "notification"
  }
}
```

## 高级特性

### 1. 消息过滤

```java
client.setMessageHandler(message -> {
    // 只处理特定类型的消息
    if ("user.notification".equals(message.getEvent())) {
        System.out.println("用户通知: " + message.getData());
    }
});
```

### 2. 批量消息处理

```java
client.setMessageHandler(message -> {
    // 将消息添加到批处理队列
    batchQueue.add(message);
    
    // 定期处理批量消息
    if (batchQueue.size() >= 10) {
        processBatchMessages(batchQueue);
        batchQueue.clear();
    }
});
```

### 3. 错误重连

```java
client.setErrorHandler(error -> {
    System.err.println("连接错误: " + error);
    
    // 延迟重连
    ScheduledExecutorService scheduler = Executors.newScheduledThreadPool(1);
    scheduler.schedule(() -> {
        client.connect();
    }, 5, TimeUnit.SECONDS);
});
```

## 性能优化

### 1. 连接池管理
- 使用连接池管理HTTP连接
- 实现连接复用和超时控制

### 2. 消息队列
- 使用异步消息队列处理消息
- 实现消息优先级和批量处理

### 3. 内存管理
- 定期清理过期连接
- 限制消息队列大小

## 监控和日志

### 日志配置

```xml
<!-- logback-spring.xml -->
<configuration>
    <appender name="STDOUT" class="ch.qos.logback.core.ConsoleAppender">
        <encoder>
            <pattern>%d{HH:mm:ss.SSS} [%thread] %-5level %logger{36} - %msg%n</pattern>
        </encoder>
    </appender>
    
    <logger name="com.example.app.sse" level="DEBUG"/>
    
    <root level="INFO">
        <appender-ref ref="STDOUT"/>
    </root>
</configuration>
```

### 监控指标

- 活跃连接数
- 消息发送速率
- 错误率
- 平均响应时间

## 故障排除

### 常见问题

1. **连接超时**
   - 检查网络连接
   - 调整超时参数
   - 检查防火墙设置

2. **消息丢失**
   - 检查客户端处理逻辑
   - 验证消息队列配置
   - 查看服务器日志

3. **内存泄漏**
   - 定期清理过期连接
   - 限制消息队列大小
   - 监控内存使用情况

### 调试技巧

```java
// 启用详细日志
client.setMessageHandler(message -> {
    logger.debug("收到消息: {}", message);
    // 处理消息
});

// 监控连接状态
client.setConnectionHandler(status -> {
    logger.info("连接状态变化: {}", status);
});
```

## 扩展开发

### 添加新的消息类型

```java
// 在MessageType枚举中添加新类型
CUSTOM_EVENT("custom.event", "自定义事件");

// 在消息处理器中处理新类型
case CUSTOM_EVENT:
    handleCustomEvent(message);
    break;
```

### 实现消息持久化

```java
// 实现消息存储接口
public interface MessageStorage {
    void saveMessage(SSEMessage message);
    List<SSEMessage> getMessages(String clientId);
    void deleteMessages(String clientId);
}
```

## 许可证

本项目采用 MIT 许可证。详见 [LICENSE](LICENSE) 文件。

## 贡献

欢迎提交 Issue 和 Pull Request 来改进这个项目。

## 联系方式

如有问题或建议，请通过以下方式联系：

- 创建 GitHub Issue
- 发送邮件到项目维护者

---

**注意**: 这是一个示例项目，用于演示Java SSE消息处理的基本实现。在生产环境中使用前，请根据实际需求进行适当的修改和测试。