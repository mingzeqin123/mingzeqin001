# Java + Redis 分布式锁防止定时任务重复提交

## 项目简介

这是一个使用Java和Redis实现的分布式锁解决方案，主要用于防止定时任务在分布式环境下重复执行。项目采用Spring Boot框架，集成了Redis作为分布式锁的存储介质。

## 核心特性

- ✅ **基于Redis的分布式锁**：使用Redis的`SET NX EX`命令实现原子性锁操作
- ✅ **Lua脚本保证原子性**：释放锁时使用Lua脚本确保只能释放自己持有的锁
- ✅ **注解方式简化使用**：提供`@DistributedLock`注解，通过AOP自动处理锁的获取和释放
- ✅ **支持重试机制**：可配置重试次数和重试间隔
- ✅ **多种失败策略**：支持跳过执行或抛出异常两种失败处理策略
- ✅ **自动过期机制**：避免死锁，支持自定义过期时间
- ✅ **定时任务集成**：与Spring的`@Scheduled`完美集成

## 技术栈

- Java 21
- Spring Boot 3.1.5
- Spring Data Redis
- Lettuce (Redis连接池)
- Spring AOP
- SLF4J + Logback

## 项目结构

```
src/main/java/com/example/
├── annotation/
│   └── DistributedLock.java          # 分布式锁注解
├── aspect/
│   └── DistributedLockAspect.java     # 分布式锁切面
├── config/
│   └── RedisConfig.java               # Redis配置
├── controller/
│   └── TestController.java            # 测试控制器（可选）
├── lock/
│   └── RedisDistributedLock.java      # Redis分布式锁核心实现
├── service/
│   └── DistributedLockTestService.java # 分布式锁测试服务
├── task/
│   └── ScheduledTaskService.java      # 定时任务示例
└── DistributedLockApplication.java    # 主启动类
```

## 快速开始

### 1. 环境准备

确保你的环境中已安装并启动了Redis服务：

```bash
# 使用Docker启动Redis（推荐）
docker run -d --name redis -p 6379:6379 redis:latest

# 或者直接启动本地Redis服务
redis-server
```

### 2. 配置Redis连接

编辑 `src/main/resources/application.yml` 文件，配置Redis连接信息：

```yaml
spring:
  redis:
    host: localhost      # Redis服务器地址
    port: 6379          # Redis端口
    password:           # Redis密码（如果有的话）
    database: 0         # 使用的数据库
```

### 3. 编译和运行

```bash
# 编译项目
mvn clean compile

# 运行应用
mvn spring-boot:run

# 或者打包后运行
mvn clean package
java -jar target/mac-java-app-1.0.0.jar
```

### 4. 查看效果

启动应用后，你会看到以下定时任务开始执行：

- **数据同步任务**：每30秒执行一次
- **报表生成任务**：每分钟执行一次  
- **清理过期数据任务**：每小时执行一次
- **系统健康检查任务**：每5分钟执行一次（不使用分布式锁）

## 使用方法

### 1. 注解方式（推荐）

```java
@Service
public class MyTaskService {
    
    @Scheduled(fixedRate = 30000)
    @DistributedLock(
        key = "my-task",                    // 锁的key
        expireTime = 25,                    // 过期时间
        timeUnit = TimeUnit.SECONDS,        // 时间单位
        retry = true,                       // 是否重试
        retryTimes = 3,                     // 重试次数
        retryInterval = 1000,               // 重试间隔(ms)
        failStrategy = DistributedLock.LockFailStrategy.SKIP  // 失败策略
    )
    public void myTask() {
        // 你的业务逻辑
        logger.info("执行定时任务...");
    }
}
```

### 2. 手动方式

```java
@Service
public class MyService {
    
    @Autowired
    private RedisDistributedLock distributedLock;
    
    public void processData() {
        String lockKey = "process-data-lock";
        String lockValue = distributedLock.generateLockValue();
        
        try {
            // 尝试获取锁
            boolean acquired = distributedLock.tryLock(lockKey, lockValue, 30, TimeUnit.SECONDS);
            
            if (acquired) {
                // 执行业务逻辑
                doProcess();
            } else {
                logger.warn("获取锁失败，跳过执行");
            }
        } finally {
            // 释放锁
            distributedLock.releaseLock(lockKey, lockValue);
        }
    }
}
```

## 配置参数说明

### @DistributedLock 注解参数

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| key | String | "" | 锁的key，为空时使用类名+方法名 |
| expireTime | long | 30 | 锁的过期时间 |
| timeUnit | TimeUnit | SECONDS | 时间单位 |
| retry | boolean | false | 获取锁失败时是否重试 |
| retryTimes | int | 3 | 重试次数 |
| retryInterval | long | 100 | 重试间隔（毫秒） |
| failStrategy | LockFailStrategy | SKIP | 失败处理策略 |

### 失败处理策略

- **SKIP**：获取锁失败时跳过方法执行
- **EXCEPTION**：获取锁失败时抛出异常

## 测试接口

如果启用了测试控制器（`app.enable-test-controller=true`），可以通过以下HTTP接口测试分布式锁功能：

```bash
# 测试注解方式的分布式锁
curl http://localhost:8080/api/test/annotation-lock

# 测试手动方式的分布式锁  
curl http://localhost:8080/api/test/manual-lock

# 测试锁状态查询
curl http://localhost:8080/api/test/lock-status

# 测试锁重试机制
curl http://localhost:8080/api/test/lock-retry
```

## 监控和排查

### 1. 查看应用日志

应用日志记录在 `logs/distributed-lock-demo.log` 文件中，包含详细的锁操作信息。

### 2. Redis监控

```bash
# 连接Redis客户端
redis-cli

# 查看所有锁相关的key
keys lock:*

# 查看特定锁的值和TTL
get lock:data-sync-task
ttl lock:data-sync-task
```

### 3. 应用监控

访问 `http://localhost:8080/actuator/health` 查看应用健康状态。

## 分布式环境测试

要测试分布式锁在多实例环境下的效果：

1. **启动多个应用实例**：

```bash
# 实例1（默认端口8080）
java -jar target/mac-java-app-1.0.0.jar

# 实例2（端口8081）
java -jar target/mac-java-app-1.0.0.jar --server.port=8081

# 实例3（端口8082）  
java -jar target/mac-java-app-1.0.0.jar --server.port=8082
```

2. **观察日志输出**：

你会发现在同一时间只有一个实例能够成功获取锁并执行定时任务，其他实例会跳过执行。

## 最佳实践

1. **合理设置过期时间**：锁的过期时间应该大于业务执行时间，但不要设置过长
2. **使用唯一的锁key**：为不同的业务使用不同的锁key
3. **异常处理**：确保在异常情况下锁能够被正确释放
4. **监控锁状态**：在生产环境中监控锁的使用情况
5. **避免长时间持锁**：尽量减少持锁时间，提高并发性能

## 常见问题

### Q: 锁没有被释放怎么办？
A: 锁有自动过期机制，即使程序崩溃，锁也会在过期时间后自动释放。

### Q: 如何处理Redis连接失败？
A: 分布式锁会捕获Redis连接异常，返回获取锁失败，不会影响应用正常运行。

### Q: 可以在非Spring Boot项目中使用吗？
A: 可以，只需要手动使用`RedisDistributedLock`类即可，不依赖Spring Boot的自动配置。

## 许可证

本项目采用 MIT 许可证。