package com.example.app.service;

import com.example.app.entity.Order;
import com.example.app.mapper.OrderMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * 订单服务类
 * 演示分表操作
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class OrderService {
    
    private final OrderMapper orderMapper;
    
    /**
     * 创建订单
     */
    @Transactional
    public Order createOrder(Order order) {
        order.setCreateTime(LocalDateTime.now());
        order.setUpdateTime(LocalDateTime.now());
        if (order.getStatus() == null) {
            order.setStatus(1); // 默认状态为待支付
        }
        
        int result = orderMapper.insert(order);
        log.info("创建订单结果: {}, 订单ID: {}", result, order.getOrderId());
        
        return order;
    }
    
    /**
     * 根据ID获取订单
     */
    public Order getOrderById(Long orderId) {
        Order order = orderMapper.selectById(orderId);
        log.info("查询订单ID: {}, 结果: {}", orderId, order != null ? "找到" : "未找到");
        return order;
    }
    
    /**
     * 根据订单号获取订单
     */
    public List<Order> getOrdersByOrderNo(String orderNo) {
        List<Order> orders = orderMapper.selectByOrderNo(orderNo);
        log.info("根据订单号查询: {}, 结果数量: {}", orderNo, orders.size());
        return orders;
    }
    
    /**
     * 根据用户ID获取订单
     */
    public List<Order> getOrdersByUserId(Long userId) {
        List<Order> orders = orderMapper.selectByUserId(userId);
        log.info("根据用户ID查询订单: {}, 结果数量: {}", userId, orders.size());
        return orders;
    }
    
    /**
     * 分页获取订单
     */
    public List<Order> getOrders(int page, int size) {
        int offset = (page - 1) * size;
        List<Order> orders = orderMapper.selectPage(offset, size);
        log.info("分页查询订单: 页码={}, 大小={}, 结果数量={}", page, size, orders.size());
        return orders;
    }
    
    /**
     * 获取所有订单
     */
    public List<Order> getAllOrders() {
        List<Order> orders = orderMapper.selectAll();
        log.info("查询所有订单, 结果数量: {}", orders.size());
        return orders;
    }
    
    /**
     * 更新订单
     */
    @Transactional
    public boolean updateOrder(Order order) {
        order.setUpdateTime(LocalDateTime.now());
        int result = orderMapper.update(order);
        log.info("更新订单: {}, 结果: {}", order.getOrderId(), result > 0 ? "成功" : "失败");
        return result > 0;
    }
    
    /**
     * 删除订单
     */
    @Transactional
    public boolean deleteOrder(Long orderId) {
        int result = orderMapper.deleteById(orderId);
        log.info("删除订单: {}, 结果: {}", orderId, result > 0 ? "成功" : "失败");
        return result > 0;
    }
    
    /**
     * 统计订单数量
     */
    public int getOrderCount() {
        int count = orderMapper.count();
        log.info("订单总数: {}", count);
        return count;
    }
    
    /**
     * 根据订单状态查询
     */
    public List<Order> getOrdersByStatus(Integer status) {
        List<Order> orders = orderMapper.selectByStatus(status);
        log.info("根据状态查询订单: {}, 结果数量: {}", status, orders.size());
        return orders;
    }
    
    /**
     * 根据金额范围查询订单
     */
    public List<Order> getOrdersByAmountRange(BigDecimal minAmount, BigDecimal maxAmount) {
        List<Order> orders = orderMapper.selectByAmountRange(minAmount, maxAmount);
        log.info("金额范围查询订单: {}-{}, 结果数量: {}", minAmount, maxAmount, orders.size());
        return orders;
    }
    
    /**
     * 根据用户ID和状态查询订单
     */
    public List<Order> getOrdersByUserIdAndStatus(Long userId, Integer status) {
        List<Order> orders = orderMapper.selectByUserIdAndStatus(userId, status);
        log.info("用户{}状态{}订单查询, 结果数量: {}", userId, status, orders.size());
        return orders;
    }
    
    /**
     * 批量创建订单（演示分表分布）
     */
    @Transactional
    public void createOrdersBatch(int count) {
        log.info("开始批量创建订单，数量: {}", count);
        
        for (int i = 1; i <= count; i++) {
            Order order = Order.builder()
                    .orderId((long) i)
                    .userId((long) (i % 100 + 1)) // 模拟100个用户
                    .orderNo("ORD" + String.format("%010d", i))
                    .amount(new BigDecimal(100 + (i % 1000)))
                    .status(i % 5 + 1) // 1-5的随机状态
                    .address("地址" + i)
                    .receiver("收货人" + i)
                    .receiverPhone("139" + String.format("%08d", i))
                    .createTime(LocalDateTime.now())
                    .updateTime(LocalDateTime.now())
                    .remark("订单备注" + i)
                    .build();
            
            orderMapper.insert(order);
            
            if (i % 100 == 0) {
                log.info("已创建订单数量: {}", i);
            }
        }
        
        log.info("批量创建订单完成，总数量: {}", count);
    }
    
    /**
     * 模拟订单状态流转
     */
    @Transactional
    public void simulateOrderFlow(Long orderId) {
        Order order = getOrderById(orderId);
        if (order == null) {
            log.warn("订单不存在: {}", orderId);
            return;
        }
        
        // 状态流转：1-待支付 -> 2-已支付 -> 3-已发货 -> 4-已完成
        int currentStatus = order.getStatus();
        int newStatus = currentStatus + 1;
        
        if (newStatus <= 4) {
            order.setStatus(newStatus);
            order.setUpdateTime(LocalDateTime.now());
            updateOrder(order);
            log.info("订单状态流转: {} -> {}", currentStatus, newStatus);
        } else {
            log.info("订单已完成，无需流转");
        }
    }
}