package com.example.task;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;

import static org.junit.jupiter.api.Assertions.*;

/**
 * 定时任务服务测试类
 */
@SpringBootTest
@ActiveProfiles("test")
public class ScheduledTaskServiceTest {

    @Autowired
    private ScheduledTaskService scheduledTaskService;

    @Test
    public void testManualTask() {
        String taskId = "test-task-001";
        
        // 测试手动任务执行
        assertDoesNotThrow(() -> scheduledTaskService.manualTask(taskId));
    }

    @Test
    public void testConcurrentManualTask() throws InterruptedException {
        String taskId = "test-task-concurrent";
        int threadCount = 5;
        ExecutorService executor = Executors.newFixedThreadPool(threadCount);
        CountDownLatch latch = new CountDownLatch(threadCount);
        AtomicInteger successCount = new AtomicInteger(0);
        AtomicInteger failCount = new AtomicInteger(0);

        for (int i = 0; i < threadCount; i++) {
            executor.submit(() -> {
                try {
                    scheduledTaskService.manualTask(taskId);
                    successCount.incrementAndGet();
                } catch (Exception e) {
                    failCount.incrementAndGet();
                } finally {
                    latch.countDown();
                }
            });
        }

        latch.await(10, TimeUnit.SECONDS);
        executor.shutdown();

        // 由于分布式锁的存在，只有一个线程能成功执行
        assertEquals(1, successCount.get());
        assertEquals(threadCount - 1, failCount.get());
    }

    @Test
    public void testDifferentTaskIds() {
        String taskId1 = "test-task-001";
        String taskId2 = "test-task-002";
        
        // 不同的任务ID应该可以并发执行
        assertDoesNotThrow(() -> {
            scheduledTaskService.manualTask(taskId1);
            scheduledTaskService.manualTask(taskId2);
        });
    }
}