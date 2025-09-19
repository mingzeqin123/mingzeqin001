#!/bin/bash

# 支付服务启动脚本

set -e

echo "正在启动支付服务..."

# 检查环境变量
if [ -z "$MONGODB_URI" ]; then
    echo "警告: MONGODB_URI 环境变量未设置，使用默认值"
    export MONGODB_URI="mongodb://localhost:27017/payment_service"
fi

# 检查 MongoDB 连接
echo "检查 MongoDB 连接..."
until mongosh "$MONGODB_URI" --eval "db.adminCommand('ismaster')" >/dev/null 2>&1; do
    echo "等待 MongoDB 启动..."
    sleep 2
done
echo "MongoDB 连接成功"

# 运行数据库迁移（如果需要）
echo "检查数据库索引..."
node -e "
const mongoose = require('mongoose');
mongoose.connect('$MONGODB_URI').then(async () => {
  console.log('数据库连接成功');
  
  // 创建索引
  const db = mongoose.connection.db;
  
  // 支付记录索引
  await db.collection('payments').createIndex({ paymentId: 1 }, { unique: true, background: true });
  await db.collection('payments').createIndex({ idempotencyKey: 1 }, { unique: true, background: true });
  await db.collection('payments').createIndex({ userId: 1, status: 1 }, { background: true });
  await db.collection('payments').createIndex({ orderId: 1, status: 1 }, { background: true });
  await db.collection('payments').createIndex({ createdAt: -1 }, { background: true });
  await db.collection('payments').createIndex({ thirdPartyTransactionId: 1 }, { background: true });
  
  // 幂等性记录索引
  await db.collection('idempotencyrecords').createIndex({ key: 1 }, { unique: true, background: true });
  await db.collection('idempotencyrecords').createIndex({ status: 1 }, { background: true });
  await db.collection('idempotencyrecords').createIndex({ paymentId: 1 }, { background: true });
  await db.collection('idempotencyrecords').createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0, background: true });
  
  console.log('索引创建完成');
  process.exit(0);
}).catch(err => {
  console.error('数据库连接失败:', err);
  process.exit(1);
});
"

# 启动应用
echo "启动支付服务应用..."
exec node app.js