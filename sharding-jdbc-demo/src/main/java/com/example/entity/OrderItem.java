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
 * Order Item entity for sharding demonstration
 * This table is bound with t_order table and uses the same sharding strategy
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@TableName("t_order_item")
public class OrderItem {
    
    @TableId(type = IdType.ASSIGN_ID)
    private Long orderItemId;
    
    private Long orderId;
    
    private Long userId;
    
    private String productName;
    
    private String productSku;
    
    private Integer quantity;
    
    private BigDecimal unitPrice;
    
    private BigDecimal totalPrice;
    
    private LocalDateTime createTime;
    
    private LocalDateTime updateTime;
    
    private Integer deleted;
    
    public OrderItem(Long orderId, Long userId, String productName, String productSku,
                     Integer quantity, BigDecimal unitPrice) {
        this.orderId = orderId;
        this.userId = userId;
        this.productName = productName;
        this.productSku = productSku;
        this.quantity = quantity;
        this.unitPrice = unitPrice;
        this.totalPrice = unitPrice.multiply(BigDecimal.valueOf(quantity));
        this.createTime = LocalDateTime.now();
        this.updateTime = LocalDateTime.now();
        this.deleted = 0;
    }
}