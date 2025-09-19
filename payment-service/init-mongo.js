// MongoDB 初始化脚本
// 创建支付服务数据库和用户

db = db.getSiblingDB('payment_service');

// 创建支付服务用户
db.createUser({
  user: 'payment_user',
  pwd: 'payment_password_123',
  roles: [
    {
      role: 'readWrite',
      db: 'payment_service'
    }
  ]
});

// 创建索引
db.payments.createIndex({ "paymentId": 1 }, { unique: true });
db.payments.createIndex({ "idempotencyKey": 1 }, { unique: true });
db.payments.createIndex({ "userId": 1, "status": 1 });
db.payments.createIndex({ "orderId": 1, "status": 1 });
db.payments.createIndex({ "createdAt": -1 });
db.payments.createIndex({ "thirdPartyTransactionId": 1 });

db.idempotencyrecords.createIndex({ "key": 1 }, { unique: true });
db.idempotencyrecords.createIndex({ "status": 1 });
db.idempotencyrecords.createIndex({ "paymentId": 1 });
db.idempotencyrecords.createIndex({ "expiresAt": 1 }, { expireAfterSeconds: 0 });

print('支付服务数据库初始化完成');