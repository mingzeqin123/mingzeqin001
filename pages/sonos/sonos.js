// pages/sonos/sonos.js
import sonosAPI from '../../utils/sonos-api.js'
import sonosConfigValidator from '../../utils/sonos-config-validator.js'

Page({
  data: {
    isConfigured: false,
    apiKey: '',
    apiSecret: '',
    households: [],
    groups: [],
    players: [],
    selectedHousehold: '',
    selectedPlayer: '',
    connectionStatus: 'disconnected',
    config: {}
  },

  onLoad() {
    this.loadStoredConfig()
  },

  onShow() {
    this.checkConnectionStatus()
  },

  // 加载存储的配置
  loadStoredConfig() {
    try {
      const config = wx.getStorageSync('sonosConfig')
      if (config) {
        this.setData({
          apiKey: config.apiKey || '',
          apiSecret: config.apiSecret || '',
          selectedHousehold: config.householdId || '',
          selectedPlayer: config.playerId || '',
          isConfigured: !!(config.apiKey && config.apiSecret)
        })
      }
    } catch (error) {
      console.error('加载配置失败:', error)
    }
  },

  // 保存配置
  saveConfig() {
    try {
      const config = {
        apiKey: this.data.apiKey,
        apiSecret: this.data.apiSecret,
        householdId: this.data.selectedHousehold,
        playerId: this.data.selectedPlayer
      }
      wx.setStorageSync('sonosConfig', config)
      this.setData({ isConfigured: true })
      wx.showToast({
        title: '配置已保存',
        icon: 'success'
      })
    } catch (error) {
      console.error('保存配置失败:', error)
      wx.showToast({
        title: '保存失败',
        icon: 'error'
      })
    }
  },

  // 输入API密钥
  onApiKeyInput(e) {
    const apiKey = e.detail.value
    this.setData({ apiKey })
    
    // 实时验证
    const validation = sonosConfigValidator.validateApiKey(apiKey)
    if (!validation.valid) {
      console.warn('API Key 验证:', validation.message)
    }
  },

  // 输入API密钥
  onApiSecretInput(e) {
    const apiSecret = e.detail.value
    this.setData({ apiSecret })
    
    // 实时验证
    const validation = sonosConfigValidator.validateApiSecret(apiSecret)
    if (!validation.valid) {
      console.warn('API Secret 验证:', validation.message)
    }
  },

  // 连接Sonos API
  async connectSonos() {
    // 验证配置
    const config = {
      apiKey: this.data.apiKey,
      apiSecret: this.data.apiSecret
    }
    
    const validation = sonosConfigValidator.validateConfig(config)
    if (!validation.valid) {
      wx.showModal({
        title: '配置错误',
        content: validation.errors.join('\n'),
        showCancel: false
      })
      return
    }

    wx.showLoading({ title: '连接中...' })

    try {
      const success = await sonosAPI.initialize(this.data.apiKey, this.data.apiSecret)
      
      if (success) {
        await this.loadHouseholds()
        this.setData({ connectionStatus: 'connected' })
        wx.showToast({
          title: '连接成功',
          icon: 'success'
        })
        this.saveConfig()
      } else {
        throw new Error('连接失败')
      }
    } catch (error) {
      console.error('连接Sonos失败:', error)
      wx.showToast({
        title: '连接失败',
        icon: 'error'
      })
    } finally {
      wx.hideLoading()
    }
  },

  // 加载家庭列表
  async loadHouseholds() {
    try {
      const households = await sonosAPI.getHouseholds()
      this.setData({ households })
      
      if (households.length > 0) {
        const householdId = households[0].id
        this.setData({ selectedHousehold: householdId })
        await this.loadPlayers(householdId)
      }
    } catch (error) {
      console.error('加载家庭列表失败:', error)
    }
  },

  // 选择家庭
  onHouseholdChange(e) {
    const householdId = e.detail.value
    this.setData({ selectedHousehold: householdId })
    this.loadPlayers(householdId)
  },

  // 加载播放器列表
  async loadPlayers(householdId) {
    try {
      const players = await sonosAPI.getPlayers(householdId)
      this.setData({ players })
      
      if (players.length > 0) {
        this.setData({ selectedPlayer: players[0].id })
      }
    } catch (error) {
      console.error('加载播放器列表失败:', error)
    }
  },

  // 选择播放器
  onPlayerChange(e) {
    this.setData({ selectedPlayer: e.detail.value })
  },

  // 测试连接
  async testConnection() {
    if (!this.data.selectedHousehold || !this.data.selectedPlayer) {
      wx.showToast({
        title: '请选择家庭和播放器',
        icon: 'error'
      })
      return
    }

    wx.showLoading({ title: '测试中...' })

    try {
      await sonosAPI.playGameSound(
        this.data.selectedHousehold,
        this.data.selectedPlayer,
        'start'
      )
      
      wx.showToast({
        title: '测试成功',
        icon: 'success'
      })
    } catch (error) {
      console.error('测试连接失败:', error)
      wx.showToast({
        title: '测试失败',
        icon: 'error'
      })
    } finally {
      wx.hideLoading()
    }
  },

  // 检查连接状态
  checkConnectionStatus() {
    const config = sonosAPI.getConfig()
    this.setData({ 
      config,
      connectionStatus: config.isInitialized ? 'connected' : 'disconnected'
    })
  },

  // 断开连接
  disconnect() {
    sonosAPI.isInitialized = false
    sonosAPI.accessToken = null
    this.setData({
      connectionStatus: 'disconnected',
      households: [],
      players: [],
      selectedHousehold: '',
      selectedPlayer: ''
    })
    
    wx.removeStorageSync('sonosConfig')
    wx.showToast({
      title: '已断开连接',
      icon: 'success'
    })
  },

  // 获取帮助信息
  showHelp() {
    wx.showModal({
      title: 'Sonos配置帮助',
      content: '1. 访问 https://developer.sonos.com 注册开发者账号\n2. 创建新的Control Integration获取API密钥\n3. 确保手机和Sonos设备在同一网络\n4. 填写API密钥并测试连接',
      showCancel: false,
      confirmText: '知道了'
    })
  },

  // 返回游戏
  backToGame() {
    wx.navigateBack()
  }
})