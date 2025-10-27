package com.example.app.generator;

import com.example.app.config.DatabaseConfig;

import java.io.File;
import java.io.FileWriter;
import java.io.IOException;
import java.util.Scanner;

/**
 * 配置文件生成器
 * 用于生成 MyBatis Plus 相关的配置文件
 */
public class ConfigGenerator {
    
    private static final String PROJECT_PATH = System.getProperty("user.dir");
    
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        
        System.out.println("=== MyBatis Plus 配置文件生成器 ===");
        System.out.println("1. 生成 application.yml");
        System.out.println("2. 生成 MyBatis Plus 配置类");
        System.out.println("3. 生成所有配置文件");
        System.out.print("请选择要生成的文件 (1-3): ");
        
        int choice = scanner.nextInt();
        
        switch (choice) {
            case 1:
                generateApplicationYml();
                break;
            case 2:
                generateMyBatisPlusConfig();
                break;
            case 3:
                generateApplicationYml();
                generateMyBatisPlusConfig();
                break;
            default:
                System.out.println("无效选择");
        }
        
        scanner.close();
    }
    
    /**
     * 生成 application.yml 配置文件
     */
    private static void generateApplicationYml() {
        try {
            String configDir = PROJECT_PATH + "/src/main/resources";
            new File(configDir).mkdirs();
            
            File configFile = new File(configDir + "/application.yml");
            FileWriter writer = new FileWriter(configFile);
            
            writer.write("# MyBatis Plus 配置文件\n");
            writer.write("spring:\n");
            writer.write("  # 数据源配置\n");
            writer.write("  datasource:\n");
            writer.write("    driver-class-name: " + DatabaseConfig.MYSQL_DRIVER + "\n");
            writer.write("    url: " + DatabaseConfig.MYSQL_URL + "\n");
            writer.write("    username: " + DatabaseConfig.MYSQL_USERNAME + "\n");
            writer.write("    password: " + DatabaseConfig.MYSQL_PASSWORD + "\n");
            writer.write("    type: com.zaxxer.hikari.HikariDataSource\n");
            writer.write("    hikari:\n");
            writer.write("      minimum-idle: 5\n");
            writer.write("      maximum-pool-size: 20\n");
            writer.write("      auto-commit: true\n");
            writer.write("      idle-timeout: 30000\n");
            writer.write("      pool-name: MyBatisPlusHikariCP\n");
            writer.write("      max-lifetime: 1800000\n");
            writer.write("      connection-timeout: 30000\n");
            writer.write("      connection-test-query: SELECT 1\n");
            writer.write("\n");
            writer.write("# MyBatis Plus 配置\n");
            writer.write("mybatis-plus:\n");
            writer.write("  # 实体扫描，多个package用逗号或者分号分隔\n");
            writer.write("  type-aliases-package: com.example.demo.entity\n");
            writer.write("  # mapper xml文件路径\n");
            writer.write("  mapper-locations: classpath*:mapper/*.xml\n");
            writer.write("  # 配置\n");
            writer.write("  configuration:\n");
            writer.write("    # 是否开启自动驼峰命名规则映射:从数据库列名到Java属性驼峰命名的类似映射\n");
            writer.write("    map-underscore-to-camel-case: true\n");
            writer.write("    # 如果查询结果中包含空值的列，则 MyBatis 在映射的时候，不会映射这个字段\n");
            writer.write("    call-setters-on-nulls: true\n");
            writer.write("    # 这个配置会将执行的sql打印出来，在开发或测试的时候可以用\n");
            writer.write("    log-impl: org.apache.ibatis.logging.stdout.StdOutImpl\n");
            writer.write("  global-config:\n");
            writer.write("    # 数据库相关配置\n");
            writer.write("    db-config:\n");
            writer.write("      # 主键类型  AUTO:\"数据库ID自增\", INPUT:\"用户输入ID\", ID_WORKER:\"全局唯一ID (数字类型唯一ID)\", UUID:\"全局唯一ID UUID\";\n");
            writer.write("      id-type: AUTO\n");
            writer.write("      # 字段策略 IGNORED:\"忽略判断\",NOT_NULL:\"非 NULL 判断\"),NOT_EMPTY:\"非空判断\"\n");
            writer.write("      field-strategy: NOT_NULL\n");
            writer.write("      # 驼峰下划线转换\n");
            writer.write("      column-underline: true\n");
            writer.write("      # 逻辑删除配置\n");
            writer.write("      logic-delete-field: deleted\n");
            writer.write("      logic-delete-value: 1\n");
            writer.write("      logic-not-delete-value: 0\n");
            writer.write("    banner: false\n");
            writer.write("\n");
            writer.write("# 日志配置\n");
            writer.write("logging:\n");
            writer.write("  level:\n");
            writer.write("    com.example.demo.mapper: debug\n");
            writer.write("    root: info\n");
            
            writer.close();
            System.out.println("✅ application.yml 生成完成！路径: " + configFile.getAbsolutePath());
            
        } catch (IOException e) {
            System.err.println("❌ 生成 application.yml 失败: " + e.getMessage());
        }
    }
    
    /**
     * 生成 MyBatis Plus 配置类
     */
    private static void generateMyBatisPlusConfig() {
        try {
            String configDir = PROJECT_PATH + "/src/main/java/com/example/app/config";
            new File(configDir).mkdirs();
            
            File configFile = new File(configDir + "/MyBatisPlusConfig.java");
            FileWriter writer = new FileWriter(configFile);
            
            writer.write("package com.example.app.config;\n\n");
            writer.write("import com.baomidou.mybatisplus.annotation.DbType;\n");
            writer.write("import com.baomidou.mybatisplus.extension.plugins.MybatisPlusInterceptor;\n");
            writer.write("import com.baomidou.mybatisplus.extension.plugins.inner.OptimisticLockerInnerInterceptor;\n");
            writer.write("import com.baomidou.mybatisplus.extension.plugins.inner.PaginationInnerInterceptor;\n");
            writer.write("import org.mybatis.spring.annotation.MapperScan;\n");
            writer.write("import org.springframework.context.annotation.Bean;\n");
            writer.write("import org.springframework.context.annotation.Configuration;\n\n");
            writer.write("/**\n");
            writer.write(" * MyBatis Plus 配置类\n");
            writer.write(" * \n");
            writer.write(" * @author CodeGenerator\n");
            writer.write(" * @since " + java.time.LocalDate.now() + "\n");
            writer.write(" */\n");
            writer.write("@Configuration\n");
            writer.write("@MapperScan(\"com.example.demo.mapper\")\n");
            writer.write("public class MyBatisPlusConfig {\n\n");
            writer.write("    /**\n");
            writer.write("     * 分页插件\n");
            writer.write("     */\n");
            writer.write("    @Bean\n");
            writer.write("    public MybatisPlusInterceptor mybatisPlusInterceptor() {\n");
            writer.write("        MybatisPlusInterceptor interceptor = new MybatisPlusInterceptor();\n");
            writer.write("        // 分页插件\n");
            writer.write("        interceptor.addInnerInterceptor(new PaginationInnerInterceptor(DbType.MYSQL));\n");
            writer.write("        // 乐观锁插件\n");
            writer.write("        interceptor.addInnerInterceptor(new OptimisticLockerInnerInterceptor());\n");
            writer.write("        return interceptor;\n");
            writer.write("    }\n");
            writer.write("}\n");
            
            writer.close();
            System.out.println("✅ MyBatisPlusConfig.java 生成完成！路径: " + configFile.getAbsolutePath());
            
        } catch (IOException e) {
            System.err.println("❌ 生成 MyBatisPlusConfig.java 失败: " + e.getMessage());
        }
    }
}