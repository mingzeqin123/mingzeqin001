"""
用户优惠券服务
"""
from datetime import datetime
from decimal import Decimal
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import and_, func

from models import UserCoupon, Coupon, UserCouponStatus, CouponStatus
from coupon_service import CouponService


class UserCouponService:
    """用户优惠券服务"""
    
    def __init__(self, db: Session):
        self.db = db
        self.coupon_service = CouponService(db)
    
    def claim_coupon(self, user_id: int, coupon_code: str) -> Dict[str, Any]:
        """用户领取优惠券"""
        # 获取优惠券
        coupon = self.coupon_service.get_coupon_by_code(coupon_code)
        if not coupon:
            return {"success": False, "message": "优惠券不存在"}
        
        # 检查优惠券可用性
        availability = self.coupon_service.check_coupon_availability(coupon.id)
        if not availability["available"]:
            return {"success": False, "message": availability["reason"]}
        
        # 检查用户是否已达到领取限制
        user_coupon_count = self.db.query(UserCoupon).filter(
            and_(
                UserCoupon.user_id == user_id,
                UserCoupon.coupon_id == coupon.id,
                UserCoupon.status.in_([UserCouponStatus.AVAILABLE, UserCouponStatus.USED])
            )
        ).count()
        
        if user_coupon_count >= coupon.per_user_limit:
            return {"success": False, "message": f"已达到领取限制，每用户最多领取{coupon.per_user_limit}张"}
        
        # 创建用户优惠券记录
        user_coupon = UserCoupon(
            user_id=user_id,
            coupon_id=coupon.id,
            status=UserCouponStatus.AVAILABLE
        )
        
        self.db.add(user_coupon)
        self.db.commit()
        self.db.refresh(user_coupon)
        
        return {
            "success": True,
            "message": "领取成功",
            "user_coupon_id": user_coupon.id,
            "coupon": coupon
        }
    
    def get_user_coupons(self, 
                        user_id: int,
                        status: Optional[str] = None,
                        page: int = 1,
                        page_size: int = 20) -> List[UserCoupon]:
        """获取用户优惠券列表"""
        query = self.db.query(UserCoupon).filter(UserCoupon.user_id == user_id)
        
        if status:
            query = query.filter(UserCoupon.status == status)
        
        # 按获得时间倒序
        query = query.order_by(UserCoupon.obtained_at.desc())
        
        # 分页
        offset = (page - 1) * page_size
        return query.offset(offset).limit(page_size).all()
    
    def get_available_user_coupons(self, 
                                  user_id: int,
                                  order_amount: Optional[Decimal] = None) -> List[Dict[str, Any]]:
        """获取用户可用的优惠券列表（包含优惠券详情）"""
        now = datetime.utcnow()
        
        # 查询用户可用的优惠券
        query = self.db.query(UserCoupon, Coupon).join(Coupon).filter(
            and_(
                UserCoupon.user_id == user_id,
                UserCoupon.status == UserCouponStatus.AVAILABLE,
                Coupon.status == CouponStatus.ACTIVE,
                Coupon.valid_from <= now,
                Coupon.valid_until >= now
            )
        )
        
        # 按订单金额筛选
        if order_amount is not None:
            query = query.filter(Coupon.min_order_amount <= order_amount)
        
        results = query.all()
        
        # 组装返回数据
        available_coupons = []
        for user_coupon, coupon in results:
            # 计算优惠金额
            discount_amount = self.coupon_service.calculate_discount(coupon, order_amount or Decimal('0'))
            
            available_coupons.append({
                "user_coupon_id": user_coupon.id,
                "coupon_id": coupon.id,
                "code": coupon.code,
                "name": coupon.name,
                "description": coupon.description,
                "type": coupon.type,
                "discount_value": coupon.discount_value,
                "min_order_amount": coupon.min_order_amount,
                "max_discount_amount": coupon.max_discount_amount,
                "valid_until": coupon.valid_until,
                "discount_amount": discount_amount,
                "obtained_at": user_coupon.obtained_at
            })
        
        return available_coupons
    
    def use_coupon(self, user_coupon_id: int, order_id: int) -> Dict[str, Any]:
        """使用优惠券"""
        user_coupon = self.db.query(UserCoupon).filter(
            UserCoupon.id == user_coupon_id
        ).first()
        
        if not user_coupon:
            return {"success": False, "message": "用户优惠券不存在"}
        
        if user_coupon.status != UserCouponStatus.AVAILABLE:
            return {"success": False, "message": "优惠券不可用"}
        
        # 检查优惠券是否仍然有效
        coupon = self.coupon_service.get_coupon_by_id(user_coupon.coupon_id)
        if not coupon:
            return {"success": False, "message": "优惠券不存在"}
        
        availability = self.coupon_service.check_coupon_availability(coupon.id)
        if not availability["available"]:
            return {"success": False, "message": availability["reason"]}
        
        # 更新用户优惠券状态
        user_coupon.status = UserCouponStatus.USED
        user_coupon.used_at = datetime.utcnow()
        user_coupon.order_id = order_id
        user_coupon.updated_at = datetime.utcnow()
        
        # 更新优惠券使用数量
        self.coupon_service.update_used_quantity(coupon.id)
        
        self.db.commit()
        
        return {
            "success": True,
            "message": "使用成功",
            "coupon": coupon
        }
    
    def refund_coupon(self, user_coupon_id: int) -> Dict[str, Any]:
        """退款优惠券"""
        user_coupon = self.db.query(UserCoupon).filter(
            UserCoupon.id == user_coupon_id
        ).first()
        
        if not user_coupon:
            return {"success": False, "message": "用户优惠券不存在"}
        
        if user_coupon.status != UserCouponStatus.USED:
            return {"success": False, "message": "只能退款已使用的优惠券"}
        
        # 更新用户优惠券状态
        user_coupon.status = UserCouponStatus.REFUNDED
        user_coupon.updated_at = datetime.utcnow()
        
        # 减少优惠券使用数量
        coupon = self.coupon_service.get_coupon_by_id(user_coupon.coupon_id)
        if coupon:
            coupon.used_quantity = max(0, coupon.used_quantity - 1)
            coupon.updated_at = datetime.utcnow()
        
        self.db.commit()
        
        return {
            "success": True,
            "message": "退款成功"
        }
    
    def get_user_coupon_by_id(self, user_coupon_id: int) -> Optional[UserCoupon]:
        """根据ID获取用户优惠券"""
        return self.db.query(UserCoupon).filter(
            UserCoupon.id == user_coupon_id
        ).first()
    
    def get_user_coupon_stats(self, user_id: int) -> Dict[str, int]:
        """获取用户优惠券统计"""
        stats = {}
        
        # 总优惠券数
        stats['total'] = self.db.query(UserCoupon).filter(
            UserCoupon.user_id == user_id
        ).count()
        
        # 可用优惠券数
        stats['available'] = self.db.query(UserCoupon).filter(
            and_(
                UserCoupon.user_id == user_id,
                UserCoupon.status == UserCouponStatus.AVAILABLE
            )
        ).count()
        
        # 已使用优惠券数
        stats['used'] = self.db.query(UserCoupon).filter(
            and_(
                UserCoupon.user_id == user_id,
                UserCoupon.status == UserCouponStatus.USED
            )
        ).count()
        
        # 已过期优惠券数
        stats['expired'] = self.db.query(UserCoupon).filter(
            and_(
                UserCoupon.user_id == user_id,
                UserCoupon.status == UserCouponStatus.EXPIRED
            )
        ).count()
        
        # 已退款优惠券数
        stats['refunded'] = self.db.query(UserCoupon).filter(
            and_(
                UserCoupon.user_id == user_id,
                UserCoupon.status == UserCouponStatus.REFUNDED
            )
        ).count()
        
        return stats
    
    def expire_user_coupons(self) -> int:
        """批量过期用户优惠券（定时任务）"""
        now = datetime.utcnow()
        
        # 查找过期的用户优惠券
        expired_coupons = self.db.query(UserCoupon).join(Coupon).filter(
            and_(
                UserCoupon.status == UserCouponStatus.AVAILABLE,
                Coupon.valid_until < now
            )
        ).all()
        
        # 更新状态
        count = 0
        for user_coupon in expired_coupons:
            user_coupon.status = UserCouponStatus.EXPIRED
            user_coupon.updated_at = now
            count += 1
        
        self.db.commit()
        return count