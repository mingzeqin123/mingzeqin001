package com.example.app;

import com.example.app.entity.Order;
import com.example.app.entity.User;
import com.example.app.service.OrderService;
import com.example.app.service.UserService;
import lombok.extern.slf4j.Slf4j;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Sharding JDBC 分表功能测试
 */
@Slf4j
@SpringBootTest
public class ShardingTest {

    @Autowired
    private UserService userService;

    @Autowired
    private OrderService orderService;

    /**
     * 测试用户分表功能
     */
    @Test
    public void testUserSharding() {
        log.info("=== 开始测试用户分表功能 ===");

        // 创建测试用户
        User user1 = User.builder()
                .userId(1L)
                .username("user1")
                .email("user1@example.com")
                .phone("13800000001")
                .age(25)
                .gender(1)
                .createTime(LocalDateTime.now())
                .updateTime(LocalDateTime.now())
                .status(1)
                .build();

        User user2 = User.builder()
                .userId(2L)
                .username("user2")
                .email("user2@example.com")
                .phone("13800000002")
                .age(30)
                .gender(2)
                .createTime(LocalDateTime.now())
                .updateTime(LocalDateTime.now())
                .status(1)
                .build();

        // 插入用户（会根据user_id进行分表）
        userService.createUser(user1); // 应该分到 t_user_1 (1 % 2 = 1)
        userService.createUser(user2); // 应该分到 t_user_0 (2 % 2 = 0)

        // 查询用户验证分表
        User foundUser1 = userService.getUserById(1L);
        User foundUser2 = userService.getUserById(2L);

        log.info("查询到用户1: {}", foundUser1);
        log.info("查询到用户2: {}", foundUser2);

        // 验证查询结果
        assert foundUser1 != null : "用户1应该存在";
        assert foundUser2 != null : "用户2应该存在";
        assert "user1".equals(foundUser1.getUsername()) : "用户1用户名不正确";
        assert "user2".equals(foundUser2.getUsername()) : "用户2用户名不正确";

        log.info("=== 用户分表功能测试通过 ===");
    }

    /**
     * 测试订单分表功能
     */
    @Test
    public void testOrderSharding() {
        log.info("=== 开始测试订单分表功能 ===");

        // 创建测试订单
        Order order1 = Order.builder()
                .orderId(1L)
                .userId(1L)
                .orderNo("ORD0000000001")
                .amount(new BigDecimal("99.99"))
                .status(1)
                .address("测试地址1")
                .receiver("收货人1")
                .receiverPhone("13900000001")
                .createTime(LocalDateTime.now())
                .updateTime(LocalDateTime.now())
                .remark("测试订单1")
                .build();

        Order order2 = Order.builder()
                .orderId(2L)
                .userId(2L)
                .orderNo("ORD0000000002")
                .amount(new BigDecimal("199.99"))
                .status(2)
                .address("测试地址2")
                .receiver("收货人2")
                .receiverPhone("13900000002")
                .createTime(LocalDateTime.now())
                .updateTime(LocalDateTime.now())
                .remark("测试订单2")
                .build();

        // 插入订单（会根据order_id进行分表）
        orderService.createOrder(order1); // 应该分到 t_order_1 (1 % 2 = 1)
        orderService.createOrder(order2); // 应该分到 t_order_0 (2 % 2 = 0)

        // 查询订单验证分表
        Order foundOrder1 = orderService.getOrderById(1L);
        Order foundOrder2 = orderService.getOrderById(2L);

        log.info("查询到订单1: {}", foundOrder1);
        log.info("查询到订单2: {}", foundOrder2);

        // 验证查询结果
        assert foundOrder1 != null : "订单1应该存在";
        assert foundOrder2 != null : "订单2应该存在";
        assert "ORD0000000001".equals(foundOrder1.getOrderNo()) : "订单1订单号不正确";
        assert "ORD0000000002".equals(foundOrder2.getOrderNo()) : "订单2订单号不正确";

        log.info("=== 订单分表功能测试通过 ===");
    }

    /**
     * 测试批量操作
     */
    @Test
    public void testBatchOperations() {
        log.info("=== 开始测试批量操作 ===");

        // 批量创建用户
        userService.createUsersBatch(10);
        
        // 批量创建订单
        orderService.createOrdersBatch(10);

        // 验证数据分布
        int userCount = userService.getUserCount();
        int orderCount = orderService.getOrderCount();

        log.info("用户总数: {}", userCount);
        log.info("订单总数: {}", orderCount);

        // 验证数据是否正确插入
        assert userCount >= 10 : "用户数量应该至少为10";
        assert orderCount >= 10 : "订单数量应该至少为10";

        log.info("=== 批量操作测试通过 ===");
    }

    /**
     * 测试跨表查询
     */
    @Test
    public void testCrossTableQuery() {
        log.info("=== 开始测试跨表查询 ===");

        // 先创建一些测试数据
        userService.createUsersBatch(5);
        orderService.createOrdersBatch(5);

        // 测试查询所有用户（跨表查询）
        List<User> allUsers = userService.getAllUsers();
        log.info("查询到所有用户数量: {}", allUsers.size());

        // 测试查询所有订单（跨表查询）
        List<Order> allOrders = orderService.getAllOrders();
        log.info("查询到所有订单数量: {}", allOrders.size());

        // 验证查询结果
        assert allUsers.size() >= 5 : "应该查询到至少5个用户";
        assert allOrders.size() >= 5 : "应该查询到至少5个订单";

        log.info("=== 跨表查询测试通过 ===");
    }

    /**
     * 测试复杂查询
     */
    @Test
    public void testComplexQuery() {
        log.info("=== 开始测试复杂查询 ===");

        // 先创建测试数据
        userService.createUsersBatch(10);
        orderService.createOrdersBatch(10);

        // 测试年龄范围查询
        List<User> usersByAge = userService.getUsersByAgeRange(20, 30);
        log.info("年龄20-30的用户数量: {}", usersByAge.size());

        // 测试金额范围查询
        List<Order> ordersByAmount = orderService.getOrdersByAmountRange(
                new BigDecimal("100"), new BigDecimal("200"));
        log.info("金额100-200的订单数量: {}", ordersByAmount.size());

        // 测试订单状态查询
        List<Order> ordersByStatus = orderService.getOrdersByStatus(1);
        log.info("状态为1的订单数量: {}", ordersByStatus.size());

        log.info("=== 复杂查询测试通过 ===");
    }
}