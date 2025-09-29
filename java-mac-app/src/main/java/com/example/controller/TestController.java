package com.example.controller;

import com.example.service.DistributedLockTestService;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 测试控制器
 * 提供HTTP接口来测试分布式锁功能
 * 
 * 注意：这个控制器是可选的，仅用于演示
 * 实际项目中可以根据需要决定是否包含
 */
@RestController
@RequestMapping("/api/test")
@ConditionalOnProperty(name = "app.enable-test-controller", havingValue = "true", matchIfMissing = false)
public class TestController {
    
    private final DistributedLockTestService testService;
    
    public TestController(DistributedLockTestService testService) {
        this.testService = testService;
    }
    
    /**
     * 测试注解方式的分布式锁
     */
    @GetMapping("/annotation-lock")
    public String testAnnotationLock() {
        testService.testMethodWithLock();
        return "注解方式分布式锁测试完成，请查看日志";
    }
    
    /**
     * 测试手动方式的分布式锁
     */
    @GetMapping("/manual-lock")
    public String testManualLock() {
        testService.testManualLock();
        return "手动方式分布式锁测试完成，请查看日志";
    }
    
    /**
     * 测试锁状态查询
     */
    @GetMapping("/lock-status")
    public String testLockStatus() {
        testService.testLockStatus();
        return "锁状态查询测试完成，请查看日志";
    }
    
    /**
     * 测试锁重试机制
     */
    @GetMapping("/lock-retry")
    public String testLockRetry() {
        testService.testLockRetry();
        return "锁重试机制测试完成，请查看日志";
    }
}