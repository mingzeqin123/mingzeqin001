"""
优惠券系统数据库模型
"""
from datetime import datetime
from decimal import Decimal
from enum import Enum
from typing import Optional
from sqlalchemy import Column, Integer, String, DateTime, Decimal as SQLDecimal, Boolean, Text, ForeignKey, Index
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship

Base = declarative_base()


class CouponType(str, Enum):
    """优惠券类型"""
    FIXED_AMOUNT = "fixed_amount"  # 固定金额
    PERCENTAGE = "percentage"      # 百分比折扣
    FREE_SHIPPING = "free_shipping"  # 免运费


class CouponStatus(str, Enum):
    """优惠券状态"""
    ACTIVE = "active"      # 激活
    INACTIVE = "inactive"  # 未激活
    EXPIRED = "expired"    # 已过期
    DELETED = "deleted"    # 已删除


class UserCouponStatus(str, Enum):
    """用户优惠券状态"""
    AVAILABLE = "available"  # 可用
    USED = "used"           # 已使用
    EXPIRED = "expired"     # 已过期
    REFUNDED = "refunded"   # 已退款


class OrderStatus(str, Enum):
    """订单状态"""
    PENDING = "pending"        # 待支付
    PAID = "paid"             # 已支付
    CANCELLED = "cancelled"    # 已取消
    REFUNDED = "refunded"      # 已退款


class PaymentStatus(str, Enum):
    """支付状态"""
    PENDING = "pending"        # 待支付
    SUCCESS = "success"        # 支付成功
    FAILED = "failed"          # 支付失败
    REFUNDED = "refunded"      # 已退款


class Coupon(Base):
    """优惠券表"""
    __tablename__ = 'coupons'
    
    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(50), unique=True, index=True, nullable=False, comment="优惠券代码")
    name = Column(String(100), nullable=False, comment="优惠券名称")
    description = Column(Text, comment="优惠券描述")
    type = Column(String(20), nullable=False, comment="优惠券类型")
    
    # 优惠券规则
    discount_value = Column(SQLDecimal(10, 2), nullable=False, comment="折扣值")
    min_order_amount = Column(SQLDecimal(10, 2), default=0, comment="最低订单金额")
    max_discount_amount = Column(SQLDecimal(10, 2), comment="最大折扣金额")
    
    # 使用限制
    total_quantity = Column(Integer, nullable=False, comment="总发放数量")
    used_quantity = Column(Integer, default=0, comment="已使用数量")
    per_user_limit = Column(Integer, default=1, comment="每用户限领数量")
    
    # 时间限制
    valid_from = Column(DateTime, nullable=False, comment="有效期开始")
    valid_until = Column(DateTime, nullable=False, comment="有效期结束")
    
    # 状态
    status = Column(String(20), default=CouponStatus.ACTIVE, comment="优惠券状态")
    
    # 适用商品/分类
    applicable_products = Column(Text, comment="适用商品ID列表(JSON)")
    applicable_categories = Column(Text, comment="适用分类ID列表(JSON)")
    
    # 时间戳
    created_at = Column(DateTime, default=datetime.utcnow, comment="创建时间")
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, comment="更新时间")
    
    # 关联关系
    user_coupons = relationship("UserCoupon", back_populates="coupon")
    order_items = relationship("OrderItem", back_populates="coupon")
    
    # 索引
    __table_args__ = (
        Index('idx_coupon_code', 'code'),
        Index('idx_coupon_status', 'status'),
        Index('idx_coupon_valid_period', 'valid_from', 'valid_until'),
    )


class UserCoupon(Base):
    """用户优惠券表"""
    __tablename__ = 'user_coupons'
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False, index=True, comment="用户ID")
    coupon_id = Column(Integer, ForeignKey('coupons.id'), nullable=False, comment="优惠券ID")
    
    # 状态
    status = Column(String(20), default=UserCouponStatus.AVAILABLE, comment="用户优惠券状态")
    
    # 使用信息
    used_at = Column(DateTime, comment="使用时间")
    order_id = Column(Integer, comment="使用的订单ID")
    
    # 时间戳
    obtained_at = Column(DateTime, default=datetime.utcnow, comment="获得时间")
    created_at = Column(DateTime, default=datetime.utcnow, comment="创建时间")
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, comment="更新时间")
    
    # 关联关系
    coupon = relationship("Coupon", back_populates="user_coupons")
    
    # 索引
    __table_args__ = (
        Index('idx_user_coupon_user', 'user_id'),
        Index('idx_user_coupon_status', 'status'),
        Index('idx_user_coupon_user_status', 'user_id', 'status'),
    )


class Order(Base):
    """订单表"""
    __tablename__ = 'orders'
    
    id = Column(Integer, primary_key=True, index=True)
    order_no = Column(String(50), unique=True, index=True, nullable=False, comment="订单号")
    user_id = Column(Integer, nullable=False, index=True, comment="用户ID")
    
    # 金额信息
    subtotal = Column(SQLDecimal(10, 2), nullable=False, comment="商品小计")
    discount_amount = Column(SQLDecimal(10, 2), default=0, comment="优惠金额")
    shipping_fee = Column(SQLDecimal(10, 2), default=0, comment="运费")
    total_amount = Column(SQLDecimal(10, 2), nullable=False, comment="订单总金额")
    
    # 状态
    status = Column(String(20), default=OrderStatus.PENDING, comment="订单状态")
    
    # 时间戳
    created_at = Column(DateTime, default=datetime.utcnow, comment="创建时间")
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, comment="更新时间")
    paid_at = Column(DateTime, comment="支付时间")
    
    # 关联关系
    order_items = relationship("OrderItem", back_populates="order")
    payments = relationship("Payment", back_populates="order")
    
    # 索引
    __table_args__ = (
        Index('idx_order_user', 'user_id'),
        Index('idx_order_status', 'status'),
        Index('idx_order_created', 'created_at'),
    )


class OrderItem(Base):
    """订单商品表"""
    __tablename__ = 'order_items'
    
    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey('orders.id'), nullable=False, comment="订单ID")
    product_id = Column(Integer, nullable=False, comment="商品ID")
    product_name = Column(String(200), nullable=False, comment="商品名称")
    quantity = Column(Integer, nullable=False, comment="数量")
    unit_price = Column(SQLDecimal(10, 2), nullable=False, comment="单价")
    total_price = Column(SQLDecimal(10, 2), nullable=False, comment="总价")
    
    # 优惠券信息
    coupon_id = Column(Integer, ForeignKey('coupons.id'), comment="使用的优惠券ID")
    discount_amount = Column(SQLDecimal(10, 2), default=0, comment="优惠金额")
    
    # 关联关系
    order = relationship("Order", back_populates="order_items")
    coupon = relationship("Coupon", back_populates="order_items")
    
    # 索引
    __table_args__ = (
        Index('idx_order_item_order', 'order_id'),
        Index('idx_order_item_product', 'product_id'),
    )


class Payment(Base):
    """支付记录表"""
    __tablename__ = 'payments'
    
    id = Column(Integer, primary_key=True, index=True)
    payment_no = Column(String(50), unique=True, index=True, nullable=False, comment="支付单号")
    order_id = Column(Integer, ForeignKey('orders.id'), nullable=False, comment="订单ID")
    user_id = Column(Integer, nullable=False, comment="用户ID")
    
    # 金额信息
    amount = Column(SQLDecimal(10, 2), nullable=False, comment="支付金额")
    discount_amount = Column(SQLDecimal(10, 2), default=0, comment="优惠金额")
    
    # 支付信息
    payment_method = Column(String(20), nullable=False, comment="支付方式")
    payment_channel = Column(String(50), comment="支付渠道")
    transaction_id = Column(String(100), comment="第三方交易ID")
    
    # 状态
    status = Column(String(20), default=PaymentStatus.PENDING, comment="支付状态")
    
    # 时间戳
    created_at = Column(DateTime, default=datetime.utcnow, comment="创建时间")
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, comment="更新时间")
    paid_at = Column(DateTime, comment="支付完成时间")
    
    # 关联关系
    order = relationship("Order", back_populates="payments")
    refunds = relationship("Refund", back_populates="payment")
    
    # 索引
    __table_args__ = (
        Index('idx_payment_order', 'order_id'),
        Index('idx_payment_user', 'user_id'),
        Index('idx_payment_status', 'status'),
    )


class Refund(Base):
    """退款记录表"""
    __tablename__ = 'refunds'
    
    id = Column(Integer, primary_key=True, index=True)
    refund_no = Column(String(50), unique=True, index=True, nullable=False, comment="退款单号")
    payment_id = Column(Integer, ForeignKey('payments.id'), nullable=False, comment="支付ID")
    order_id = Column(Integer, nullable=False, comment="订单ID")
    user_id = Column(Integer, nullable=False, comment="用户ID")
    
    # 金额信息
    refund_amount = Column(SQLDecimal(10, 2), nullable=False, comment="退款金额")
    coupon_refund_amount = Column(SQLDecimal(10, 2), default=0, comment="优惠券退款金额")
    
    # 退款信息
    refund_reason = Column(Text, comment="退款原因")
    refund_method = Column(String(20), comment="退款方式")
    transaction_id = Column(String(100), comment="第三方退款交易ID")
    
    # 状态
    status = Column(String(20), default=PaymentStatus.PENDING, comment="退款状态")
    
    # 时间戳
    created_at = Column(DateTime, default=datetime.utcnow, comment="创建时间")
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, comment="更新时间")
    refunded_at = Column(DateTime, comment="退款完成时间")
    
    # 关联关系
    payment = relationship("Payment", back_populates="refunds")
    
    # 索引
    __table_args__ = (
        Index('idx_refund_payment', 'payment_id'),
        Index('idx_refund_order', 'order_id'),
        Index('idx_refund_user', 'user_id'),
        Index('idx_refund_status', 'status'),
    )