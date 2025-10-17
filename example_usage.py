"""
优惠券系统使用示例
"""
from datetime import datetime, timedelta
from decimal import Decimal
from sqlalchemy.orm import Session

from database import SessionLocal
from models import CouponType, CouponStatus
from coupon_service import CouponService
from user_coupon_service import UserCouponService
from order_service import OrderService, PaymentService
from refund_service import RefundService


def example_coupon_management():
    """优惠券管理示例"""
    print("=== 优惠券管理示例 ===")
    
    db = SessionLocal()
    try:
        coupon_service = CouponService(db)
        
        # 1. 创建固定金额优惠券
        fixed_coupon_data = {
            "name": "新用户专享优惠券",
            "description": "新用户注册即可领取，满100减20",
            "type": CouponType.FIXED_AMOUNT.value,
            "discount_value": Decimal("20.00"),
            "min_order_amount": Decimal("100.00"),
            "total_quantity": 1000,
            "per_user_limit": 1,
            "valid_from": datetime.utcnow(),
            "valid_until": datetime.utcnow() + timedelta(days=30)
        }
        
        fixed_coupon = coupon_service.create_coupon(fixed_coupon_data)
        print(f"创建固定金额优惠券: {fixed_coupon.code}")
        
        # 2. 创建百分比优惠券
        percentage_coupon_data = {
            "name": "全场8折优惠券",
            "description": "全场商品8折优惠，最高减50元",
            "type": CouponType.PERCENTAGE.value,
            "discount_value": Decimal("20.00"),  # 20%折扣
            "min_order_amount": Decimal("200.00"),
            "max_discount_amount": Decimal("50.00"),
            "total_quantity": 500,
            "per_user_limit": 2,
            "valid_from": datetime.utcnow(),
            "valid_until": datetime.utcnow() + timedelta(days=15)
        }
        
        percentage_coupon = coupon_service.create_coupon(percentage_coupon_data)
        print(f"创建百分比优惠券: {percentage_coupon.code}")
        
        # 3. 创建免运费优惠券
        shipping_coupon_data = {
            "name": "免运费优惠券",
            "description": "满50元免运费",
            "type": CouponType.FREE_SHIPPING.value,
            "discount_value": Decimal("0.00"),
            "min_order_amount": Decimal("50.00"),
            "total_quantity": 2000,
            "per_user_limit": 3,
            "valid_from": datetime.utcnow(),
            "valid_until": datetime.utcnow() + timedelta(days=60)
        }
        
        shipping_coupon = coupon_service.create_coupon(shipping_coupon_data)
        print(f"创建免运费优惠券: {shipping_coupon.code}")
        
        # 4. 查询优惠券列表
        coupons = coupon_service.list_coupons(status=CouponStatus.ACTIVE.value)
        print(f"当前活跃优惠券数量: {len(coupons)}")
        
    finally:
        db.close()


def example_user_coupon_operations():
    """用户优惠券操作示例"""
    print("\n=== 用户优惠券操作示例 ===")
    
    db = SessionLocal()
    try:
        user_coupon_service = UserCouponService(db)
        coupon_service = CouponService(db)
        
        user_id = 1001
        
        # 1. 用户领取优惠券
        fixed_coupon = coupon_service.get_coupon_by_code("新用户专享优惠券")
        if fixed_coupon:
            result = user_coupon_service.claim_coupon(user_id, fixed_coupon.code)
            print(f"领取优惠券结果: {result['message']}")
        
        # 2. 查询用户优惠券
        user_coupons = user_coupon_service.get_user_coupons(user_id)
        print(f"用户{user_id}的优惠券数量: {len(user_coupons)}")
        
        # 3. 查询可用优惠券（模拟订单金额150元）
        available_coupons = user_coupon_service.get_available_user_coupons(
            user_id, 
            order_amount=Decimal("150.00")
        )
        print(f"用户{user_id}可用优惠券数量: {len(available_coupons)}")
        
        # 4. 获取用户优惠券统计
        stats = user_coupon_service.get_user_coupon_stats(user_id)
        print(f"用户优惠券统计: {stats}")
        
    finally:
        db.close()


def example_order_and_payment():
    """订单和支付示例"""
    print("\n=== 订单和支付示例 ===")
    
    db = SessionLocal()
    try:
        order_service = OrderService(db)
        payment_service = PaymentService(db)
        user_coupon_service = UserCouponService(db)
        
        user_id = 1001
        
        # 1. 创建订单
        order_data = {
            "items": [
                {
                    "product_id": 1001,
                    "product_name": "iPhone 15",
                    "quantity": 1,
                    "unit_price": Decimal("5999.00")
                },
                {
                    "product_id": 1002,
                    "product_name": "AirPods Pro",
                    "quantity": 1,
                    "unit_price": Decimal("1999.00")
                }
            ],
            "shipping_address": {
                "name": "张三",
                "phone": "13800138000",
                "address": "北京市朝阳区xxx街道xxx号"
            }
        }
        
        # 获取用户可用优惠券
        available_coupons = user_coupon_service.get_available_user_coupons(user_id)
        if available_coupons:
            order_data["user_coupon_id"] = available_coupons[0]["user_coupon_id"]
            print(f"使用优惠券: {available_coupons[0]['name']}")
        
        order_result = order_service.create_order(user_id, order_data)
        if order_result["success"]:
            order = order_result["order"]
            print(f"订单创建成功: {order.order_no}")
            print(f"订单金额: {order.subtotal}, 优惠金额: {order.discount_amount}, 总金额: {order.total_amount}")
            
            # 2. 创建支付
            payment_data = {
                "payment_method": "alipay",
                "payment_channel": "web"
            }
            
            payment_result = payment_service.create_payment(order.id, payment_data)
            if payment_result["success"]:
                payment = payment_result["payment"]
                print(f"支付记录创建成功: {payment.payment_no}")
                
                # 3. 模拟支付成功
                success_result = payment_service.process_payment(
                    payment.id, 
                    "ALIPAY_" + str(int(datetime.utcnow().timestamp()))
                )
                if success_result["success"]:
                    print("支付处理成功")
                    
                    # 4. 查询订单状态
                    updated_order = order_service.get_order_by_id(order.id)
                    print(f"订单状态: {updated_order.status}")
        
    finally:
        db.close()


def example_refund_process():
    """退款流程示例"""
    print("\n=== 退款流程示例 ===")
    
    db = SessionLocal()
    try:
        refund_service = RefundService(db)
        order_service = OrderService(db)
        
        user_id = 1001
        
        # 1. 查询用户已支付订单
        orders = order_service.get_user_orders(user_id, status="paid")
        if orders:
            order = orders[0]
            print(f"找到已支付订单: {order.order_no}")
            
            # 2. 创建退款申请
            refund_data = {
                "refund_type": "full",
                "reason": "商品质量问题，要求退款",
                "refund_method": "alipay"
            }
            
            refund_result = refund_service.create_refund(order.id, refund_data)
            if refund_result["success"]:
                refund = refund_result["refund"]
                print(f"退款申请创建成功: {refund.refund_no}")
                print(f"退款金额: {refund.refund_amount}")
                
                # 3. 处理退款（管理员操作）
                process_result = refund_service.process_refund(
                    refund.id,
                    "REFUND_" + str(int(datetime.utcnow().timestamp()))
                )
                if process_result["success"]:
                    print("退款处理成功")
                    
                    # 4. 查询退款状态
                    updated_refund = refund_service.get_refund_by_id(refund.id)
                    print(f"退款状态: {updated_refund.status}")
        
    finally:
        db.close()


def example_business_rules():
    """业务规则示例"""
    print("\n=== 业务规则示例 ===")
    
    from business_rules import CouponBusinessRules, OrderBusinessRules
    
    # 1. 验证优惠券创建规则
    try:
        invalid_coupon_data = {
            "name": "测试优惠券",
            "type": "invalid_type",  # 无效类型
            "discount_value": Decimal("-10.00"),  # 负数折扣
            "total_quantity": 0,  # 零数量
            "valid_from": datetime.utcnow(),
            "valid_until": datetime.utcnow() - timedelta(days=1)  # 过期时间早于开始时间
        }
        
        CouponBusinessRules.validate_coupon_creation(invalid_coupon_data)
    except Exception as e:
        print(f"优惠券验证失败: {e}")
    
    # 2. 验证订单创建规则
    try:
        invalid_order_data = {
            "items": []  # 空商品列表
        }
        
        OrderBusinessRules.validate_order_creation(invalid_order_data)
    except Exception as e:
        print(f"订单验证失败: {e}")
    
    print("业务规则验证完成")


if __name__ == "__main__":
    print("优惠券系统使用示例")
    print("=" * 50)
    
    # 运行示例
    example_coupon_management()
    example_user_coupon_operations()
    example_order_and_payment()
    example_refund_process()
    example_business_rules()
    
    print("\n示例运行完成！")