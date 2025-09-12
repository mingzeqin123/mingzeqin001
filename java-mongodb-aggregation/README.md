# Java MongoDB聚合功能演示项目

这是一个演示Java连接MongoDB并实现各种聚合功能的完整项目。

## 项目特性

### 📊 聚合功能演示
- **基本分组聚合** - 按部门统计员工数量和平均薪资
- **复杂聚合** - 按年龄段分组统计
- **数组操作** - 技能使用情况统计
- **关联查询** - 订单和用户信息关联（$lookup）
- **时间序列分析** - 按月统计订单趋势
- **条件聚合** - 使用$cond进行条件统计
- **文本搜索聚合** - 结合全文搜索的聚合
- **地理位置聚合** - 按地理位置分组统计

### 🛠️ 技术栈
- **Java 11+**
- **MongoDB Driver 4.11.1**
- **Jackson** - JSON处理
- **SLF4J + Logback** - 日志记录
- **Maven** - 项目构建

### 📁 项目结构
```
java-mongodb-aggregation/
├── src/main/java/com/example/mongodb/
│   ├── MongoAggregationApp.java          # 主程序入口
│   ├── model/                            # 数据模型
│   │   ├── User.java                     # 用户模型
│   │   ├── Order.java                    # 订单模型
│   │   └── Product.java                  # 产品模型
│   ├── service/                          # 服务层
│   │   ├── AggregationService.java       # 聚合操作服务
│   │   └── DataInitService.java          # 数据初始化服务
│   └── util/
│       └── MongoDBUtil.java              # MongoDB连接工具
├── src/main/resources/
│   └── logback.xml                       # 日志配置
├── pom.xml                               # Maven配置
└── README.md                             # 项目说明
```

## 🚀 快速开始

### 1. 环境要求
- Java 11 或更高版本
- Maven 3.6 或更高版本
- MongoDB 4.4 或更高版本

### 2. 启动MongoDB
确保MongoDB服务正在运行：
```bash
# 启动MongoDB服务
mongod

# 或者使用Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

### 3. 编译和运行项目
```bash
# 进入项目目录
cd java-mongodb-aggregation

# 编译项目
mvn clean compile

# 运行项目
mvn exec:java -Dexec.mainClass="com.example.mongodb.MongoAggregationApp"

# 或者打包后运行
mvn clean package
java -jar target/mongodb-aggregation-1.0.0.jar
```

### 4. 使用说明

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

**建议操作顺序：**
1. 首先选择 `1` 初始化示例数据
2. 然后选择 `2` 运行所有聚合示例
3. 或者选择特定的聚合功能进行演示

## 📊 聚合功能详解

### 1. 基本分组聚合
```java
// 按部门统计员工数量和平均薪资
group("$department", 
    Arrays.asList(
        Document.parse("{ $sum: 1 }").append("_id", "employeeCount"),
        Document.parse("{ $avg: \"$salary\" }").append("_id", "avgSalary")
    )
)
```

### 2. 复杂条件分组
```java
// 使用$switch添加年龄段字段
addFields(new Document("ageRange", 
    new Document("$switch", new Document()
        .append("branches", Arrays.asList(
            new Document("case", new Document("$lt", Arrays.asList("$age", 25)))
                .append("then", "18-24"),
            new Document("case", new Document("$lt", Arrays.asList("$age", 35)))
                .append("then", "25-34")
        ))
        .append("default", "35+")
    )
))
```

### 3. 数组操作
```java
// 展开技能数组并统计
unwind("$skills"),
group("$skills",
    Arrays.asList(
        Document.parse("{ $sum: 1 }").append("_id", "userCount"),
        Document.parse("{ $avg: \"$salary\" }").append("_id", "avgSalary")
    )
)
```

### 4. 关联查询
```java
// 关联用户表
lookup("users", "customerId", "_id", "customerInfo"),
unwind("$customerInfo")
```

### 5. 条件聚合
```java
// 使用$cond进行条件统计
Document.parse("{ $sum: { $cond: [{ $gt: [\"$salary\", 80000] }, 1, 0] } }")
    .append("_id", "highSalaryUsers")
```

## 🗃️ 数据模型

### User（用户）
- 姓名、邮箱、年龄
- 城市、国家
- 薪资、部门
- 技能列表
- 创建/更新时间

### Product（产品）
- 产品名称、描述
- 类别、品牌
- 价格、库存
- 标签、评分
- 激活状态

### Order（订单）
- 订单号、客户信息
- 订单项列表
- 总金额、状态
- 支付方式、配送地址
- 订单/交付日期

## 🔧 配置说明

### MongoDB连接配置
在 `MongoDBUtil.java` 中修改连接参数：
```java
private static final String HOST = "localhost";
private static final int PORT = 27017;
private static final String USERNAME = null; // 如需认证
private static final String PASSWORD = null; // 如需认证
```

### 日志配置
在 `src/main/resources/logback.xml` 中配置日志级别和输出格式。

## 📈 示例输出

### 部门统计示例
```json
{
  "department": "IT",
  "employeeCount": 25,
  "avgSalary": 85000.0,
  "minSalary": 45000.0,
  "maxSalary": 150000.0
}
```

### 产品销售分析示例
```json
{
  "productName": "iPhone 15",
  "category": "Electronics",
  "totalQuantitySold": 150,
  "totalRevenue": 149850.0,
  "orderCount": 75,
  "avgPrice": 999.0
}
```

## 🚨 注意事项

1. **MongoDB服务** - 确保MongoDB服务正在运行
2. **内存使用** - 大量数据聚合可能消耗较多内存
3. **索引优化** - 生产环境中应根据查询模式创建适当索引
4. **连接管理** - 程序退出时会自动关闭MongoDB连接

## 🤝 贡献

欢迎提交Issue和Pull Request来改进这个项目！

## 📄 许可证

MIT License - 详见LICENSE文件