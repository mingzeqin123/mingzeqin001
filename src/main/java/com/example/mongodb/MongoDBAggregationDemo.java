package com.example.mongodb;

import com.example.mongodb.service.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * MongoDB聚合功能演示主类
 */
public class MongoDBAggregationDemo {
    
    private static final Logger logger = LoggerFactory.getLogger(MongoDBAggregationDemo.class);
    
    public static void main(String[] args) {
        logger.info("=== MongoDB聚合功能演示开始 ===");
        
        try {
            // 初始化服务
            DataInitializationService dataService = new DataInitializationService();
            UserAggregationService userService = new UserAggregationService();
            OrderAggregationService orderService = new OrderAggregationService();
            AdvancedAggregationService advancedService = new AdvancedAggregationService();
            
            // 初始化示例数据
            dataService.initializeData();
            dataService.showDataStatistics();
            
            System.out.println("\n" + "=".repeat(80) + "\n");
            
            // 演示用户聚合功能
            logger.info("开始演示用户聚合功能...");
            userService.groupUsersByCity();
            System.out.println();
            
            userService.groupUsersByAgeRange();
            System.out.println();
            
            userService.getCountryStatistics();
            System.out.println();
            
            userService.getInterestsDistribution();
            System.out.println();
            
            userService.getTopUsersByBalance();
            System.out.println();
            
            userService.getAverageBalanceByCity();
            System.out.println();
            
            System.out.println("\n" + "=".repeat(80) + "\n");
            
            // 演示订单聚合功能
            logger.info("开始演示订单聚合功能...");
            orderService.getOrderStatisticsByStatus();
            System.out.println();
            
            orderService.getOrderStatisticsByPaymentMethod();
            System.out.println();
            
            orderService.getTopOrdersByAmount();
            System.out.println();
            
            orderService.getMonthlyOrderStatistics();
            System.out.println();
            
            orderService.getUserOrderStatistics();
            System.out.println();
            
            orderService.getOrdersByProduct("iPhone 15");
            System.out.println();
            
            orderService.getOrderStatusTransition();
            System.out.println();
            
            System.out.println("\n" + "=".repeat(80) + "\n");
            
            // 演示高级聚合功能
            logger.info("开始演示高级聚合功能...");
            advancedService.getUserOrderJoinStatistics();
            System.out.println();
            
            advancedService.getCityOrderStatistics();
            System.out.println();
            
            advancedService.getHighValueCustomers(2000.0);
            System.out.println();
            
            advancedService.getPopularProducts();
            System.out.println();
            
            advancedService.getUserBehaviorByAgeGroup();
            System.out.println();
            
            advancedService.getOrderDistributionByHour();
            System.out.println();
            
            advancedService.getHighValueOrdersByCity("北京");
            System.out.println();
            
            logger.info("=== MongoDB聚合功能演示完成 ===");
            
        } catch (Exception e) {
            logger.error("演示过程中发生错误", e);
        } finally {
            // 关闭连接
            com.example.mongodb.config.MongoConfig.closeConnection();
        }
    }
}