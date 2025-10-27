package com.example.app.generator;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * 代码生成器配置类
 * 
 * @author MyBatis Plus Generator
 * @since 2024-01-15
 */
@Data
@Component
@ConfigurationProperties(prefix = "generator")
public class GeneratorConfig {

    /**
     * 数据库配置
     */
    private DataSourceConfig datasource;

    /**
     * 全局配置
     */
    private GlobalConfig global;

    /**
     * 包配置
     */
    private PackageConfig packageConfig;

    /**
     * 策略配置
     */
    private StrategyConfig strategy;

    @Data
    public static class DataSourceConfig {
        /**
         * 数据库连接URL
         */
        private String url;
        
        /**
         * 数据库用户名
         */
        private String username;
        
        /**
         * 数据库密码
         */
        private String password;
        
        /**
         * 数据库驱动名
         */
        private String driverName;
    }

    @Data
    public static class GlobalConfig {
        /**
         * 作者
         */
        private String author;
        
        /**
         * 输出目录
         */
        private String outputDir;
        
        /**
         * 是否覆盖已有文件
         */
        private Boolean fileOverride;
        
        /**
         * 是否打开输出目录
         */
        private Boolean open;
        
        /**
         * 是否在xml中添加二级缓存配置
         */
        private Boolean enableCache;
        
        /**
         * 开启 BaseResultMap
         */
        private Boolean baseResultMap;
        
        /**
         * 开启 baseColumnList
         */
        private Boolean baseColumnList;
        
        /**
         * 时间类型对应策略
         */
        private String dateType;
    }

    @Data
    public static class PackageConfig {
        /**
         * 父包名
         */
        private String parent;
        
        /**
         * 实体类包名
         */
        private String entity;
        
        /**
         * Mapper包名
         */
        private String mapper;
        
        /**
         * Mapper XML包名
         */
        private String xml;
        
        /**
         * Service包名
         */
        private String service;
        
        /**
         * Service实现类包名
         */
        private String serviceImpl;
        
        /**
         * Controller包名
         */
        private String controller;
    }

    @Data
    public static class StrategyConfig {
        /**
         * 数据库表映射到实体的命名策略
         */
        private String naming;
        
        /**
         * 数据库表字段映射到实体的命名策略
         */
        private String columnNaming;
        
        /**
         * 自定义继承的Entity类全称，带包名
         */
        private String superEntityClass;
        
        /**
         * 自定义继承的Mapper类全称，带包名
         */
        private String superMapperClass;
        
        /**
         * 自定义继承的Service类全称，带包名
         */
        private String superServiceClass;
        
        /**
         * 自定义继承的ServiceImpl类全称，带包名
         */
        private String superServiceImplClass;
        
        /**
         * 自定义继承的Controller类全称，带包名
         */
        private String superControllerClass;
        
        /**
         * 需要包含的表名，允许正则表达式（与exclude二选一配置）
         */
        private String include;
        
        /**
         * 需要排除的表名，允许正则表达式
         */
        private String exclude;
        
        /**
         * 实体是否为lombok模型（默认 false）
         */
        private Boolean entityLombokModel;
        
        /**
         * 生成 @RestController 控制器
         */
        private Boolean restControllerStyle;
        
        /**
         * 驼峰转连字符
         */
        private Boolean controllerMappingHyphenStyle;
        
        /**
         * 是否生成实体时，生成字段注解
         */
        private Boolean entityTableFieldAnnotationEnable;
        
        /**
         * 乐观锁属性名称
         */
        private String versionFieldName;
        
        /**
         * 逻辑删除属性名称
         */
        private String logicDeleteFieldName;
        
        /**
         * 表填充字段
         */
        private List<TableFillConfig> tableFillList;
    }

    @Data
    public static class TableFillConfig {
        /**
         * 字段名称
         */
        private String fieldName;
        
        /**
         * 字段填充策略
         */
        private String fieldFill;
    }
}