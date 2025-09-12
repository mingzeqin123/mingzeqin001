package com.example.mongodb.service;

import com.example.mongodb.config.MongoConfig;
import com.example.mongodb.model.Order;
import com.example.mongodb.model.User;
import com.mongodb.client.MongoCollection;
import com.mongodb.client.MongoDatabase;
import org.bson.Document;
import org.bson.types.ObjectId;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Random;

/**
 * 数据初始化服务类
 */
public class DataInitializationService {
    
    private static final Logger logger = LoggerFactory.getLogger(DataInitializationService.class);
    private final MongoCollection<Document> userCollection;
    private final MongoCollection<Document> orderCollection;
    private final Random random = new Random();
    
    public DataInitializationService() {
        MongoDatabase database = MongoConfig.getDatabase();
        this.userCollection = database.getCollection("users");
        this.orderCollection = database.getCollection("orders");
    }
    
    /**
     * 初始化示例数据
     */
    public void initializeData() {
        logger.info("开始初始化示例数据...");
        
        // 清空现有数据
        userCollection.drop();
        orderCollection.drop();
        logger.info("已清空现有数据");
        
        // 创建用户数据
        createSampleUsers();
        
        // 创建订单数据
        createSampleOrders();
        
        logger.info("数据初始化完成！");
    }
    
    /**
     * 创建示例用户数据
     */
    private void createSampleUsers() {
        logger.info("创建示例用户数据...");
        
        String[] cities = {"北京", "上海", "广州", "深圳", "杭州", "成都", "武汉", "西安", "南京", "重庆"};
        String[] countries = {"中国", "美国", "日本", "韩国", "英国", "德国", "法国", "澳大利亚", "加拿大", "新加坡"};
        String[] interests = {"音乐", "电影", "运动", "读书", "旅游", "美食", "摄影", "游戏", "编程", "绘画", "舞蹈", "健身"};
        
        for (int i = 1; i <= 100; i++) {
            Document userDoc = new Document()
                .append("name", "用户" + i)
                .append("email", "user" + i + "@example.com")
                .append("age", 18 + random.nextInt(50))
                .append("city", cities[random.nextInt(cities.length)])
                .append("country", countries[random.nextInt(countries.length)])
                .append("registrationDate", LocalDateTime.now().minusDays(random.nextInt(365)))
                .append("interests", Arrays.asList(
                    interests[random.nextInt(interests.length)],
                    interests[random.nextInt(interests.length)],
                    interests[random.nextInt(interests.length)]
                ))
                .append("balance", 1000 + random.nextDouble() * 10000);
            
            userCollection.insertOne(userDoc);
        }
        
        logger.info("已创建100个示例用户");
    }
    
    /**
     * 创建示例订单数据
     */
    private void createSampleOrders() {
        logger.info("创建示例订单数据...");
        
        String[] statuses = {"待付款", "已付款", "已发货", "已完成", "已取消"};
        String[] paymentMethods = {"支付宝", "微信支付", "银行卡", "信用卡", "PayPal"};
        String[] products = {"iPhone 15", "MacBook Pro", "iPad Air", "AirPods", "Apple Watch", 
                           "Samsung Galaxy", "华为手机", "小米手机", "联想笔记本", "戴尔显示器"};
        
        // 获取所有用户ID
        List<Document> users = userCollection.find().into(Arrays.asList());
        
        for (int i = 1; i <= 500; i++) {
            Document randomUser = users.get(random.nextInt(users.size()));
            ObjectId userId = randomUser.getObjectId("_id");
            
            // 创建订单项
            int itemCount = 1 + random.nextInt(3); // 1-3个商品
            List<Document> items = Arrays.asList();
            
            for (int j = 0; j < itemCount; j++) {
                String product = products[random.nextInt(products.length)];
                int quantity = 1 + random.nextInt(3);
                double price = 100 + random.nextDouble() * 2000;
                
                Document item = new Document()
                    .append("productId", "P" + (1000 + random.nextInt(9000)))
                    .append("productName", product)
                    .append("quantity", quantity)
                    .append("price", price);
                
                items.add(item);
            }
            
            // 计算总金额
            double totalAmount = items.stream()
                .mapToDouble(item -> item.getInteger("quantity") * item.getDouble("price"))
                .sum();
            
            Document orderDoc = new Document()
                .append("userId", userId)
                .append("orderNumber", "ORD" + String.format("%06d", i))
                .append("totalAmount", totalAmount)
                .append("status", statuses[random.nextInt(statuses.length)])
                .append("orderDate", LocalDateTime.now().minusDays(random.nextInt(90)))
                .append("items", items)
                .append("shippingAddress", "地址" + i)
                .append("paymentMethod", paymentMethods[random.nextInt(paymentMethods.length)]);
            
            orderCollection.insertOne(orderDoc);
        }
        
        logger.info("已创建500个示例订单");
    }
    
    /**
     * 显示数据统计信息
     */
    public void showDataStatistics() {
        logger.info("=== 数据统计信息 ===");
        logger.info("用户总数: {}", userCollection.countDocuments());
        logger.info("订单总数: {}", orderCollection.countDocuments());
        
        // 显示用户分布
        logger.info("用户城市分布:");
        userCollection.aggregate(Arrays.asList(
            com.mongodb.client.model.Aggregates.group("$city", 
                com.mongodb.client.model.Accumulators.sum("count", 1)),
            com.mongodb.client.model.Aggregates.sort(com.mongodb.client.model.Sorts.descending("count"))
        )).forEach(doc -> {
            logger.info("  {}: {} 人", doc.getString("_id"), doc.getInteger("count"));
        });
        
        // 显示订单状态分布
        logger.info("订单状态分布:");
        orderCollection.aggregate(Arrays.asList(
            com.mongodb.client.model.Aggregates.group("$status", 
                com.mongodb.client.model.Accumulators.sum("count", 1)),
            com.mongodb.client.model.Aggregates.sort(com.mongodb.client.model.Sorts.descending("count"))
        )).forEach(doc -> {
            logger.info("  {}: {} 个", doc.getString("_id"), doc.getInteger("count"));
        });
    }
}