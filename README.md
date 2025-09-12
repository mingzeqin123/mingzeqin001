# MongoDB Java 聚合功能演示项目

这是一个使用Java连接MongoDB并实现各种聚合功能的演示项目。

## 项目结构

```
src/main/java/com/example/mongodb/
├── config/
│   └── MongoConfig.java              # MongoDB连接配置
├── model/
│   ├── User.java                     # 用户数据模型
│   └── Order.java                    # 订单数据模型
├── service/
│   ├── DataInitializationService.java    # 数据初始化服务
│   ├── UserAggregationService.java       # 用户聚合功能
│   ├── OrderAggregationService.java      # 订单聚合功能
│   └── AdvancedAggregationService.java   # 高级聚合功能
└── MongoDBAggregationDemo.java       # 主演示类
```

## 功能特性

### 1. 基础聚合功能
- **用户聚合**：
  - 按城市分组统计用户数量
  - 按年龄段分组统计
  - 各国用户统计信息（平均年龄、最大余额等）
  - 兴趣爱好分布统计
  - 余额最高的用户排行
  - 各城市平均余额统计

- **订单聚合**：
  - 按状态分组统计订单
  - 按支付方式统计订单
  - 金额最高的订单排行
  - 按月统计订单数量和金额
  - 用户订单统计
  - 特定商品订单查询
  - 订单状态分布统计

### 2. 高级聚合功能
- **多表关联查询**：
  - 用户订单关联统计
  - 各城市订单统计
  - 高价值客户识别
  - 商品受欢迎程度分析

- **复杂管道操作**：
  - 用户行为分析（按年龄段）
  - 订单时间分布分析
  - 复杂条件查询

## 环境要求

- Java 11+
- Maven 3.6+
- MongoDB 4.0+

## 运行方式

### 1. 确保MongoDB服务运行
```bash
# 启动MongoDB服务
mongod --dbpath /path/to/your/db
```

### 2. 编译和运行项目
```bash
# 编译项目
mvn clean compile

# 运行演示程序
mvn exec:java

# 或者直接运行
mvn clean package
java -cp target/classes:target/dependency/* com.example.mongodb.MongoDBAggregationDemo
```

## 聚合操作示例

### 基础分组统计
```java
// 按城市分组统计用户数量
List<Bson> pipeline = Arrays.asList(
    Aggregates.group("$city", Accumulators.sum("count", 1)),
    Aggregates.sort(Sorts.descending("count"))
);
```

### 多表关联查询
```java
// 用户订单关联统计
List<Bson> pipeline = Arrays.asList(
    Aggregates.lookup("users", "userId", "_id", "userInfo"),
    Aggregates.unwind("$userInfo"),
    Aggregates.group("$userInfo.name", 
        Accumulators.sum("orderCount", 1),
        Accumulators.sum("totalSpent", "$totalAmount")
    )
);
```

### 复杂条件查询
```java
// 添加年龄段字段
Aggregates.addFields(new Document("ageGroup", 
    new Document("$switch", new Document("branches", Arrays.asList(
        new Document("case", new Document("$lt", Arrays.asList("$age", 25))).append("then", "18-24"),
        new Document("case", new Document("$lt", Arrays.asList("$age", 35))).append("then", "25-34")
    )).append("default", "35+"))),
```

## 数据模型

### 用户模型 (User)
- id: ObjectId
- name: String
- email: String
- age: Integer
- city: String
- country: String
- registrationDate: LocalDateTime
- interests: List<String>
- balance: Double

### 订单模型 (Order)
- id: ObjectId
- userId: ObjectId (关联用户)
- orderNumber: String
- totalAmount: Double
- status: String
- orderDate: LocalDateTime
- items: List<OrderItem>
- shippingAddress: String
- paymentMethod: String

## 注意事项

1. 确保MongoDB服务正在运行
2. 项目会自动创建示例数据，包含100个用户和500个订单
3. 所有聚合操作都会在控制台输出结果
4. 项目使用MongoDB Java Driver 4.11.1版本

## 扩展功能

可以根据需要添加更多聚合功能：
- 时间序列分析
- 地理位置聚合
- 文本搜索聚合
- 图形数据分析
- 实时数据聚合