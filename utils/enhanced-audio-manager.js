// utils/enhanced-audio-manager.js
// 增强的音频管理器，集成Sonos和本地音频

import sonosAPI from './sonos-api.js'

class EnhancedAudioManager {
  constructor() {
    this.localAudioManager = null
    this.sonosEnabled = false
    this.sonosConfig = null
    this.audioEnabled = true
    this.musicEnabled = true
    this.soundEnabled = true
    
    this.loadConfig()
  }

  // 加载配置
  loadConfig() {
    try {
      this.sonosConfig = wx.getStorageSync('sonosConfig')
      this.sonosEnabled = !!(this.sonosConfig && this.sonosConfig.apiKey && this.sonosConfig.apiSecret)
    } catch (error) {
      console.error('加载音频配置失败:', error)
      this.sonosEnabled = false
    }
  }

  // 初始化本地音频管理器
  initLocalAudio() {
    if (!this.localAudioManager) {
      // 这里可以初始化本地音频管理器
      // 由于微信小程序的限制，我们主要依赖Sonos
      console.log('本地音频管理器初始化')
    }
  }

  // 播放游戏音效
  async playGameSound(soundType, score = 0) {
    if (!this.audioEnabled) return

    // 优先使用Sonos播放
    if (this.sonosEnabled && sonosAPI.isReady()) {
      try {
        await this.playSonosSound(soundType, score)
        return
      } catch (error) {
        console.error('Sonos播放失败，尝试本地播放:', error)
      }
    }

    // 降级到本地播放
    this.playLocalSound(soundType)
  }

  // 播放Sonos音效
  async playSonosSound(soundType, score = 0) {
    if (!this.sonosConfig || !sonosAPI.isReady()) {
      throw new Error('Sonos未配置或未连接')
    }

    const soundMessages = {
      'jump': '跳跃！',
      'landing': '落地成功！',
      'perfect': '完美落地！',
      'gameOver': '游戏结束！',
      'newRecord': `新纪录！${score}分！`,
      'start': '游戏开始！',
      'pause': '游戏暂停',
      'resume': '游戏继续'
    }

    const message = soundMessages[soundType] || '游戏音效'
    
    await sonosAPI.playGameSound(
      this.sonosConfig.householdId,
      this.sonosConfig.playerId,
      soundType,
      score
    )
  }

  // 播放本地音效
  playLocalSound(soundType) {
    // 这里可以实现本地音效播放
    // 由于微信小程序的限制，我们主要使用震动反馈
    const vibrationPatterns = {
      'jump': 'short',
      'landing': 'short',
      'perfect': 'heavy',
      'gameOver': 'heavy',
      'newRecord': 'heavy',
      'start': 'short'
    }

    const pattern = vibrationPatterns[soundType]
    if (pattern) {
      wx.vibrateShort({
        type: pattern
      })
    }
  }

  // 播放背景音乐
  async playBackgroundMusic() {
    if (!this.musicEnabled) return

    if (this.sonosEnabled && sonosAPI.isReady()) {
      try {
        // 使用Sonos播放背景音乐
        await this.playSonosBackgroundMusic()
      } catch (error) {
        console.error('Sonos背景音乐播放失败:', error)
      }
    }
  }

  // 播放Sonos背景音乐
  async playSonosBackgroundMusic() {
    if (!this.sonosConfig || !sonosAPI.isReady()) {
      throw new Error('Sonos未配置或未连接')
    }

    // 这里可以播放预设的背景音乐
    // 需要先上传音乐文件到可访问的URL
    const backgroundMusicUrl = 'https://your-music-server.com/background-music.mp3'
    
    const audioClip = {
      name: 'Background Music',
      appId: 'com.wechat.jumpgame',
      streamUrl: backgroundMusicUrl,
      volume: 30,
      clipType: 'CUSTOM'
    }

    await sonosAPI.playAudioClip(
      this.sonosConfig.householdId,
      this.sonosConfig.playerId,
      audioClip
    )
  }

  // 停止所有音频
  async stopAllAudio() {
    if (this.sonosEnabled && sonosAPI.isReady() && this.sonosConfig) {
      try {
        await sonosAPI.pause(
          this.sonosConfig.householdId,
          this.sonosConfig.playerId
        )
      } catch (error) {
        console.error('停止Sonos音频失败:', error)
      }
    }
  }

  // 设置音量
  async setVolume(volume) {
    if (this.sonosEnabled && sonosAPI.isReady() && this.sonosConfig) {
      try {
        await sonosAPI.setVolume(
          this.sonosConfig.householdId,
          this.sonosConfig.playerId,
          volume
        )
      } catch (error) {
        console.error('设置Sonos音量失败:', error)
      }
    }
  }

  // 设置音频开关
  setAudioEnabled(enabled) {
    this.audioEnabled = enabled
    this.saveConfig()
  }

  // 设置音乐开关
  setMusicEnabled(enabled) {
    this.musicEnabled = enabled
    this.saveConfig()
  }

  // 设置音效开关
  setSoundEnabled(enabled) {
    this.soundEnabled = enabled
    this.saveConfig()
  }

  // 保存配置
  saveConfig() {
    try {
      const config = {
        audioEnabled: this.audioEnabled,
        musicEnabled: this.musicEnabled,
        soundEnabled: this.soundEnabled
      }
      wx.setStorageSync('audioConfig', config)
    } catch (error) {
      console.error('保存音频配置失败:', error)
    }
  }

  // 获取音频状态
  getAudioStatus() {
    return {
      audioEnabled: this.audioEnabled,
      musicEnabled: this.musicEnabled,
      soundEnabled: this.soundEnabled,
      sonosEnabled: this.sonosEnabled,
      sonosReady: sonosAPI.isReady()
    }
  }

  // 检查Sonos连接状态
  async checkSonosConnection() {
    if (!this.sonosConfig) {
      return { connected: false, error: '未配置Sonos' }
    }

    try {
      const config = sonosAPI.getConfig()
      return {
        connected: config.isInitialized,
        householdsCount: config.householdsCount,
        playersCount: config.playersCount
      }
    } catch (error) {
      return { connected: false, error: error.message }
    }
  }

  // 重新连接Sonos
  async reconnectSonos() {
    if (!this.sonosConfig) {
      throw new Error('未配置Sonos')
    }

    try {
      const success = await sonosAPI.initialize(
        this.sonosConfig.apiKey,
        this.sonosConfig.apiSecret
      )
      
      if (success) {
        this.sonosEnabled = true
        return true
      } else {
        throw new Error('连接失败')
      }
    } catch (error) {
      this.sonosEnabled = false
      throw error
    }
  }
}

// 创建全局实例
const enhancedAudioManager = new EnhancedAudioManager()

export default enhancedAudioManager