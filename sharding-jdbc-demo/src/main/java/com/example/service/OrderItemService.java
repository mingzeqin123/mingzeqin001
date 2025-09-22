package com.example.service;

import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.example.entity.OrderItem;
import com.example.mapper.OrderItemMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Order Item service implementation
 */
@Slf4j
@Service
public class OrderItemService extends ServiceImpl<OrderItemMapper, OrderItem> {
    
    /**
     * Find order items by order ID
     * This will use the same sharding strategy as orders (binding table)
     */
    public List<OrderItem> findByOrderId(Long orderId) {
        List<OrderItem> items = baseMapper.findByOrderId(orderId);
        log.info("Found {} items for order: {}", items.size(), orderId);
        return items;
    }
    
    /**
     * Find order items by user ID
     * This will query the specific database based on user_id sharding
     */
    public List<OrderItem> findByUserId(Long userId) {
        List<OrderItem> items = baseMapper.findByUserId(userId);
        log.info("Found {} items for user: {}", items.size(), userId);
        return items;
    }
    
    /**
     * Find order items by product name
     * This will query across all shards
     */
    public List<OrderItem> findByProductName(String productName) {
        List<OrderItem> items = baseMapper.findByProductName(productName);
        log.info("Found {} items for product: {}", items.size(), productName);
        return items;
    }
}