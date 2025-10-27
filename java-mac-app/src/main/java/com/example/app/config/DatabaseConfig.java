package com.example.app.config;

/**
 * 数据库配置类
 * 用于配置 MyBatis Plus 代码生成器的数据库连接信息
 */
public class DatabaseConfig {
    
    // MySQL 配置
    public static final String MYSQL_URL = "jdbc:mysql://localhost:3306/test?useUnicode=true&characterEncoding=utf8&zeroDateTimeBehavior=convertToNull&useSSL=true&serverTimezone=GMT%2B8";
    public static final String MYSQL_USERNAME = "root";
    public static final String MYSQL_PASSWORD = "123456";
    public static final String MYSQL_DRIVER = "com.mysql.cj.jdbc.Driver";
    
    // H2 配置（用于测试）
    public static final String H2_URL = "jdbc:h2:mem:testdb;DB_CLOSE_DELAY=-1;DB_CLOSE_ON_EXIT=FALSE";
    public static final String H2_USERNAME = "sa";
    public static final String H2_PASSWORD = "";
    public static final String H2_DRIVER = "org.h2.Driver";
    
    // 数据库类型枚举
    public enum DatabaseType {
        MYSQL("MySQL", MYSQL_DRIVER, MYSQL_URL, MYSQL_USERNAME, MYSQL_PASSWORD),
        H2("H2", H2_DRIVER, H2_URL, H2_USERNAME, H2_PASSWORD);
        
        private final String name;
        private final String driver;
        private final String url;
        private final String username;
        private final String password;
        
        DatabaseType(String name, String driver, String url, String username, String password) {
            this.name = name;
            this.driver = driver;
            this.url = url;
            this.username = username;
            this.password = password;
        }
        
        public String getName() { return name; }
        public String getDriver() { return driver; }
        public String getUrl() { return url; }
        public String getUsername() { return username; }
        public String getPassword() { return password; }
    }
}