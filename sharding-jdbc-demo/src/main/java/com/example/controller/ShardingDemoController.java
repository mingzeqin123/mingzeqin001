package com.example.controller;

import com.example.entity.Order;
import com.example.entity.OrderItem;
import com.example.entity.User;
import com.example.entity.Config;
import com.example.service.UserService;
import com.example.service.OrderService;
import com.example.service.OrderItemService;
import com.example.service.ConfigService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Controller for demonstrating sharding functionality
 */
@Slf4j
@RestController
@RequestMapping("/api/sharding")
public class ShardingDemoController {
    
    @Autowired
    private UserService userService;
    
    @Autowired
    private OrderService orderService;
    
    @Autowired
    private OrderItemService orderItemService;
    
    @Autowired
    private ConfigService configService;
    
    /**
     * Initialize demo data
     */
    @PostMapping("/init")
    public Map<String, Object> initDemoData() {
        Map<String, Object> result = new HashMap<>();
        
        try {
            // Create some users
            User user1 = userService.createUser("zhang_san", "zhang@example.com", "13800001111", 25, "Beijing");
            User user2 = userService.createUser("li_si", "li@example.com", "13800002222", 30, "Shanghai");
            User user3 = userService.createUser("wang_wu", "wang@example.com", "13800003333", 28, "Guangzhou");
            User user4 = userService.createUser("zhao_liu", "zhao@example.com", "13800004444", 35, "Shenzhen");
            
            log.info("Created users: {}, {}, {}, {}", 
                    user1.getUserId(), user2.getUserId(), user3.getUserId(), user4.getUserId());
            
            // Create some orders
            List<OrderItem> items1 = Arrays.asList(
                    new OrderItem(null, user1.getUserId(), "iPhone 15", "IP15-128G", 1, new BigDecimal("5999.00")),
                    new OrderItem(null, user1.getUserId(), "AirPods Pro", "APP-2023", 1, new BigDecimal("1899.00"))
            );
            Order order1 = orderService.createOrder(user1.getUserId(), "Beijing Chaoyang District", items1);
            
            List<OrderItem> items2 = Arrays.asList(
                    new OrderItem(null, user2.getUserId(), "MacBook Pro", "MBP-M3-16", 1, new BigDecimal("12999.00"))
            );
            Order order2 = orderService.createOrder(user2.getUserId(), "Shanghai Pudong New Area", items2);
            
            List<OrderItem> items3 = Arrays.asList(
                    new OrderItem(null, user3.getUserId(), "iPad Air", "IPA-2024", 1, new BigDecimal("4399.00")),
                    new OrderItem(null, user3.getUserId(), "Apple Pencil", "AP-2024", 1, new BigDecimal("899.00"))
            );
            Order order3 = orderService.createOrder(user3.getUserId(), "Guangzhou Tianhe District", items3);
            
            // Create some config entries (broadcast table)
            configService.saveConfig("system.name", "ShardingSphere Demo", "System name configuration");
            configService.saveConfig("system.version", "1.0.0", "System version");
            configService.saveConfig("max.order.items", "10", "Maximum order items allowed");
            
            result.put("success", true);
            result.put("message", "Demo data initialized successfully");
            result.put("users", Arrays.asList(user1.getUserId(), user2.getUserId(), user3.getUserId(), user4.getUserId()));
            result.put("orders", Arrays.asList(order1.getOrderId(), order2.getOrderId(), order3.getOrderId()));
            
        } catch (Exception e) {
            log.error("Failed to initialize demo data", e);
            result.put("success", false);
            result.put("message", "Failed to initialize demo data: " + e.getMessage());
        }
        
        return result;
    }
    
    /**
     * Get user by ID (demonstrates single shard query)
     */
    @GetMapping("/user/{userId}")
    public User getUser(@PathVariable Long userId) {
        return userService.findById(userId);
    }
    
    /**
     * Get users by age range (demonstrates cross-shard query)
     */
    @GetMapping("/users/age")
    public List<User> getUsersByAge(@RequestParam Integer minAge, @RequestParam Integer maxAge) {
        return userService.findByAgeRange(minAge, maxAge);
    }
    
    /**
     * Get orders by user ID (demonstrates database sharding)
     */
    @GetMapping("/orders/user/{userId}")
    public List<Order> getOrdersByUser(@PathVariable Long userId) {
        return orderService.findByUserId(userId);
    }
    
    /**
     * Get order with items (demonstrates binding tables)
     */
    @GetMapping("/order/{orderId}/items")
    public Map<String, Object> getOrderWithItems(@PathVariable Long orderId) {
        Map<String, Object> result = new HashMap<>();
        Order order = orderService.findById(orderId);
        List<OrderItem> items = orderItemService.findByOrderId(orderId);
        
        result.put("order", order);
        result.put("items", items);
        return result;
    }
    
    /**
     * Get orders by amount range (demonstrates cross-shard query)
     */
    @GetMapping("/orders/amount")
    public List<Order> getOrdersByAmount(@RequestParam BigDecimal minAmount, @RequestParam BigDecimal maxAmount) {
        return orderService.findByAmountRange(minAmount, maxAmount);
    }
    
    /**
     * Update order status
     */
    @PutMapping("/order/{orderId}/status")
    public Order updateOrderStatus(@PathVariable Long orderId, @RequestParam String status) {
        return orderService.updateOrderStatus(orderId, status);
    }
    
    /**
     * Get config value (demonstrates broadcast table)
     */
    @GetMapping("/config/{key}")
    public Config getConfig(@PathVariable String key) {
        return configService.findByKey(key);
    }
    
    /**
     * Set config value (demonstrates broadcast table)
     */
    @PostMapping("/config")
    public Config setConfig(@RequestParam String key, @RequestParam String value, 
                           @RequestParam(required = false) String description) {
        return configService.saveConfig(key, value, description);
    }
    
    /**
     * Get sharding statistics
     */
    @GetMapping("/stats")
    public Map<String, Object> getShardingStats() {
        Map<String, Object> stats = new HashMap<>();
        
        stats.put("totalUsers", userService.getTotalUserCount());
        stats.put("pendingOrders", orderService.countByStatus("PENDING"));
        stats.put("completedOrders", orderService.countByStatus("COMPLETED"));
        
        return stats;
    }
}