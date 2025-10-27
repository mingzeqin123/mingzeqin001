package com.example.app.generator;

import com.example.app.config.DatabaseConfig;

import java.io.File;
import java.io.FileWriter;
import java.io.IOException;
import java.util.Scanner;

/**
 * 示例数据生成器
 * 用于生成示例数据库表结构和测试数据
 */
public class SampleDataGenerator {
    
    private static final String PROJECT_PATH = System.getProperty("user.dir");
    
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        
        System.out.println("=== 示例数据生成器 ===");
        System.out.println("1. 生成用户相关表结构");
        System.out.println("2. 生成商品相关表结构");
        System.out.println("3. 生成订单相关表结构");
        System.out.println("4. 生成所有示例表结构");
        System.out.print("请选择要生成的表结构 (1-4): ");
        
        int choice = scanner.nextInt();
        
        switch (choice) {
            case 1:
                generateUserTables();
                break;
            case 2:
                generateProductTables();
                break;
            case 3:
                generateOrderTables();
                break;
            case 4:
                generateUserTables();
                generateProductTables();
                generateOrderTables();
                break;
            default:
                System.out.println("无效选择");
        }
        
        scanner.close();
    }
    
    /**
     * 生成用户相关表结构
     */
    private static void generateUserTables() {
        try {
            String sqlDir = PROJECT_PATH + "/sql";
            new File(sqlDir).mkdirs();
            
            File sqlFile = new File(sqlDir + "/user_tables.sql");
            FileWriter writer = new FileWriter(sqlFile);
            
            writer.write("-- 用户相关表结构\n");
            writer.write("-- 创建时间: " + java.time.LocalDateTime.now() + "\n\n");
            
            // 用户表
            writer.write("-- 用户表\n");
            writer.write("CREATE TABLE IF NOT EXISTS `t_user` (\n");
            writer.write("  `id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '用户ID',\n");
            writer.write("  `username` varchar(50) NOT NULL COMMENT '用户名',\n");
            writer.write("  `password` varchar(100) NOT NULL COMMENT '密码',\n");
            writer.write("  `email` varchar(100) DEFAULT NULL COMMENT '邮箱',\n");
            writer.write("  `phone` varchar(20) DEFAULT NULL COMMENT '手机号',\n");
            writer.write("  `nickname` varchar(50) DEFAULT NULL COMMENT '昵称',\n");
            writer.write("  `avatar` varchar(255) DEFAULT NULL COMMENT '头像',\n");
            writer.write("  `status` tinyint(1) DEFAULT 1 COMMENT '状态：1-正常，0-禁用',\n");
            writer.write("  `create_time` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',\n");
            writer.write("  `update_time` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',\n");
            writer.write("  `deleted` tinyint(1) DEFAULT 0 COMMENT '逻辑删除：0-未删除，1-已删除',\n");
            writer.write("  PRIMARY KEY (`id`),\n");
            writer.write("  UNIQUE KEY `uk_username` (`username`),\n");
            writer.write("  UNIQUE KEY `uk_email` (`email`)\n");
            writer.write(") ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户表';\n\n");
            
            // 角色表
            writer.write("-- 角色表\n");
            writer.write("CREATE TABLE IF NOT EXISTS `t_role` (\n");
            writer.write("  `id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '角色ID',\n");
            writer.write("  `role_name` varchar(50) NOT NULL COMMENT '角色名称',\n");
            writer.write("  `role_code` varchar(50) NOT NULL COMMENT '角色编码',\n");
            writer.write("  `description` varchar(255) DEFAULT NULL COMMENT '角色描述',\n");
            writer.write("  `status` tinyint(1) DEFAULT 1 COMMENT '状态：1-正常，0-禁用',\n");
            writer.write("  `create_time` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',\n");
            writer.write("  `update_time` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',\n");
            writer.write("  `deleted` tinyint(1) DEFAULT 0 COMMENT '逻辑删除：0-未删除，1-已删除',\n");
            writer.write("  PRIMARY KEY (`id`),\n");
            writer.write("  UNIQUE KEY `uk_role_code` (`role_code`)\n");
            writer.write(") ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='角色表';\n\n");
            
            // 权限表
            writer.write("-- 权限表\n");
            writer.write("CREATE TABLE IF NOT EXISTS `t_permission` (\n");
            writer.write("  `id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '权限ID',\n");
            writer.write("  `permission_name` varchar(50) NOT NULL COMMENT '权限名称',\n");
            writer.write("  `permission_code` varchar(100) NOT NULL COMMENT '权限编码',\n");
            writer.write("  `parent_id` bigint(20) DEFAULT 0 COMMENT '父权限ID',\n");
            writer.write("  `type` tinyint(1) DEFAULT 1 COMMENT '权限类型：1-菜单，2-按钮',\n");
            writer.write("  `path` varchar(255) DEFAULT NULL COMMENT '路径',\n");
            writer.write("  `icon` varchar(100) DEFAULT NULL COMMENT '图标',\n");
            writer.write("  `sort` int(11) DEFAULT 0 COMMENT '排序',\n");
            writer.write("  `status` tinyint(1) DEFAULT 1 COMMENT '状态：1-正常，0-禁用',\n");
            writer.write("  `create_time` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',\n");
            writer.write("  `update_time` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',\n");
            writer.write("  `deleted` tinyint(1) DEFAULT 0 COMMENT '逻辑删除：0-未删除，1-已删除',\n");
            writer.write("  PRIMARY KEY (`id`),\n");
            writer.write("  UNIQUE KEY `uk_permission_code` (`permission_code`)\n");
            writer.write(") ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='权限表';\n\n");
            
            // 用户角色关联表
            writer.write("-- 用户角色关联表\n");
            writer.write("CREATE TABLE IF NOT EXISTS `t_user_role` (\n");
            writer.write("  `id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT 'ID',\n");
            writer.write("  `user_id` bigint(20) NOT NULL COMMENT '用户ID',\n");
            writer.write("  `role_id` bigint(20) NOT NULL COMMENT '角色ID',\n");
            writer.write("  `create_time` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',\n");
            writer.write("  PRIMARY KEY (`id`),\n");
            writer.write("  UNIQUE KEY `uk_user_role` (`user_id`, `role_id`)\n");
            writer.write(") ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户角色关联表';\n\n");
            
            // 角色权限关联表
            writer.write("-- 角色权限关联表\n");
            writer.write("CREATE TABLE IF NOT EXISTS `t_role_permission` (\n");
            writer.write("  `id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT 'ID',\n");
            writer.write("  `role_id` bigint(20) NOT NULL COMMENT '角色ID',\n");
            writer.write("  `permission_id` bigint(20) NOT NULL COMMENT '权限ID',\n");
            writer.write("  `create_time` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',\n");
            writer.write("  PRIMARY KEY (`id`),\n");
            writer.write("  UNIQUE KEY `uk_role_permission` (`role_id`, `permission_id`)\n");
            writer.write(") ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='角色权限关联表';\n\n");
            
            // 插入示例数据
            writer.write("-- 插入示例数据\n");
            writer.write("INSERT INTO `t_role` (`role_name`, `role_code`, `description`) VALUES\n");
            writer.write("('管理员', 'ADMIN', '系统管理员'),\n");
            writer.write("('普通用户', 'USER', '普通用户');\n\n");
            
            writer.write("INSERT INTO `t_permission` (`permission_name`, `permission_code`, `parent_id`, `type`, `path`, `icon`, `sort`) VALUES\n");
            writer.write("('用户管理', 'user:manage', 0, 1, '/user', 'user', 1),\n");
            writer.write("('用户列表', 'user:list', 1, 2, NULL, NULL, 1),\n");
            writer.write("('用户新增', 'user:add', 1, 2, NULL, NULL, 2),\n");
            writer.write("('用户修改', 'user:edit', 1, 2, NULL, NULL, 3),\n");
            writer.write("('用户删除', 'user:delete', 1, 2, NULL, NULL, 4);\n\n");
            
            writer.write("INSERT INTO `t_user` (`username`, `password`, `email`, `nickname`) VALUES\n");
            writer.write("('admin', '$2a$10$7JB720yubVSOfvVWb5k5mOe8Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q', 'admin@example.com', '管理员'),\n");
            writer.write("('user', '$2a$10$7JB720yubVSOfvVWb5k5mOe8Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q', 'user@example.com', '普通用户');\n\n");
            
            writer.close();
            System.out.println("✅ 用户相关表结构生成完成！路径: " + sqlFile.getAbsolutePath());
            
        } catch (IOException e) {
            System.err.println("❌ 生成用户表结构失败: " + e.getMessage());
        }
    }
    
    /**
     * 生成商品相关表结构
     */
    private static void generateProductTables() {
        try {
            String sqlDir = PROJECT_PATH + "/sql";
            new File(sqlDir).mkdirs();
            
            File sqlFile = new File(sqlDir + "/product_tables.sql");
            FileWriter writer = new FileWriter(sqlFile);
            
            writer.write("-- 商品相关表结构\n");
            writer.write("-- 创建时间: " + java.time.LocalDateTime.now() + "\n\n");
            
            // 商品分类表
            writer.write("-- 商品分类表\n");
            writer.write("CREATE TABLE IF NOT EXISTS `t_category` (\n");
            writer.write("  `id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '分类ID',\n");
            writer.write("  `category_name` varchar(50) NOT NULL COMMENT '分类名称',\n");
            writer.write("  `parent_id` bigint(20) DEFAULT 0 COMMENT '父分类ID',\n");
            writer.write("  `level` int(11) DEFAULT 1 COMMENT '分类层级',\n");
            writer.write("  `sort` int(11) DEFAULT 0 COMMENT '排序',\n");
            writer.write("  `icon` varchar(255) DEFAULT NULL COMMENT '分类图标',\n");
            writer.write("  `status` tinyint(1) DEFAULT 1 COMMENT '状态：1-正常，0-禁用',\n");
            writer.write("  `create_time` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',\n");
            writer.write("  `update_time` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',\n");
            writer.write("  `deleted` tinyint(1) DEFAULT 0 COMMENT '逻辑删除：0-未删除，1-已删除',\n");
            writer.write("  PRIMARY KEY (`id`)\n");
            writer.write(") ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='商品分类表';\n\n");
            
            // 商品表
            writer.write("-- 商品表\n");
            writer.write("CREATE TABLE IF NOT EXISTS `t_product` (\n");
            writer.write("  `id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '商品ID',\n");
            writer.write("  `product_name` varchar(100) NOT NULL COMMENT '商品名称',\n");
            writer.write("  `product_code` varchar(50) NOT NULL COMMENT '商品编码',\n");
            writer.write("  `category_id` bigint(20) NOT NULL COMMENT '分类ID',\n");
            writer.write("  `price` decimal(10,2) NOT NULL COMMENT '商品价格',\n");
            writer.write("  `cost_price` decimal(10,2) DEFAULT NULL COMMENT '成本价格',\n");
            writer.write("  `stock` int(11) DEFAULT 0 COMMENT '库存数量',\n");
            writer.write("  `description` text COMMENT '商品描述',\n");
            writer.write("  `images` text COMMENT '商品图片（JSON格式）',\n");
            writer.write("  `status` tinyint(1) DEFAULT 1 COMMENT '状态：1-上架，0-下架',\n");
            writer.write("  `create_time` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',\n");
            writer.write("  `update_time` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',\n");
            writer.write("  `deleted` tinyint(1) DEFAULT 0 COMMENT '逻辑删除：0-未删除，1-已删除',\n");
            writer.write("  PRIMARY KEY (`id`),\n");
            writer.write("  UNIQUE KEY `uk_product_code` (`product_code`)\n");
            writer.write(") ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='商品表';\n\n");
            
            writer.close();
            System.out.println("✅ 商品相关表结构生成完成！路径: " + sqlFile.getAbsolutePath());
            
        } catch (IOException e) {
            System.err.println("❌ 生成商品表结构失败: " + e.getMessage());
        }
    }
    
    /**
     * 生成订单相关表结构
     */
    private static void generateOrderTables() {
        try {
            String sqlDir = PROJECT_PATH + "/sql";
            new File(sqlDir).mkdirs();
            
            File sqlFile = new File(sqlDir + "/order_tables.sql");
            FileWriter writer = new FileWriter(sqlFile);
            
            writer.write("-- 订单相关表结构\n");
            writer.write("-- 创建时间: " + java.time.LocalDateTime.now() + "\n\n");
            
            // 订单表
            writer.write("-- 订单表\n");
            writer.write("CREATE TABLE IF NOT EXISTS `t_order` (\n");
            writer.write("  `id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '订单ID',\n");
            writer.write("  `order_no` varchar(50) NOT NULL COMMENT '订单号',\n");
            writer.write("  `user_id` bigint(20) NOT NULL COMMENT '用户ID',\n");
            writer.write("  `total_amount` decimal(10,2) NOT NULL COMMENT '订单总金额',\n");
            writer.write("  `status` tinyint(1) DEFAULT 1 COMMENT '订单状态：1-待付款，2-已付款，3-已发货，4-已完成，5-已取消',\n");
            writer.write("  `remark` varchar(255) DEFAULT NULL COMMENT '订单备注',\n");
            writer.write("  `create_time` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',\n");
            writer.write("  `update_time` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',\n");
            writer.write("  `deleted` tinyint(1) DEFAULT 0 COMMENT '逻辑删除：0-未删除，1-已删除',\n");
            writer.write("  PRIMARY KEY (`id`),\n");
            writer.write("  UNIQUE KEY `uk_order_no` (`order_no`)\n");
            writer.write(") ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='订单表';\n\n");
            
            // 订单详情表
            writer.write("-- 订单详情表\n");
            writer.write("CREATE TABLE IF NOT EXISTS `t_order_item` (\n");
            writer.write("  `id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT 'ID',\n");
            writer.write("  `order_id` bigint(20) NOT NULL COMMENT '订单ID',\n");
            writer.write("  `product_id` bigint(20) NOT NULL COMMENT '商品ID',\n");
            writer.write("  `product_name` varchar(100) NOT NULL COMMENT '商品名称',\n");
            writer.write("  `product_price` decimal(10,2) NOT NULL COMMENT '商品价格',\n");
            writer.write("  `quantity` int(11) NOT NULL COMMENT '购买数量',\n");
            writer.write("  `total_price` decimal(10,2) NOT NULL COMMENT '小计金额',\n");
            writer.write("  `create_time` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',\n");
            writer.write("  PRIMARY KEY (`id`)\n");
            writer.write(") ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='订单详情表';\n\n");
            
            writer.close();
            System.out.println("✅ 订单相关表结构生成完成！路径: " + sqlFile.getAbsolutePath());
            
        } catch (IOException e) {
            System.err.println("❌ 生成订单表结构失败: " + e.getMessage());
        }
    }
}