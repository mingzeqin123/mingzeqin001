# ShardingSphere JDBC 分表演示项目

这个项目演示了如何使用 ShardingSphere-JDBC 实现数据库分表功能。

## 项目概述

本项目展示了以下 ShardingSphere-JDBC 功能：

- **数据库分片**：根据用户ID将数据分布到不同的数据库
- **表分片**：根据不同的分片键将数据分布到不同的表
- **绑定表**：订单和订单项表使用相同的分片策略
- **广播表**：配置表在所有分片中都存在
- **分布式主键生成**：使用雪花算法生成唯一ID
- **跨分片查询**：支持跨多个分片的聚合查询

## 项目结构

```
sharding-jdbc-demo/
├── src/
│   ├── main/
│   │   ├── java/com/example/
│   │   │   ├── entity/          # 实体类
│   │   │   ├── mapper/          # MyBatis Mapper接口
│   │   │   ├── service/         # 业务逻辑层
│   │   │   ├── controller/      # REST API控制器
│   │   │   └── ShardingJdbcDemoApplication.java  # 启动类
│   │   └── resources/
│   │       ├── application.yml  # Spring Boot配置
│   │       └── sharding-config.yaml  # 备用ShardingSphere配置
│   └── test/
│       ├── java/                # 测试类
│       └── resources/           # 测试配置
├── scripts/                     # 数据库初始化脚本
└── pom.xml                     # Maven配置
```

## 分片策略

### 数据库分片
- **分片键**: `user_id`
- **分片算法**: `ds$->{user_id % 2}`
- **结果**: 用户数据根据user_id被分配到ds0或ds1数据库

### 表分片

#### 用户表 (t_user)
- **分片键**: `user_id`
- **分片算法**: `t_user_$->{user_id % 2}`
- **实际数据节点**: `ds0.t_user_0`, `ds0.t_user_1`, `ds1.t_user_0`, `ds1.t_user_1`

#### 订单表 (t_order)
- **数据库分片键**: `user_id` (与用户在同一数据库)
- **表分片键**: `order_id`
- **分片算法**: `t_order_$->{order_id % 4}`
- **实际数据节点**: `ds0.t_order_0~3`, `ds1.t_order_0~3`

#### 订单项表 (t_order_item)
- **绑定表**: 与t_order使用相同的分片策略
- **分片键**: `user_id` (数据库), `order_id` (表)

#### 配置表 (t_config)
- **广播表**: 在所有分片中都存在相同的数据

## 快速开始

### 1. 环境准备

- Java 17+
- Maven 3.6+
- MySQL 8.0+ (生产环境)

### 2. 数据库初始化

#### 生产环境 (MySQL)
```bash
# 1. 创建数据库
mysql -u root -p < scripts/create-databases.sql

# 2. 创建表结构
mysql -u root -p < scripts/create-tables-ds0.sql
mysql -u root -p < scripts/create-tables-ds1.sql
```

#### 测试环境
测试使用H2内存数据库，无需额外配置。

### 3. 配置修改

修改 `src/main/resources/application.yml` 中的数据库连接信息：

```yaml
spring:
  shardingsphere:
    datasource:
      ds0:
        jdbc-url: jdbc:mysql://localhost:3306/sharding_db_0?useSSL=false&serverTimezone=UTC
        username: your_username
        password: your_password
      ds1:
        jdbc-url: jdbc:mysql://localhost:3306/sharding_db_1?useSSL=false&serverTimezone=UTC
        username: your_username
        password: your_password
```

### 4. 运行项目

```bash
# 编译项目
mvn clean compile

# 运行测试
mvn test

# 启动应用
mvn spring-boot:run
```

应用将在 http://localhost:8080 启动。

## API 接口

### 初始化演示数据
```http
POST /api/sharding/init
```

### 用户相关接口
```http
# 根据ID获取用户
GET /api/sharding/user/{userId}

# 根据年龄范围查询用户
GET /api/sharding/users/age?minAge=20&maxAge=40
```

### 订单相关接口
```http
# 根据用户ID获取订单
GET /api/sharding/orders/user/{userId}

# 获取订单及其明细
GET /api/sharding/order/{orderId}/items

# 根据金额范围查询订单
GET /api/sharding/orders/amount?minAmount=100&maxAmount=1000

# 更新订单状态
PUT /api/sharding/order/{orderId}/status?status=COMPLETED
```

### 配置相关接口
```http
# 获取配置
GET /api/sharding/config/{key}

# 设置配置
POST /api/sharding/config?key=test&value=value&description=desc
```

### 统计接口
```http
# 获取分片统计信息
GET /api/sharding/stats
```

## 分片效果验证

### 1. 查看SQL执行日志

启动应用后，可以在日志中看到ShardingSphere生成的实际SQL：

```
Logic SQL: SELECT * FROM t_user WHERE user_id = ?
Actual SQL: ds0 ::: SELECT * FROM t_user_0 WHERE user_id = ?
```

### 2. 验证数据分布

创建用户后，可以通过用户ID验证数据分布：
- user_id为偶数：存储在ds0数据库
- user_id为奇数：存储在ds1数据库

### 3. 跨分片查询

执行年龄范围查询时，可以看到ShardingSphere会查询所有相关分片：

```
Actual SQL: ds0 ::: SELECT * FROM t_user_0 WHERE age BETWEEN ? AND ?
Actual SQL: ds0 ::: SELECT * FROM t_user_1 WHERE age BETWEEN ? AND ?
Actual SQL: ds1 ::: SELECT * FROM t_user_0 WHERE age BETWEEN ? AND ?
Actual SQL: ds1 ::: SELECT * FROM t_user_1 WHERE age BETWEEN ? AND ?
```

## 核心特性说明

### 1. 分片算法

#### 标准分片算法
```yaml
sharding-algorithms:
  user_db_inline:
    type: INLINE
    props:
      algorithm-expression: ds$->{user_id % 2}
```

#### 复合分片策略
对于需要多个分片键的场景，可以使用复合分片策略。

### 2. 绑定表

订单表和订单项表配置为绑定表，确保相关数据在同一分片：

```yaml
binding-tables:
  - t_order,t_order_item
```

### 3. 广播表

配置表作为广播表，在所有分片中保持数据一致：

```yaml
broadcast-tables:
  - t_config
```

### 4. 分布式主键

使用雪花算法生成全局唯一ID：

```yaml
key-generators:
  snowflake:
    type: SNOWFLAKE
```

## 性能优化建议

1. **合理选择分片键**：选择数据分布均匀的字段作为分片键
2. **避免跨分片事务**：尽量将相关数据放在同一分片
3. **使用绑定表**：关联查询的表使用相同分片策略
4. **索引优化**：在每个分片表上创建适当的索引
5. **连接池配置**：合理配置数据库连接池参数

## 常见问题

### 1. 跨分片事务
ShardingSphere支持弱XA事务，但建议避免跨分片事务以获得更好的性能。

### 2. 分片键修改
一旦确定分片键，不建议修改，因为这会导致数据重新分布。

### 3. 全表扫描
避免不带分片键的查询，这会导致全分片扫描影响性能。

## 扩展功能

### 1. 读写分离
可以结合读写分离功能，实现读写分离+分表的架构。

### 2. 数据脱敏
ShardingSphere提供数据脱敏功能，保护敏感数据。

### 3. 影子库
支持影子库功能，用于压力测试和灰度发布。

## 参考文档

- [ShardingSphere官方文档](https://shardingsphere.apache.org/document/current/cn/overview/)
- [Spring Boot集成指南](https://shardingsphere.apache.org/document/current/cn/user-manual/shardingsphere-jdbc/spring-boot-starter/)
- [分片算法详解](https://shardingsphere.apache.org/document/current/cn/user-manual/common-config/builtin-algorithm/sharding/)