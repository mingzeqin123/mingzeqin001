package com.example.mongodb.service;

import com.example.mongodb.config.MongoConfig;
import com.example.mongodb.model.User;
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
 * 用户聚合功能服务类
 */
public class UserAggregationService {
    
    private static final Logger logger = LoggerFactory.getLogger(UserAggregationService.class);
    private final MongoCollection<Document> userCollection;
    
    public UserAggregationService() {
        MongoDatabase database = MongoConfig.getDatabase();
        this.userCollection = database.getCollection("users");
    }
    
    /**
     * 按城市分组统计用户数量
     */
    public void groupUsersByCity() {
        logger.info("=== 按城市分组统计用户数量 ===");
        
        List<Bson> pipeline = Arrays.asList(
            Aggregates.group("$city", Accumulators.sum("count", 1)),
            Aggregates.sort(Sorts.descending("count"))
        );
        
        userCollection.aggregate(pipeline).forEach(doc -> {
            logger.info("城市: {}, 用户数量: {}", 
                doc.getString("_id"), doc.getInteger("count"));
        });
    }
    
    /**
     * 按年龄段分组统计
     */
    public void groupUsersByAgeRange() {
        logger.info("=== 按年龄段分组统计用户 ===");
        
        List<Bson> pipeline = Arrays.asList(
            Aggregates.addFields(new Document("ageRange", 
                new Document("$switch", new Document("branches", Arrays.asList(
                    new Document("case", new Document("$lt", Arrays.asList("$age", 25))).append("then", "18-24"),
                    new Document("case", new Document("$lt", Arrays.asList("$age", 35))).append("then", "25-34"),
                    new Document("case", new Document("$lt", Arrays.asList("$age", 45))).append("then", "35-44"),
                    new Document("case", new Document("$lt", Arrays.asList("$age", 55))).append("then", "45-54")
                )).append("default", "55+"))),
            Aggregates.group("$ageRange", Accumulators.sum("count", 1)),
            Aggregates.sort(Sorts.ascending("_id"))
        );
        
        userCollection.aggregate(pipeline).forEach(doc -> {
            logger.info("年龄段: {}, 用户数量: {}", 
                doc.getString("_id"), doc.getInteger("count"));
        });
    }
    
    /**
     * 统计每个国家的平均年龄和最大余额
     */
    public void getCountryStatistics() {
        logger.info("=== 各国用户统计信息 ===");
        
        List<Bson> pipeline = Arrays.asList(
            Aggregates.group("$country", 
                Accumulators.avg("avgAge", "$age"),
                Accumulators.max("maxBalance", "$balance"),
                Accumulators.sum("totalUsers", 1)
            ),
            Aggregates.sort(Sorts.descending("totalUsers"))
        );
        
        userCollection.aggregate(pipeline).forEach(doc -> {
            logger.info("国家: {}, 平均年龄: {:.2f}, 最大余额: {:.2f}, 用户总数: {}", 
                doc.getString("_id"), 
                doc.getDouble("avgAge"), 
                doc.getDouble("maxBalance"),
                doc.getInteger("totalUsers"));
        });
    }
    
    /**
     * 查找兴趣爱好的分布情况
     */
    public void getInterestsDistribution() {
        logger.info("=== 兴趣爱好分布统计 ===");
        
        List<Bson> pipeline = Arrays.asList(
            Aggregates.unwind("$interests"),
            Aggregates.group("$interests", Accumulators.sum("count", 1)),
            Aggregates.sort(Sorts.descending("count"))
        );
        
        userCollection.aggregate(pipeline).forEach(doc -> {
            logger.info("兴趣: {}, 用户数量: {}", 
                doc.getString("_id"), doc.getInteger("count"));
        });
    }
    
    /**
     * 查找余额最高的前10名用户
     */
    public void getTopUsersByBalance() {
        logger.info("=== 余额最高的前10名用户 ===");
        
        List<Bson> pipeline = Arrays.asList(
            Aggregates.sort(Sorts.descending("balance")),
            Aggregates.limit(10),
            Aggregates.project(new Document("name", 1)
                .append("email", 1)
                .append("balance", 1)
                .append("city", 1)
                .append("country", 1))
        );
        
        userCollection.aggregate(pipeline).forEach(doc -> {
            logger.info("姓名: {}, 邮箱: {}, 余额: {:.2f}, 城市: {}, 国家: {}", 
                doc.getString("name"),
                doc.getString("email"),
                doc.getDouble("balance"),
                doc.getString("city"),
                doc.getString("country"));
        });
    }
    
    /**
     * 按城市统计平均余额
     */
    public void getAverageBalanceByCity() {
        logger.info("=== 各城市平均余额统计 ===");
        
        List<Bson> pipeline = Arrays.asList(
            Aggregates.group("$city", 
                Accumulators.avg("avgBalance", "$balance"),
                Accumulators.sum("userCount", 1)
            ),
            Aggregates.match(Filters.gte("userCount", 2)), // 只显示用户数>=2的城市
            Aggregates.sort(Sorts.descending("avgBalance"))
        );
        
        userCollection.aggregate(pipeline).forEach(doc -> {
            logger.info("城市: {}, 平均余额: {:.2f}, 用户数量: {}", 
                doc.getString("_id"), 
                doc.getDouble("avgBalance"),
                doc.getInteger("userCount"));
        });
    }
}