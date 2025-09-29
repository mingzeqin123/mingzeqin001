package com.example.annotation;

import java.lang.annotation.*;
import java.util.concurrent.TimeUnit;

/**
 * 分布式锁注解
 * 用于标记需要分布式锁保护的方法
 */
@Target({ElementType.METHOD})
@Retention(RetentionPolicy.RUNTIME)
@Documented
public @interface DistributedLock {

    /**
     * 锁的key，支持SpEL表达式
     * 默认为方法名
     */
    String key() default "";

    /**
     * 锁的过期时间
     * 默认30秒
     */
    long expireTime() default 30;

    /**
     * 时间单位
     * 默认秒
     */
    TimeUnit timeUnit() default TimeUnit.SECONDS;

    /**
     * 重试次数
     * 默认不重试
     */
    int retryTimes() default 0;

    /**
     * 重试间隔（毫秒）
     * 默认1000毫秒
     */
    long retryInterval() default 1000;

    /**
     * 获取锁失败时的处理方式
     * true: 抛出异常
     * false: 静默跳过
     */
    boolean throwException() default false;

    /**
     * 异常信息
     */
    String message() default "获取分布式锁失败";
}