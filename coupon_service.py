"""
优惠券管理服务
"""
import uuid
from datetime import datetime, timedelta
from decimal import Decimal
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_

from models import Coupon, CouponType, CouponStatus


class CouponService:
    """优惠券管理服务"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def create_coupon(self, coupon_data: Dict[str, Any]) -> Coupon:
        """创建优惠券"""
        # 生成优惠券代码
        if not coupon_data.get('code'):
            coupon_data['code'] = self._generate_coupon_code()
        
        # 验证数据
        self._validate_coupon_data(coupon_data)
        
        # 创建优惠券
        coupon = Coupon(**coupon_data)
        self.db.add(coupon)
        self.db.commit()
        self.db.refresh(coupon)
        
        return coupon
    
    def get_coupon_by_id(self, coupon_id: int) -> Optional[Coupon]:
        """根据ID获取优惠券"""
        return self.db.query(Coupon).filter(Coupon.id == coupon_id).first()
    
    def get_coupon_by_code(self, code: str) -> Optional[Coupon]:
        """根据代码获取优惠券"""
        return self.db.query(Coupon).filter(Coupon.code == code).first()
    
    def list_coupons(self, 
                    status: Optional[str] = None,
                    coupon_type: Optional[str] = None,
                    page: int = 1,
                    page_size: int = 20) -> List[Coupon]:
        """获取优惠券列表"""
        query = self.db.query(Coupon)
        
        if status:
            query = query.filter(Coupon.status == status)
        
        if coupon_type:
            query = query.filter(Coupon.type == coupon_type)
        
        # 分页
        offset = (page - 1) * page_size
        return query.offset(offset).limit(page_size).all()
    
    def update_coupon(self, coupon_id: int, update_data: Dict[str, Any]) -> Optional[Coupon]:
        """更新优惠券"""
        coupon = self.get_coupon_by_id(coupon_id)
        if not coupon:
            return None
        
        # 验证更新数据
        if 'type' in update_data:
            self._validate_coupon_type(update_data['type'])
        
        # 更新字段
        for key, value in update_data.items():
            if hasattr(coupon, key):
                setattr(coupon, key, value)
        
        coupon.updated_at = datetime.utcnow()
        self.db.commit()
        self.db.refresh(coupon)
        
        return coupon
    
    def delete_coupon(self, coupon_id: int) -> bool:
        """删除优惠券（软删除）"""
        coupon = self.get_coupon_by_id(coupon_id)
        if not coupon:
            return False
        
        coupon.status = CouponStatus.DELETED
        coupon.updated_at = datetime.utcnow()
        self.db.commit()
        
        return True
    
    def activate_coupon(self, coupon_id: int) -> bool:
        """激活优惠券"""
        coupon = self.get_coupon_by_id(coupon_id)
        if not coupon:
            return False
        
        coupon.status = CouponStatus.ACTIVE
        coupon.updated_at = datetime.utcnow()
        self.db.commit()
        
        return True
    
    def deactivate_coupon(self, coupon_id: int) -> bool:
        """停用优惠券"""
        coupon = self.get_coupon_by_id(coupon_id)
        if not coupon:
            return False
        
        coupon.status = CouponStatus.INACTIVE
        coupon.updated_at = datetime.utcnow()
        self.db.commit()
        
        return True
    
    def check_coupon_availability(self, coupon_id: int) -> Dict[str, Any]:
        """检查优惠券可用性"""
        coupon = self.get_coupon_by_id(coupon_id)
        if not coupon:
            return {"available": False, "reason": "优惠券不存在"}
        
        now = datetime.utcnow()
        
        # 检查状态
        if coupon.status != CouponStatus.ACTIVE:
            return {"available": False, "reason": "优惠券未激活"}
        
        # 检查有效期
        if now < coupon.valid_from:
            return {"available": False, "reason": "优惠券尚未生效"}
        
        if now > coupon.valid_until:
            return {"available": False, "reason": "优惠券已过期"}
        
        # 检查库存
        if coupon.used_quantity >= coupon.total_quantity:
            return {"available": False, "reason": "优惠券已领完"}
        
        return {"available": True, "coupon": coupon}
    
    def get_available_coupons(self, 
                             user_id: int,
                             product_ids: Optional[List[int]] = None,
                             category_ids: Optional[List[int]] = None,
                             order_amount: Optional[Decimal] = None) -> List[Coupon]:
        """获取用户可用的优惠券列表"""
        now = datetime.utcnow()
        
        query = self.db.query(Coupon).filter(
            and_(
                Coupon.status == CouponStatus.ACTIVE,
                Coupon.valid_from <= now,
                Coupon.valid_until >= now,
                Coupon.used_quantity < Coupon.total_quantity
            )
        )
        
        # 按订单金额筛选
        if order_amount is not None:
            query = query.filter(Coupon.min_order_amount <= order_amount)
        
        # 按商品筛选
        if product_ids:
            # 这里需要根据实际业务逻辑实现商品筛选
            pass
        
        # 按分类筛选
        if category_ids:
            # 这里需要根据实际业务逻辑实现分类筛选
            pass
        
        return query.all()
    
    def _generate_coupon_code(self) -> str:
        """生成优惠券代码"""
        # 生成8位随机码
        code = str(uuid.uuid4()).replace('-', '').upper()[:8]
        
        # 检查是否已存在
        while self.get_coupon_by_code(code):
            code = str(uuid.uuid4()).replace('-', '').upper()[:8]
        
        return code
    
    def _validate_coupon_data(self, data: Dict[str, Any]) -> None:
        """验证优惠券数据"""
        # 验证必填字段
        required_fields = ['name', 'type', 'discount_value', 'total_quantity', 'valid_from', 'valid_until']
        for field in required_fields:
            if field not in data:
                raise ValueError(f"缺少必填字段: {field}")
        
        # 验证优惠券类型
        self._validate_coupon_type(data['type'])
        
        # 验证折扣值
        if data['discount_value'] <= 0:
            raise ValueError("折扣值必须大于0")
        
        # 验证数量
        if data['total_quantity'] <= 0:
            raise ValueError("总数量必须大于0")
        
        # 验证时间
        if data['valid_from'] >= data['valid_until']:
            raise ValueError("有效期开始时间必须早于结束时间")
        
        # 验证百分比折扣的最大折扣金额
        if data['type'] == CouponType.PERCENTAGE:
            if not data.get('max_discount_amount'):
                raise ValueError("百分比折扣必须设置最大折扣金额")
    
    def _validate_coupon_type(self, coupon_type: str) -> None:
        """验证优惠券类型"""
        if coupon_type not in [e.value for e in CouponType]:
            raise ValueError(f"无效的优惠券类型: {coupon_type}")
    
    def calculate_discount(self, coupon: Coupon, order_amount: Decimal) -> Decimal:
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
            # 免运费（这里简化处理，实际可能需要更复杂的逻辑）
            discount = Decimal('0')
        else:
            discount = Decimal('0')
        
        return discount
    
    def update_used_quantity(self, coupon_id: int, quantity: int = 1) -> bool:
        """更新已使用数量"""
        coupon = self.get_coupon_by_id(coupon_id)
        if not coupon:
            return False
        
        coupon.used_quantity += quantity
        coupon.updated_at = datetime.utcnow()
        self.db.commit()
        
        return True