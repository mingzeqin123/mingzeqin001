package com.example.mongodb.config;

import com.mongodb.client.MongoClient;
import com.mongodb.client.MongoClients;
import com.mongodb.client.MongoDatabase;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * MongoDB连接配置类
 */
public class MongoConfig {
    
    private static final Logger logger = LoggerFactory.getLogger(MongoConfig.class);
    
    private static final String CONNECTION_STRING = "mongodb://localhost:27017";
    private static final String DATABASE_NAME = "aggregation_demo";
    
    private static MongoClient mongoClient;
    private static MongoDatabase database;
    
    /**
     * 获取MongoDB客户端连接
     */
    public static MongoClient getMongoClient() {
        if (mongoClient == null) {
            try {
                mongoClient = MongoClients.create(CONNECTION_STRING);
                logger.info("MongoDB客户端连接成功: {}", CONNECTION_STRING);
            } catch (Exception e) {
                logger.error("MongoDB客户端连接失败", e);
                throw new RuntimeException("无法连接到MongoDB", e);
            }
        }
        return mongoClient;
    }
    
    /**
     * 获取数据库实例
     */
    public static MongoDatabase getDatabase() {
        if (database == null) {
            database = getMongoClient().getDatabase(DATABASE_NAME);
            logger.info("获取数据库实例: {}", DATABASE_NAME);
        }
        return database;
    }
    
    /**
     * 关闭连接
     */
    public static void closeConnection() {
        if (mongoClient != null) {
            mongoClient.close();
            logger.info("MongoDB连接已关闭");
        }
    }
}