package com.example.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Order entity for sharding demonstration
 * This table will be sharded by user_id (database) and order_id (table)
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@TableName("t_order")
public class Order {
    
    @TableId(type = IdType.ASSIGN_ID)
    private Long orderId;
    
    private Long userId;
    
    private String orderNumber;
    
    private BigDecimal totalAmount;
    
    private String status;
    
    private String shippingAddress;
    
    private LocalDateTime createTime;
    
    private LocalDateTime updateTime;
    
    private Integer deleted;
    
    public Order(Long userId, String orderNumber, BigDecimal totalAmount, 
                 String status, String shippingAddress) {
        this.userId = userId;
        this.orderNumber = orderNumber;
        this.totalAmount = totalAmount;
        this.status = status;
        this.shippingAddress = shippingAddress;
        this.createTime = LocalDateTime.now();
        this.updateTime = LocalDateTime.now();
        this.deleted = 0;
    }
}