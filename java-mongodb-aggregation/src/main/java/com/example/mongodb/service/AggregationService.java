package com.example.mongodb.service;

import com.example.mongodb.model.Order;
import com.example.mongodb.model.Product;
import com.example.mongodb.model.User;
import com.example.mongodb.util.MongoDBUtil;
import com.mongodb.client.AggregateIterable;
import com.mongodb.client.MongoCollection;
import com.mongodb.client.MongoDatabase;
import org.bson.Document;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.Arrays;
import java.util.List;

import static com.mongodb.client.model.Aggregates.*;
import static com.mongodb.client.model.Filters.*;
import static com.mongodb.client.model.Sorts.*;

/**
 * MongoDB聚合操作服务类
 * 演示各种聚合功能：$match, $group, $sort, $project, $lookup, $unwind等
 */
public class AggregationService {
    
    private static final Logger logger = LoggerFactory.getLogger(AggregationService.class);
    
    private final MongoDatabase database;
    private final MongoCollection<Document> usersCollection;
    private final MongoCollection<Document> ordersCollection;
    private final MongoCollection<Document> productsCollection;
    
    public AggregationService() {
        this.database = MongoDBUtil.getDatabase();
        this.usersCollection = database.getCollection("users");
        this.ordersCollection = database.getCollection("orders");
        this.productsCollection = database.getCollection("products");
    }
    
    /**
     * 示例1: 基本分组聚合 - 按部门统计员工数量和平均薪资
     */
    public void groupByDepartment() {
        logger.info("=== 示例1: 按部门分组统计 ===");
        
        List<Document> pipeline = Arrays.asList(
            // 匹配条件：只统计有薪资信息的用户
            match(exists("salary")),
            
            // 按部门分组
            group("$department", 
                Arrays.asList(
                    Document.parse("{ $sum: 1 }").append("_id", "employeeCount"),
                    Document.parse("{ $avg: \"$salary\" }").append("_id", "avgSalary"),
                    Document.parse("{ $min: \"$salary\" }").append("_id", "minSalary"),
                    Document.parse("{ $max: \"$salary\" }").append("_id", "maxSalary")
                )
            ),
            
            // 排序：按平均薪资降序
            sort(descending("avgSalary")),
            
            // 投影：重命名字段
            project(Document.parse(
                "{ department: \"$_id\", employeeCount: 1, avgSalary: 1, minSalary: 1, maxSalary: 1, _id: 0 }"
            ))
        );
        
        AggregateIterable<Document> results = usersCollection.aggregate(pipeline);
        for (Document doc : results) {
            logger.info("部门统计: {}", doc.toJson());
        }
    }
    
    /**
     * 示例2: 复杂聚合 - 按年龄段分组统计
     */
    public void groupByAgeRange() {
        logger.info("=== 示例2: 按年龄段分组统计 ===");
        
        List<Document> pipeline = Arrays.asList(
            // 添加年龄段字段
            addFields(new Document("ageRange", 
                new Document("$switch", new Document()
                    .append("branches", Arrays.asList(
                        new Document("case", new Document("$lt", Arrays.asList("$age", 25)))
                            .append("then", "18-24"),
                        new Document("case", new Document("$lt", Arrays.asList("$age", 35)))
                            .append("then", "25-34"),
                        new Document("case", new Document("$lt", Arrays.asList("$age", 45)))
                            .append("then", "35-44"),
                        new Document("case", new Document("$lt", Arrays.asList("$age", 55)))
                            .append("then", "45-54")
                    ))
                    .append("default", "55+")
                )
            )),
            
            // 按年龄段分组
            group("$ageRange",
                Arrays.asList(
                    Document.parse("{ $sum: 1 }").append("_id", "count"),
                    Document.parse("{ $avg: \"$age\" }").append("_id", "avgAge"),
                    Document.parse("{ $avg: \"$salary\" }").append("_id", "avgSalary")
                )
            ),
            
            // 排序
            sort(ascending("_id")),
            
            // 投影
            project(Document.parse(
                "{ ageRange: \"$_id\", count: 1, avgAge: 1, avgSalary: 1, _id: 0 }"
            ))
        );
        
        AggregateIterable<Document> results = usersCollection.aggregate(pipeline);
        for (Document doc : results) {
            logger.info("年龄段统计: {}", doc.toJson());
        }
    }
    
    /**
     * 示例3: 数组操作 - 统计技能使用情况
     */
    public void analyzeSkills() {
        logger.info("=== 示例3: 技能统计分析 ===");
        
        List<Document> pipeline = Arrays.asList(
            // 匹配有技能的用户
            match(and(exists("skills"), ne("skills", null))),
            
            // 展开技能数组
            unwind("$skills"),
            
            // 按技能分组统计
            group("$skills",
                Arrays.asList(
                    Document.parse("{ $sum: 1 }").append("_id", "userCount"),
                    Document.parse("{ $avg: \"$salary\" }").append("_id", "avgSalary"),
                    Document.parse("{ $push: \"$name\" }").append("_id", "users")
                )
            ),
            
            // 排序：按用户数量降序
            sort(descending("userCount")),
            
            // 限制结果数量
            limit(10),
            
            // 投影
            project(Document.parse(
                "{ skill: \"$_id\", userCount: 1, avgSalary: 1, users: 1, _id: 0 }"
            ))
        );
        
        AggregateIterable<Document> results = usersCollection.aggregate(pipeline);
        for (Document doc : results) {
            logger.info("技能统计: {}", doc.toJson());
        }
    }
    
    /**
     * 示例4: 关联查询 - 订单和用户信息关联
     */
    public void orderUserLookup() {
        logger.info("=== 示例4: 订单用户关联查询 ===");
        
        List<Document> pipeline = Arrays.asList(
            // 关联用户表
            lookup("users", "customerId", "_id", "customerInfo"),
            
            // 展开用户信息（假设每个订单只对应一个用户）
            unwind("$customerInfo"),
            
            // 匹配条件：只查询已完成的订单
            match(eq("status", "delivered")),
            
            // 按客户分组统计
            group("$customerId",
                Arrays.asList(
                    Document.parse("{ $sum: 1 }").append("_id", "orderCount"),
                    Document.parse("{ $sum: \"$totalAmount\" }").append("_id", "totalSpent"),
                    Document.parse("{ $avg: \"$totalAmount\" }").append("_id", "avgOrderAmount"),
                    Document.parse("{ $first: \"$customerInfo.name\" }").append("_id", "customerName"),
                    Document.parse("{ $first: \"$customerInfo.city\" }").append("_id", "customerCity")
                )
            ),
            
            // 排序：按总消费降序
            sort(descending("totalSpent")),
            
            // 限制前10名客户
            limit(10),
            
            // 投影
            project(Document.parse(
                "{ customerId: \"$_id\", customerName: 1, customerCity: 1, " +
                "orderCount: 1, totalSpent: 1, avgOrderAmount: 1, _id: 0 }"
            ))
        );
        
        AggregateIterable<Document> results = ordersCollection.aggregate(pipeline);
        for (Document doc : results) {
            logger.info("客户消费统计: {}", doc.toJson());
        }
    }
    
    /**
     * 示例5: 复杂聚合 - 产品销售分析
     */
    public void productSalesAnalysis() {
        logger.info("=== 示例5: 产品销售分析 ===");
        
        List<Document> pipeline = Arrays.asList(
            // 匹配已完成的订单
            match(eq("status", "delivered")),
            
            // 展开订单项
            unwind("$items"),
            
            // 按产品分组统计销售数据
            group("$items.productId",
                Arrays.asList(
                    Document.parse("{ $sum: \"$items.quantity\" }").append("_id", "totalQuantitySold"),
                    Document.parse("{ $sum: { $multiply: [\"$items.quantity\", \"$items.price\"] } }")
                        .append("_id", "totalRevenue"),
                    Document.parse("{ $sum: 1 }").append("_id", "orderCount"),
                    Document.parse("{ $avg: \"$items.price\" }").append("_id", "avgPrice"),
                    Document.parse("{ $first: \"$items.productName\" }").append("_id", "productName"),
                    Document.parse("{ $first: \"$items.category\" }").append("_id", "category")
                )
            ),
            
            // 关联产品信息
            lookup("products", "_id", "_id", "productDetails"),
            
            // 添加计算字段
            addFields(new Document("revenuePerOrder", 
                new Document("$divide", Arrays.asList("$totalRevenue", "$orderCount"))
            )),
            
            // 排序：按总收入降序
            sort(descending("totalRevenue")),
            
            // 限制前20个产品
            limit(20),
            
            // 投影
            project(Document.parse(
                "{ productId: \"$_id\", productName: 1, category: 1, " +
                "totalQuantitySold: 1, totalRevenue: 1, orderCount: 1, " +
                "avgPrice: 1, revenuePerOrder: 1, _id: 0 }"
            ))
        );
        
        AggregateIterable<Document> results = ordersCollection.aggregate(pipeline);
        for (Document doc : results) {
            logger.info("产品销售分析: {}", doc.toJson());
        }
    }
    
    /**
     * 示例6: 时间序列分析 - 按月统计订单趋势
     */
    public void monthlyOrderTrends() {
        logger.info("=== 示例6: 月度订单趋势分析 ===");
        
        List<Document> pipeline = Arrays.asList(
            // 添加日期字段
            addFields(new Document()
                .append("year", new Document("$year", "$orderDate"))
                .append("month", new Document("$month", "$orderDate"))
                .append("yearMonth", new Document("$dateToString", 
                    new Document("format", "%Y-%m").append("date", "$orderDate")))
            ),
            
            // 按年月分组
            group("$yearMonth",
                Arrays.asList(
                    Document.parse("{ $sum: 1 }").append("_id", "orderCount"),
                    Document.parse("{ $sum: \"$totalAmount\" }").append("_id", "totalRevenue"),
                    Document.parse("{ $avg: \"$totalAmount\" }").append("_id", "avgOrderValue"),
                    Document.parse("{ $addToSet: \"$customerId\" }").append("_id", "uniqueCustomers")
                )
            ),
            
            // 添加唯一客户数量
            addFields(new Document("uniqueCustomerCount", 
                new Document("$size", "$uniqueCustomers")
            )),
            
            // 排序：按年月升序
            sort(ascending("_id")),
            
            // 投影
            project(Document.parse(
                "{ yearMonth: \"$_id\", orderCount: 1, totalRevenue: 1, " +
                "avgOrderValue: 1, uniqueCustomerCount: 1, _id: 0 }"
            ))
        );
        
        AggregateIterable<Document> results = ordersCollection.aggregate(pipeline);
        for (Document doc : results) {
            logger.info("月度趋势: {}", doc.toJson());
        }
    }
    
    /**
     * 示例7: 文本搜索和聚合
     */
    public void textSearchAggregation() {
        logger.info("=== 示例7: 文本搜索聚合 ===");
        
        List<Document> pipeline = Arrays.asList(
            // 文本搜索（需要先创建文本索引）
            match(text("Java")),
            
            // 添加搜索得分
            addFields(new Document("searchScore", new Document("$meta", "textScore"))),
            
            // 按城市分组
            group("$city",
                Arrays.asList(
                    Document.parse("{ $sum: 1 }").append("_id", "count"),
                    Document.parse("{ $avg: \"$searchScore\" }").append("_id", "avgScore"),
                    Document.parse("{ $push: \"$name\" }").append("_id", "users")
                )
            ),
            
            // 排序：按平均得分降序
            sort(descending("avgScore")),
            
            // 投影
            project(Document.parse(
                "{ city: \"$_id\", userCount: \"$count\", avgSearchScore: \"$avgScore\", " +
                "users: 1, _id: 0 }"
            ))
        );
        
        try {
            AggregateIterable<Document> results = usersCollection.aggregate(pipeline);
            for (Document doc : results) {
                logger.info("文本搜索结果: {}", doc.toJson());
            }
        } catch (Exception e) {
            logger.warn("文本搜索需要先创建文本索引: {}", e.getMessage());
        }
    }
    
    /**
     * 示例8: 地理位置聚合（如果有地理数据）
     */
    public void geoSpatialAggregation() {
        logger.info("=== 示例8: 地理位置聚合 ===");
        
        // 这个示例需要地理位置数据和地理索引
        List<Document> pipeline = Arrays.asList(
            // 按国家分组
            group("$country",
                Arrays.asList(
                    Document.parse("{ $sum: 1 }").append("_id", "userCount"),
                    Document.parse("{ $avg: \"$salary\" }").append("_id", "avgSalary"),
                    Document.parse("{ $push: \"$city\" }").append("_id", "cities")
                )
            ),
            
            // 添加唯一城市数量
            addFields(new Document("uniqueCityCount", 
                new Document("$size", new Document("$setUnion", Arrays.asList("$cities", Arrays.asList())))
            )),
            
            // 排序：按用户数量降序
            sort(descending("userCount")),
            
            // 投影
            project(Document.parse(
                "{ country: \"$_id\", userCount: 1, avgSalary: 1, " +
                "uniqueCityCount: 1, cities: 1, _id: 0 }"
            ))
        );
        
        AggregateIterable<Document> results = usersCollection.aggregate(pipeline);
        for (Document doc : results) {
            logger.info("地理位置统计: {}", doc.toJson());
        }
    }
    
    /**
     * 示例9: 条件聚合 - 使用$cond进行条件统计
     */
    public void conditionalAggregation() {
        logger.info("=== 示例9: 条件聚合统计 ===");
        
        List<Document> pipeline = Arrays.asList(
            group(null, // 不按字段分组，统计全部
                Arrays.asList(
                    // 总用户数
                    Document.parse("{ $sum: 1 }").append("_id", "totalUsers"),
                    
                    // 高薪用户数（薪资>80000）
                    Document.parse("{ $sum: { $cond: [{ $gt: [\"$salary\", 80000] }, 1, 0] } }")
                        .append("_id", "highSalaryUsers"),
                    
                    // 年轻用户数（年龄<30）
                    Document.parse("{ $sum: { $cond: [{ $lt: [\"$age\", 30] }, 1, 0] } }")
                        .append("_id", "youngUsers"),
                    
                    // 技能丰富用户数（技能>3个）
                    Document.parse("{ $sum: { $cond: [{ $gt: [{ $size: { $ifNull: [\"$skills\", []] } }, 3] }, 1, 0] } }")
                        .append("_id", "skilledUsers"),
                    
                    // 平均薪资
                    Document.parse("{ $avg: \"$salary\" }").append("_id", "avgSalary")
                )
            ),
            
            // 添加百分比计算
            addFields(new Document()
                .append("highSalaryPercentage", 
                    new Document("$multiply", Arrays.asList(
                        new Document("$divide", Arrays.asList("$highSalaryUsers", "$totalUsers")), 100)))
                .append("youngUserPercentage",
                    new Document("$multiply", Arrays.asList(
                        new Document("$divide", Arrays.asList("$youngUsers", "$totalUsers")), 100)))
                .append("skilledUserPercentage",
                    new Document("$multiply", Arrays.asList(
                        new Document("$divide", Arrays.asList("$skilledUsers", "$totalUsers")), 100)))
            ),
            
            // 投影
            project(Document.parse(
                "{ totalUsers: 1, highSalaryUsers: 1, youngUsers: 1, skilledUsers: 1, " +
                "avgSalary: 1, highSalaryPercentage: 1, youngUserPercentage: 1, " +
                "skilledUserPercentage: 1, _id: 0 }"
            ))
        );
        
        AggregateIterable<Document> results = usersCollection.aggregate(pipeline);
        for (Document doc : results) {
            logger.info("条件统计结果: {}", doc.toJson());
        }
    }
    
    /**
     * 运行所有聚合示例
     */
    public void runAllExamples() {
        logger.info("开始运行MongoDB聚合示例...");
        
        try {
            groupByDepartment();
            Thread.sleep(1000);
            
            groupByAgeRange();
            Thread.sleep(1000);
            
            analyzeSkills();
            Thread.sleep(1000);
            
            orderUserLookup();
            Thread.sleep(1000);
            
            productSalesAnalysis();
            Thread.sleep(1000);
            
            monthlyOrderTrends();
            Thread.sleep(1000);
            
            textSearchAggregation();
            Thread.sleep(1000);
            
            geoSpatialAggregation();
            Thread.sleep(1000);
            
            conditionalAggregation();
            
            logger.info("所有聚合示例运行完成！");
            
        } catch (InterruptedException e) {
            logger.error("示例运行被中断", e);
            Thread.currentThread().interrupt();
        } catch (Exception e) {
            logger.error("运行聚合示例时出错", e);
        }
    }
}