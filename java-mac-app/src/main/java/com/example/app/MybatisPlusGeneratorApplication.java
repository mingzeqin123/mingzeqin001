package com.example.app;

import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.ConfigurableApplicationContext;
import org.springframework.core.env.Environment;

import java.net.InetAddress;
import java.net.UnknownHostException;

/**
 * MyBatis Plus 代码生成器 Spring Boot 启动类
 * 
 * @author MyBatis Plus Generator
 * @since 2024-01-15
 */
@Slf4j
@SpringBootApplication
@EnableConfigurationProperties
public class MybatisPlusGeneratorApplication {

    public static void main(String[] args) throws UnknownHostException {
        ConfigurableApplicationContext application = SpringApplication.run(MybatisPlusGeneratorApplication.class, args);
        Environment env = application.getEnvironment();
        String ip = InetAddress.getLocalHost().getHostAddress();
        String port = env.getProperty("server.port");
        String path = env.getProperty("server.servlet.context-path", "");
        
        log.info("\n----------------------------------------------------------\n\t" +
                "Application '{}' is running! Access URLs:\n\t" +
                "Local: \t\thttp://localhost:{}{}\n\t" +
                "External: \thttp://{}:{}{}\n\t" +
                "Profile(s): \t{}\n\t" +
                "代码生成器API: \thttp://localhost:{}{}/api/generator/health\n\t" +
                "Swagger文档: \thttp://localhost:{}{}/swagger-ui.html\n\t" +
                "Druid监控: \thttp://localhost:{}{}/druid/index.html\n" +
                "----------------------------------------------------------",
                env.getProperty("spring.application.name", "MyBatis Plus Generator"),
                port, path,
                ip, port, path,
                env.getActiveProfiles(),
                port, path,
                port, path,
                port, path
        );
    }
}