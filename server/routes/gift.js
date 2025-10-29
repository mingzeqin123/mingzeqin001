const express = require('express');
const router = express.Router();

/**
 * 获取礼物列表
 * GET /api/gift/list
 */
router.get('/list', async (req, res) => {
  try {
    const gifts = [
      {
        id: 1,
        name: '玫瑰',
        icon: '/images/gifts/rose.png',
        value: 1,
        animation: 'rose',
        description: '送上一朵玫瑰'
      },
      {
        id: 2,
        name: '爱心',
        icon: '/images/gifts/heart.png',
        value: 5,
        animation: 'heart',
        description: '送上一颗爱心'
      },
      {
        id: 3,
        name: '钻石',
        icon: '/images/gifts/diamond.png',
        value: 10,
        animation: 'diamond',
        description: '送上一颗钻石'
      },
      {
        id: 4,
        name: '跑车',
        icon: '/images/gifts/car.png',
        value: 50,
        animation: 'car',
        description: '送上一辆跑车'
      },
      {
        id: 5,
        name: '飞机',
        icon: '/images/gifts/plane.png',
        value: 100,
        animation: 'plane',
        description: '送上一架飞机'
      },
      {
        id: 6,
        name: '火箭',
        icon: '/images/gifts/rocket.png',
        value: 500,
        animation: 'rocket',
        description: '送上一枚火箭'
      },
      {
        id: 7,
        name: '城堡',
        icon: '/images/gifts/castle.png',
        value: 1000,
        animation: 'castle',
        description: '送上一座城堡'
      },
      {
        id: 8,
        name: '皇冠',
        icon: '/images/gifts/crown.png',
        value: 2000,
        animation: 'crown',
        description: '送上一顶皇冠'
      }
    ];
    
    res.json({
      code: 0,
      message: '获取成功',
      data: gifts
    });
  } catch (error) {
    console.error('获取礼物列表失败:', error);
    res.json({
      code: 500,
      message: '获取失败'
    });
  }
});

/**
 * 发送礼物
 * POST /api/gift/send
 */
router.post('/send', async (req, res) => {
  try {
    const { roomId, giftId, userId, userInfo } = req.body;
    
    if (!roomId || !giftId || !userId) {
      return res.json({
        code: 400,
        message: '缺少必要参数'
      });
    }
    
    // 获取礼物信息
    const gift = await req.liveService.getGiftById(giftId);
    if (!gift) {
      return res.json({
        code: 400,
        message: '礼物不存在'
      });
    }
    
    // 检查用户金币是否足够
    const user = await req.liveService.getUserById(userId);
    if (!user || user.coins < gift.value) {
      return res.json({
        code: 400,
        message: '金币不足'
      });
    }
    
    // 扣除用户金币
    await req.liveService.updateUser(userId, {
      coins: user.coins - gift.value
    });
    
    // 创建礼物记录
    const giftRecord = {
      id: Date.now(),
      roomId,
      giftId: gift.id,
      giftName: gift.name,
      giftValue: gift.value,
      userId,
      userInfo,
      timestamp: new Date()
    };
    
    // 保存礼物记录
    await req.liveService.saveGift(roomId, giftRecord);
    
    // 更新主播收益
    await req.liveService.updateHostEarnings(roomId, gift.value);
    
    res.json({
      code: 0,
      message: '发送成功',
      data: giftRecord
    });
  } catch (error) {
    console.error('发送礼物失败:', error);
    res.json({
      code: 500,
      message: '发送失败'
    });
  }
});

/**
 * 获取礼物统计
 * GET /api/gift/stats/:roomId
 */
router.get('/stats/:roomId', async (req, res) => {
  try {
    const { roomId } = req.params;
    const { startTime, endTime } = req.query;
    
    const stats = await req.liveService.getGiftStats(roomId, startTime, endTime);
    
    res.json({
      code: 0,
      message: '获取成功',
      data: stats
    });
  } catch (error) {
    console.error('获取礼物统计失败:', error);
    res.json({
      code: 500,
      message: '获取失败'
    });
  }
});

/**
 * 获取用户礼物记录
 * GET /api/gift/user/:userId
 */
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    
    const records = await req.liveService.getUserGiftRecords(
      userId,
      parseInt(page),
      parseInt(limit)
    );
    
    res.json({
      code: 0,
      message: '获取成功',
      data: records
    });
  } catch (error) {
    console.error('获取用户礼物记录失败:', error);
    res.json({
      code: 500,
      message: '获取失败'
    });
  }
});

/**
 * 获取主播收益记录
 * GET /api/gift/earnings/:userId
 */
router.get('/earnings/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    
    const earnings = await req.liveService.getHostEarnings(
      userId,
      parseInt(page),
      parseInt(limit)
    );
    
    res.json({
      code: 0,
      message: '获取成功',
      data: earnings
    });
  } catch (error) {
    console.error('获取主播收益记录失败:', error);
    res.json({
      code: 500,
      message: '获取失败'
    });
  }
});

/**
 * 提现申请
 * POST /api/gift/withdraw
 */
router.post('/withdraw', async (req, res) => {
  try {
    const { userId, amount, accountType, accountInfo } = req.body;
    
    if (!userId || !amount || !accountType || !accountInfo) {
      return res.json({
        code: 400,
        message: '缺少必要参数'
      });
    }
    
    // 检查用户余额
    const user = await req.liveService.getUserById(userId);
    if (!user || user.earnings < amount) {
      return res.json({
        code: 400,
        message: '余额不足'
      });
    }
    
    // 检查最小提现金额
    const minWithdraw = 100; // 最小提现100金币
    if (amount < minWithdraw) {
      return res.json({
        code: 400,
        message: `最小提现金额为${minWithdraw}金币`
      });
    }
    
    // 创建提现申请
    const withdrawRecord = {
      id: Date.now().toString(),
      userId,
      amount,
      accountType,
      accountInfo,
      status: 'pending', // pending, approved, rejected
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    await req.liveService.createWithdrawRecord(withdrawRecord);
    
    res.json({
      code: 0,
      message: '提现申请已提交',
      data: withdrawRecord
    });
  } catch (error) {
    console.error('提现申请失败:', error);
    res.json({
      code: 500,
      message: '提现申请失败'
    });
  }
});

/**
 * 获取提现记录
 * GET /api/gift/withdraw/:userId
 */
router.get('/withdraw/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    
    const records = await req.liveService.getWithdrawRecords(
      userId,
      parseInt(page),
      parseInt(limit)
    );
    
    res.json({
      code: 0,
      message: '获取成功',
      data: records
    });
  } catch (error) {
    console.error('获取提现记录失败:', error);
    res.json({
      code: 500,
      message: '获取失败'
    });
  }
});

/**
 * 充值金币
 * POST /api/gift/recharge
 */
router.post('/recharge', async (req, res) => {
  try {
    const { userId, amount, paymentMethod } = req.body;
    
    if (!userId || !amount || !paymentMethod) {
      return res.json({
        code: 400,
        message: '缺少必要参数'
      });
    }
    
    // 检查充值金额
    if (amount <= 0) {
      return res.json({
        code: 400,
        message: '充值金额必须大于0'
      });
    }
    
    // 获取用户信息
    const user = await req.liveService.getUserById(userId);
    if (!user) {
      return res.json({
        code: 400,
        message: '用户不存在'
      });
    }
    
    // 更新用户金币
    await req.liveService.updateUser(userId, {
      coins: user.coins + amount
    });
    
    // 创建充值记录
    const rechargeRecord = {
      id: Date.now().toString(),
      userId,
      amount,
      paymentMethod,
      status: 'completed',
      createdAt: new Date()
    };
    
    await req.liveService.createRechargeRecord(rechargeRecord);
    
    res.json({
      code: 0,
      message: '充值成功',
      data: {
        newBalance: user.coins + amount
      }
    });
  } catch (error) {
    console.error('充值失败:', error);
    res.json({
      code: 500,
      message: '充值失败'
    });
  }
});

module.exports = router;