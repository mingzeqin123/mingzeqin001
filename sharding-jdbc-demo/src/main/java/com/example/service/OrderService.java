package com.example.service;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.example.entity.Order;
import com.example.entity.OrderItem;
import com.example.mapper.OrderMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

/**
 * Order service implementation
 */
@Slf4j
@Service
public class OrderService extends ServiceImpl<OrderMapper, Order> {
    
    @Autowired
    private OrderItemService orderItemService;
    
    /**
     * Create a new order with order items
     * This demonstrates transaction across sharded tables
     */
    @Transactional
    public Order createOrder(Long userId, String shippingAddress, List<OrderItem> orderItems) {
        // Generate order number
        String orderNumber = "ORD-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        
        // Calculate total amount
        BigDecimal totalAmount = orderItems.stream()
                .map(OrderItem::getTotalPrice)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        // Create order
        Order order = new Order(userId, orderNumber, totalAmount, "PENDING", shippingAddress);
        boolean saved = save(order);
        
        if (saved) {
            log.info("Order created successfully: {}", order);
            
            // Create order items
            for (OrderItem item : orderItems) {
                item.setOrderId(order.getOrderId());
                item.setUserId(userId);
            }
            
            boolean itemsSaved = orderItemService.saveBatch(orderItems);
            if (itemsSaved) {
                log.info("Created {} order items for order: {}", orderItems.size(), order.getOrderId());
            } else {
                throw new RuntimeException("Failed to create order items");
            }
            
            return order;
        } else {
            throw new RuntimeException("Failed to create order");
        }
    }
    
    /**
     * Find orders by user ID
     * This will query the specific database based on user_id sharding
     */
    public List<Order> findByUserId(Long userId) {
        List<Order> orders = baseMapper.findByUserId(userId);
        log.info("Found {} orders for user: {}", orders.size(), userId);
        return orders;
    }
    
    /**
     * Find order by ID
     * This will query across shards to find the order
     */
    public Order findById(Long orderId) {
        Order order = getById(orderId);
        if (order != null) {
            log.info("Found order: {}", order);
        }
        return order;
    }
    
    /**
     * Find orders by amount range
     * This will query across all shards
     */
    public List<Order> findByAmountRange(BigDecimal minAmount, BigDecimal maxAmount) {
        List<Order> orders = baseMapper.findByAmountRange(minAmount, maxAmount);
        log.info("Found {} orders in amount range {}-{}", orders.size(), minAmount, maxAmount);
        return orders;
    }
    
    /**
     * Update order status
     * This will be routed to the correct shard based on order_id
     */
    @Transactional
    public Order updateOrderStatus(Long orderId, String status) {
        Order order = getById(orderId);
        if (order != null) {
            order.setStatus(status);
            boolean updated = updateById(order);
            if (updated) {
                log.info("Order status updated successfully: {}", order);
                return order;
            }
        }
        throw new RuntimeException("Failed to update order status for ID: " + orderId);
    }
    
    /**
     * Get order with items
     * This demonstrates querying binding tables
     */
    public Order getOrderWithItems(Long orderId) {
        Order order = getById(orderId);
        if (order != null) {
            List<OrderItem> items = orderItemService.findByOrderId(orderId);
            log.info("Found order with {} items", items.size());
            // You could add items to order object if needed
        }
        return order;
    }
    
    /**
     * Count orders by status
     * This will aggregate results from all shards
     */
    public long countByStatus(String status) {
        long count = baseMapper.countByStatus(status);
        log.info("Found {} orders with status: {}", count, status);
        return count;
    }
}