// pages/sokoban/testPuzzles.js
// 测试用的推箱子关卡数据

export const testPuzzles = [
  {
    name: "简单关卡1",
    description: "适合新手的简单关卡",
    rows: 6,
    cols: 8,
    grid: [
      ['#', '#', '#', '#', '#', '#', '#', '#'],
      ['#', ' ', ' ', ' ', ' ', ' ', ' ', '#'],
      ['#', ' ', '$', ' ', '.', ' ', ' ', '#'],
      ['#', ' ', '@', ' ', ' ', ' ', ' ', '#'],
      ['#', ' ', ' ', ' ', ' ', ' ', ' ', '#'],
      ['#', '#', '#', '#', '#', '#', '#', '#']
    ]
  },
  
  {
    name: "经典关卡",
    description: "经典的推箱子布局",
    rows: 8,
    cols: 8,
    grid: [
      ['#', '#', '#', '#', '#', '#', '#', '#'],
      ['#', ' ', ' ', ' ', ' ', ' ', ' ', '#'],
      ['#', ' ', '$', ' ', '.', '$', ' ', '#'],
      ['#', ' ', ' ', ' ', '.', ' ', ' ', '#'],
      ['#', ' ', '@', ' ', ' ', ' ', ' ', '#'],
      ['#', ' ', ' ', '$', '.', ' ', ' ', '#'],
      ['#', ' ', ' ', ' ', ' ', ' ', ' ', '#'],
      ['#', '#', '#', '#', '#', '#', '#', '#']
    ]
  },
  
  {
    name: "中等难度",
    description: "需要一定策略的关卡",
    rows: 10,
    cols: 10,
    grid: [
      ['#', '#', '#', '#', '#', '#', '#', '#', '#', '#'],
      ['#', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', '#'],
      ['#', ' ', '#', ' ', '$', ' ', '#', ' ', ' ', '#'],
      ['#', ' ', ' ', ' ', '.', ' ', ' ', ' ', ' ', '#'],
      ['#', ' ', ' ', '$', '.', '$', ' ', ' ', ' ', '#'],
      ['#', ' ', ' ', ' ', '.', ' ', ' ', ' ', ' ', '#'],
      ['#', ' ', '#', ' ', '$', ' ', '#', ' ', ' ', '#'],
      ['#', ' ', ' ', ' ', '@', ' ', ' ', ' ', ' ', '#'],
      ['#', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', '#'],
      ['#', '#', '#', '#', '#', '#', '#', '#', '#', '#']
    ]
  },
  
  {
    name: "困难关卡",
    description: "高难度挑战",
    rows: 12,
    cols: 12,
    grid: [
      ['#', '#', '#', '#', '#', '#', '#', '#', '#', '#', '#', '#'],
      ['#', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', '#'],
      ['#', ' ', '#', '#', ' ', '$', ' ', '#', '#', ' ', ' ', '#'],
      ['#', ' ', '#', '.', ' ', ' ', ' ', '.', '#', ' ', ' ', '#'],
      ['#', ' ', ' ', ' ', '$', ' ', '$', ' ', ' ', ' ', ' ', '#'],
      ['#', ' ', ' ', ' ', ' ', '@', ' ', ' ', ' ', ' ', ' ', '#'],
      ['#', ' ', ' ', ' ', '$', ' ', '$', ' ', ' ', ' ', ' ', '#'],
      ['#', ' ', '#', '.', ' ', ' ', ' ', '.', '#', ' ', ' ', '#'],
      ['#', ' ', '#', '#', ' ', '$', ' ', '#', '#', ' ', ' ', '#'],
      ['#', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', '#'],
      ['#', ' ', ' ', ' ', ' ', '.', ' ', ' ', ' ', ' ', ' ', '#'],
      ['#', '#', '#', '#', '#', '#', '#', '#', '#', '#', '#', '#']
    ]
  }
]

// 将网格格式转换为求解器需要的格式
export function convertGridToPuzzle(gridData) {
  const puzzle = {
    rows: gridData.rows,
    cols: gridData.cols,
    grid: gridData.grid.map(row => [...row]),
    player: null,
    boxes: [],
    targets: []
  }

  // 提取玩家、箱子和目标位置
  for (let row = 0; row < puzzle.rows; row++) {
    for (let col = 0; col < puzzle.cols; col++) {
      const cell = puzzle.grid[row][col]
      if (cell === '@') {
        puzzle.player = { x: col, y: row }
        puzzle.grid[row][col] = ' '
      } else if (cell === '$') {
        puzzle.boxes.push({ x: col, y: row })
        puzzle.grid[row][col] = ' '
      } else if (cell === '.') {
        puzzle.targets.push({ x: col, y: row })
        puzzle.grid[row][col] = ' '
      }
    }
  }

  return puzzle
}

// 生成随机推箱子关卡
export function generateRandomPuzzle(rows = 8, cols = 8, boxCount = 3) {
  const puzzle = {
    rows,
    cols,
    grid: [],
    player: null,
    boxes: [],
    targets: []
  }

  // 初始化网格（全部为空地）
  for (let row = 0; row < rows; row++) {
    puzzle.grid[row] = new Array(cols).fill(' ')
  }

  // 添加边界墙
  for (let row = 0; row < rows; row++) {
    puzzle.grid[row][0] = '#'
    puzzle.grid[row][cols - 1] = '#'
  }
  for (let col = 0; col < cols; col++) {
    puzzle.grid[0][col] = '#'
    puzzle.grid[rows - 1][col] = '#'
  }

  // 随机添加内部墙壁
  const wallCount = Math.floor((rows * cols) * 0.1)
  for (let i = 0; i < wallCount; i++) {
    const row = Math.floor(Math.random() * (rows - 2)) + 1
    const col = Math.floor(Math.random() * (cols - 2)) + 1
    if (puzzle.grid[row][col] === ' ') {
      puzzle.grid[row][col] = '#'
    }
  }

  // 随机放置玩家
  let playerPlaced = false
  while (!playerPlaced) {
    const row = Math.floor(Math.random() * (rows - 2)) + 1
    const col = Math.floor(Math.random() * (cols - 2)) + 1
    if (puzzle.grid[row][col] === ' ') {
      puzzle.player = { x: col, y: row }
      playerPlaced = true
    }
  }

  // 随机放置箱子和目标
  const availablePositions = []
  for (let row = 1; row < rows - 1; row++) {
    for (let col = 1; col < cols - 1; col++) {
      if (puzzle.grid[row][col] === ' ' && 
          !(row === puzzle.player.y && col === puzzle.player.x)) {
        availablePositions.push({ x: col, y: row })
      }
    }
  }

  // 随机选择位置放置箱子和目标
  const shuffled = availablePositions.sort(() => Math.random() - 0.5)
  
  for (let i = 0; i < Math.min(boxCount, Math.floor(shuffled.length / 2)); i++) {
    puzzle.boxes.push(shuffled[i])
    puzzle.targets.push(shuffled[i + boxCount])
  }

  return puzzle
}

// 验证关卡是否有效
export function validatePuzzle(puzzle) {
  // 检查基本要求
  if (!puzzle.player || puzzle.boxes.length === 0 || 
      puzzle.boxes.length !== puzzle.targets.length) {
    return false
  }

  // 检查所有位置是否在有效范围内
  const isValidPos = (pos) => {
    return pos.x >= 0 && pos.x < puzzle.cols && 
           pos.y >= 0 && pos.y < puzzle.rows &&
           puzzle.grid[pos.y][pos.x] !== '#'
  }

  if (!isValidPos(puzzle.player)) return false
  
  for (const box of puzzle.boxes) {
    if (!isValidPos(box)) return false
  }
  
  for (const target of puzzle.targets) {
    if (!isValidPos(target)) return false
  }

  return true
}

// 关卡难度评估
export function assessDifficulty(puzzle) {
  let score = 0
  
  // 基于大小
  score += puzzle.rows * puzzle.cols * 0.1
  
  // 基于箱子数量
  score += puzzle.boxes.length * 2
  
  // 基于墙壁密度
  let wallCount = 0
  for (let row = 0; row < puzzle.rows; row++) {
    for (let col = 0; col < puzzle.cols; col++) {
      if (puzzle.grid[row][col] === '#') wallCount++
    }
  }
  score += (wallCount / (puzzle.rows * puzzle.cols)) * 10
  
  // 基于箱子到目标的平均距离
  let totalDistance = 0
  for (const box of puzzle.boxes) {
    let minDistance = Infinity
    for (const target of puzzle.targets) {
      const distance = Math.abs(box.x - target.x) + Math.abs(box.y - target.y)
      minDistance = Math.min(minDistance, distance)
    }
    totalDistance += minDistance
  }
  score += totalDistance / puzzle.boxes.length
  
  // 分类难度
  if (score < 10) return '简单'
  if (score < 20) return '中等'
  if (score < 30) return '困难'
  return '极难'
}