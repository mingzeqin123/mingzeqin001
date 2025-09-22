# Sharding JDBC 分表演示

这是一个使用 Sharding JDBC 进行数据库分表的完整演示项目。

## 项目结构

```
src/main/java/com/example/app/
├── ShardingApplication.java          # Spring Boot 启动类
├── entity/                          # 实体类
│   ├── User.java                    # 用户实体
│   └── Order.java                   # 订单实体
├── mapper/                          # MyBatis Mapper
│   ├── UserMapper.java              # 用户数据访问层
│   └── OrderMapper.java             # 订单数据访问层
├── service/                         # 服务层
│   ├── UserService.java             # 用户服务
│   └── OrderService.java            # 订单服务
└── controller/                      # 控制器
    └── ShardingTestController.java  # 分表测试控制器

src/main/resources/
├── application.yml                  # Sharding JDBC 配置
└── sql/
    └── init.sql                     # 数据库初始化脚本
```

## 分表配置说明

### 1. 数据源配置
- **ds0**: 连接到 test_db_0 数据库
- **ds1**: 连接到 test_db_1 数据库

### 2. 分表规则

#### 用户表 (t_user)
- **分片键**: user_id
- **分表策略**: 按 user_id % 2 进行分表
  - user_id % 2 = 0 → t_user_0
  - user_id % 2 = 1 → t_user_1
- **分库策略**: 按 user_id % 2 进行分库
  - user_id % 2 = 0 → ds0
  - user_id % 2 = 1 → ds1

#### 订单表 (t_order)
- **分片键**: order_id
- **分表策略**: 按 order_id % 2 进行分表
  - order_id % 2 = 0 → t_order_0
  - order_id % 2 = 1 → t_order_1
- **分库策略**: 按 order_id % 2 进行分库
  - order_id % 2 = 0 → ds0
  - order_id % 2 = 1 → ds1

## 环境准备

### 1. 数据库准备
```sql
-- 创建数据库
CREATE DATABASE test_db_0;
CREATE DATABASE test_db_1;

-- 执行初始化脚本
source src/main/resources/sql/init.sql
```

### 2. 配置文件修改
修改 `application.yml` 中的数据库连接信息：
```yaml
spring:
  shardingsphere:
    datasource:
      ds0:
        jdbc-url: jdbc:mysql://localhost:3306/test_db_0?...
        username: your_username
        password: your_password
      ds1:
        jdbc-url: jdbc:mysql://localhost:3306/test_db_1?...
        username: your_username
        password: your_password
```

## 运行项目

### 1. 启动应用
```bash
mvn spring-boot:run
```

### 2. 访问接口
应用启动后访问: http://localhost:8080/api/sharding/

## API 接口说明

### 用户相关接口
- `GET /api/sharding/users` - 获取所有用户
- `GET /api/sharding/users/{id}` - 根据ID获取用户
- `POST /api/sharding/users` - 创建用户
- `GET /api/sharding/users/search/username/{username}` - 根据用户名查询
- `GET /api/sharding/users/search/age?minAge=20&maxAge=30` - 年龄范围查询

### 订单相关接口
- `GET /api/sharding/orders` - 获取所有订单
- `GET /api/sharding/orders/{id}` - 根据ID获取订单
- `POST /api/sharding/orders` - 创建订单
- `GET /api/sharding/orders/user/{userId}` - 根据用户ID查询订单
- `GET /api/sharding/orders/status/{status}` - 根据状态查询订单

### 批量操作接口
- `POST /api/sharding/batch/users/{count}` - 批量创建用户
- `POST /api/sharding/batch/orders/{count}` - 批量创建订单

### 统计信息接口
- `GET /api/sharding/stats` - 获取统计信息

## 测试示例

### 1. 创建用户
```bash
curl -X POST http://localhost:8080/api/sharding/users \
  -H "Content-Type: application/json" \
  -d '{
    "userId": 1,
    "username": "testuser",
    "email": "test@example.com",
    "phone": "13800000000",
    "age": 25,
    "gender": 1
  }'
```

### 2. 查询用户
```bash
curl http://localhost:8080/api/sharding/users/1
```

### 3. 批量创建用户
```bash
curl -X POST http://localhost:8080/api/sharding/batch/users/100
```

### 4. 查看统计信息
```bash
curl http://localhost:8080/api/sharding/stats
```

## 分表验证

### 1. 查看分表分布
执行批量创建操作后，可以通过以下SQL查看数据分布：

```sql
-- 查看 ds0 数据库中的用户分布
USE test_db_0;
SELECT 't_user_0' as table_name, COUNT(*) as count FROM t_user_0
UNION ALL
SELECT 't_user_1' as table_name, COUNT(*) as count FROM t_user_1;

-- 查看 ds1 数据库中的用户分布
USE test_db_1;
SELECT 't_user_0' as table_name, COUNT(*) as count FROM t_user_0
UNION ALL
SELECT 't_user_1' as table_name, COUNT(*) as count FROM t_user_1;
```

### 2. 验证分片规则
- 用户ID为奇数的用户会存储在 t_user_1 表中
- 用户ID为偶数的用户会存储在 t_user_0 表中
- 订单ID的分片规则与用户ID相同

## 运行测试

```bash
# 运行所有测试
mvn test

# 运行特定测试类
mvn test -Dtest=ShardingTest
```

## 注意事项

1. **分片键选择**: 分片键应该选择数据分布均匀的字段，避免数据倾斜
2. **跨库查询**: 跨库查询会影响性能，尽量避免
3. **事务处理**: 跨库事务需要使用分布式事务处理
4. **数据一致性**: 分表后需要考虑数据一致性问题
5. **监控**: 建议添加分表监控，观察数据分布情况

## 扩展功能

### 1. 添加更多分片算法
可以配置不同的分片算法，如：
- 取模分片 (MOD)
- 哈希分片 (HASH)
- 范围分片 (RANGE)
- 自定义分片算法

### 2. 读写分离
可以配置读写分离，将读操作路由到从库

### 3. 数据脱敏
可以配置数据脱敏规则，保护敏感数据

### 4. 分布式事务
可以集成 Seata 等分布式事务框架