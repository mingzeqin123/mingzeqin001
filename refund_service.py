"""
退款服务
"""
import uuid
from datetime import datetime
from decimal import Decimal
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import and_

from models import Refund, Payment, Order, UserCoupon, UserCouponStatus, PaymentStatus, OrderStatus
from user_coupon_service import UserCouponService


class RefundService:
    """退款服务"""
    
    def __init__(self, db: Session):
        self.db = db
        self.user_coupon_service = UserCouponService(db)
    
    def create_refund(self, order_id: int, refund_data: Dict[str, Any]) -> Dict[str, Any]:
        """创建退款申请"""
        # 获取订单
        order = self.db.query(Order).filter(Order.id == order_id).first()
        if not order:
            return {"success": False, "message": "订单不存在"}
        
        if order.status != OrderStatus.PAID:
            return {"success": False, "message": "只有已支付订单才能申请退款"}
        
        # 获取支付记录
        payment = self.db.query(Payment).filter(
            and_(
                Payment.order_id == order_id,
                Payment.status == PaymentStatus.SUCCESS
            )
        ).first()
        
        if not payment:
            return {"success": False, "message": "未找到有效的支付记录"}
        
        # 检查是否已有退款记录
        existing_refund = self.db.query(Refund).filter(
            and_(
                Refund.order_id == order_id,
                Refund.status.in_([PaymentStatus.PENDING, PaymentStatus.SUCCESS])
            )
        ).first()
        
        if existing_refund:
            return {"success": False, "message": "该订单已有退款申请或已退款"}
        
        # 计算退款金额
        refund_amount = self._calculate_refund_amount(order, refund_data.get('refund_type', 'full'))
        
        if refund_amount <= 0:
            return {"success": False, "message": "退款金额必须大于0"}
        
        # 生成退款单号
        refund_no = self._generate_refund_no()
        
        # 创建退款记录
        refund = Refund(
            refund_no=refund_no,
            payment_id=payment.id,
            order_id=order_id,
            user_id=order.user_id,
            refund_amount=refund_amount,
            coupon_refund_amount=order.discount_amount if order.discount_amount > 0 else Decimal('0'),
            refund_reason=refund_data.get('reason', ''),
            refund_method=refund_data.get('refund_method', payment.payment_method),
            status=PaymentStatus.PENDING
        )
        
        self.db.add(refund)
        self.db.commit()
        self.db.refresh(refund)
        
        return {
            "success": True,
            "refund": refund,
            "message": "退款申请创建成功"
        }
    
    def process_refund(self, refund_id: int, transaction_id: str = None) -> Dict[str, Any]:
        """处理退款"""
        refund = self.db.query(Refund).filter(Refund.id == refund_id).first()
        if not refund:
            return {"success": False, "message": "退款记录不存在"}
        
        if refund.status != PaymentStatus.PENDING:
            return {"success": False, "message": "退款状态不允许处理"}
        
        # 更新退款状态
        refund.status = PaymentStatus.SUCCESS
        refund.transaction_id = transaction_id
        refund.refunded_at = datetime.utcnow()
        refund.updated_at = datetime.utcnow()
        
        # 更新订单状态
        order = self.db.query(Order).filter(Order.id == refund.order_id).first()
        if order:
            order.status = OrderStatus.REFUNDED
            order.updated_at = datetime.utcnow()
        
        # 更新支付状态
        payment = self.db.query(Payment).filter(Payment.id == refund.payment_id).first()
        if payment:
            payment.status = PaymentStatus.REFUNDED
            payment.updated_at = datetime.utcnow()
        
        # 处理优惠券退款
        if refund.coupon_refund_amount > 0:
            self._refund_coupons(refund.order_id, refund.user_id)
        
        self.db.commit()
        
        return {
            "success": True,
            "message": "退款处理成功"
        }
    
    def reject_refund(self, refund_id: int, reason: str) -> Dict[str, Any]:
        """拒绝退款"""
        refund = self.db.query(Refund).filter(Refund.id == refund_id).first()
        if not refund:
            return {"success": False, "message": "退款记录不存在"}
        
        if refund.status != PaymentStatus.PENDING:
            return {"success": False, "message": "退款状态不允许拒绝"}
        
        # 更新退款状态
        refund.status = PaymentStatus.FAILED
        refund.refund_reason = f"{refund.refund_reason} [拒绝原因: {reason}]"
        refund.updated_at = datetime.utcnow()
        
        self.db.commit()
        
        return {
            "success": True,
            "message": "退款拒绝成功"
        }
    
    def get_refund_by_id(self, refund_id: int) -> Optional[Refund]:
        """根据ID获取退款记录"""
        return self.db.query(Refund).filter(Refund.id == refund_id).first()
    
    def get_refund_by_no(self, refund_no: str) -> Optional[Refund]:
        """根据退款单号获取退款记录"""
        return self.db.query(Refund).filter(Refund.refund_no == refund_no).first()
    
    def get_user_refunds(self, 
                        user_id: int,
                        status: Optional[str] = None,
                        page: int = 1,
                        page_size: int = 20) -> List[Refund]:
        """获取用户退款记录列表"""
        query = self.db.query(Refund).filter(Refund.user_id == user_id)
        
        if status:
            query = query.filter(Refund.status == status)
        
        # 按创建时间倒序
        query = query.order_by(Refund.created_at.desc())
        
        # 分页
        offset = (page - 1) * page_size
        return query.offset(offset).limit(page_size).all()
    
    def get_pending_refunds(self, page: int = 1, page_size: int = 20) -> List[Refund]:
        """获取待处理的退款列表"""
        query = self.db.query(Refund).filter(Refund.status == PaymentStatus.PENDING)
        
        # 按创建时间倒序
        query = query.order_by(Refund.created_at.desc())
        
        # 分页
        offset = (page - 1) * page_size
        return query.offset(offset).limit(page_size).all()
    
    def _calculate_refund_amount(self, order: Order, refund_type: str) -> Decimal:
        """计算退款金额"""
        if refund_type == 'full':
            # 全额退款
            return order.total_amount
        elif refund_type == 'partial':
            # 部分退款（这里简化处理，实际可能需要更复杂的逻辑）
            return order.total_amount * Decimal('0.8')  # 退80%
        else:
            return Decimal('0')
    
    def _refund_coupons(self, order_id: int, user_id: int) -> None:
        """退款优惠券"""
        # 查找该订单使用的优惠券
        user_coupons = self.db.query(UserCoupon).filter(
            and_(
                UserCoupon.user_id == user_id,
                UserCoupon.order_id == order_id,
                UserCoupon.status == UserCouponStatus.USED
            )
        ).all()
        
        # 将优惠券状态改为已退款
        for user_coupon in user_coupons:
            user_coupon.status = UserCouponStatus.REFUNDED
            user_coupon.updated_at = datetime.utcnow()
        
        # 减少优惠券的使用数量
        for user_coupon in user_coupons:
            coupon = self.db.query(Coupon).filter(Coupon.id == user_coupon.coupon_id).first()
            if coupon:
                coupon.used_quantity = max(0, coupon.used_quantity - 1)
                coupon.updated_at = datetime.utcnow()
    
    def _generate_refund_no(self) -> str:
        """生成退款单号"""
        timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
        random_str = str(uuid.uuid4()).replace('-', '').upper()[:6]
        return f"REF{timestamp}{random_str}"
    
    def get_refund_stats(self) -> Dict[str, int]:
        """获取退款统计"""
        stats = {}
        
        # 总退款数
        stats['total'] = self.db.query(Refund).count()
        
        # 待处理退款数
        stats['pending'] = self.db.query(Refund).filter(
            Refund.status == PaymentStatus.PENDING
        ).count()
        
        # 已退款数
        stats['success'] = self.db.query(Refund).filter(
            Refund.status == PaymentStatus.SUCCESS
        ).count()
        
        # 已拒绝退款数
        stats['failed'] = self.db.query(Refund).filter(
            Refund.status == PaymentStatus.FAILED
        ).count()
        
        return stats