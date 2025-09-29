package com.example.controller;

import com.example.task.ScheduledTaskService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

/**
 * 任务控制器
 * 提供手动触发任务的HTTP接口
 */
@Slf4j
@RestController
@RequestMapping("/api/task")
public class TaskController {

    @Autowired
    private ScheduledTaskService scheduledTaskService;

    /**
     * 手动触发任务
     */
    @PostMapping("/manual")
    public Map<String, Object> triggerManualTask() {
        Map<String, Object> result = new HashMap<>();
        String taskId = UUID.randomUUID().toString();
        
        try {
            scheduledTaskService.manualTask(taskId);
            result.put("success", true);
            result.put("message", "任务执行成功");
            result.put("taskId", taskId);
        } catch (Exception e) {
            log.error("手动任务执行失败", e);
            result.put("success", false);
            result.put("message", "任务执行失败: " + e.getMessage());
            result.put("taskId", taskId);
        }
        
        return result;
    }

    /**
     * 手动触发任务（带任务ID）
     */
    @PostMapping("/manual/{taskId}")
    public Map<String, Object> triggerManualTaskWithId(@PathVariable String taskId) {
        Map<String, Object> result = new HashMap<>();
        
        try {
            scheduledTaskService.manualTask(taskId);
            result.put("success", true);
            result.put("message", "任务执行成功");
            result.put("taskId", taskId);
        } catch (Exception e) {
            log.error("手动任务执行失败，taskId: {}", taskId, e);
            result.put("success", false);
            result.put("message", "任务执行失败: " + e.getMessage());
            result.put("taskId", taskId);
        }
        
        return result;
    }

    /**
     * 健康检查接口
     */
    @GetMapping("/health")
    public Map<String, Object> health() {
        Map<String, Object> result = new HashMap<>();
        result.put("status", "UP");
        result.put("timestamp", System.currentTimeMillis());
        return result;
    }
}