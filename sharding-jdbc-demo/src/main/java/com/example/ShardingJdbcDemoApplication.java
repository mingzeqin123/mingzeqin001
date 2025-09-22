package com.example;

import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.transaction.annotation.EnableTransactionManagement;

/**
 * ShardingSphere JDBC Demo Application
 */
@SpringBootApplication
@MapperScan("com.example.mapper")
@EnableTransactionManagement
public class ShardingJdbcDemoApplication {
    
    public static void main(String[] args) {
        SpringApplication.run(ShardingJdbcDemoApplication.class, args);
        System.out.println("ShardingSphere JDBC Demo Application started successfully!");
    }
}