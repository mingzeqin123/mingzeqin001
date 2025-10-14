# Java SSE 消息处理系统

这是一个完整的Java Server-Sent Events (SSE) 消息处理系统，集成了JavaFX图形界面和Spring Boot后端服务。

## 功能特性

### 🚀 核心功能
- **SSE服务器**: 基于Spring Boot的高性能SSE服务器
- **SSE客户端**: 支持自动重连的SSE客户端
- **消息处理器**: 支持过滤、转换、路由的消息处理系统
- **JavaFX界面**: 直观的图形用户界面
- **实时通信**: 支持实时双向消息传输

### 📦 组件架构

```
com.example.app.sse/
├── SseMessage.java          # 消息模型
├── SseController.java       # SSE服务器控制器
├── SseClient.java          # SSE客户端
├── SseMessageProcessor.java # 消息处理器
├── SseServerApplication.java # Spring Boot应用
└── SseDemo.java            # 演示程序
```

## 快速开始

### 1. 构建项目

```bash
cd java-mac-app
mvn clean compile
```

### 2. 运行应用程序

```bash
mvn javafx:run
```

或者运行主类:

```bash
java -cp target/classes com.example.app.MacJavaApp
```

### 3. 使用SSE功能

1. **启动服务器**: 在"SSE消息处理"标签页中点击"启动服务器"
2. **连接客户端**: 输入服务器URL和客户端ID，点击"连接"
3. **发送消息**: 选择事件类型，输入消息内容，点击"发送消息"
4. **查看日志**: 在输出区域查看实时消息日志

## API 文档

### SSE服务器端点

#### 建立连接
```
GET /api/sse/connect?clientId={clientId}
Accept: text/event-stream
```

#### 发送消息到指定客户端
```
POST /api/sse/send/{clientId}
Content-Type: application/json

{
  "event": "notification",
  "data": {
    "message": "Hello World"
  }
}
```

#### 广播消息
```
POST /api/sse/broadcast
Content-Type: application/json

{
  "event": "broadcast",
  "data": {
    "message": "Broadcast message"
  }
}
```

#### 获取服务器状态
```
GET /api/sse/status
```

#### 断开客户端连接
```
DELETE /api/sse/disconnect/{clientId}
```

### 消息格式

SSE消息采用以下JSON格式:

```json
{
  "id": "message-id",
  "event": "event-type",
  "data": {
    "content": "message content",
    "timestamp": "2024-01-01T12:00:00"
  },
  "timestamp": "2024-01-01T12:00:00",
  "retry": 3000,
  "metadata": {
    "sender": "client-id",
    "processed": true
  }
}
```

## 使用示例

### 1. 基本客户端使用

```java
// 创建客户端
SseClient client = new SseClient();

// 设置事件处理器
client.onEvent("notification", message -> {
    System.out.println("收到通知: " + message.getData());
});

// 连接到服务器
client.connect("http://localhost:8080", "my-client-id")
    .thenRun(() -> System.out.println("连接成功"));
```

### 2. 消息处理器使用

```java
// 创建消息处理器
SseMessageProcessor processor = new SseMessageProcessor();

// 注册处理器
processor.registerHandler("log", message -> {
    System.out.println("日志: " + message.getData());
});

// 注册过滤器
processor.registerFilter("important", message -> {
    return "important".equals(message.getMetadata().get("priority"));
});

// 处理消息
processor.submitMessage(message);
```

### 3. 服务器集成

```java
// 启动服务器
ConfigurableApplicationContext context = 
    SseServerApplication.startServer(8080);

// 停止服务器
SseServerApplication.stopServer();
```

## 高级功能

### 消息过滤

消息处理器支持多种过滤器:

- **时间过滤器**: 只处理最近的消息
- **内容过滤器**: 过滤空消息
- **优先级过滤器**: 根据优先级过滤
- **自定义过滤器**: 支持自定义过滤逻辑

### 消息转换

支持消息转换功能:

- **数据清理**: 清理和格式化消息内容
- **时间戳添加**: 自动添加处理时间戳
- **元数据增强**: 添加处理元数据
- **自定义转换**: 支持自定义转换逻辑

### 消息路由

支持多种路由模式:

- **精确匹配**: 根据事件类型精确匹配
- **通配符匹配**: 支持 `*` 和 `?` 通配符
- **模式匹配**: 支持正则表达式匹配
- **多处理器**: 一个消息可以被多个处理器处理

## 配置选项

### 服务器配置

```properties
# 服务器端口
server.port=8080

# SSE超时时间（毫秒）
sse.timeout=1800000

# 心跳间隔（秒）
sse.heartbeat.interval=30
```

### 客户端配置

```java
// 连接超时
client.setConnectTimeout(10, TimeUnit.SECONDS);

// 读取超时（SSE需要长连接）
client.setReadTimeout(0, TimeUnit.SECONDS);

// 重连间隔
client.setRetryInterval(5, TimeUnit.SECONDS);
```

## 故障排除

### 常见问题

1. **连接失败**
   - 检查服务器是否启动
   - 确认端口号正确
   - 检查防火墙设置

2. **消息丢失**
   - 检查网络连接稳定性
   - 确认客户端连接状态
   - 查看服务器日志

3. **内存使用过高**
   - 调整消息队列大小
   - 优化消息处理逻辑
   - 定期清理连接

### 日志配置

在 `src/main/resources/simplelogger.properties` 中配置日志级别:

```properties
org.slf4j.simpleLogger.defaultLogLevel=INFO
org.slf4j.simpleLogger.log.com.example.app.sse=DEBUG
```

## 性能优化

### 服务器端优化

- 使用连接池管理客户端连接
- 实现消息批处理
- 配置适当的超时时间
- 使用异步处理

### 客户端优化

- 实现智能重连机制
- 使用消息缓存
- 优化事件处理逻辑
- 及时清理资源

## 扩展开发

### 自定义消息处理器

```java
public class CustomMessageHandler implements MessageHandler {
    @Override
    public void handle(SseMessage message) throws Exception {
        // 自定义处理逻辑
    }
}
```

### 自定义过滤器

```java
public class CustomMessageFilter implements MessageFilter {
    @Override
    public boolean accept(SseMessage message) {
        // 自定义过滤逻辑
        return true;
    }
}
```

### 自定义转换器

```java
public class CustomMessageTransformer implements MessageTransformer {
    @Override
    public SseMessage transform(SseMessage message) throws Exception {
        // 自定义转换逻辑
        return message;
    }
}
```

## 许可证

本项目采用 MIT 许可证。详情请参见 [LICENSE](LICENSE) 文件。

## 贡献

欢迎提交 Issue 和 Pull Request 来改进这个项目。

## 联系方式

如有问题或建议，请通过以下方式联系:

- 创建 GitHub Issue
- 发送邮件至项目维护者

---

**注意**: 这是一个演示项目，生产环境使用时请根据实际需求进行安全性和性能优化。