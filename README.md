# Redis分布式锁防重复提交

基于Java和Redis实现的分布式锁，用于防止定时任务重复提交。

## 功能特性

- ✅ 基于Redis的分布式锁实现
- ✅ 支持Lua脚本保证原子性
- ✅ 支持锁的自动过期
- ✅ 支持重试机制
- ✅ 支持SpEL表达式动态生成锁key
- ✅ 提供AOP注解简化使用
- ✅ 支持定时任务和手动任务
- ✅ 完整的测试用例

## 项目结构

```
src/main/java/com/example/
├── annotation/
│   └── DistributedLock.java          # 分布式锁注解
├── aspect/
│   └── DistributedLockAspect.java    # AOP切面实现
├── config/
│   └── RedisConfig.java              # Redis配置
├── controller/
│   └── TaskController.java           # 任务控制器
├── lock/
│   ├── RedisDistributedLock.java     # 分布式锁核心实现
│   └── DistributedLockManager.java   # 锁管理器
├── task/
│   └── ScheduledTaskService.java     # 定时任务示例
└── Application.java                  # 启动类
```

## 快速开始

### 1. 环境要求

- JDK 8+
- Maven 3.6+
- Redis 3.0+

### 2. 启动Redis

```bash
# 使用Docker启动Redis
docker run -d --name redis -p 6379:6379 redis:latest

# 或使用本地Redis
redis-server
```

### 3. 运行项目

```bash
# 编译项目
mvn clean compile

# 运行项目
mvn spring-boot:run
```

### 4. 测试接口

```bash
# 健康检查
curl http://localhost:8080/api/task/health

# 手动触发任务
curl -X POST http://localhost:8080/api/task/manual

# 带任务ID的手动触发
curl -X POST http://localhost:8080/api/task/manual/test-task-001
```

## 使用方式

### 1. 注解方式（推荐）

```java
@Service
public class MyTaskService {
    
    @Scheduled(fixedRate = 10000)
    @DistributedLock(expireTime = 30, timeUnit = TimeUnit.SECONDS)
    public void scheduledTask() {
        // 定时任务逻辑
    }
    
    @DistributedLock(key = "manualTask:#{#taskId}", expireTime = 5, timeUnit = TimeUnit.MINUTES)
    public void manualTask(String taskId) {
        // 手动任务逻辑
    }
}
```

### 2. 编程方式

```java
@Service
public class MyTaskService {
    
    @Autowired
    private DistributedLockManager lockManager;
    
    public void executeTask() {
        lockManager.executeWithLock("myTask", 30, TimeUnit.SECONDS, () -> {
            // 需要加锁的业务逻辑
            System.out.println("执行任务...");
        });
    }
}
```

## 注解参数说明

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| key | String | "" | 锁的key，支持SpEL表达式 |
| expireTime | long | 30 | 锁的过期时间 |
| timeUnit | TimeUnit | SECONDS | 时间单位 |
| retryTimes | int | 0 | 重试次数 |
| retryInterval | long | 1000 | 重试间隔（毫秒） |
| throwException | boolean | false | 获取锁失败时是否抛出异常 |
| message | String | "获取分布式锁失败" | 异常信息 |

## SpEL表达式示例

```java
// 使用方法参数
@DistributedLock(key = "task:#{#taskId}")
public void task(String taskId) { }

// 使用对象属性
@DistributedLock(key = "user:#{#user.id}")
public void userTask(User user) { }

// 组合表达式
@DistributedLock(key = "task:#{#type}:#{#id}")
public void complexTask(String type, String id) { }
```

## 测试

```bash
# 运行所有测试
mvn test

# 运行特定测试类
mvn test -Dtest=RedisDistributedLockTest

# 运行测试并生成报告
mvn test jacoco:report
```

## 注意事项

1. **锁的过期时间**：设置合理的过期时间，避免死锁
2. **重试机制**：合理设置重试次数和间隔，避免过度重试
3. **锁的粒度**：根据业务需求选择合适的锁粒度
4. **异常处理**：确保在异常情况下锁能被正确释放
5. **Redis连接**：确保Redis服务稳定可用

## 性能考虑

- 使用Lua脚本保证原子性，减少网络往返
- 合理设置连接池参数
- 避免过长的锁持有时间
- 考虑使用Redis集群提高可用性

## 扩展功能

- 支持锁的可重入性
- 支持锁的公平性
- 支持锁的监控和统计
- 支持锁的自动续期