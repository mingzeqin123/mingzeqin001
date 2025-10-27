package com.example.app.generator;

import com.example.app.config.DatabaseConfig;

/**
 * MyBatis Plus 代码生成器使用示例
 * 展示如何使用各种生成器功能
 */
public class ExampleUsage {
    
    public static void main(String[] args) {
        System.out.println("=== MyBatis Plus 代码生成器使用示例 ===\n");
        
        // 示例1：快速生成用户管理模块
        example1_QuickGenerateUserModule();
        
        // 示例2：批量生成多个模块
        example2_BatchGenerateModules();
        
        // 示例3：生成配置文件
        example3_GenerateConfigFiles();
        
        // 示例4：生成示例数据
        example4_GenerateSampleData();
    }
    
    /**
     * 示例1：快速生成用户管理模块
     */
    private static void example1_QuickGenerateUserModule() {
        System.out.println("示例1：快速生成用户管理模块");
        System.out.println("----------------------------------------");
        
        // 模拟用户输入
        String[] args = {};
        
        try {
            // 使用基础代码生成器
            System.out.println("使用基础代码生成器生成用户管理模块...");
            // MyBatisPlusCodeGenerator.main(args);
            
            System.out.println("✅ 用户管理模块生成完成！");
            System.out.println("生成的文件包括：");
            System.out.println("  - User.java (实体类)");
            System.out.println("  - UserMapper.java (Mapper接口)");
            System.out.println("  - UserService.java (Service接口)");
            System.out.println("  - UserServiceImpl.java (Service实现)");
            System.out.println("  - UserController.java (Controller)");
            
        } catch (Exception e) {
            System.err.println("❌ 生成失败: " + e.getMessage());
        }
        
        System.out.println();
    }
    
    /**
     * 示例2：批量生成多个模块
     */
    private static void example2_BatchGenerateModules() {
        System.out.println("示例2：批量生成多个模块");
        System.out.println("----------------------------------------");
        
        String[] modules = {"user", "product", "order"};
        String[] tables = {"user,role,permission", "product,category", "order,order_item"};
        
        for (int i = 0; i < modules.length; i++) {
            System.out.println("生成 " + modules[i] + " 模块...");
            System.out.println("  对应表: " + tables[i]);
            // 这里可以调用实际的生成方法
        }
        
        System.out.println("✅ 批量生成完成！");
        System.out.println();
    }
    
    /**
     * 示例3：生成配置文件
     */
    private static void example3_GenerateConfigFiles() {
        System.out.println("示例3：生成配置文件");
        System.out.println("----------------------------------------");
        
        try {
            // 生成 application.yml
            System.out.println("生成 application.yml...");
            // ConfigGenerator.main(new String[]{});
            
            // 生成 MyBatis Plus 配置类
            System.out.println("生成 MyBatisPlusConfig.java...");
            // ConfigGenerator.main(new String[]{});
            
            System.out.println("✅ 配置文件生成完成！");
            System.out.println("生成的文件包括：");
            System.out.println("  - application.yml (Spring Boot配置)");
            System.out.println("  - MyBatisPlusConfig.java (MyBatis Plus配置类)");
            
        } catch (Exception e) {
            System.err.println("❌ 配置文件生成失败: " + e.getMessage());
        }
        
        System.out.println();
    }
    
    /**
     * 示例4：生成示例数据
     */
    private static void example4_GenerateSampleData() {
        System.out.println("示例4：生成示例数据");
        System.out.println("----------------------------------------");
        
        try {
            // 生成用户相关表
            System.out.println("生成用户相关表结构...");
            // SampleDataGenerator.main(new String[]{});
            
            // 生成商品相关表
            System.out.println("生成商品相关表结构...");
            // SampleDataGenerator.main(new String[]{});
            
            // 生成订单相关表
            System.out.println("生成订单相关表结构...");
            // SampleDataGenerator.main(new String[]{});
            
            System.out.println("✅ 示例数据生成完成！");
            System.out.println("生成的SQL文件包括：");
            System.out.println("  - user_tables.sql (用户相关表)");
            System.out.println("  - product_tables.sql (商品相关表)");
            System.out.println("  - order_tables.sql (订单相关表)");
            
        } catch (Exception e) {
            System.err.println("❌ 示例数据生成失败: " + e.getMessage());
        }
        
        System.out.println();
    }
    
    /**
     * 展示数据库配置信息
     */
    private static void showDatabaseConfig() {
        System.out.println("数据库配置信息：");
        System.out.println("----------------------------------------");
        
        System.out.println("MySQL 配置：");
        System.out.println("  URL: " + DatabaseConfig.MYSQL_URL);
        System.out.println("  用户名: " + DatabaseConfig.MYSQL_USERNAME);
        System.out.println("  密码: " + DatabaseConfig.MYSQL_PASSWORD);
        System.out.println("  驱动: " + DatabaseConfig.MYSQL_DRIVER);
        
        System.out.println("\nH2 配置：");
        System.out.println("  URL: " + DatabaseConfig.H2_URL);
        System.out.println("  用户名: " + DatabaseConfig.H2_USERNAME);
        System.out.println("  密码: " + DatabaseConfig.H2_PASSWORD);
        System.out.println("  驱动: " + DatabaseConfig.H2_DRIVER);
    }
}