/**
 * 微信公众号分享卡片使用示例
 * 演示如何获取和使用分享卡片ticket
 */

const { wechatShareCard } = require('../utils/wechatShare.js')

// 示例1: 基本使用
async function basicExample() {
  console.log('=== 基本使用示例 ===')
  
  try {
    // 创建游戏分享卡片
    const shareData = {
      score: 150,
      playerName: '小明',
      bestScore: 200
    }
    
    const result = await wechatShareCard.createGameShareCard(shareData)
    
    if (result.success) {
      console.log('✅ 分享卡片创建成功!')
      console.log('Ticket:', result.ticket)
      console.log('二维码URL:', result.qrCodeUrl)
      console.log('卡片数据:', result.cardData)
    } else {
      console.error('❌ 分享卡片创建失败:', result.error)
    }
  } catch (error) {
    console.error('❌ 发生错误:', error.message)
  }
}

// 示例2: 自定义分享卡片
async function customCardExample() {
  console.log('\n=== 自定义分享卡片示例 ===')
  
  try {
    const customCardData = {
      title: '我的跳一跳成绩',
      description: '看看我的分数吧！',
      imageUrl: '/images/custom-share.png',
      url: '/pages/game/game?from=custom'
    }
    
    const ticket = await wechatShareCard.createShareCardTicket(customCardData)
    const qrCodeUrl = wechatShareCard.getShareCardQRCodeUrl(ticket)
    
    console.log('✅ 自定义分享卡片创建成功!')
    console.log('Ticket:', ticket)
    console.log('二维码URL:', qrCodeUrl)
  } catch (error) {
    console.error('❌ 自定义分享卡片创建失败:', error.message)
  }
}

// 示例3: 批量创建分享卡片
async function batchCreateExample() {
  console.log('\n=== 批量创建分享卡片示例 ===')
  
  const players = [
    { name: '玩家1', score: 100 },
    { name: '玩家2', score: 200 },
    { name: '玩家3', score: 300 }
  ]
  
  const results = []
  
  for (const player of players) {
    try {
      const result = await wechatShareCard.createGameShareCard({
        score: player.score,
        playerName: player.name,
        bestScore: 300
      })
      
      results.push({
        player: player.name,
        success: result.success,
        ticket: result.ticket,
        error: result.error
      })
    } catch (error) {
      results.push({
        player: player.name,
        success: false,
        error: error.message
      })
    }
  }
  
  console.log('批量创建结果:')
  results.forEach(result => {
    if (result.success) {
      console.log(`✅ ${result.player}: ${result.ticket}`)
    } else {
      console.log(`❌ ${result.player}: ${result.error}`)
    }
  })
}

// 示例4: 在微信小程序页面中使用
function miniProgramPageExample() {
  console.log('\n=== 微信小程序页面使用示例 ===')
  
  // 在Page对象中使用
  const pageExample = {
    data: {
      score: 0,
      shareCardTicket: ''
    },
    
    // 创建分享卡片
    async createShareCard() {
      try {
        const shareData = {
          score: this.data.score,
          playerName: '当前玩家',
          bestScore: wx.getStorageSync('bestScore') || 0
        }
        
        const result = await wechatShareCard.createGameShareCard(shareData)
        
        if (result.success) {
          this.setData({
            shareCardTicket: result.ticket
          })
          
          wx.showModal({
            title: '分享卡片创建成功',
            content: `Ticket: ${result.ticket}`,
            success: (res) => {
              if (res.confirm) {
                wx.setClipboardData({
                  data: result.ticket,
                  success: () => {
                    wx.showToast({
                      title: 'Ticket已复制',
                      icon: 'success'
                    })
                  }
                })
              }
            }
          })
        } else {
          wx.showToast({
            title: '创建失败',
            icon: 'error'
          })
        }
      } catch (error) {
        console.error('创建分享卡片失败:', error)
        wx.showToast({
          title: '创建失败',
          icon: 'error'
        })
      }
    },
    
    // 分享给朋友
    onShareAppMessage() {
      return {
        title: `我的跳一跳成绩: ${this.data.score}分`,
        path: `/pages/game/game?score=${this.data.score}&ticket=${this.data.shareCardTicket}`,
        imageUrl: '/images/share.png'
      }
    }
  }
  
  console.log('页面示例代码已准备，可以在实际页面中使用')
}

// 运行示例
async function runExamples() {
  console.log('🚀 开始运行微信公众号分享卡片示例...\n')
  
  // 注意：在实际运行前，请确保已正确配置微信公众号信息
  console.log('⚠️  请确保已在 config/wechatConfig.js 中配置正确的微信公众号信息')
  console.log('⚠️  示例代码需要在小程序环境中运行才能调用微信API\n')
  
  // 运行示例
  await basicExample()
  await customCardExample()
  await batchCreateExample()
  miniProgramPageExample()
  
  console.log('\n✅ 所有示例运行完成!')
}

// 导出示例函数
module.exports = {
  basicExample,
  customCardExample,
  batchCreateExample,
  miniProgramPageExample,
  runExamples
}

// 如果直接运行此文件，则执行示例
if (typeof wx !== 'undefined') {
  // 在小程序环境中运行
  runExamples()
} else {
  // 在Node.js环境中运行
  console.log('请在微信小程序环境中运行此示例')
}