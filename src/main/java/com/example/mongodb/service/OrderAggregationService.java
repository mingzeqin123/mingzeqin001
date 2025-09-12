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

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Arrays;
import java.util.List;

/**
 * 订单聚合功能服务类
 */
public class OrderAggregationService {
    
    private static final Logger logger = LoggerFactory.getLogger(OrderAggregationService.class);
    private final MongoCollection<Document> orderCollection;
    
    public OrderAggregationService() {
        MongoDatabase database = MongoConfig.getDatabase();
        this.orderCollection = database.getCollection("orders");
    }
    
    /**
     * 按状态分组统计订单数量和总金额
     */
    public void getOrderStatisticsByStatus() {
        logger.info("=== 按订单状态统计 ===");
        
        List<Bson> pipeline = Arrays.asList(
            Aggregates.group("$status", 
                Accumulators.sum("count", 1),
                Accumulators.sum("totalAmount", "$totalAmount"),
                Accumulators.avg("avgAmount", "$totalAmount")
            ),
            Aggregates.sort(Sorts.descending("count"))
        );
        
        orderCollection.aggregate(pipeline).forEach(doc -> {
            logger.info("状态: {}, 订单数量: {}, 总金额: {:.2f}, 平均金额: {:.2f}", 
                doc.getString("_id"), 
                doc.getInteger("count"),
                doc.getDouble("totalAmount"),
                doc.getDouble("avgAmount"));
        });
    }
    
    /**
     * 按支付方式统计订单
     */
    public void getOrderStatisticsByPaymentMethod() {
        logger.info("=== 按支付方式统计订单 ===");
        
        List<Bson> pipeline = Arrays.asList(
            Aggregates.group("$paymentMethod", 
                Accumulators.sum("count", 1),
                Accumulators.sum("totalAmount", "$totalAmount")
            ),
            Aggregates.sort(Sorts.descending("totalAmount"))
        );
        
        orderCollection.aggregate(pipeline).forEach(doc -> {
            logger.info("支付方式: {}, 订单数量: {}, 总金额: {:.2f}", 
                doc.getString("_id"), 
                doc.getInteger("count"),
                doc.getDouble("totalAmount"));
        });
    }
    
    /**
     * 查找订单金额最高的前10个订单
     */
    public void getTopOrdersByAmount() {
        logger.info("=== 金额最高的前10个订单 ===");
        
        List<Bson> pipeline = Arrays.asList(
            Aggregates.sort(Sorts.descending("totalAmount")),
            Aggregates.limit(10),
            Aggregates.project(new Document("orderNumber", 1)
                .append("totalAmount", 1)
                .append("status", 1)
                .append("orderDate", 1)
                .append("paymentMethod", 1))
        );
        
        orderCollection.aggregate(pipeline).forEach(doc -> {
            logger.info("订单号: {}, 金额: {:.2f}, 状态: {}, 支付方式: {}, 日期: {}", 
                doc.getString("orderNumber"),
                doc.getDouble("totalAmount"),
                doc.getString("status"),
                doc.getString("paymentMethod"),
                doc.getDate("orderDate"));
        });
    }
    
    /**
     * 按月统计订单数量和金额
     */
    public void getMonthlyOrderStatistics() {
        logger.info("=== 按月统计订单 ===");
        
        List<Bson> pipeline = Arrays.asList(
            Aggregates.addFields(new Document("yearMonth", 
                new Document("$dateToString", 
                    new Document("format", "%Y-%m").append("date", "$orderDate")))),
            Aggregates.group("$yearMonth", 
                Accumulators.sum("count", 1),
                Accumulators.sum("totalAmount", "$totalAmount"),
                Accumulators.avg("avgAmount", "$totalAmount")
            ),
            Aggregates.sort(Sorts.ascending("_id"))
        );
        
        orderCollection.aggregate(pipeline).forEach(doc -> {
            logger.info("月份: {}, 订单数量: {}, 总金额: {:.2f}, 平均金额: {:.2f}", 
                doc.getString("_id"), 
                doc.getInteger("count"),
                doc.getDouble("totalAmount"),
                doc.getDouble("avgAmount"));
        });
    }
    
    /**
     * 统计每个用户的订单数量和总消费
     */
    public void getUserOrderStatistics() {
        logger.info("=== 用户订单统计 ===");
        
        List<Bson> pipeline = Arrays.asList(
            Aggregates.group("$userId", 
                Accumulators.sum("orderCount", 1),
                Accumulators.sum("totalSpent", "$totalAmount"),
                Accumulators.avg("avgOrderAmount", "$totalAmount")
            ),
            Aggregates.sort(Sorts.descending("totalSpent")),
            Aggregates.limit(10)
        );
        
        orderCollection.aggregate(pipeline).forEach(doc -> {
            logger.info("用户ID: {}, 订单数量: {}, 总消费: {:.2f}, 平均订单金额: {:.2f}", 
                doc.get("_id"), 
                doc.getInteger("orderCount"),
                doc.getDouble("totalSpent"),
                doc.getDouble("avgOrderAmount"));
        });
    }
    
    /**
     * 查找包含特定商品的订单
     */
    public void getOrdersByProduct(String productName) {
        logger.info("=== 包含商品 '{}' 的订单 ===", productName);
        
        List<Bson> pipeline = Arrays.asList(
            Aggregates.match(Filters.eq("items.productName", productName)),
            Aggregates.project(new Document("orderNumber", 1)
                .append("totalAmount", 1)
                .append("status", 1)
                .append("orderDate", 1)
                .append("items", new Document("$filter", 
                    new Document("input", "$items")
                        .append("cond", new Document("$eq", Arrays.asList("$$item.productName", productName)))))
        );
        
        orderCollection.aggregate(pipeline).forEach(doc -> {
            logger.info("订单号: {}, 金额: {:.2f}, 状态: {}, 商品信息: {}", 
                doc.getString("orderNumber"),
                doc.getDouble("totalAmount"),
                doc.getString("status"),
                doc.getList("items", Document.class));
        });
    }
    
    /**
     * 统计订单状态转换情况
     */
    public void getOrderStatusTransition() {
        logger.info("=== 订单状态分布 ===");
        
        List<Bson> pipeline = Arrays.asList(
            Aggregates.group("$status", 
                Accumulators.sum("count", 1),
                Accumulators.avg("avgAmount", "$totalAmount")
            ),
            Aggregates.addFields(new Document("percentage", 
                new Document("$multiply", 
                    Arrays.asList(new Document("$divide", Arrays.asList("$count", 
                        new Document("$sum", "$count"))), 100)))),
            Aggregates.sort(Sorts.descending("count"))
        );
        
        orderCollection.aggregate(pipeline).forEach(doc -> {
            logger.info("状态: {}, 数量: {}, 占比: {:.2f}%, 平均金额: {:.2f}", 
                doc.getString("_id"), 
                doc.getInteger("count"),
                doc.getDouble("percentage"),
                doc.getDouble("avgAmount"));
        });
    }
}