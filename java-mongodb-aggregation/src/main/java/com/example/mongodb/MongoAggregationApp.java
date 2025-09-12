package com.example.mongodb;

import com.example.mongodb.service.AggregationService;
import com.example.mongodb.service.DataInitService;
import com.example.mongodb.util.MongoDBUtil;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.Scanner;

/**
 * MongoDB聚合功能演示主程序
 */
public class MongoAggregationApp {
    
    private static final Logger logger = LoggerFactory.getLogger(MongoAggregationApp.class);
    
    public static void main(String[] args) {
        logger.info("=== MongoDB聚合功能演示程序 ===");
        
        try {
            // 测试MongoDB连接
            if (!MongoDBUtil.testConnection()) {
                logger.error("MongoDB连接失败，请检查MongoDB服务是否启动");
                System.exit(1);
            }
            
            Scanner scanner = new Scanner(System.in);
            DataInitService dataInitService = new DataInitService();
            AggregationService aggregationService = new AggregationService();
            
            while (true) {
                showMenu();
                System.out.print("请选择操作 (输入数字): ");
                
                try {
                    int choice = scanner.nextInt();
                    scanner.nextLine(); // 消费换行符
                    
                    switch (choice) {
                        case 1:
                            logger.info("初始化示例数据...");
                            dataInitService.initializeAllData();
                            dataInitService.printDataStatistics();
                            break;
                            
                        case 2:
                            logger.info("运行所有聚合示例...");
                            aggregationService.runAllExamples();
                            break;
                            
                        case 3:
                            logger.info("按部门分组统计...");
                            aggregationService.groupByDepartment();
                            break;
                            
                        case 4:
                            logger.info("按年龄段分组统计...");
                            aggregationService.groupByAgeRange();
                            break;
                            
                        case 5:
                            logger.info("技能统计分析...");
                            aggregationService.analyzeSkills();
                            break;
                            
                        case 6:
                            logger.info("订单用户关联查询...");
                            aggregationService.orderUserLookup();
                            break;
                            
                        case 7:
                            logger.info("产品销售分析...");
                            aggregationService.productSalesAnalysis();
                            break;
                            
                        case 8:
                            logger.info("月度订单趋势分析...");
                            aggregationService.monthlyOrderTrends();
                            break;
                            
                        case 9:
                            logger.info("文本搜索聚合...");
                            aggregationService.textSearchAggregation();
                            break;
                            
                        case 10:
                            logger.info("地理位置聚合...");
                            aggregationService.geoSpatialAggregation();
                            break;
                            
                        case 11:
                            logger.info("条件聚合统计...");
                            aggregationService.conditionalAggregation();
                            break;
                            
                        case 12:
                            logger.info("查看数据统计信息...");
                            dataInitService.printDataStatistics();
                            break;
                            
                        case 0:
                            logger.info("程序退出");
                            return;
                            
                        default:
                            logger.warn("无效的选择，请重新输入");
                            break;
                    }
                    
                    System.out.println("\n按回车键继续...");
                    scanner.nextLine();
                    
                } catch (Exception e) {
                    logger.error("操作执行失败", e);
                    scanner.nextLine(); // 清除错误输入
                }
            }
            
        } catch (Exception e) {
            logger.error("程序运行出错", e);
        } finally {
            // 关闭MongoDB连接
            MongoDBUtil.close();
        }
    }
    
    /**
     * 显示菜单
     */
    private static void showMenu() {
        System.out.println("\n" + "=".repeat(60));
        System.out.println("           MongoDB聚合功能演示菜单");
        System.out.println("=".repeat(60));
        System.out.println("1.  初始化示例数据");
        System.out.println("2.  运行所有聚合示例");
        System.out.println("3.  按部门分组统计");
        System.out.println("4.  按年龄段分组统计");
        System.out.println("5.  技能统计分析");
        System.out.println("6.  订单用户关联查询");
        System.out.println("7.  产品销售分析");
        System.out.println("8.  月度订单趋势分析");
        System.out.println("9.  文本搜索聚合");
        System.out.println("10. 地理位置聚合");
        System.out.println("11. 条件聚合统计");
        System.out.println("12. 查看数据统计信息");
        System.out.println("0.  退出程序");
        System.out.println("=".repeat(60));
    }
    
    /**
     * 演示模式 - 自动运行所有示例
     */
    public static void runDemoMode() {
        logger.info("=== 演示模式 ===");
        
        try {
            if (!MongoDBUtil.testConnection()) {
                logger.error("MongoDB连接失败");
                return;
            }
            
            DataInitService dataInitService = new DataInitService();
            AggregationService aggregationService = new AggregationService();
            
            // 初始化数据
            logger.info("步骤1: 初始化示例数据");
            dataInitService.initializeAllData();
            dataInitService.printDataStatistics();
            
            Thread.sleep(2000);
            
            // 运行所有聚合示例
            logger.info("步骤2: 运行聚合示例");
            aggregationService.runAllExamples();
            
            logger.info("演示完成！");
            
        } catch (Exception e) {
            logger.error("演示模式运行出错", e);
        } finally {
            MongoDBUtil.close();
        }
    }
}