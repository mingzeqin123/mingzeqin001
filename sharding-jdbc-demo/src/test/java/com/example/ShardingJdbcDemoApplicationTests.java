package com.example;

import com.example.entity.Order;
import com.example.entity.OrderItem;
import com.example.entity.User;
import com.example.service.OrderService;
import com.example.service.UserService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import java.math.BigDecimal;
import java.util.Arrays;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Test class for ShardingSphere JDBC functionality
 */
@SpringBootTest
@ActiveProfiles("test")
class ShardingJdbcDemoApplicationTests {
    
    @Autowired
    private UserService userService;
    
    @Autowired
    private OrderService orderService;
    
    @Test
    void contextLoads() {
        // Test that Spring context loads successfully
        assertNotNull(userService);
        assertNotNull(orderService);
    }
    
    @Test
    void testUserSharding() {
        // Create users and verify they are distributed across shards
        User user1 = userService.createUser("test_user_1", "test1@example.com", "13800001111", 25, "Test City 1");
        User user2 = userService.createUser("test_user_2", "test2@example.com", "13800002222", 30, "Test City 2");
        
        assertNotNull(user1.getUserId());
        assertNotNull(user2.getUserId());
        
        // Verify users can be retrieved
        User retrievedUser1 = userService.findById(user1.getUserId());
        User retrievedUser2 = userService.findById(user2.getUserId());
        
        assertEquals(user1.getUsername(), retrievedUser1.getUsername());
        assertEquals(user2.getUsername(), retrievedUser2.getUsername());
        
        System.out.println("User 1 ID: " + user1.getUserId() + " (should route to shard: ds" + (user1.getUserId() % 2) + ")");
        System.out.println("User 2 ID: " + user2.getUserId() + " (should route to shard: ds" + (user2.getUserId() % 2) + ")");
    }
    
    @Test
    void testOrderSharding() {
        // Create a user first
        User user = userService.createUser("test_order_user", "order@example.com", "13800003333", 28, "Order City");
        
        // Create order items
        List<OrderItem> items = Arrays.asList(
                new OrderItem(null, user.getUserId(), "Test Product 1", "TP1-001", 2, new BigDecimal("100.00")),
                new OrderItem(null, user.getUserId(), "Test Product 2", "TP2-002", 1, new BigDecimal("200.00"))
        );
        
        // Create order
        Order order = orderService.createOrder(user.getUserId(), "Test Address", items);
        
        assertNotNull(order.getOrderId());
        assertEquals(new BigDecimal("400.00"), order.getTotalAmount());
        
        // Verify order can be retrieved
        Order retrievedOrder = orderService.findById(order.getOrderId());
        assertEquals(order.getOrderNumber(), retrievedOrder.getOrderNumber());
        
        System.out.println("Order ID: " + order.getOrderId() + " (should route to table: t_order_" + (order.getOrderId() % 4) + ")");
        System.out.println("User ID: " + user.getUserId() + " (should route to database: ds" + (user.getUserId() % 2) + ")");
    }
    
    @Test
    void testCrossShardQuery() {
        // Create multiple users
        User user1 = userService.createUser("cross_shard_1", "cs1@example.com", "13800004444", 25, "City A");
        User user2 = userService.createUser("cross_shard_2", "cs2@example.com", "13800005555", 30, "City B");
        User user3 = userService.createUser("cross_shard_3", "cs3@example.com", "13800006666", 35, "City C");
        
        // Query users by age range (cross-shard query)
        List<User> usersInRange = userService.findByAgeRange(20, 40);
        
        assertTrue(usersInRange.size() >= 3);
        System.out.println("Found " + usersInRange.size() + " users in age range 20-40 across all shards");
    }
}