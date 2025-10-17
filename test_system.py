"""
优惠券系统测试
"""
import pytest
from datetime import datetime, timedelta
from decimal import Decimal
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from models import Base, CouponType, CouponStatus
from coupon_service import CouponService
from user_coupon_service import UserCouponService
from order_service import OrderService, PaymentService
from refund_service import RefundService


# 测试数据库配置
TEST_DATABASE_URL = "sqlite:///./test_coupon_system.db"
engine = create_engine(TEST_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def setup_test_db():
    """设置测试数据库"""
    Base.metadata.create_all(bind=engine)


def teardown_test_db():
    """清理测试数据库"""
    Base.metadata.drop_all(bind=engine)


def test_coupon_creation():
    """测试优惠券创建"""
    setup_test_db()
    
    db = TestingSessionLocal()
    try:
        coupon_service = CouponService(db)
        
        # 创建测试优惠券
        coupon_data = {
            "name": "测试优惠券",
            "description": "测试用优惠券",
            "type": CouponType.FIXED_AMOUNT.value,
            "discount_value": Decimal("10.00"),
            "min_order_amount": Decimal("50.00"),
            "total_quantity": 100,
            "per_user_limit": 1,
            "valid_from": datetime.utcnow(),
            "valid_until": datetime.utcnow() + timedelta(days=30)
        }
        
        coupon = coupon_service.create_coupon(coupon_data)
        
        assert coupon is not None
        assert coupon.name == "测试优惠券"
        assert coupon.type == CouponType.FIXED_AMOUNT.value
        assert coupon.discount_value == Decimal("10.00")
        assert coupon.status == CouponStatus.ACTIVE.value
        
        print("✓ 优惠券创建测试通过")
        
    finally:
        db.close()
        teardown_test_db()


def test_user_coupon_claiming():
    """测试用户优惠券领取"""
    setup_test_db()
    
    db = TestingSessionLocal()
    try:
        coupon_service = CouponService(db)
        user_coupon_service = UserCouponService(db)
        
        # 创建测试优惠券
        coupon_data = {
            "name": "测试优惠券",
            "type": CouponType.FIXED_AMOUNT.value,
            "discount_value": Decimal("10.00"),
            "min_order_amount": Decimal("50.00"),
            "total_quantity": 100,
            "per_user_limit": 1,
            "valid_from": datetime.utcnow(),
            "valid_until": datetime.utcnow() + timedelta(days=30)
        }
        
        coupon = coupon_service.create_coupon(coupon_data)
        
        # 用户领取优惠券
        user_id = 1001
        result = user_coupon_service.claim_coupon(user_id, coupon.code)
        
        assert result["success"] is True
        assert "user_coupon_id" in result
        
        # 验证用户优惠券记录
        user_coupons = user_coupon_service.get_user_coupons(user_id)
        assert len(user_coupons) == 1
        assert user_coupons[0].user_id == user_id
        assert user_coupons[0].coupon_id == coupon.id
        
        print("✓ 用户优惠券领取测试通过")
        
    finally:
        db.close()
        teardown_test_db()


def test_order_creation():
    """测试订单创建"""
    setup_test_db()
    
    db = TestingSessionLocal()
    try:
        order_service = OrderService(db)
        
        # 创建测试订单
        user_id = 1001
        order_data = {
            "items": [
                {
                    "product_id": 1001,
                    "product_name": "测试商品",
                    "quantity": 2,
                    "unit_price": Decimal("50.00")
                }
            ]
        }
        
        result = order_service.create_order(user_id, order_data)
        
        assert result["success"] is True
        assert "order" in result
        
        order = result["order"]
        assert order.user_id == user_id
        assert order.subtotal == Decimal("100.00")
        assert order.total_amount == Decimal("110.00")  # 100 + 10运费
        
        print("✓ 订单创建测试通过")
        
    finally:
        db.close()
        teardown_test_db()


def test_payment_processing():
    """测试支付处理"""
    setup_test_db()
    
    db = TestingSessionLocal()
    try:
        order_service = OrderService(db)
        payment_service = PaymentService(db)
        
        # 创建测试订单
        user_id = 1001
        order_data = {
            "items": [
                {
                    "product_id": 1001,
                    "product_name": "测试商品",
                    "quantity": 1,
                    "unit_price": Decimal("100.00")
                }
            ]
        }
        
        order_result = order_service.create_order(user_id, order_data)
        order = order_result["order"]
        
        # 创建支付
        payment_data = {
            "payment_method": "alipay",
            "payment_channel": "web"
        }
        
        payment_result = payment_service.create_payment(order.id, payment_data)
        assert payment_result["success"] is True
        
        payment = payment_result["payment"]
        assert payment.order_id == order.id
        assert payment.amount == order.total_amount
        
        # 处理支付成功
        success_result = payment_service.process_payment(
            payment.id, 
            "TEST_TRANSACTION_123"
        )
        assert success_result["success"] is True
        
        # 验证订单状态更新
        updated_order = order_service.get_order_by_id(order.id)
        assert updated_order.status == "paid"
        
        print("✓ 支付处理测试通过")
        
    finally:
        db.close()
        teardown_test_db()


def test_refund_process():
    """测试退款流程"""
    setup_test_db()
    
    db = TestingSessionLocal()
    try:
        order_service = OrderService(db)
        payment_service = PaymentService(db)
        refund_service = RefundService(db)
        
        # 创建测试订单并支付
        user_id = 1001
        order_data = {
            "items": [
                {
                    "product_id": 1001,
                    "product_name": "测试商品",
                    "quantity": 1,
                    "unit_price": Decimal("100.00")
                }
            ]
        }
        
        order_result = order_service.create_order(user_id, order_data)
        order = order_result["order"]
        
        payment_data = {"payment_method": "alipay"}
        payment_result = payment_service.create_payment(order.id, payment_data)
        payment = payment_result["payment"]
        
        # 处理支付成功
        payment_service.process_payment(payment.id, "TEST_TRANSACTION_123")
        
        # 创建退款申请
        refund_data = {
            "refund_type": "full",
            "reason": "测试退款",
            "refund_method": "alipay"
        }
        
        refund_result = refund_service.create_refund(order.id, refund_data)
        assert refund_result["success"] is True
        
        refund = refund_result["refund"]
        assert refund.order_id == order.id
        assert refund.refund_amount == order.total_amount
        
        # 处理退款
        process_result = refund_service.process_refund(
            refund.id, 
            "TEST_REFUND_123"
        )
        assert process_result["success"] is True
        
        # 验证订单状态
        updated_order = order_service.get_order_by_id(order.id)
        assert updated_order.status == "refunded"
        
        print("✓ 退款流程测试通过")
        
    finally:
        db.close()
        teardown_test_db()


def test_business_rules():
    """测试业务规则"""
    from business_rules import CouponBusinessRules, OrderBusinessRules
    
    # 测试优惠券创建规则
    try:
        invalid_data = {
            "name": "测试",
            "type": "invalid_type",
            "discount_value": Decimal("-10"),
            "total_quantity": 0,
            "valid_from": datetime.utcnow(),
            "valid_until": datetime.utcnow() - timedelta(days=1)
        }
        CouponBusinessRules.validate_coupon_creation(invalid_data)
        assert False, "应该抛出异常"
    except Exception as e:
        assert "无效的优惠券类型" in str(e)
    
    # 测试订单创建规则
    try:
        invalid_order = {"items": []}
        OrderBusinessRules.validate_order_creation(invalid_order)
        assert False, "应该抛出异常"
    except Exception as e:
        assert "订单商品不能为空" in str(e)
    
    print("✓ 业务规则测试通过")


def run_all_tests():
    """运行所有测试"""
    print("开始运行优惠券系统测试...")
    print("=" * 50)
    
    try:
        test_coupon_creation()
        test_user_coupon_claiming()
        test_order_creation()
        test_payment_processing()
        test_refund_process()
        test_business_rules()
        
        print("=" * 50)
        print("✓ 所有测试通过！")
        
    except Exception as e:
        print(f"✗ 测试失败: {e}")
        raise


if __name__ == "__main__":
    run_all_tests()