package com.example.app.entity;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 订单实体类
 * 分表字段：order_id
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Order {
    
    /**
     * 订单ID - 分片键
     */
    private Long orderId;
    
    /**
     * 用户ID
     */
    private Long userId;
    
    /**
     * 订单号
     */
    private String orderNo;
    
    /**
     * 订单金额
     */
    private BigDecimal amount;
    
    /**
     * 订单状态：1-待支付，2-已支付，3-已发货，4-已完成，5-已取消
     */
    private Integer status;
    
    /**
     * 收货地址
     */
    private String address;
    
    /**
     * 收货人
     */
    private String receiver;
    
    /**
     * 收货人电话
     */
    private String receiverPhone;
    
    /**
     * 创建时间
     */
    private LocalDateTime createTime;
    
    /**
     * 更新时间
     */
    private LocalDateTime updateTime;
    
    /**
     * 备注
     */
    private String remark;
}