# Java MongoDB聚合功能项目使用指南

## 🎯 项目概述

这是一个完整的Java MongoDB聚合功能演示项目，包含了以下核心功能：

### 📊 聚合功能演示
1. **基本分组聚合** - 按部门统计员工数量和平均薪资
2. **复杂聚合** - 按年龄段分组统计
3. **数组操作** - 技能使用情况统计（$unwind）
4. **关联查询** - 订单和用户信息关联（$lookup）
5. **产品销售分析** - 复杂的销售数据聚合
6. **时间序列分析** - 按月统计订单趋势
7. **文本搜索聚合** - 结合全文搜索的聚合
8. **地理位置聚合** - 按地理位置分组统计
9. **条件聚合** - 使用$cond进行条件统计

### 🏗️ 项目架构
```
java-mongodb-aggregation/
├── src/main/java/com/example/mongodb/
│   ├── MongoAggregationApp.java          # 主程序入口
│   ├── model/                            # 数据模型层
│   │   ├── User.java                     # 用户模型
│   │   ├── Order.java                    # 订单模型（包含OrderItem内部类）
│   │   └── Product.java                  # 产品模型
│   ├── service/                          # 业务服务层
│   │   ├── AggregationService.java       # 聚合操作服务（核心）
│   │   └── DataInitService.java          # 数据初始化服务
│   └── util/
│       └── MongoDBUtil.java              # MongoDB连接工具
├── src/main/resources/
│   └── logback.xml                       # 日志配置
├── pom.xml                               # Maven项目配置
├── run.sh                                # 主运行脚本
├── compile.sh                            # 简单编译脚本
├── docker-setup.sh                      # Docker MongoDB设置
└── README.md                             # 项目说明
```

## 🚀 快速开始

### 方法1: 使用Maven（推荐）

**1. 确保环境**
```bash
# 检查Java版本（需要11+）
java -version

# 检查Maven版本（需要3.6+）
mvn -version
```

**2. 启动MongoDB**
```bash
# 选项A: 本地MongoDB
mongod

# 选项B: 使用Docker（推荐）
./docker-setup.sh
```

**3. 运行项目**
```bash
# 直接运行
./run.sh

# 或者分步执行
mvn clean compile
mvn exec:java -Dexec.mainClass="com.example.mongodb.MongoAggregationApp"
```

### 方法2: 使用Docker完整环境

如果你的系统没有安装Maven或MongoDB，可以使用Docker：

```bash
# 1. 启动MongoDB容器
./docker-setup.sh

# 2. 使用Maven Docker镜像运行项目
docker run -it --rm \
  --network host \
  -v "$(pwd)":/workspace \
  -w /workspace \
  maven:3.8-openjdk-11 \
  mvn exec:java -Dexec.mainClass="com.example.mongodb.MongoAggregationApp"
```

## 📋 使用说明

### 交互式菜单
程序启动后会显示交互式菜单：

```
============================================================
           MongoDB聚合功能演示菜单
============================================================
1.  初始化示例数据
2.  运行所有聚合示例
3.  按部门分组统计
4.  按年龄段分组统计
5.  技能统计分析
6.  订单用户关联查询
7.  产品销售分析
8.  月度订单趋势分析
9.  文本搜索聚合
10. 地理位置聚合
11. 条件聚合统计
12. 查看数据统计信息
0.  退出程序
============================================================
```

### 推荐使用流程

**第一次运行：**
1. 选择 `1` - 初始化示例数据（创建用户、产品、订单数据）
2. 选择 `12` - 查看数据统计信息
3. 选择 `2` - 运行所有聚合示例

**后续使用：**
- 选择特定的聚合功能（3-11）进行单独演示
- 每个功能都有详细的日志输出，显示聚合管道和结果

## 🔧 核心聚合功能详解

### 1. 基本分组聚合（groupByDepartment）
```java
// 聚合管道
List<Document> pipeline = Arrays.asList(
    match(exists("salary")),                    // $match: 筛选有薪资的用户
    group("$department",                        // $group: 按部门分组
        Arrays.asList(
            Document.parse("{ $sum: 1 }").append("_id", "employeeCount"),
            Document.parse("{ $avg: \"$salary\" }").append("_id", "avgSalary"),
            Document.parse("{ $min: \"$salary\" }").append("_id", "minSalary"),
            Document.parse("{ $max: \"$salary\" }").append("_id", "maxSalary")
        )
    ),
    sort(descending("avgSalary")),              // $sort: 按平均薪资降序
    project(Document.parse(                     // $project: 字段投影
        "{ department: \"$_id\", employeeCount: 1, avgSalary: 1, minSalary: 1, maxSalary: 1, _id: 0 }"
    ))
);
```

### 2. 数组操作聚合（analyzeSkills）
```java
List<Document> pipeline = Arrays.asList(
    match(and(exists("skills"), ne("skills", null))),  // 筛选有技能的用户
    unwind("$skills"),                                  // $unwind: 展开技能数组
    group("$skills",                                    // 按技能分组统计
        Arrays.asList(
            Document.parse("{ $sum: 1 }").append("_id", "userCount"),
            Document.parse("{ $avg: \"$salary\" }").append("_id", "avgSalary"),
            Document.parse("{ $push: \"$name\" }").append("_id", "users")
        )
    ),
    sort(descending("userCount")),                      // 按用户数量排序
    limit(10)                                           // 限制结果数量
);
```

### 3. 关联查询聚合（orderUserLookup）
```java
List<Document> pipeline = Arrays.asList(
    lookup("users", "customerId", "_id", "customerInfo"),  // $lookup: 关联用户表
    unwind("$customerInfo"),                               // 展开用户信息
    match(eq("status", "delivered")),                      // 筛选已完成订单
    group("$customerId",                                   // 按客户分组
        Arrays.asList(
            Document.parse("{ $sum: 1 }").append("_id", "orderCount"),
            Document.parse("{ $sum: \"$totalAmount\" }").append("_id", "totalSpent"),
            Document.parse("{ $avg: \"$totalAmount\" }").append("_id", "avgOrderAmount"),
            Document.parse("{ $first: \"$customerInfo.name\" }").append("_id", "customerName")
        )
    ),
    sort(descending("totalSpent")),                        // 按总消费排序
    limit(10)                                              // 前10名客户
);
```

### 4. 条件聚合（conditionalAggregation）
```java
List<Document> pipeline = Arrays.asList(
    group(null,  // 不按字段分组，统计全部
        Arrays.asList(
            Document.parse("{ $sum: 1 }").append("_id", "totalUsers"),
            // 条件统计：高薪用户数
            Document.parse("{ $sum: { $cond: [{ $gt: [\"$salary\", 80000] }, 1, 0] } }")
                .append("_id", "highSalaryUsers"),
            // 条件统计：年轻用户数
            Document.parse("{ $sum: { $cond: [{ $lt: [\"$age\", 30] }, 1, 0] } }")
                .append("_id", "youngUsers")
        )
    ),
    // 添加百分比计算
    addFields(new Document("highSalaryPercentage", 
        new Document("$multiply", Arrays.asList(
            new Document("$divide", Arrays.asList("$highSalaryUsers", "$totalUsers")), 100))))
);
```

## 📊 示例数据说明

### 用户数据（100条）
- 姓名、邮箱、年龄（22-62岁）
- 城市（北京、上海、纽约、伦敦等）
- 薪资（30,000-150,000）
- 部门（IT、Sales、Marketing、HR、Finance、Operations）
- 技能（Java、Python、JavaScript、C++、Sales等）

### 产品数据（20种产品）
- 电子产品（iPhone、MacBook、iPad等）
- 服装（Nike、Adidas、Levi's等）
- 家居用品（咖啡机、微波炉等）
- 办公用品（显示器、键盘等）

### 订单数据（200条）
- 随机客户和产品组合
- 多种订单状态（pending、processing、shipped、delivered、cancelled）
- 过去6个月的订单日期
- 多种支付方式

## 🎯 核心聚合操作符演示

| 操作符 | 功能 | 使用场景 |
|--------|------|----------|
| `$match` | 文档筛选 | 数据过滤，类似SQL的WHERE |
| `$group` | 分组聚合 | 按字段分组，计算聚合值 |
| `$sort` | 排序 | 结果排序 |
| `$project` | 字段投影 | 选择和重命名字段 |
| `$lookup` | 关联查询 | 跨集合关联，类似SQL的JOIN |
| `$unwind` | 数组展开 | 将数组字段展开为多个文档 |
| `$addFields` | 添加字段 | 计算新字段 |
| `$limit` | 限制结果 | 限制返回文档数量 |
| `$cond` | 条件表达式 | 条件判断和计算 |
| `$switch` | 多条件分支 | 复杂条件逻辑 |

## 🔍 日志和调试

项目使用SLF4J+Logback进行日志记录：

- **控制台输出**: 实时查看聚合过程和结果
- **文件日志**: 保存在 `logs/mongodb-aggregation.log`
- **日志级别**: 可在 `logback.xml` 中调整

## ⚙️ 配置说明

### MongoDB连接配置
在 `MongoDBUtil.java` 中修改：
```java
private static final String HOST = "localhost";
private static final int PORT = 27017;
private static final String USERNAME = null; // 如需认证请设置
private static final String PASSWORD = null; // 如需认证请设置
```

### Maven依赖版本
在 `pom.xml` 中可以调整依赖版本：
- MongoDB Driver: 4.11.1
- Jackson: 2.15.2
- SLF4J: 2.0.9
- Logback: 1.4.11

## 🚨 常见问题

### Q1: MongoDB连接失败
**解决方案:**
1. 确保MongoDB服务正在运行：`mongod` 或 `./docker-setup.sh`
2. 检查端口是否被占用：`netstat -an | grep 27017`
3. 检查防火墙设置

### Q2: Maven命令不存在
**解决方案:**
1. 安装Maven：`apt-get install maven` 或下载官方版本
2. 使用Docker运行：见上文Docker方法
3. 手动下载JAR依赖（不推荐）

### Q3: 聚合查询慢
**解决方案:**
1. 检查是否创建了适当的索引
2. 使用 `explain()` 分析查询计划
3. 优化聚合管道顺序（将 `$match` 放在前面）

### Q4: 内存不足
**解决方案:**
1. 增加JVM堆内存：`java -Xmx2g -jar ...`
2. 使用 `$limit` 限制结果集大小
3. 分批处理大数据集

## 🎓 学习建议

1. **从简单开始**: 先运行基本的分组聚合，理解 `$group` 的用法
2. **理解管道概念**: MongoDB聚合是管道式处理，每个阶段的输出是下个阶段的输入
3. **查看日志**: 注意观察日志中的聚合管道结构和结果
4. **修改代码**: 尝试修改聚合条件，观察结果变化
5. **性能优化**: 学习索引对聚合性能的影响

## 📚 扩展学习

- [MongoDB聚合管道官方文档](https://docs.mongodb.com/manual/aggregation/)
- [Java MongoDB Driver文档](https://mongodb.github.io/mongo-java-driver/)
- [聚合操作符参考](https://docs.mongodb.com/manual/reference/operator/aggregation/)

## 🤝 贡献

欢迎提交Issue和Pull Request来改进这个项目！