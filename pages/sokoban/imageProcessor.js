// pages/sokoban/imageProcessor.js
class ImageProcessor {
  constructor() {
    this.canvas = null
    this.ctx = null
    this.imageData = null
  }

  // 从图片中提取推箱子布局
  async extractPuzzleFromImage(imagePath) {
    try {
      // 创建canvas用于图像处理
      const canvas = wx.createOffscreenCanvas({ type: '2d' })
      const ctx = canvas.getContext('2d')
      
      // 加载图片
      const image = canvas.createImage()
      
      return new Promise((resolve, reject) => {
        image.onload = () => {
          try {
            // 设置canvas尺寸
            canvas.width = image.width
            canvas.height = image.height
            
            // 绘制图片到canvas
            ctx.drawImage(image, 0, 0)
            
            // 获取图像数据
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
            
            // 分析图像并提取推箱子布局
            const puzzleGrid = this.analyzePuzzleLayout(imageData, canvas.width, canvas.height)
            
            resolve(puzzleGrid)
          } catch (error) {
            reject(error)
          }
        }
        
        image.onerror = () => {
          reject(new Error('图片加载失败'))
        }
        
        image.src = imagePath
      })
    } catch (error) {
      throw new Error('图像处理失败: ' + error.message)
    }
  }

  // 分析推箱子布局
  analyzePuzzleLayout(imageData, width, height) {
    const data = imageData.data
    
    // 1. 预处理：转换为灰度图像
    const grayData = this.convertToGrayscale(data, width, height)
    
    // 2. 边缘检测
    const edges = this.detectEdges(grayData, width, height)
    
    // 3. 检测网格结构
    const gridInfo = this.detectGrid(edges, width, height)
    
    if (!gridInfo) {
      throw new Error('无法检测到推箱子网格结构')
    }
    
    // 4. 识别游戏元素
    const puzzle = this.recognizeGameElements(data, width, height, gridInfo)
    
    if (!puzzle) {
      throw new Error('无法识别推箱子游戏元素')
    }
    
    return puzzle
  }

  // 转换为灰度图像
  convertToGrayscale(data, width, height) {
    const grayData = new Uint8Array(width * height)
    
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i]
      const g = data[i + 1]
      const b = data[i + 2]
      
      // 使用加权平均计算灰度值
      const gray = Math.round(0.299 * r + 0.587 * g + 0.114 * b)
      grayData[i / 4] = gray
    }
    
    return grayData
  }

  // 边缘检测（简化的Sobel算子）
  detectEdges(grayData, width, height) {
    const edges = new Uint8Array(width * height)
    
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = y * width + x
        
        // Sobel X
        const gx = 
          -1 * grayData[(y-1) * width + (x-1)] + 1 * grayData[(y-1) * width + (x+1)] +
          -2 * grayData[y * width + (x-1)] + 2 * grayData[y * width + (x+1)] +
          -1 * grayData[(y+1) * width + (x-1)] + 1 * grayData[(y+1) * width + (x+1)]
        
        // Sobel Y
        const gy = 
          -1 * grayData[(y-1) * width + (x-1)] + -2 * grayData[(y-1) * width + x] + -1 * grayData[(y-1) * width + (x+1)] +
          1 * grayData[(y+1) * width + (x-1)] + 2 * grayData[(y+1) * width + x] + 1 * grayData[(y+1) * width + (x+1)]
        
        // 计算梯度幅值
        const magnitude = Math.sqrt(gx * gx + gy * gy)
        edges[idx] = magnitude > 50 ? 255 : 0
      }
    }
    
    return edges
  }

  // 检测网格结构
  detectGrid(edges, width, height) {
    // 检测水平线
    const horizontalLines = this.detectHorizontalLines(edges, width, height)
    
    // 检测垂直线
    const verticalLines = this.detectVerticalLines(edges, width, height)
    
    if (horizontalLines.length < 2 || verticalLines.length < 2) {
      return null
    }
    
    // 计算网格参数
    const gridWidth = Math.round((verticalLines[verticalLines.length - 1] - verticalLines[0]) / (verticalLines.length - 1))
    const gridHeight = Math.round((horizontalLines[horizontalLines.length - 1] - horizontalLines[0]) / (horizontalLines.length - 1))
    
    return {
      rows: horizontalLines.length - 1,
      cols: verticalLines.length - 1,
      cellWidth: gridWidth,
      cellHeight: gridHeight,
      startX: verticalLines[0],
      startY: horizontalLines[0],
      horizontalLines,
      verticalLines
    }
  }

  // 检测水平线
  detectHorizontalLines(edges, width, height) {
    const lines = []
    const threshold = width * 0.3 // 至少30%的宽度有边缘点
    
    for (let y = 0; y < height; y++) {
      let edgeCount = 0
      for (let x = 0; x < width; x++) {
        if (edges[y * width + x] === 255) {
          edgeCount++
        }
      }
      
      if (edgeCount > threshold) {
        // 检查是否与已有线条重复
        const isDuplicate = lines.some(line => Math.abs(line - y) < 10)
        if (!isDuplicate) {
          lines.push(y)
        }
      }
    }
    
    return lines.sort((a, b) => a - b)
  }

  // 检测垂直线
  detectVerticalLines(edges, width, height) {
    const lines = []
    const threshold = height * 0.3 // 至少30%的高度有边缘点
    
    for (let x = 0; x < width; x++) {
      let edgeCount = 0
      for (let y = 0; y < height; y++) {
        if (edges[y * width + x] === 255) {
          edgeCount++
        }
      }
      
      if (edgeCount > threshold) {
        // 检查是否与已有线条重复
        const isDuplicate = lines.some(line => Math.abs(line - x) < 10)
        if (!isDuplicate) {
          lines.push(x)
        }
      }
    }
    
    return lines.sort((a, b) => a - b)
  }

  // 识别游戏元素
  recognizeGameElements(data, width, height, gridInfo) {
    const puzzle = {
      rows: gridInfo.rows,
      cols: gridInfo.cols,
      grid: []
    }
    
    // 初始化网格
    for (let row = 0; row < gridInfo.rows; row++) {
      puzzle.grid[row] = new Array(gridInfo.cols).fill(' ')
    }
    
    // 分析每个网格单元
    for (let row = 0; row < gridInfo.rows; row++) {
      for (let col = 0; col < gridInfo.cols; col++) {
        const cellType = this.analyzeCellType(data, width, height, gridInfo, row, col)
        puzzle.grid[row][col] = cellType
      }
    }
    
    // 验证推箱子布局的有效性
    if (!this.validatePuzzle(puzzle)) {
      return null
    }
    
    return puzzle
  }

  // 分析单元格类型
  analyzeCellType(data, width, height, gridInfo, row, col) {
    const startX = gridInfo.startX + col * gridInfo.cellWidth
    const startY = gridInfo.startY + row * gridInfo.cellHeight
    const endX = Math.min(startX + gridInfo.cellWidth, width)
    const endY = Math.min(startY + gridInfo.cellHeight, height)
    
    // 采样区域中心部分的颜色
    const sampleSize = Math.min(gridInfo.cellWidth, gridInfo.cellHeight) * 0.6
    const centerX = startX + gridInfo.cellWidth / 2
    const centerY = startY + gridInfo.cellHeight / 2
    const sampleStartX = Math.floor(centerX - sampleSize / 2)
    const sampleStartY = Math.floor(centerY - sampleSize / 2)
    const sampleEndX = Math.floor(centerX + sampleSize / 2)
    const sampleEndY = Math.floor(centerY + sampleSize / 2)
    
    let totalR = 0, totalG = 0, totalB = 0, pixelCount = 0
    
    for (let y = sampleStartY; y < sampleEndY && y < height; y++) {
      for (let x = sampleStartX; x < sampleEndX && x < width; x++) {
        if (x >= 0 && y >= 0) {
          const idx = (y * width + x) * 4
          totalR += data[idx]
          totalG += data[idx + 1]
          totalB += data[idx + 2]
          pixelCount++
        }
      }
    }
    
    if (pixelCount === 0) return ' '
    
    const avgR = totalR / pixelCount
    const avgG = totalG / pixelCount
    const avgB = totalB / pixelCount
    
    // 根据颜色特征判断元素类型
    return this.classifyByColor(avgR, avgG, avgB)
  }

  // 根据颜色分类元素
  classifyByColor(r, g, b) {
    // 计算颜色的HSV值用于更好的分类
    const { h, s, v } = this.rgbToHsv(r, g, b)
    
    // 墙壁：通常是深色（灰色、黑色、棕色）
    if (v < 80 || (s < 30 && v < 150)) {
      return '#' // 墙壁
    }
    
    // 目标点：通常是特殊颜色（红色、绿色等）
    if (s > 100 && v > 100) {
      if (h < 30 || h > 330) { // 红色系
        return '.'  // 目标点
      }
      if (h > 60 && h < 180) { // 绿色系
        return '.'  // 目标点
      }
    }
    
    // 箱子：通常是棕色、橙色或其他中等亮度的颜色
    if (v > 80 && v < 200 && s > 20) {
      if ((h > 15 && h < 60) || (h > 200 && h < 300)) {
        return '$'  // 箱子
      }
    }
    
    // 玩家：通常是蓝色或其他鲜艳颜色
    if (s > 80 && v > 120) {
      if (h > 180 && h < 270) { // 蓝色系
        return '@'  // 玩家
      }
    }
    
    // 默认为空地
    return ' '
  }

  // RGB转HSV
  rgbToHsv(r, g, b) {
    r /= 255
    g /= 255
    b /= 255
    
    const max = Math.max(r, g, b)
    const min = Math.min(r, g, b)
    const diff = max - min
    
    let h = 0
    if (diff !== 0) {
      if (max === r) {
        h = ((g - b) / diff) % 6
      } else if (max === g) {
        h = (b - r) / diff + 2
      } else {
        h = (r - g) / diff + 4
      }
    }
    h = Math.round(h * 60)
    if (h < 0) h += 360
    
    const s = max === 0 ? 0 : Math.round((diff / max) * 100)
    const v = Math.round(max * 100)
    
    return { h, s, v }
  }

  // 验证推箱子布局
  validatePuzzle(puzzle) {
    let playerCount = 0
    let boxCount = 0
    let targetCount = 0
    
    for (let row = 0; row < puzzle.rows; row++) {
      for (let col = 0; col < puzzle.cols; col++) {
        const cell = puzzle.grid[row][col]
        if (cell === '@') playerCount++
        else if (cell === '$') boxCount++
        else if (cell === '.') targetCount++
      }
    }
    
    // 基本验证：必须有一个玩家，箱子数量等于目标数量
    return playerCount === 1 && boxCount > 0 && boxCount === targetCount
  }

  // 简化的模式识别方法（用于无法通过颜色识别的情况）
  fallbackPatternRecognition(data, width, height, gridInfo) {
    // 这里可以实现更复杂的模式识别算法
    // 例如模板匹配、形状识别等
    
    // 创建一个简单的示例布局
    const puzzle = {
      rows: 8,
      cols: 8,
      grid: [
        ['#', '#', '#', '#', '#', '#', '#', '#'],
        ['#', ' ', ' ', ' ', ' ', ' ', ' ', '#'],
        ['#', ' ', '$', ' ', '.', ' ', ' ', '#'],
        ['#', ' ', ' ', '$', '.', ' ', ' ', '#'],
        ['#', ' ', '@', ' ', ' ', ' ', ' ', '#'],
        ['#', ' ', ' ', '$', '.', ' ', ' ', '#'],
        ['#', ' ', ' ', ' ', ' ', ' ', ' ', '#'],
        ['#', '#', '#', '#', '#', '#', '#', '#']
      ]
    }
    
    return puzzle
  }
}

export default ImageProcessor