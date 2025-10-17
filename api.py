"""
优惠券系统API接口
"""
from datetime import datetime
from decimal import Decimal
from typing import List, Optional
from fastapi import FastAPI, HTTPException, Depends, Query
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from models import Base
from database import get_db, engine
from coupon_service import CouponService
from user_coupon_service import UserCouponService
from order_service import OrderService, PaymentService
from refund_service import RefundService

# 创建数据库表
Base.metadata.create_all(bind=engine)

app = FastAPI(title="优惠券系统API", version="1.0.0")

# 依赖注入
def get_coupon_service(db: Session = Depends(get_db)) -> CouponService:
    return CouponService(db)

def get_user_coupon_service(db: Session = Depends(get_db)) -> UserCouponService:
    return UserCouponService(db)

def get_order_service(db: Session = Depends(get_db)) -> OrderService:
    return OrderService(db)

def get_payment_service(db: Session = Depends(get_db)) -> PaymentService:
    return PaymentService(db)

def get_refund_service(db: Session = Depends(get_db)) -> RefundService:
    return RefundService(db)


# Pydantic模型
class CouponCreate(BaseModel):
    name: str = Field(..., description="优惠券名称")
    description: Optional[str] = Field(None, description="优惠券描述")
    type: str = Field(..., description="优惠券类型")
    discount_value: Decimal = Field(..., description="折扣值")
    min_order_amount: Decimal = Field(0, description="最低订单金额")
    max_discount_amount: Optional[Decimal] = Field(None, description="最大折扣金额")
    total_quantity: int = Field(..., description="总发放数量")
    per_user_limit: int = Field(1, description="每用户限领数量")
    valid_from: datetime = Field(..., description="有效期开始")
    valid_until: datetime = Field(..., description="有效期结束")
    applicable_products: Optional[str] = Field(None, description="适用商品ID列表")
    applicable_categories: Optional[str] = Field(None, description="适用分类ID列表")

class CouponUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    type: Optional[str] = None
    discount_value: Optional[Decimal] = None
    min_order_amount: Optional[Decimal] = None
    max_discount_amount: Optional[Decimal] = None
    total_quantity: Optional[int] = None
    per_user_limit: Optional[int] = None
    valid_from: Optional[datetime] = None
    valid_until: Optional[datetime] = None
    status: Optional[str] = None

class OrderCreate(BaseModel):
    items: List[dict] = Field(..., description="订单商品列表")
    user_coupon_id: Optional[int] = Field(None, description="使用的用户优惠券ID")
    shipping_address: Optional[dict] = Field(None, description="收货地址")

class PaymentCreate(BaseModel):
    payment_method: str = Field("alipay", description="支付方式")
    payment_channel: str = Field("web", description="支付渠道")

class RefundCreate(BaseModel):
    refund_type: str = Field("full", description="退款类型")
    reason: str = Field(..., description="退款原因")
    refund_method: Optional[str] = Field(None, description="退款方式")


# 优惠券管理API
@app.post("/coupons/")
async def create_coupon(
    coupon: CouponCreate,
    service: CouponService = Depends(get_coupon_service)
):
    """创建优惠券"""
    try:
        result = service.create_coupon(coupon.dict())
        return {"success": True, "data": result, "message": "优惠券创建成功"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/coupons/{coupon_id}")
async def get_coupon(
    coupon_id: int,
    service: CouponService = Depends(get_coupon_service)
):
    """获取优惠券详情"""
    coupon = service.get_coupon_by_id(coupon_id)
    if not coupon:
        raise HTTPException(status_code=404, detail="优惠券不存在")
    return {"success": True, "data": coupon}

@app.get("/coupons/")
async def list_coupons(
    status: Optional[str] = Query(None, description="优惠券状态"),
    coupon_type: Optional[str] = Query(None, description="优惠券类型"),
    page: int = Query(1, ge=1, description="页码"),
    page_size: int = Query(20, ge=1, le=100, description="每页数量"),
    service: CouponService = Depends(get_coupon_service)
):
    """获取优惠券列表"""
    coupons = service.list_coupons(status, coupon_type, page, page_size)
    return {"success": True, "data": coupons}

@app.put("/coupons/{coupon_id}")
async def update_coupon(
    coupon_id: int,
    coupon_update: CouponUpdate,
    service: CouponService = Depends(get_coupon_service)
):
    """更新优惠券"""
    update_data = {k: v for k, v in coupon_update.dict().items() if v is not None}
    result = service.update_coupon(coupon_id, update_data)
    if not result:
        raise HTTPException(status_code=404, detail="优惠券不存在")
    return {"success": True, "data": result, "message": "优惠券更新成功"}

@app.delete("/coupons/{coupon_id}")
async def delete_coupon(
    coupon_id: int,
    service: CouponService = Depends(get_coupon_service)
):
    """删除优惠券"""
    success = service.delete_coupon(coupon_id)
    if not success:
        raise HTTPException(status_code=404, detail="优惠券不存在")
    return {"success": True, "message": "优惠券删除成功"}

@app.post("/coupons/{coupon_id}/activate")
async def activate_coupon(
    coupon_id: int,
    service: CouponService = Depends(get_coupon_service)
):
    """激活优惠券"""
    success = service.activate_coupon(coupon_id)
    if not success:
        raise HTTPException(status_code=404, detail="优惠券不存在")
    return {"success": True, "message": "优惠券激活成功"}

@app.post("/coupons/{coupon_id}/deactivate")
async def deactivate_coupon(
    coupon_id: int,
    service: CouponService = Depends(get_coupon_service)
):
    """停用优惠券"""
    success = service.deactivate_coupon(coupon_id)
    if not success:
        raise HTTPException(status_code=404, detail="优惠券不存在")
    return {"success": True, "message": "优惠券停用成功"}


# 用户优惠券API
@app.post("/users/{user_id}/coupons/claim")
async def claim_coupon(
    user_id: int,
    coupon_code: str = Query(..., description="优惠券代码"),
    service: UserCouponService = Depends(get_user_coupon_service)
):
    """用户领取优惠券"""
    result = service.claim_coupon(user_id, coupon_code)
    if not result["success"]:
        raise HTTPException(status_code=400, detail=result["message"])
    return result

@app.get("/users/{user_id}/coupons/")
async def get_user_coupons(
    user_id: int,
    status: Optional[str] = Query(None, description="优惠券状态"),
    page: int = Query(1, ge=1, description="页码"),
    page_size: int = Query(20, ge=1, le=100, description="每页数量"),
    service: UserCouponService = Depends(get_user_coupon_service)
):
    """获取用户优惠券列表"""
    coupons = service.get_user_coupons(user_id, status, page, page_size)
    return {"success": True, "data": coupons}

@app.get("/users/{user_id}/coupons/available")
async def get_available_coupons(
    user_id: int,
    order_amount: Optional[Decimal] = Query(None, description="订单金额"),
    service: UserCouponService = Depends(get_user_coupon_service)
):
    """获取用户可用优惠券列表"""
    coupons = service.get_available_user_coupons(user_id, order_amount)
    return {"success": True, "data": coupons}

@app.get("/users/{user_id}/coupons/stats")
async def get_user_coupon_stats(
    user_id: int,
    service: UserCouponService = Depends(get_user_coupon_service)
):
    """获取用户优惠券统计"""
    stats = service.get_user_coupon_stats(user_id)
    return {"success": True, "data": stats}


# 订单API
@app.post("/orders/")
async def create_order(
    user_id: int,
    order: OrderCreate,
    service: OrderService = Depends(get_order_service)
):
    """创建订单"""
    order_data = order.dict()
    order_data['user_id'] = user_id
    result = service.create_order(user_id, order_data)
    if not result["success"]:
        raise HTTPException(status_code=400, detail=result["message"])
    return result

@app.get("/orders/{order_id}")
async def get_order(
    order_id: int,
    service: OrderService = Depends(get_order_service)
):
    """获取订单详情"""
    order = service.get_order_by_id(order_id)
    if not order:
        raise HTTPException(status_code=404, detail="订单不存在")
    return {"success": True, "data": order}

@app.get("/users/{user_id}/orders/")
async def get_user_orders(
    user_id: int,
    status: Optional[str] = Query(None, description="订单状态"),
    page: int = Query(1, ge=1, description="页码"),
    page_size: int = Query(20, ge=1, le=100, description="每页数量"),
    service: OrderService = Depends(get_order_service)
):
    """获取用户订单列表"""
    orders = service.get_user_orders(user_id, status, page, page_size)
    return {"success": True, "data": orders}

@app.post("/orders/{order_id}/cancel")
async def cancel_order(
    order_id: int,
    user_id: int,
    service: OrderService = Depends(get_order_service)
):
    """取消订单"""
    result = service.cancel_order(order_id, user_id)
    if not result["success"]:
        raise HTTPException(status_code=400, detail=result["message"])
    return result


# 支付API
@app.post("/payments/")
async def create_payment(
    order_id: int,
    payment: PaymentCreate,
    service: PaymentService = Depends(get_payment_service)
):
    """创建支付记录"""
    result = service.create_payment(order_id, payment.dict())
    if not result["success"]:
        raise HTTPException(status_code=400, detail=result["message"])
    return result

@app.post("/payments/{payment_id}/success")
async def process_payment_success(
    payment_id: int,
    transaction_id: str = Query(..., description="第三方交易ID"),
    service: PaymentService = Depends(get_payment_service)
):
    """处理支付成功"""
    result = service.process_payment(payment_id, transaction_id)
    if not result["success"]:
        raise HTTPException(status_code=400, detail=result["message"])
    return result

@app.post("/payments/{payment_id}/failure")
async def process_payment_failure(
    payment_id: int,
    failure_reason: str = Query(..., description="失败原因"),
    service: PaymentService = Depends(get_payment_service)
):
    """处理支付失败"""
    result = service.process_payment_failure(payment_id, failure_reason)
    if not result["success"]:
        raise HTTPException(status_code=400, detail=result["message"])
    return result

@app.get("/payments/{payment_id}")
async def get_payment(
    payment_id: int,
    service: PaymentService = Depends(get_payment_service)
):
    """获取支付记录详情"""
    payment = service.get_payment_by_id(payment_id)
    if not payment:
        raise HTTPException(status_code=404, detail="支付记录不存在")
    return {"success": True, "data": payment}

@app.get("/users/{user_id}/payments/")
async def get_user_payments(
    user_id: int,
    status: Optional[str] = Query(None, description="支付状态"),
    page: int = Query(1, ge=1, description="页码"),
    page_size: int = Query(20, ge=1, le=100, description="每页数量"),
    service: PaymentService = Depends(get_payment_service)
):
    """获取用户支付记录列表"""
    payments = service.get_user_payments(user_id, status, page, page_size)
    return {"success": True, "data": payments}


# 退款API
@app.post("/refunds/")
async def create_refund(
    order_id: int,
    refund: RefundCreate,
    service: RefundService = Depends(get_refund_service)
):
    """创建退款申请"""
    result = service.create_refund(order_id, refund.dict())
    if not result["success"]:
        raise HTTPException(status_code=400, detail=result["message"])
    return result

@app.post("/refunds/{refund_id}/process")
async def process_refund(
    refund_id: int,
    transaction_id: Optional[str] = Query(None, description="第三方退款交易ID"),
    service: RefundService = Depends(get_refund_service)
):
    """处理退款"""
    result = service.process_refund(refund_id, transaction_id)
    if not result["success"]:
        raise HTTPException(status_code=400, detail=result["message"])
    return result

@app.post("/refunds/{refund_id}/reject")
async def reject_refund(
    refund_id: int,
    reason: str = Query(..., description="拒绝原因"),
    service: RefundService = Depends(get_refund_service)
):
    """拒绝退款"""
    result = service.reject_refund(refund_id, reason)
    if not result["success"]:
        raise HTTPException(status_code=400, detail=result["message"])
    return result

@app.get("/refunds/{refund_id}")
async def get_refund(
    refund_id: int,
    service: RefundService = Depends(get_refund_service)
):
    """获取退款记录详情"""
    refund = service.get_refund_by_id(refund_id)
    if not refund:
        raise HTTPException(status_code=404, detail="退款记录不存在")
    return {"success": True, "data": refund}

@app.get("/users/{user_id}/refunds/")
async def get_user_refunds(
    user_id: int,
    status: Optional[str] = Query(None, description="退款状态"),
    page: int = Query(1, ge=1, description="页码"),
    page_size: int = Query(20, ge=1, le=100, description="每页数量"),
    service: RefundService = Depends(get_refund_service)
):
    """获取用户退款记录列表"""
    refunds = service.get_user_refunds(user_id, status, page, page_size)
    return {"success": True, "data": refunds}

@app.get("/admin/refunds/pending")
async def get_pending_refunds(
    page: int = Query(1, ge=1, description="页码"),
    page_size: int = Query(20, ge=1, le=100, description="每页数量"),
    service: RefundService = Depends(get_refund_service)
):
    """获取待处理退款列表（管理员）"""
    refunds = service.get_pending_refunds(page, page_size)
    return {"success": True, "data": refunds}

@app.get("/admin/refunds/stats")
async def get_refund_stats(
    service: RefundService = Depends(get_refund_service)
):
    """获取退款统计（管理员）"""
    stats = service.get_refund_stats()
    return {"success": True, "data": stats}


# 健康检查
@app.get("/health")
async def health_check():
    """健康检查"""
    return {"status": "healthy", "timestamp": datetime.utcnow()}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)