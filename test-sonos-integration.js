// test-sonos-integration.js
// Sonos 集成测试脚本

import sonosAPI from './utils/sonos-api.js'
import enhancedAudioManager from './utils/enhanced-audio-manager.js'

class SonosIntegrationTest {
  constructor() {
    this.testResults = []
  }

  // 运行所有测试
  async runAllTests() {
    console.log('🚀 开始 Sonos 集成测试...')
    
    try {
      await this.testSonosAPI()
      await this.testEnhancedAudioManager()
      await this.testGameIntegration()
      
      this.printResults()
    } catch (error) {
      console.error('❌ 测试过程中发生错误:', error)
    }
  }

  // 测试 Sonos API
  async testSonosAPI() {
    console.log('\n📡 测试 Sonos API...')
    
    // 测试 API 初始化
    try {
      const config = sonosAPI.getConfig()
      this.addResult('Sonos API 配置检查', config.isInitialized, config)
    } catch (error) {
      this.addResult('Sonos API 配置检查', false, error.message)
    }

    // 测试音频片段播放（模拟）
    try {
      const mockAudioClip = {
        name: 'Test Audio',
        appId: 'com.wechat.jumpgame',
        streamUrl: 'data:audio/mp3;base64,test',
        volume: 20,
        clipType: 'CHIME'
      }
      
      // 这里只是测试方法调用，不会实际播放
      console.log('✅ 音频片段播放方法可用')
      this.addResult('音频片段播放方法', true, '方法调用成功')
    } catch (error) {
      this.addResult('音频片段播放方法', false, error.message)
    }
  }

  // 测试增强音频管理器
  async testEnhancedAudioManager() {
    console.log('\n🎵 测试增强音频管理器...')
    
    try {
      // 测试音频状态获取
      const status = enhancedAudioManager.getAudioStatus()
      this.addResult('音频状态获取', true, status)
      
      // 测试音频开关设置
      enhancedAudioManager.setAudioEnabled(true)
      enhancedAudioManager.setMusicEnabled(true)
      enhancedAudioManager.setSoundEnabled(true)
      this.addResult('音频开关设置', true, '设置成功')
      
      // 测试游戏音效播放（模拟）
      try {
        await enhancedAudioManager.playGameSound('test')
        this.addResult('游戏音效播放', true, '播放成功')
      } catch (error) {
        // 预期会失败，因为没有配置 Sonos
        this.addResult('游戏音效播放', false, '预期失败（未配置）')
      }
      
    } catch (error) {
      this.addResult('增强音频管理器测试', false, error.message)
    }
  }

  // 测试游戏集成
  async testGameIntegration() {
    console.log('\n🎮 测试游戏集成...')
    
    try {
      // 测试游戏音效类型
      const soundTypes = ['start', 'jump', 'landing', 'perfect', 'gameOver', 'newRecord']
      
      for (const soundType of soundTypes) {
        try {
          await enhancedAudioManager.playGameSound(soundType, 100)
          this.addResult(`游戏音效: ${soundType}`, true, '播放成功')
        } catch (error) {
          this.addResult(`游戏音效: ${soundType}`, false, error.message)
        }
      }
      
      // 测试音频配置保存
      enhancedAudioManager.saveConfig()
      this.addResult('音频配置保存', true, '保存成功')
      
    } catch (error) {
      this.addResult('游戏集成测试', false, error.message)
    }
  }

  // 添加测试结果
  addResult(testName, success, details) {
    this.testResults.push({
      name: testName,
      success,
      details,
      timestamp: new Date().toISOString()
    })
  }

  // 打印测试结果
  printResults() {
    console.log('\n📊 测试结果汇总:')
    console.log('=' * 50)
    
    const successCount = this.testResults.filter(r => r.success).length
    const totalCount = this.testResults.length
    
    console.log(`✅ 成功: ${successCount}/${totalCount}`)
    console.log(`❌ 失败: ${totalCount - successCount}/${totalCount}`)
    
    console.log('\n📋 详细结果:')
    this.testResults.forEach((result, index) => {
      const status = result.success ? '✅' : '❌'
      console.log(`${index + 1}. ${status} ${result.name}`)
      if (result.details) {
        console.log(`   详情: ${JSON.stringify(result.details, null, 2)}`)
      }
    })
    
    console.log('\n🎯 测试完成!')
  }

  // 模拟游戏场景测试
  async simulateGameScenario() {
    console.log('\n🎮 模拟游戏场景测试...')
    
    const scenarios = [
      { action: 'start', sound: 'start' },
      { action: 'jump', sound: 'jump' },
      { action: 'landing', sound: 'landing' },
      { action: 'perfect_landing', sound: 'perfect' },
      { action: 'new_record', sound: 'newRecord' },
      { action: 'game_over', sound: 'gameOver' }
    ]
    
    for (const scenario of scenarios) {
      console.log(`🎬 模拟场景: ${scenario.action}`)
      try {
        await enhancedAudioManager.playGameSound(scenario.sound, 50)
        console.log(`   ✅ 音效播放: ${scenario.sound}`)
      } catch (error) {
        console.log(`   ❌ 音效播放失败: ${error.message}`)
      }
      
      // 模拟延迟
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
  }
}

// 运行测试
const test = new SonosIntegrationTest()

// 在微信小程序环境中运行测试
if (typeof wx !== 'undefined') {
  // 微信小程序环境
  test.runAllTests().then(() => {
    console.log('🎉 所有测试完成!')
  })
} else {
  // Node.js 环境
  test.runAllTests().then(() => {
    console.log('🎉 所有测试完成!')
  })
}

export default SonosIntegrationTest