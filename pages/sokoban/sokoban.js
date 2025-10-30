// pages/sokoban/sokoban.js
import SokobanSolver from './sokobanSolver.js'
import ImageProcessor from './imageProcessor.js'
import PuzzleRenderer from './puzzleRenderer.js'
import { testPuzzles, convertGridToPuzzle } from './testPuzzles.js'

Page({
  data: {
    imageUrl: '',
    puzzleGrid: null,
    solution: null,
    isProcessing: false,
    currentStep: 0,
    totalSteps: 0,
    solutionSteps: [],
    showSolution: false,
    processingStatus: '',
    showTestMode: false,
    testPuzzles: testPuzzles,
    selectedTestPuzzle: 0,
    showRenderer: false
  },

  onLoad() {
    this.imageProcessor = new ImageProcessor()
    this.sokobanSolver = new SokobanSolver()
    this.puzzleRenderer = new PuzzleRenderer('puzzleCanvas', this)
  },

  // 选择图片
  chooseImage() {
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const tempFilePath = res.tempFilePaths[0]
        this.setData({
          imageUrl: tempFilePath,
          puzzleGrid: null,
          solution: null,
          showSolution: false,
          currentStep: 0,
          totalSteps: 0,
          solutionSteps: []
        })
      },
      fail: (err) => {
        wx.showToast({
          title: '选择图片失败',
          icon: 'error'
        })
        console.error('选择图片失败:', err)
      }
    })
  },

  // 分析图片并求解
  async solvePuzzle() {
    if (!this.data.imageUrl) {
      wx.showToast({
        title: '请先选择图片',
        icon: 'none'
      })
      return
    }

    this.setData({
      isProcessing: true,
      processingStatus: '正在分析图片...'
    })

    try {
      // 1. 图像处理 - 提取推箱子布局
      const puzzleGrid = await this.imageProcessor.extractPuzzleFromImage(this.data.imageUrl)
      
      if (!puzzleGrid) {
        throw new Error('无法识别推箱子布局，请确保图片清晰且包含完整的推箱子游戏界面')
      }

      this.setData({
        puzzleGrid: puzzleGrid,
        processingStatus: '正在计算最优解...'
      })

      // 2. 求解推箱子
      const solution = await this.sokobanSolver.solve(puzzleGrid)
      
      if (!solution) {
        throw new Error('无法找到解决方案，请检查推箱子是否有解')
      }

      this.setData({
        solution: solution,
        solutionSteps: solution.steps,
        totalSteps: solution.steps.length,
        currentStep: 0,
        showSolution: true,
        isProcessing: false,
        processingStatus: ''
      })

      wx.showToast({
        title: `找到解决方案！共${solution.steps.length}步`,
        icon: 'success',
        duration: 2000
      })

    } catch (error) {
      console.error('求解失败:', error)
      this.setData({
        isProcessing: false,
        processingStatus: ''
      })
      
      wx.showModal({
        title: '求解失败',
        content: error.message || '处理过程中出现错误，请重试',
        showCancel: false
      })
    }
  },

  // 显示上一步
  prevStep() {
    if (this.data.currentStep > 0) {
      this.setData({
        currentStep: this.data.currentStep - 1
      })
    }
  },

  // 显示下一步
  nextStep() {
    if (this.data.currentStep < this.data.totalSteps - 1) {
      this.setData({
        currentStep: this.data.currentStep + 1
      })
    }
  },

  // 跳转到指定步骤
  goToStep(e) {
    const step = parseInt(e.detail.value)
    this.setData({
      currentStep: step
    })
  },

  // 自动播放解决方案
  autoPlay() {
    if (this.autoPlayTimer) {
      clearInterval(this.autoPlayTimer)
      this.autoPlayTimer = null
      return
    }

    this.autoPlayTimer = setInterval(() => {
      if (this.data.currentStep >= this.data.totalSteps - 1) {
        clearInterval(this.autoPlayTimer)
        this.autoPlayTimer = null
        return
      }
      
      this.setData({
        currentStep: this.data.currentStep + 1
      })
    }, 1000)
  },

  // 重置
  reset() {
    this.setData({
      imageUrl: '',
      puzzleGrid: null,
      solution: null,
      showSolution: false,
      currentStep: 0,
      totalSteps: 0,
      solutionSteps: [],
      isProcessing: false,
      processingStatus: ''
    })
    
    if (this.autoPlayTimer) {
      clearInterval(this.autoPlayTimer)
      this.autoPlayTimer = null
    }
  },

  // 分享结果
  shareResult() {
    if (!this.data.solution) {
      wx.showToast({
        title: '暂无解决方案可分享',
        icon: 'none'
      })
      return
    }

    wx.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage', 'shareTimeline']
    })
  },

  // 分享给朋友
  onShareAppMessage() {
    const { totalSteps } = this.data
    return {
      title: `我用AI解决了推箱子难题，只需${totalSteps}步！`,
      path: '/pages/sokoban/sokoban',
      imageUrl: '/images/sokoban-share.png'
    }
  },

  // 分享到朋友圈
  onShareTimeline() {
    const { totalSteps } = this.data
    return {
      title: `推箱子AI求解器：${totalSteps}步完美解决！`,
      query: 'from=timeline',
      imageUrl: '/images/sokoban-share.png'
    }
  },

  // 切换测试模式
  toggleTestMode() {
    this.setData({
      showTestMode: !this.data.showTestMode
    })
  },

  // 选择测试关卡
  selectTestPuzzle(e) {
    const index = e.currentTarget.dataset.index
    this.setData({
      selectedTestPuzzle: index
    })
  },

  // 加载测试关卡
  async loadTestPuzzle() {
    const puzzleData = testPuzzles[this.data.selectedTestPuzzle]
    const puzzle = convertGridToPuzzle(puzzleData)
    
    this.setData({
      puzzleGrid: puzzle,
      showRenderer: true,
      showTestMode: false
    })

    // 等待canvas初始化
    setTimeout(async () => {
      await this.puzzleRenderer.init()
      this.puzzleRenderer.setPuzzle(puzzle)
      this.puzzleRenderer.renderState({
        player: puzzle.player,
        boxes: puzzle.boxes
      })
    }, 100)
  },

  // 求解测试关卡
  async solveTestPuzzle() {
    if (!this.data.puzzleGrid) {
      wx.showToast({
        title: '请先加载测试关卡',
        icon: 'none'
      })
      return
    }

    this.setData({
      isProcessing: true,
      processingStatus: '正在计算最优解...'
    })

    try {
      const solution = await this.sokobanSolver.solve(this.data.puzzleGrid)
      
      if (!solution) {
        throw new Error('无法找到解决方案')
      }

      this.setData({
        solution: solution,
        solutionSteps: solution.steps,
        totalSteps: solution.steps.length,
        currentStep: 0,
        showSolution: true,
        isProcessing: false,
        processingStatus: ''
      })

      wx.showToast({
        title: `找到解决方案！共${solution.steps.length}步`,
        icon: 'success',
        duration: 2000
      })

    } catch (error) {
      console.error('求解失败:', error)
      this.setData({
        isProcessing: false,
        processingStatus: ''
      })
      
      wx.showModal({
        title: '求解失败',
        content: error.message || '处理过程中出现错误，请重试',
        showCancel: false
      })
    }
  },

  onUnload() {
    if (this.autoPlayTimer) {
      clearInterval(this.autoPlayTimer)
    }
  }
})