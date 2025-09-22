package com.example.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.example.entity.OrderItem;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Select;

import java.util.List;

/**
 * Order Item mapper interface
 */
@Mapper
public interface OrderItemMapper extends BaseMapper<OrderItem> {
    
    /**
     * Find order items by order ID
     * This will use the same sharding strategy as orders (binding table)
     */
    @Select("SELECT * FROM t_order_item WHERE order_id = #{orderId}")
    List<OrderItem> findByOrderId(Long orderId);
    
    /**
     * Find order items by user ID
     * This will query specific database based on user_id sharding
     */
    @Select("SELECT * FROM t_order_item WHERE user_id = #{userId}")
    List<OrderItem> findByUserId(Long userId);
    
    /**
     * Find order items by product name
     * This will query across all shards
     */
    @Select("SELECT * FROM t_order_item WHERE product_name LIKE CONCAT('%', #{productName}, '%')")
    List<OrderItem> findByProductName(String productName);
}