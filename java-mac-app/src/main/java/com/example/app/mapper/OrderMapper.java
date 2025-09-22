package com.example.app.mapper;

import com.example.app.entity.Order;
import org.apache.ibatis.annotations.*;

import java.math.BigDecimal;
import java.util.List;

/**
 * 订单Mapper接口
 */
@Mapper
public interface OrderMapper {
    
    /**
     * 插入订单
     */
    @Insert("INSERT INTO t_order (order_id, user_id, order_no, amount, status, address, receiver, receiver_phone, create_time, update_time, remark) " +
            "VALUES (#{orderId}, #{userId}, #{orderNo}, #{amount}, #{status}, #{address}, #{receiver}, #{receiverPhone}, #{createTime}, #{updateTime}, #{remark})")
    int insert(Order order);
    
    /**
     * 根据订单ID查询
     */
    @Select("SELECT * FROM t_order WHERE order_id = #{orderId}")
    Order selectById(@Param("orderId") Long orderId);
    
    /**
     * 根据订单号查询
     */
    @Select("SELECT * FROM t_order WHERE order_no = #{orderNo}")
    List<Order> selectByOrderNo(@Param("orderNo") String orderNo);
    
    /**
     * 根据用户ID查询订单
     */
    @Select("SELECT * FROM t_order WHERE user_id = #{userId} ORDER BY create_time DESC")
    List<Order> selectByUserId(@Param("userId") Long userId);
    
    /**
     * 分页查询订单
     */
    @Select("SELECT * FROM t_order ORDER BY create_time DESC LIMIT #{offset}, #{limit}")
    List<Order> selectPage(@Param("offset") int offset, @Param("limit") int limit);
    
    /**
     * 查询所有订单
     */
    @Select("SELECT * FROM t_order ORDER BY create_time DESC")
    List<Order> selectAll();
    
    /**
     * 更新订单
     */
    @Update("UPDATE t_order SET user_id = #{userId}, order_no = #{orderNo}, amount = #{amount}, " +
            "status = #{status}, address = #{address}, receiver = #{receiver}, receiver_phone = #{receiverPhone}, " +
            "update_time = #{updateTime}, remark = #{remark} WHERE order_id = #{orderId}")
    int update(Order order);
    
    /**
     * 删除订单
     */
    @Delete("DELETE FROM t_order WHERE order_id = #{orderId}")
    int deleteById(@Param("orderId") Long orderId);
    
    /**
     * 统计订单数量
     */
    @Select("SELECT COUNT(*) FROM t_order")
    int count();
    
    /**
     * 根据订单状态查询
     */
    @Select("SELECT * FROM t_order WHERE status = #{status} ORDER BY create_time DESC")
    List<Order> selectByStatus(@Param("status") Integer status);
    
    /**
     * 根据金额范围查询订单
     */
    @Select("SELECT * FROM t_order WHERE amount BETWEEN #{minAmount} AND #{maxAmount} ORDER BY create_time DESC")
    List<Order> selectByAmountRange(@Param("minAmount") BigDecimal minAmount, @Param("maxAmount") BigDecimal maxAmount);
    
    /**
     * 根据用户ID和状态查询订单
     */
    @Select("SELECT * FROM t_order WHERE user_id = #{userId} AND status = #{status} ORDER BY create_time DESC")
    List<Order> selectByUserIdAndStatus(@Param("userId") Long userId, @Param("status") Integer status);
}