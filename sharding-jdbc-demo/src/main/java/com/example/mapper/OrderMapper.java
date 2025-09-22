package com.example.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.example.entity.Order;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Select;

import java.math.BigDecimal;
import java.util.List;

/**
 * Order mapper interface
 */
@Mapper
public interface OrderMapper extends BaseMapper<Order> {
    
    /**
     * Find orders by user ID
     * This will query specific database based on user_id sharding
     */
    @Select("SELECT * FROM t_order WHERE user_id = #{userId}")
    List<Order> findByUserId(Long userId);
    
    /**
     * Find orders by total amount range
     * This will query across all shards
     */
    @Select("SELECT * FROM t_order WHERE total_amount BETWEEN #{minAmount} AND #{maxAmount}")
    List<Order> findByAmountRange(BigDecimal minAmount, BigDecimal maxAmount);
    
    /**
     * Count orders by status
     * This demonstrates broadcast query across all shards
     */
    @Select("SELECT COUNT(*) FROM t_order WHERE status = #{status}")
    Long countByStatus(String status);
}