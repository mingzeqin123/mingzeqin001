"""
优惠券系统业务规则和验证
"""
from datetime import datetime, timedelta
from decimal import Decimal
from typing import List, Dict, Any, Optional
from enum import Enum

from models import CouponType, CouponStatus, UserCouponStatus


class BusinessRuleError(Exception):
    """业务规则异常"""
    pass


class CouponBusinessRules:
    """优惠券业务规则"""
    
    @staticmethod
    def validate_coupon_creation(data: Dict[str, Any]) -> None:
        """验证优惠券创建规则"""
        # 验证必填字段
        required_fields = ['name', 'type', 'discount_value', 'total_quantity', 'valid_from', 'valid_until']
        for field in required_fields:
            if field not in data or data[field] is None:
                raise BusinessRuleError(f"缺少必填字段: {field}")
        
        # 验证优惠券类型
        if data['type'] not in [e.value for e in CouponType]:
            raise BusinessRuleError(f"无效的优惠券类型: {data['type']}")
        
        # 验证折扣值
        if data['discount_value'] <= 0:
            raise BusinessRuleError("折扣值必须大于0")
        
        # 验证百分比折扣
        if data['type'] == CouponType.PERCENTAGE:
            if data['discount_value'] > 100:
                raise BusinessRuleError("百分比折扣不能超过100%")
            if not data.get('max_discount_amount'):
                raise BusinessRuleError("百分比折扣必须设置最大折扣金额")
        
        # 验证固定金额折扣
        if data['type'] == CouponType.FIXED_AMOUNT:
            if data['discount_value'] > 10000:  # 最大10000元
                raise BusinessRuleError("固定金额折扣不能超过10000元")
        
        # 验证数量限制
        if data['total_quantity'] <= 0:
            raise BusinessRuleError("总发放数量必须大于0")
        if data['total_quantity'] > 1000000:  # 最大100万张
            raise BusinessRuleError("总发放数量不能超过1000000张")
        
        if data.get('per_user_limit', 1) <= 0:
            raise BusinessRuleError("每用户限领数量必须大于0")
        if data.get('per_user_limit', 1) > 10:  # 最大10张
            raise BusinessRuleError("每用户限领数量不能超过10张")
        
        # 验证时间
        now = datetime.utcnow()
        if data['valid_from'] < now:
            raise BusinessRuleError("有效期开始时间不能早于当前时间")
        
        if data['valid_until'] <= data['valid_from']:
            raise BusinessRuleError("有效期结束时间必须晚于开始时间")
        
        # 验证有效期长度（最长1年）
        max_validity = timedelta(days=365)
        if data['valid_until'] - data['valid_from'] > max_validity:
            raise BusinessRuleError("优惠券有效期不能超过1年")
        
        # 验证最低订单金额
        if data.get('min_order_amount', 0) < 0:
            raise BusinessRuleError("最低订单金额不能为负数")
        
        # 验证最大折扣金额
        if data.get('max_discount_amount') is not None and data['max_discount_amount'] <= 0:
            raise BusinessRuleError("最大折扣金额必须大于0")
    
    @staticmethod
    def validate_coupon_usage(coupon: Any, order_amount: Decimal, user_id: int) -> None:
        """验证优惠券使用规则"""
        # 检查优惠券状态
        if coupon.status != CouponStatus.ACTIVE:
            raise BusinessRuleError("优惠券未激活")
        
        # 检查有效期
        now = datetime.utcnow()
        if now < coupon.valid_from:
            raise BusinessRuleError("优惠券尚未生效")
        if now > coupon.valid_until:
            raise BusinessRuleError("优惠券已过期")
        
        # 检查库存
        if coupon.used_quantity >= coupon.total_quantity:
            raise BusinessRuleError("优惠券已领完")
        
        # 检查订单金额
        if order_amount < coupon.min_order_amount:
            raise BusinessRuleError(f"订单金额不满足优惠券使用条件，最低需要{coupon.min_order_amount}元")
    
    @staticmethod
    def calculate_discount_amount(coupon: Any, order_amount: Decimal) -> Decimal:
        """计算优惠金额"""
        if coupon.type == CouponType.FIXED_AMOUNT:
            # 固定金额折扣
            discount = min(coupon.discount_value, order_amount)
        elif coupon.type == CouponType.PERCENTAGE:
            # 百分比折扣
            discount = order_amount * (coupon.discount_value / 100)
            if coupon.max_discount_amount:
                discount = min(discount, coupon.max_discount_amount)
        elif coupon.type == CouponType.FREE_SHIPPING:
            # 免运费（这里简化处理）
            discount = Decimal('0')
        else:
            discount = Decimal('0')
        
        return discount.quantize(Decimal('0.01'))


class OrderBusinessRules:
    """订单业务规则"""
    
    @staticmethod
    def validate_order_creation(data: Dict[str, Any]) -> None:
        """验证订单创建规则"""
        # 验证订单商品
        items = data.get('items', [])
        if not items:
            raise BusinessRuleError("订单商品不能为空")
        
        # 验证每个商品
        for item in items:
            required_fields = ['product_id', 'product_name', 'quantity', 'unit_price']
            for field in required_fields:
                if field not in item:
                    raise BusinessRuleError(f"商品缺少必填字段: {field}")
            
            if item['quantity'] <= 0:
                raise BusinessRuleError("商品数量必须大于0")
            
            if item['unit_price'] <= 0:
                raise BusinessRuleError("商品单价必须大于0")
        
        # 验证订单总金额
        subtotal = sum(item['quantity'] * item['unit_price'] for item in items)
        if subtotal <= 0:
            raise BusinessRuleError("订单总金额必须大于0")
        
        # 验证订单金额上限（防止异常大额订单）
        if subtotal > Decimal('1000000'):  # 最大100万元
            raise BusinessRuleError("订单金额不能超过1000000元")
    
    @staticmethod
    def validate_order_cancellation(order: Any, user_id: int) -> None:
        """验证订单取消规则"""
        # 检查订单归属
        if order.user_id != user_id:
            raise BusinessRuleError("无权限操作此订单")
        
        # 检查订单状态
        if order.status not in ['pending']:
            raise BusinessRuleError("只有待支付订单才能取消")
        
        # 检查取消时间限制（创建后30分钟内可取消）
        cancel_deadline = order.created_at + timedelta(minutes=30)
        if datetime.utcnow() > cancel_deadline:
            raise BusinessRuleError("订单创建超过30分钟，无法取消")


class PaymentBusinessRules:
    """支付业务规则"""
    
    @staticmethod
    def validate_payment_creation(order: Any, payment_data: Dict[str, Any]) -> None:
        """验证支付创建规则"""
        # 检查订单状态
        if order.status != 'pending':
            raise BusinessRuleError("只有待支付订单才能创建支付")
        
        # 验证支付方式
        valid_methods = ['alipay', 'wechat', 'bank_card', 'balance']
        if payment_data.get('payment_method') not in valid_methods:
            raise BusinessRuleError(f"不支持的支付方式: {payment_data.get('payment_method')}")
        
        # 验证支付金额
        if order.total_amount <= 0:
            raise BusinessRuleError("支付金额必须大于0")
    
    @staticmethod
    def validate_payment_processing(payment: Any) -> None:
        """验证支付处理规则"""
        # 检查支付状态
        if payment.status != 'pending':
            raise BusinessRuleError("只有待支付状态才能处理支付")
        
        # 检查支付时间限制（30分钟内有效）
        payment_deadline = payment.created_at + timedelta(minutes=30)
        if datetime.utcnow() > payment_deadline:
            raise BusinessRuleError("支付已过期，请重新创建支付")


class RefundBusinessRules:
    """退款业务规则"""
    
    @staticmethod
    def validate_refund_creation(order: Any, refund_data: Dict[str, Any]) -> None:
        """验证退款创建规则"""
        # 检查订单状态
        if order.status != 'paid':
            raise BusinessRuleError("只有已支付订单才能申请退款")
        
        # 验证退款类型
        valid_types = ['full', 'partial']
        if refund_data.get('refund_type') not in valid_types:
            raise BusinessRuleError(f"无效的退款类型: {refund_data.get('refund_type')}")
        
        # 验证退款原因
        reason = refund_data.get('reason', '').strip()
        if not reason:
            raise BusinessRuleError("退款原因不能为空")
        
        if len(reason) > 500:
            raise BusinessRuleError("退款原因不能超过500字符")
        
        # 检查退款时间限制（支付后7天内可申请退款）
        refund_deadline = order.paid_at + timedelta(days=7)
        if datetime.utcnow() > refund_deadline:
            raise BusinessRuleError("支付超过7天，无法申请退款")
    
    @staticmethod
    def validate_refund_processing(refund: Any) -> None:
        """验证退款处理规则"""
        # 检查退款状态
        if refund.status != 'pending':
            raise BusinessRuleError("只有待处理状态才能处理退款")
        
        # 检查退款金额
        if refund.refund_amount <= 0:
            raise BusinessRuleError("退款金额必须大于0")


class UserCouponBusinessRules:
    """用户优惠券业务规则"""
    
    @staticmethod
    def validate_coupon_claiming(user_id: int, coupon: Any, user_coupon_count: int) -> None:
        """验证优惠券领取规则"""
        # 检查用户领取限制
        if user_coupon_count >= coupon.per_user_limit:
            raise BusinessRuleError(f"已达到领取限制，每用户最多领取{coupon.per_user_limit}张")
        
        # 检查优惠券可用性
        CouponBusinessRules.validate_coupon_usage(coupon, Decimal('0'), user_id)
    
    @staticmethod
    def validate_coupon_usage(user_coupon: Any, order_amount: Decimal) -> None:
        """验证优惠券使用规则"""
        # 检查用户优惠券状态
        if user_coupon.status != UserCouponStatus.AVAILABLE:
            raise BusinessRuleError("优惠券不可用")
        
        # 检查优惠券是否过期
        if user_coupon.coupon.valid_until < datetime.utcnow():
            raise BusinessRuleError("优惠券已过期")
        
        # 检查订单金额
        if order_amount < user_coupon.coupon.min_order_amount:
            raise BusinessRuleError(f"订单金额不满足优惠券使用条件，最低需要{user_coupon.coupon.min_order_amount}元")


class SystemLimits:
    """系统限制配置"""
    
    # 优惠券限制
    MAX_COUPON_QUANTITY = 1000000  # 最大发放数量
    MAX_PER_USER_LIMIT = 10  # 每用户最大领取数量
    MAX_COUPON_VALIDITY_DAYS = 365  # 最大有效期天数
    MAX_DISCOUNT_AMOUNT = 10000  # 最大折扣金额
    
    # 订单限制
    MAX_ORDER_AMOUNT = 1000000  # 最大订单金额
    MAX_ORDER_ITEMS = 100  # 最大订单商品数量
    ORDER_CANCEL_DEADLINE_MINUTES = 30  # 订单取消截止时间（分钟）
    
    # 支付限制
    PAYMENT_TIMEOUT_MINUTES = 30  # 支付超时时间（分钟）
    
    # 退款限制
    REFUND_DEADLINE_DAYS = 7  # 退款申请截止时间（天）
    MAX_REFUND_REASON_LENGTH = 500  # 最大退款原因长度
    
    # 用户限制
    MAX_USER_COUPONS_PER_TYPE = 5  # 每用户每种类型优惠券最大数量
    DAILY_CLAIM_LIMIT = 10  # 每日领取限制


class RateLimiting:
    """限流规则"""
    
    @staticmethod
    def check_claim_rate_limit(user_id: int, daily_claims: int) -> None:
        """检查领取频率限制"""
        if daily_claims >= SystemLimits.DAILY_CLAIM_LIMIT:
            raise BusinessRuleError(f"每日领取限制为{SystemLimits.DAILY_CLAIM_LIMIT}张，请明天再试")
    
    @staticmethod
    def check_order_rate_limit(user_id: int, recent_orders: int) -> None:
        """检查下单频率限制"""
        if recent_orders >= 50:  # 每小时最多50单
            raise BusinessRuleError("下单过于频繁，请稍后再试")
    
    @staticmethod
    def check_refund_rate_limit(user_id: int, recent_refunds: int) -> None:
        """检查退款频率限制"""
        if recent_refunds >= 5:  # 每天最多5次退款申请
            raise BusinessRuleError("退款申请过于频繁，请明天再试")