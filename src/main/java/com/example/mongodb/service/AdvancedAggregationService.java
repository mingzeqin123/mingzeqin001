package com.example.mongodb.service;

import com.example.mongodb.config.MongoConfig;
import com.mongodb.client.MongoCollection;
import com.mongodb.client.MongoDatabase;
import com.mongodb.client.model.Accumulators;
import com.mongodb.client.model.Aggregates;
import com.mongodb.client.model.Filters;
import com.mongodb.client.model.Sorts;
import org.bson.Document;
import org.bson.conversions.Bson;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.Arrays;
import java.util.List;

/**
 * 高级聚合功能服务类 - 包含多表关联和复杂管道操作
 */
public class AdvancedAggregationService {
    
    private static final Logger logger = LoggerFactory.getLogger(AdvancedAggregationService.class);
    private final MongoCollection<Document> userCollection;
    private final MongoCollection<Document> orderCollection;
    
    public AdvancedAggregationService() {
        MongoDatabase database = MongoConfig.getDatabase();
        this.userCollection = database.getCollection("users");
        this.orderCollection = database.getCollection("orders");
    }
    
    /**
     * 用户订单关联查询 - 查找每个用户的订单统计信息
     */
    public void getUserOrderJoinStatistics() {
        logger.info("=== 用户订单关联统计 ===");
        
        List<Bson> pipeline = Arrays.asList(
            // 从订单集合开始
            Aggregates.lookup("users", "userId", "_id", "userInfo"),
            // 展开用户信息
            Aggregates.unwind("$userInfo"),
            // 按用户分组统计
            Aggregates.group("$userInfo.name", 
                Accumulators.sum("orderCount", 1),
                Accumulators.sum("totalSpent", "$totalAmount"),
                Accumulators.avg("avgOrderAmount", "$totalAmount"),
                Accumulators.first("userCity", "$userInfo.city"),
                Accumulators.first("userCountry", "$userInfo.country")
            ),
            // 按总消费排序
            Aggregates.sort(Sorts.descending("totalSpent")),
            // 限制前10条
            Aggregates.limit(10)
        );
        
        orderCollection.aggregate(pipeline).forEach(doc -> {
            logger.info("用户: {}, 城市: {}, 国家: {}, 订单数: {}, 总消费: {:.2f}, 平均订单金额: {:.2f}", 
                doc.getString("_id"),
                doc.getString("userCity"),
                doc.getString("userCountry"),
                doc.getInteger("orderCount"),
                doc.getDouble("totalSpent"),
                doc.getDouble("avgOrderAmount"));
        });
    }
    
    /**
     * 按城市统计用户订单情况
     */
    public void getCityOrderStatistics() {
        logger.info("=== 各城市订单统计 ===");
        
        List<Bson> pipeline = Arrays.asList(
            // 从订单集合开始
            Aggregates.lookup("users", "userId", "_id", "userInfo"),
            Aggregates.unwind("$userInfo"),
            // 按城市分组
            Aggregates.group("$userInfo.city", 
                Accumulators.sum("totalOrders", 1),
                Accumulators.sum("totalAmount", "$totalAmount"),
                Accumulators.avg("avgOrderAmount", "$totalAmount"),
                Accumulators.addToSet("uniqueUsers", "$userId")
            ),
            // 计算唯一用户数
            Aggregates.addFields(new Document("uniqueUserCount", 
                new Document("$size", "$uniqueUsers"))),
            // 按总订单数排序
            Aggregates.sort(Sorts.descending("totalOrders"))
        );
        
        orderCollection.aggregate(pipeline).forEach(doc -> {
            logger.info("城市: {}, 总订单数: {}, 总金额: {:.2f}, 平均订单金额: {:.2f}, 活跃用户数: {}", 
                doc.getString("_id"),
                doc.getInteger("totalOrders"),
                doc.getDouble("totalAmount"),
                doc.getDouble("avgOrderAmount"),
                doc.getInteger("uniqueUserCount"));
        });
    }
    
    /**
     * 查找高价值客户 - 消费金额超过阈值的用户
     */
    public void getHighValueCustomers(double threshold) {
        logger.info("=== 高价值客户 (消费金额 > {}) ===", threshold);
        
        List<Bson> pipeline = Arrays.asList(
            // 从订单集合开始
            Aggregates.lookup("users", "userId", "_id", "userInfo"),
            Aggregates.unwind("$userInfo"),
            // 按用户分组计算总消费
            Aggregates.group("$userId", 
                Accumulators.sum("totalSpent", "$totalAmount"),
                Accumulators.sum("orderCount", 1),
                Accumulators.first("userName", "$userInfo.name"),
                Accumulators.first("userEmail", "$userInfo.email"),
                Accumulators.first("userCity", "$userInfo.city"),
                Accumulators.first("userBalance", "$userInfo.balance")
            ),
            // 过滤高价值客户
            Aggregates.match(Filters.gt("totalSpent", threshold)),
            // 按总消费排序
            Aggregates.sort(Sorts.descending("totalSpent"))
        );
        
        orderCollection.aggregate(pipeline).forEach(doc -> {
            logger.info("用户: {} ({}), 邮箱: {}, 城市: {}, 总消费: {:.2f}, 订单数: {}, 账户余额: {:.2f}", 
                doc.getString("userName"),
                doc.get("_id"),
                doc.getString("userEmail"),
                doc.getString("userCity"),
                doc.getDouble("totalSpent"),
                doc.getInteger("orderCount"),
                doc.getDouble("userBalance"));
        });
    }
    
    /**
     * 订单商品分析 - 统计最受欢迎的商品
     */
    public void getPopularProducts() {
        logger.info("=== 最受欢迎的商品 ===");
        
        List<Bson> pipeline = Arrays.asList(
            // 展开订单项
            Aggregates.unwind("$items"),
            // 按商品分组统计
            Aggregates.group("$items.productName", 
                Accumulators.sum("totalQuantity", "$items.quantity"),
                Accumulators.sum("totalRevenue", 
                    new Document("$multiply", Arrays.asList("$items.quantity", "$items.price"))),
                Accumulators.sum("orderCount", 1),
                Accumulators.avg("avgPrice", "$items.price")
            ),
            // 按总销量排序
            Aggregates.sort(Sorts.descending("totalQuantity")),
            // 限制前10个
            Aggregates.limit(10)
        );
        
        orderCollection.aggregate(pipeline).forEach(doc -> {
            logger.info("商品: {}, 总销量: {}, 总收入: {:.2f}, 出现订单数: {}, 平均价格: {:.2f}", 
                doc.getString("_id"),
                doc.getInteger("totalQuantity"),
                doc.getDouble("totalRevenue"),
                doc.getInteger("orderCount"),
                doc.getDouble("avgPrice"));
        });
    }
    
    /**
     * 用户行为分析 - 按年龄段分析订单行为
     */
    public void getUserBehaviorByAgeGroup() {
        logger.info("=== 按年龄段分析用户订单行为 ===");
        
        List<Bson> pipeline = Arrays.asList(
            // 从订单开始
            Aggregates.lookup("users", "userId", "_id", "userInfo"),
            Aggregates.unwind("$userInfo"),
            // 添加年龄段字段
            Aggregates.addFields(new Document("ageGroup", 
                new Document("$switch", new Document("branches", Arrays.asList(
                    new Document("case", new Document("$lt", Arrays.asList("$userInfo.age", 25))).append("then", "18-24"),
                    new Document("case", new Document("$lt", Arrays.asList("$userInfo.age", 35))).append("then", "25-34"),
                    new Document("case", new Document("$lt", Arrays.asList("$userInfo.age", 45))).append("then", "35-44"),
                    new Document("case", new Document("$lt", Arrays.asList("$userInfo.age", 55))).append("then", "45-54")
                )).append("default", "55+"))),
            // 按年龄段分组
            Aggregates.group("$ageGroup", 
                Accumulators.sum("totalOrders", 1),
                Accumulators.sum("totalAmount", "$totalAmount"),
                Accumulators.avg("avgOrderAmount", "$totalAmount"),
                Accumulators.addToSet("uniqueUsers", "$userId")
            ),
            // 计算唯一用户数
            Aggregates.addFields(new Document("uniqueUserCount", 
                new Document("$size", "$uniqueUsers"))),
            // 按年龄段排序
            Aggregates.sort(Sorts.ascending("_id"))
        );
        
        orderCollection.aggregate(pipeline).forEach(doc -> {
            logger.info("年龄段: {}, 总订单数: {}, 总金额: {:.2f}, 平均订单金额: {:.2f}, 活跃用户数: {}", 
                doc.getString("_id"),
                doc.getInteger("totalOrders"),
                doc.getDouble("totalAmount"),
                doc.getDouble("avgOrderAmount"),
                doc.getInteger("uniqueUserCount"));
        });
    }
    
    /**
     * 订单时间分析 - 按小时统计订单分布
     */
    public void getOrderDistributionByHour() {
        logger.info("=== 按小时统计订单分布 ===");
        
        List<Bson> pipeline = Arrays.asList(
            // 添加小时字段
            Aggregates.addFields(new Document("hour", 
                new Document("$hour", "$orderDate"))),
            // 按小时分组
            Aggregates.group("$hour", 
                Accumulators.sum("orderCount", 1),
                Accumulators.sum("totalAmount", "$totalAmount"),
                Accumulators.avg("avgAmount", "$totalAmount")
            ),
            // 按小时排序
            Aggregates.sort(Sorts.ascending("_id"))
        );
        
        orderCollection.aggregate(pipeline).forEach(doc -> {
            logger.info("小时: {}, 订单数: {}, 总金额: {:.2f}, 平均金额: {:.2f}", 
                doc.getInteger("_id"),
                doc.getInteger("orderCount"),
                doc.getDouble("totalAmount"),
                doc.getDouble("avgAmount"));
        });
    }
    
    /**
     * 复杂条件查询 - 查找特定城市的高消费用户订单
     */
    public void getHighValueOrdersByCity(String city) {
        logger.info("=== {} 市高消费订单 ===", city);
        
        List<Bson> pipeline = Arrays.asList(
            // 关联用户信息
            Aggregates.lookup("users", "userId", "_id", "userInfo"),
            Aggregates.unwind("$userInfo"),
            // 过滤特定城市
            Aggregates.match(Filters.eq("userInfo.city", city)),
            // 过滤高金额订单
            Aggregates.match(Filters.gt("totalAmount", 1000)),
            // 按金额排序
            Aggregates.sort(Sorts.descending("totalAmount")),
            // 限制前10条
            Aggregates.limit(10),
            // 投影需要的字段
            Aggregates.project(new Document("orderNumber", 1)
                .append("totalAmount", 1)
                .append("status", 1)
                .append("orderDate", 1)
                .append("userName", "$userInfo.name")
                .append("userEmail", "$userInfo.email")
                .append("paymentMethod", 1))
        );
        
        orderCollection.aggregate(pipeline).forEach(doc -> {
            logger.info("订单号: {}, 金额: {:.2f}, 状态: {}, 用户: {} ({}), 支付方式: {}", 
                doc.getString("orderNumber"),
                doc.getDouble("totalAmount"),
                doc.getString("status"),
                doc.getString("userName"),
                doc.getString("userEmail"),
                doc.getString("paymentMethod"));
        });
    }
}