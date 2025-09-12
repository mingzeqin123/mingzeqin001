package com.example.mongodb.util;

import com.mongodb.MongoClientSettings;
import com.mongodb.MongoCredential;
import com.mongodb.ServerAddress;
import com.mongodb.client.MongoClient;
import com.mongodb.client.MongoClients;
import com.mongodb.client.MongoDatabase;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.Arrays;

/**
 * MongoDB连接工具类
 */
public class MongoDBUtil {
    
    private static final Logger logger = LoggerFactory.getLogger(MongoDBUtil.class);
    
    private static MongoClient mongoClient;
    private static final String DATABASE_NAME = "aggregation_demo";
    
    // 默认连接配置
    private static final String HOST = "localhost";
    private static final int PORT = 27017;
    private static final String USERNAME = null; // 如果需要认证，请设置用户名
    private static final String PASSWORD = null; // 如果需要认证，请设置密码
    
    /**
     * 获取MongoDB客户端连接
     */
    public static MongoClient getMongoClient() {
        if (mongoClient == null) {
            synchronized (MongoDBUtil.class) {
                if (mongoClient == null) {
                    try {
                        MongoClientSettings.Builder settingsBuilder = MongoClientSettings.builder()
                                .applyToClusterSettings(builder ->
                                        builder.hosts(Arrays.asList(new ServerAddress(HOST, PORT))));
                        
                        // 如果需要认证
                        if (USERNAME != null && PASSWORD != null) {
                            MongoCredential credential = MongoCredential.createCredential(
                                    USERNAME, DATABASE_NAME, PASSWORD.toCharArray());
                            settingsBuilder.credential(credential);
                        }
                        
                        mongoClient = MongoClients.create(settingsBuilder.build());
                        logger.info("MongoDB客户端连接成功: {}:{}", HOST, PORT);
                        
                    } catch (Exception e) {
                        logger.error("MongoDB连接失败", e);
                        throw new RuntimeException("MongoDB连接失败", e);
                    }
                }
            }
        }
        return mongoClient;
    }
    
    /**
     * 获取数据库实例
     */
    public static MongoDatabase getDatabase() {
        return getMongoClient().getDatabase(DATABASE_NAME);
    }
    
    /**
     * 获取数据库实例（指定数据库名称）
     */
    public static MongoDatabase getDatabase(String databaseName) {
        return getMongoClient().getDatabase(databaseName);
    }
    
    /**
     * 关闭MongoDB连接
     */
    public static void close() {
        if (mongoClient != null) {
            mongoClient.close();
            mongoClient = null;
            logger.info("MongoDB连接已关闭");
        }
    }
    
    /**
     * 测试连接
     */
    public static boolean testConnection() {
        try {
            MongoDatabase database = getDatabase();
            // 尝试获取集合列表来测试连接
            database.listCollectionNames().first();
            logger.info("MongoDB连接测试成功");
            return true;
        } catch (Exception e) {
            logger.error("MongoDB连接测试失败", e);
            return false;
        }
    }
}