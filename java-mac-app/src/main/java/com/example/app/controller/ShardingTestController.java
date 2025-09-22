package com.example.app.controller;

import com.example.app.entity.Order;
import com.example.app.entity.User;
import com.example.app.service.OrderService;
import com.example.app.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Sharding JDBC 分表测试控制器
 */
@Slf4j
@RestController
@RequestMapping("/api/sharding")
@RequiredArgsConstructor
public class ShardingTestController {
    
    private final UserService userService;
    private final OrderService orderService;
    
    /**
     * 首页
     */
    @GetMapping("/")
    public Map<String, Object> index() {
        Map<String, Object> result = new HashMap<>();
        result.put("message", "Sharding JDBC 分表演示");
        result.put("timestamp", LocalDateTime.now());
        result.put("endpoints", new String[]{
            "GET /api/sharding/users - 获取所有用户",
            "GET /api/sharding/users/{id} - 获取用户",
            "POST /api/sharding/users - 创建用户",
            "GET /api/sharding/orders - 获取所有订单",
            "GET /api/sharding/orders/{id} - 获取订单",
            "POST /api/sharding/orders - 创建订单",
            "POST /api/sharding/batch/users/{count} - 批量创建用户",
            "POST /api/sharding/batch/orders/{count} - 批量创建订单",
            "GET /api/sharding/stats - 获取统计信息"
        });
        return result;
    }
    
    // ==================== 用户相关接口 ====================
    
    /**
     * 获取所有用户
     */
    @GetMapping("/users")
    public List<User> getAllUsers() {
        return userService.getAllUsers();
    }
    
    /**
     * 根据ID获取用户
     */
    @GetMapping("/users/{id}")
    public User getUserById(@PathVariable Long id) {
        return userService.getUserById(id);
    }
    
    /**
     * 创建用户
     */
    @PostMapping("/users")
    public User createUser(@RequestBody User user) {
        return userService.createUser(user);
    }
    
    /**
     * 根据用户名查询用户
     */
    @GetMapping("/users/search/username/{username}")
    public List<User> getUsersByUsername(@PathVariable String username) {
        return userService.getUsersByUsername(username);
    }
    
    /**
     * 根据年龄范围查询用户
     */
    @GetMapping("/users/search/age")
    public List<User> getUsersByAgeRange(@RequestParam int minAge, @RequestParam int maxAge) {
        return userService.getUsersByAgeRange(minAge, maxAge);
    }
    
    /**
     * 分页获取用户
     */
    @GetMapping("/users/page")
    public List<User> getUsersPage(@RequestParam(defaultValue = "1") int page, 
                                  @RequestParam(defaultValue = "10") int size) {
        return userService.getUsers(page, size);
    }
    
    /**
     * 更新用户
     */
    @PutMapping("/users/{id}")
    public boolean updateUser(@PathVariable Long id, @RequestBody User user) {
        user.setUserId(id);
        return userService.updateUser(user);
    }
    
    /**
     * 删除用户
     */
    @DeleteMapping("/users/{id}")
    public boolean deleteUser(@PathVariable Long id) {
        return userService.deleteUser(id);
    }
    
    // ==================== 订单相关接口 ====================
    
    /**
     * 获取所有订单
     */
    @GetMapping("/orders")
    public List<Order> getAllOrders() {
        return orderService.getAllOrders();
    }
    
    /**
     * 根据ID获取订单
     */
    @GetMapping("/orders/{id}")
    public Order getOrderById(@PathVariable Long id) {
        return orderService.getOrderById(id);
    }
    
    /**
     * 创建订单
     */
    @PostMapping("/orders")
    public Order createOrder(@RequestBody Order order) {
        return orderService.createOrder(order);
    }
    
    /**
     * 根据用户ID查询订单
     */
    @GetMapping("/orders/user/{userId}")
    public List<Order> getOrdersByUserId(@PathVariable Long userId) {
        return orderService.getOrdersByUserId(userId);
    }
    
    /**
     * 根据订单状态查询
     */
    @GetMapping("/orders/status/{status}")
    public List<Order> getOrdersByStatus(@PathVariable Integer status) {
        return orderService.getOrdersByStatus(status);
    }
    
    /**
     * 根据金额范围查询订单
     */
    @GetMapping("/orders/amount")
    public List<Order> getOrdersByAmountRange(@RequestParam BigDecimal minAmount, 
                                             @RequestParam BigDecimal maxAmount) {
        return orderService.getOrdersByAmountRange(minAmount, maxAmount);
    }
    
    /**
     * 分页获取订单
     */
    @GetMapping("/orders/page")
    public List<Order> getOrdersPage(@RequestParam(defaultValue = "1") int page, 
                                    @RequestParam(defaultValue = "10") int size) {
        return orderService.getOrders(page, size);
    }
    
    /**
     * 更新订单
     */
    @PutMapping("/orders/{id}")
    public boolean updateOrder(@PathVariable Long id, @RequestBody Order order) {
        order.setOrderId(id);
        return orderService.updateOrder(order);
    }
    
    /**
     * 删除订单
     */
    @DeleteMapping("/orders/{id}")
    public boolean deleteOrder(@PathVariable Long id) {
        return orderService.deleteOrder(id);
    }
    
    /**
     * 订单状态流转
     */
    @PostMapping("/orders/{id}/flow")
    public void simulateOrderFlow(@PathVariable Long id) {
        orderService.simulateOrderFlow(id);
    }
    
    // ==================== 批量操作接口 ====================
    
    /**
     * 批量创建用户
     */
    @PostMapping("/batch/users/{count}")
    public Map<String, Object> batchCreateUsers(@PathVariable int count) {
        long startTime = System.currentTimeMillis();
        userService.createUsersBatch(count);
        long endTime = System.currentTimeMillis();
        
        Map<String, Object> result = new HashMap<>();
        result.put("message", "批量创建用户完成");
        result.put("count", count);
        result.put("duration", endTime - startTime + "ms");
        return result;
    }
    
    /**
     * 批量创建订单
     */
    @PostMapping("/batch/orders/{count}")
    public Map<String, Object> batchCreateOrders(@PathVariable int count) {
        long startTime = System.currentTimeMillis();
        orderService.createOrdersBatch(count);
        long endTime = System.currentTimeMillis();
        
        Map<String, Object> result = new HashMap<>();
        result.put("message", "批量创建订单完成");
        result.put("count", count);
        result.put("duration", endTime - startTime + "ms");
        return result;
    }
    
    // ==================== 统计信息接口 ====================
    
    /**
     * 获取统计信息
     */
    @GetMapping("/stats")
    public Map<String, Object> getStats() {
        Map<String, Object> stats = new HashMap<>();
        stats.put("userCount", userService.getUserCount());
        stats.put("orderCount", orderService.getOrderCount());
        stats.put("timestamp", LocalDateTime.now());
        
        // 分表分布统计
        Map<String, Object> shardingStats = new HashMap<>();
        shardingStats.put("description", "分表配置");
        shardingStats.put("databases", new String[]{"ds0", "ds1"});
        shardingStats.put("userTables", new String[]{"t_user_0", "t_user_1"});
        shardingStats.put("orderTables", new String[]{"t_order_0", "t_order_1"});
        shardingStats.put("shardingStrategy", "按ID取模分表");
        
        stats.put("sharding", shardingStats);
        return stats;
    }
}