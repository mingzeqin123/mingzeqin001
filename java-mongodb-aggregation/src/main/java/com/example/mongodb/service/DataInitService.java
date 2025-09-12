package com.example.mongodb.service;

import com.example.mongodb.model.Order;
import com.example.mongodb.model.Product;
import com.example.mongodb.model.User;
import com.example.mongodb.util.MongoDBUtil;
import com.mongodb.client.MongoCollection;
import com.mongodb.client.MongoDatabase;
import org.bson.Document;
import org.bson.types.ObjectId;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.Arrays;
import java.util.Date;
import java.util.List;
import java.util.Random;

/**
 * 数据初始化服务类
 * 用于创建示例数据
 */
public class DataInitService {
    
    private static final Logger logger = LoggerFactory.getLogger(DataInitService.class);
    
    private final MongoDatabase database;
    private final MongoCollection<Document> usersCollection;
    private final MongoCollection<Document> ordersCollection;
    private final MongoCollection<Document> productsCollection;
    private final Random random = new Random();
    
    public DataInitService() {
        this.database = MongoDBUtil.getDatabase();
        this.usersCollection = database.getCollection("users");
        this.ordersCollection = database.getCollection("orders");
        this.productsCollection = database.getCollection("products");
    }
    
    /**
     * 初始化所有示例数据
     */
    public void initializeAllData() {
        logger.info("开始初始化示例数据...");
        
        // 清空现有数据
        clearAllData();
        
        // 创建示例数据
        createUsers();
        createProducts();
        createOrders();
        
        // 创建索引
        createIndexes();
        
        logger.info("示例数据初始化完成！");
    }
    
    /**
     * 清空所有数据
     */
    private void clearAllData() {
        logger.info("清空现有数据...");
        usersCollection.deleteMany(new Document());
        ordersCollection.deleteMany(new Document());
        productsCollection.deleteMany(new Document());
    }
    
    /**
     * 创建用户数据
     */
    private void createUsers() {
        logger.info("创建用户数据...");
        
        String[] names = {"张三", "李四", "王五", "赵六", "钱七", "孙八", "周九", "吴十",
                         "郑一", "王二", "李三", "张四", "陈五", "杨六", "黄七", "刘八",
                         "John Smith", "Jane Doe", "Mike Johnson", "Sarah Wilson"};
        
        String[] departments = {"IT", "Sales", "Marketing", "HR", "Finance", "Operations"};
        String[] cities = {"北京", "上海", "广州", "深圳", "杭州", "成都", "武汉", "西安", 
                          "New York", "London", "Tokyo", "Sydney"};
        String[] countries = {"中国", "美国", "英国", "日本", "澳大利亚"};
        String[][] skillsPool = {
            {"Java", "Spring", "MySQL", "Redis"},
            {"Python", "Django", "PostgreSQL", "Docker"},
            {"JavaScript", "React", "Node.js", "MongoDB"},
            {"C++", "Linux", "Git", "AWS"},
            {"Sales", "Marketing", "Communication", "Excel"},
            {"Photoshop", "Illustrator", "UI/UX", "Figma"},
            {"Project Management", "Agile", "Scrum", "Leadership"}
        };
        
        for (int i = 0; i < 100; i++) {
            Document user = new Document()
                .append("name", names[random.nextInt(names.length)] + (i > 19 ? i : ""))
                .append("email", "user" + i + "@example.com")
                .append("age", 22 + random.nextInt(40))
                .append("city", cities[random.nextInt(cities.length)])
                .append("country", countries[random.nextInt(countries.length)])
                .append("salary", 30000 + random.nextInt(120000))
                .append("department", departments[random.nextInt(departments.length)])
                .append("skills", Arrays.asList(skillsPool[random.nextInt(skillsPool.length)]))
                .append("createdAt", new Date())
                .append("updatedAt", new Date());
            
            usersCollection.insertOne(user);
        }
        
        logger.info("已创建 {} 个用户", usersCollection.countDocuments());
    }
    
    /**
     * 创建产品数据
     */
    private void createProducts() {
        logger.info("创建产品数据...");
        
        String[] productNames = {
            "iPhone 15", "Samsung Galaxy S24", "MacBook Pro", "Dell XPS 13",
            "iPad Air", "Surface Pro 9", "AirPods Pro", "Sony WH-1000XM5",
            "Nike Air Max", "Adidas Ultraboost", "Levi's Jeans", "H&M T-Shirt",
            "Coffee Maker", "Blender", "Microwave", "Air Fryer",
            "Gaming Chair", "Standing Desk", "Monitor 27\"", "Mechanical Keyboard"
        };
        
        String[] categories = {"Electronics", "Clothing", "Home & Kitchen", "Sports", "Office"};
        String[] brands = {"Apple", "Samsung", "Dell", "HP", "Nike", "Adidas", "Levi's", "H&M", "Sony", "LG"};
        
        for (int i = 0; i < productNames.length; i++) {
            Document product = new Document()
                .append("name", productNames[i])
                .append("description", "High quality " + productNames[i].toLowerCase())
                .append("category", categories[random.nextInt(categories.length)])
                .append("brand", brands[random.nextInt(brands.length)])
                .append("price", 99.99 + random.nextDouble() * 1900)
                .append("stock", 10 + random.nextInt(500))
                .append("tags", Arrays.asList("popular", "bestseller", "new"))
                .append("rating", 3.0 + random.nextDouble() * 2)
                .append("reviewCount", random.nextInt(1000))
                .append("isActive", true)
                .append("createdAt", new Date())
                .append("updatedAt", new Date());
            
            productsCollection.insertOne(product);
        }
        
        logger.info("已创建 {} 个产品", productsCollection.countDocuments());
    }
    
    /**
     * 创建订单数据
     */
    private void createOrders() {
        logger.info("创建订单数据...");
        
        // 获取所有用户和产品ID
        List<ObjectId> userIds = usersCollection.find()
            .projection(new Document("_id", 1))
            .map(doc -> doc.getObjectId("_id"))
            .into(Arrays.asList());
        
        List<Document> products = productsCollection.find()
            .projection(new Document("_id", 1).append("name", 1).append("price", 1).append("category", 1))
            .into(Arrays.asList());
        
        String[] statuses = {"pending", "processing", "shipped", "delivered", "cancelled"};
        String[] paymentMethods = {"Credit Card", "PayPal", "Bank Transfer", "Cash"};
        String[] addresses = {
            "北京市朝阳区某某街道123号", "上海市浦东新区某某路456号",
            "广州市天河区某某大道789号", "深圳市南山区某某街101号",
            "123 Main St, New York, NY", "456 Oak Ave, Los Angeles, CA"
        };
        
        for (int i = 0; i < 200; i++) {
            ObjectId customerId = userIds.get(random.nextInt(userIds.size()));
            String customerName = "Customer " + i;
            
            // 随机选择1-5个产品
            int itemCount = 1 + random.nextInt(5);
            List<Document> orderItems = Arrays.asList();
            double totalAmount = 0;
            
            for (int j = 0; j < itemCount; j++) {
                Document product = products.get(random.nextInt(products.size()));
                int quantity = 1 + random.nextInt(3);
                double price = product.getDouble("price");
                
                Document item = new Document()
                    .append("productId", product.getObjectId("_id"))
                    .append("productName", product.getString("name"))
                    .append("quantity", quantity)
                    .append("price", price)
                    .append("category", product.getString("category"));
                
                orderItems.add(item);
                totalAmount += price * quantity;
            }
            
            // 创建随机日期（过去6个月内）
            LocalDateTime orderDate = LocalDateTime.now().minusDays(random.nextInt(180));
            Date orderDateAsDate = Date.from(orderDate.toInstant(ZoneOffset.UTC));
            
            Document order = new Document()
                .append("orderNumber", "ORD" + String.format("%06d", i + 1))
                .append("customerId", customerId)
                .append("customerName", customerName)
                .append("items", orderItems)
                .append("totalAmount", Math.round(totalAmount * 100.0) / 100.0)
                .append("status", statuses[random.nextInt(statuses.length)])
                .append("paymentMethod", paymentMethods[random.nextInt(paymentMethods.length)])
                .append("shippingAddress", addresses[random.nextInt(addresses.length)])
                .append("orderDate", orderDateAsDate);
            
            // 如果状态是delivered，添加交付日期
            if ("delivered".equals(order.getString("status"))) {
                LocalDateTime deliveryDate = orderDate.plusDays(1 + random.nextInt(7));
                order.append("deliveryDate", Date.from(deliveryDate.toInstant(ZoneOffset.UTC)));
            }
            
            ordersCollection.insertOne(order);
        }
        
        logger.info("已创建 {} 个订单", ordersCollection.countDocuments());
    }
    
    /**
     * 创建索引
     */
    private void createIndexes() {
        logger.info("创建索引...");
        
        try {
            // 用户集合索引
            usersCollection.createIndex(new Document("department", 1));
            usersCollection.createIndex(new Document("city", 1));
            usersCollection.createIndex(new Document("salary", 1));
            usersCollection.createIndex(new Document("age", 1));
            
            // 尝试创建文本索引
            try {
                usersCollection.createIndex(new Document("name", "text").append("skills", "text"));
                logger.info("文本索引创建成功");
            } catch (Exception e) {
                logger.warn("文本索引创建失败: {}", e.getMessage());
            }
            
            // 产品集合索引
            productsCollection.createIndex(new Document("category", 1));
            productsCollection.createIndex(new Document("brand", 1));
            productsCollection.createIndex(new Document("price", 1));
            productsCollection.createIndex(new Document("rating", 1));
            
            // 订单集合索引
            ordersCollection.createIndex(new Document("customerId", 1));
            ordersCollection.createIndex(new Document("status", 1));
            ordersCollection.createIndex(new Document("orderDate", 1));
            ordersCollection.createIndex(new Document("totalAmount", 1));
            
            logger.info("索引创建完成");
            
        } catch (Exception e) {
            logger.error("创建索引时出错", e);
        }
    }
    
    /**
     * 获取数据统计信息
     */
    public void printDataStatistics() {
        logger.info("=== 数据库统计信息 ===");
        logger.info("用户数量: {}", usersCollection.countDocuments());
        logger.info("产品数量: {}", productsCollection.countDocuments());
        logger.info("订单数量: {}", ordersCollection.countDocuments());
        
        // 统计订单状态分布
        List<Document> statusPipeline = Arrays.asList(
            new Document("$group", new Document("_id", "$status")
                .append("count", new Document("$sum", 1))),
            new Document("$sort", new Document("count", -1))
        );
        
        logger.info("订单状态分布:");
        ordersCollection.aggregate(statusPipeline).forEach(doc -> 
            logger.info("  {}: {}", doc.getString("_id"), doc.getInteger("count")));
    }
}