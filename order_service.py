"""
订单和支付服务
"""
import uuid
from datetime import datetime
from decimal import Decimal
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import and_

from models import Order, OrderItem, Payment, OrderStatus, PaymentStatus
from user_coupon_service import UserCouponService
from coupon_service import CouponService


class OrderService:
    """订单服务"""
    
    def __init__(self, db: Session):
        self.db = db
        self.user_coupon_service = UserCouponService(db)
        self.coupon_service = CouponService(db)
    
    def create_order(self, user_id: int, order_data: Dict[str, Any]) -> Dict[str, Any]:
        """创建订单"""
        # 生成订单号
        order_no = self._generate_order_no()
        
        # 计算订单金额
        order_items = order_data.get('items', [])
        if not order_items:
            return {"success": False, "message": "订单商品不能为空"}
        
        subtotal = sum(item['quantity'] * item['unit_price'] for item in order_items)
        
        # 处理优惠券
        discount_amount = Decimal('0')
        used_coupon_id = None
        
        if 'user_coupon_id' in order_data and order_data['user_coupon_id']:
            coupon_result = self._apply_coupon(
                order_data['user_coupon_id'], 
                user_id, 
                subtotal
            )
            if coupon_result['success']:
                discount_amount = coupon_result['discount_amount']
                used_coupon_id = coupon_result['coupon_id']
            else:
                return {"success": False, "message": coupon_result['message']}
        
        # 计算运费（这里简化处理）
        shipping_fee = self._calculate_shipping_fee(subtotal, order_data.get('shipping_address'))
        
        # 计算总金额
        total_amount = subtotal - discount_amount + shipping_fee
        
        # 创建订单
        order = Order(
            order_no=order_no,
            user_id=user_id,
            subtotal=subtotal,
            discount_amount=discount_amount,
            shipping_fee=shipping_fee,
            total_amount=total_amount,
            status=OrderStatus.PENDING
        )
        
        self.db.add(order)
        self.db.flush()  # 获取订单ID
        
        # 创建订单商品
        for item_data in order_items:
            order_item = OrderItem(
                order_id=order.id,
                product_id=item_data['product_id'],
                product_name=item_data['product_name'],
                quantity=item_data['quantity'],
                unit_price=item_data['unit_price'],
                total_price=item_data['quantity'] * item_data['unit_price'],
                coupon_id=used_coupon_id,
                discount_amount=discount_amount if used_coupon_id else Decimal('0')
            )
            self.db.add(order_item)
        
        self.db.commit()
        self.db.refresh(order)
        
        return {
            "success": True,
            "order": order,
            "message": "订单创建成功"
        }
    
    def get_order_by_id(self, order_id: int) -> Optional[Order]:
        """根据ID获取订单"""
        return self.db.query(Order).filter(Order.id == order_id).first()
    
    def get_order_by_no(self, order_no: str) -> Optional[Order]:
        """根据订单号获取订单"""
        return self.db.query(Order).filter(Order.order_no == order_no).first()
    
    def get_user_orders(self, 
                       user_id: int,
                       status: Optional[str] = None,
                       page: int = 1,
                       page_size: int = 20) -> List[Order]:
        """获取用户订单列表"""
        query = self.db.query(Order).filter(Order.user_id == user_id)
        
        if status:
            query = query.filter(Order.status == status)
        
        # 按创建时间倒序
        query = query.order_by(Order.created_at.desc())
        
        # 分页
        offset = (page - 1) * page_size
        return query.offset(offset).limit(page_size).all()
    
    def cancel_order(self, order_id: int, user_id: int) -> Dict[str, Any]:
        """取消订单"""
        order = self.get_order_by_id(order_id)
        if not order:
            return {"success": False, "message": "订单不存在"}
        
        if order.user_id != user_id:
            return {"success": False, "message": "无权限操作此订单"}
        
        if order.status != OrderStatus.PENDING:
            return {"success": False, "message": "只能取消待支付订单"}
        
        # 更新订单状态
        order.status = OrderStatus.CANCELLED
        order.updated_at = datetime.utcnow()
        
        # 如果有使用优惠券，需要退款
        if order.discount_amount > 0:
            # 查找用户优惠券并退款
            user_coupons = self.db.query(UserCoupon).filter(
                and_(
                    UserCoupon.user_id == user_id,
                    UserCoupon.order_id == order_id,
                    UserCoupon.status == UserCouponStatus.USED
                )
            ).all()
            
            for user_coupon in user_coupons:
                self.user_coupon_service.refund_coupon(user_coupon.id)
        
        self.db.commit()
        
        return {"success": True, "message": "订单取消成功"}
    
    def _apply_coupon(self, user_coupon_id: int, user_id: int, order_amount: Decimal) -> Dict[str, Any]:
        """应用优惠券"""
        # 获取用户优惠券
        user_coupon = self.user_coupon_service.get_user_coupon_by_id(user_coupon_id)
        if not user_coupon:
            return {"success": False, "message": "用户优惠券不存在"}
        
        if user_coupon.user_id != user_id:
            return {"success": False, "message": "无权限使用此优惠券"}
        
        # 获取优惠券详情
        coupon = self.coupon_service.get_coupon_by_id(user_coupon.coupon_id)
        if not coupon:
            return {"success": False, "message": "优惠券不存在"}
        
        # 检查订单金额是否满足最低要求
        if order_amount < coupon.min_order_amount:
            return {"success": False, "message": f"订单金额不满足优惠券使用条件，最低需要{coupon.min_order_amount}元"}
        
        # 计算优惠金额
        discount_amount = self.coupon_service.calculate_discount(coupon, order_amount)
        
        return {
            "success": True,
            "discount_amount": discount_amount,
            "coupon_id": coupon.id
        }
    
    def _calculate_shipping_fee(self, order_amount: Decimal, shipping_address: Optional[Dict] = None) -> Decimal:
        """计算运费（简化实现）"""
        # 这里可以根据实际业务逻辑实现运费计算
        # 例如：满100免运费，否则收取10元运费
        if order_amount >= Decimal('100'):
            return Decimal('0')
        else:
            return Decimal('10')
    
    def _generate_order_no(self) -> str:
        """生成订单号"""
        timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
        random_str = str(uuid.uuid4()).replace('-', '').upper()[:6]
        return f"ORD{timestamp}{random_str}"


class PaymentService:
    """支付服务"""
    
    def __init__(self, db: Session):
        self.db = db
        self.order_service = OrderService(db)
    
    def create_payment(self, order_id: int, payment_data: Dict[str, Any]) -> Dict[str, Any]:
        """创建支付记录"""
        order = self.order_service.get_order_by_id(order_id)
        if not order:
            return {"success": False, "message": "订单不存在"}
        
        if order.status != OrderStatus.PENDING:
            return {"success": False, "message": "订单状态不允许支付"}
        
        # 生成支付单号
        payment_no = self._generate_payment_no()
        
        # 创建支付记录
        payment = Payment(
            payment_no=payment_no,
            order_id=order_id,
            user_id=order.user_id,
            amount=order.total_amount,
            discount_amount=order.discount_amount,
            payment_method=payment_data.get('payment_method', 'alipay'),
            payment_channel=payment_data.get('payment_channel', 'web'),
            status=PaymentStatus.PENDING
        )
        
        self.db.add(payment)
        self.db.commit()
        self.db.refresh(payment)
        
        return {
            "success": True,
            "payment": payment,
            "message": "支付记录创建成功"
        }
    
    def process_payment(self, payment_id: int, transaction_id: str) -> Dict[str, Any]:
        """处理支付成功"""
        payment = self.db.query(Payment).filter(Payment.id == payment_id).first()
        if not payment:
            return {"success": False, "message": "支付记录不存在"}
        
        if payment.status != PaymentStatus.PENDING:
            return {"success": False, "message": "支付状态不允许处理"}
        
        # 更新支付状态
        payment.status = PaymentStatus.SUCCESS
        payment.transaction_id = transaction_id
        payment.paid_at = datetime.utcnow()
        payment.updated_at = datetime.utcnow()
        
        # 更新订单状态
        order = self.order_service.get_order_by_id(payment.order_id)
        if order:
            order.status = OrderStatus.PAID
            order.paid_at = datetime.utcnow()
            order.updated_at = datetime.utcnow()
            
            # 如果有使用优惠券，标记为已使用
            if order.discount_amount > 0:
                user_coupons = self.db.query(UserCoupon).filter(
                    and_(
                        UserCoupon.user_id == order.user_id,
                        UserCoupon.order_id == order.id,
                        UserCoupon.status == UserCouponStatus.AVAILABLE
                    )
                ).all()
                
                for user_coupon in user_coupons:
                    self.user_coupon_service.use_coupon(user_coupon.id, order.id)
        
        self.db.commit()
        
        return {
            "success": True,
            "message": "支付处理成功"
        }
    
    def process_payment_failure(self, payment_id: int, failure_reason: str) -> Dict[str, Any]:
        """处理支付失败"""
        payment = self.db.query(Payment).filter(Payment.id == payment_id).first()
        if not payment:
            return {"success": False, "message": "支付记录不存在"}
        
        # 更新支付状态
        payment.status = PaymentStatus.FAILED
        payment.updated_at = datetime.utcnow()
        
        self.db.commit()
        
        return {
            "success": True,
            "message": "支付失败处理完成"
        }
    
    def get_payment_by_id(self, payment_id: int) -> Optional[Payment]:
        """根据ID获取支付记录"""
        return self.db.query(Payment).filter(Payment.id == payment_id).first()
    
    def get_payment_by_no(self, payment_no: str) -> Optional[Payment]:
        """根据支付单号获取支付记录"""
        return self.db.query(Payment).filter(Payment.payment_no == payment_no).first()
    
    def get_user_payments(self, 
                         user_id: int,
                         status: Optional[str] = None,
                         page: int = 1,
                         page_size: int = 20) -> List[Payment]:
        """获取用户支付记录列表"""
        query = self.db.query(Payment).filter(Payment.user_id == user_id)
        
        if status:
            query = query.filter(Payment.status == status)
        
        # 按创建时间倒序
        query = query.order_by(Payment.created_at.desc())
        
        # 分页
        offset = (page - 1) * page_size
        return query.offset(offset).limit(page_size).all()
    
    def _generate_payment_no(self) -> str:
        """生成支付单号"""
        timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
        random_str = str(uuid.uuid4()).replace('-', '').upper()[:6]
        return f"PAY{timestamp}{random_str}"