package com.example.annotation;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;
import java.util.concurrent.TimeUnit;

/**
 * 分布式锁注解
 * 用于标记需要使用分布式锁的方法
 */
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface DistributedLock {
    
    /**
     * 锁的key，支持SpEL表达式
     * 默认使用类名+方法名
     */
    String key() default "";
    
    /**
     * 锁的过期时间，默认30秒
     */
    long expireTime() default 30;
    
    /**
     * 时间单位，默认秒
     */
    TimeUnit timeUnit() default TimeUnit.SECONDS;
    
    /**
     * 获取锁失败时是否重试
     */
    boolean retry() default false;
    
    /**
     * 重试次数，默认3次
     */
    int retryTimes() default 3;
    
    /**
     * 重试间隔时间（毫秒），默认100ms
     */
    long retryInterval() default 100;
    
    /**
     * 获取锁失败时的处理策略
     */
    LockFailStrategy failStrategy() default LockFailStrategy.SKIP;
    
    /**
     * 锁失败处理策略枚举
     */
    enum LockFailStrategy {
        SKIP,      // 跳过执行
        EXCEPTION  // 抛出异常
    }
}