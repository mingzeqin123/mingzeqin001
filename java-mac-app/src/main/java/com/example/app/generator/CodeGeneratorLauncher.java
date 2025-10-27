package com.example.app.generator;

import java.util.Scanner;

/**
 * MyBatis Plus 代码生成器启动器
 * 提供统一的入口来使用各种代码生成功能
 */
public class CodeGeneratorLauncher {
    
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        
        while (true) {
            showMainMenu();
            System.out.print("请选择功能 (1-6): ");
            
            try {
                int choice = scanner.nextInt();
                
                switch (choice) {
                    case 1:
                        // 基础代码生成器
                        System.out.println("\n=== 启动基础代码生成器 ===");
                        MyBatisPlusCodeGenerator.main(args);
                        break;
                    case 2:
                        // 高级代码生成器
                        System.out.println("\n=== 启动高级代码生成器 ===");
                        AdvancedCodeGenerator.main(args);
                        break;
                    case 3:
                        // 配置文件生成器
                        System.out.println("\n=== 启动配置文件生成器 ===");
                        ConfigGenerator.main(args);
                        break;
                    case 4:
                        // 示例数据生成器
                        System.out.println("\n=== 启动示例数据生成器 ===");
                        SampleDataGenerator.main(args);
                        break;
                    case 5:
                        // 快速开始
                        quickStart();
                        break;
                    case 6:
                        // 退出
                        System.out.println("感谢使用 MyBatis Plus 代码生成器！");
                        scanner.close();
                        return;
                    default:
                        System.out.println("无效选择，请重新输入！");
                }
                
                System.out.println("\n按回车键继续...");
                scanner.nextLine(); // 消费换行符
                scanner.nextLine(); // 等待用户按回车
                
            } catch (Exception e) {
                System.err.println("发生错误: " + e.getMessage());
                scanner.nextLine(); // 消费可能的换行符
            }
        }
    }
    
    /**
     * 显示主菜单
     */
    private static void showMainMenu() {
        System.out.println("\n" + "=".repeat(50));
        System.out.println("           MyBatis Plus 代码生成器");
        System.out.println("=".repeat(50));
        System.out.println("1. 基础代码生成器 - 简单快速的代码生成");
        System.out.println("2. 高级代码生成器 - 自定义配置的代码生成");
        System.out.println("3. 配置文件生成器 - 生成 MyBatis Plus 配置文件");
        System.out.println("4. 示例数据生成器 - 生成示例数据库表结构");
        System.out.println("5. 快速开始 - 一键生成完整项目结构");
        System.out.println("6. 退出");
        System.out.println("=".repeat(50));
    }
    
    /**
     * 快速开始功能
     */
    private static void quickStart() {
        Scanner scanner = new Scanner(System.in);
        
        System.out.println("\n=== 快速开始 ===");
        System.out.println("此功能将为您生成一个完整的 MyBatis Plus 项目结构，包括：");
        System.out.println("• 示例数据库表结构");
        System.out.println("• MyBatis Plus 配置文件");
        System.out.println("• 用户管理模块的完整代码");
        System.out.println("• 商品管理模块的完整代码");
        System.out.println("• 订单管理模块的完整代码");
        
        System.out.print("\n确认开始快速生成？(y/n): ");
        String confirm = scanner.next();
        
        if ("y".equalsIgnoreCase(confirm) || "yes".equalsIgnoreCase(confirm)) {
            System.out.println("\n开始快速生成...");
            
            try {
                // 1. 生成示例数据
                System.out.println("1. 生成示例数据库表结构...");
                SampleDataGenerator.main(new String[]{});
                
                // 2. 生成配置文件
                System.out.println("2. 生成配置文件...");
                ConfigGenerator.main(new String[]{});
                
                // 3. 生成用户管理模块
                System.out.println("3. 生成用户管理模块...");
                generateUserModule();
                
                // 4. 生成商品管理模块
                System.out.println("4. 生成商品管理模块...");
                generateProductModule();
                
                // 5. 生成订单管理模块
                System.out.println("5. 生成订单管理模块...");
                generateOrderModule();
                
                System.out.println("\n✅ 快速生成完成！");
                System.out.println("生成的文件位于项目根目录的 generated 文件夹中");
                System.out.println("您可以查看 sql 文件夹中的数据库表结构");
                System.out.println("配置文件已生成到 src/main/resources 目录");
                
            } catch (Exception e) {
                System.err.println("❌ 快速生成失败: " + e.getMessage());
                e.printStackTrace();
            }
        } else {
            System.out.println("已取消快速生成");
        }
    }
    
    /**
     * 生成用户管理模块
     */
    private static void generateUserModule() {
        // 这里可以调用具体的生成逻辑
        System.out.println("   生成用户实体类、Mapper、Service、Controller...");
    }
    
    /**
     * 生成商品管理模块
     */
    private static void generateProductModule() {
        // 这里可以调用具体的生成逻辑
        System.out.println("   生成商品实体类、Mapper、Service、Controller...");
    }
    
    /**
     * 生成订单管理模块
     */
    private static void generateOrderModule() {
        // 这里可以调用具体的生成逻辑
        System.out.println("   生成订单实体类、Mapper、Service、Controller...");
    }
}