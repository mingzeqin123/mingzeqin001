// pages/sokoban/sokobanSolver.js
class SokobanSolver {
  constructor() {
    this.directions = [
      { dx: 0, dy: -1, name: '上' },
      { dx: 0, dy: 1, name: '下' },
      { dx: -1, dy: 0, name: '左' },
      { dx: 1, dy: 0, name: '右' }
    ]
  }

  // 求解推箱子
  async solve(puzzle) {
    try {
      console.log('开始求解推箱子...')
      
      // 1. 预处理和验证
      const processedPuzzle = this.preprocessPuzzle(puzzle)
      if (!processedPuzzle) {
        throw new Error('推箱子布局无效')
      }

      // 2. 使用A*算法求解
      const solution = await this.solveWithAStar(processedPuzzle)
      
      if (!solution) {
        throw new Error('无法找到解决方案')
      }

      console.log(`找到解决方案，共${solution.steps.length}步`)
      return solution
    } catch (error) {
      console.error('求解失败:', error)
      throw error
    }
  }

  // 预处理推箱子布局
  preprocessPuzzle(puzzle) {
    const processed = {
      rows: puzzle.rows,
      cols: puzzle.cols,
      grid: puzzle.grid.map(row => [...row]),
      player: null,
      boxes: [],
      targets: []
    }

    // 找到玩家、箱子和目标位置
    for (let row = 0; row < puzzle.rows; row++) {
      for (let col = 0; col < puzzle.cols; col++) {
        const cell = puzzle.grid[row][col]
        if (cell === '@') {
          processed.player = { x: col, y: row }
          processed.grid[row][col] = ' ' // 玩家位置标记为空地
        } else if (cell === '$') {
          processed.boxes.push({ x: col, y: row })
          processed.grid[row][col] = ' ' // 箱子位置标记为空地
        } else if (cell === '.') {
          processed.targets.push({ x: col, y: row })
          processed.grid[row][col] = ' ' // 目标位置标记为空地，但记录目标
        }
      }
    }

    // 验证
    if (!processed.player || processed.boxes.length === 0 || 
        processed.boxes.length !== processed.targets.length) {
      return null
    }

    return processed
  }

  // 使用A*算法求解
  async solveWithAStar(puzzle) {
    const initialState = {
      player: puzzle.player,
      boxes: [...puzzle.boxes],
      steps: [],
      g: 0, // 实际代价
      h: 0, // 启发式代价
      f: 0  // 总代价
    }

    // 计算初始启发式代价
    initialState.h = this.calculateHeuristic(initialState, puzzle.targets)
    initialState.f = initialState.g + initialState.h

    const openList = [initialState]
    const closedList = new Set()
    const maxIterations = 10000 // 防止无限循环
    let iterations = 0

    while (openList.length > 0 && iterations < maxIterations) {
      iterations++
      
      // 每100次迭代让出控制权，避免阻塞UI
      if (iterations % 100 === 0) {
        await new Promise(resolve => setTimeout(resolve, 0))
      }

      // 选择f值最小的状态
      openList.sort((a, b) => a.f - b.f)
      const currentState = openList.shift()

      // 检查是否达到目标状态
      if (this.isGoalState(currentState, puzzle.targets)) {
        return {
          steps: currentState.steps,
          totalCost: currentState.g
        }
      }

      // 将当前状态加入已访问列表
      const stateKey = this.getStateKey(currentState)
      if (closedList.has(stateKey)) {
        continue
      }
      closedList.add(stateKey)

      // 生成所有可能的下一步状态
      const nextStates = this.generateNextStates(currentState, puzzle)
      
      for (const nextState of nextStates) {
        const nextStateKey = this.getStateKey(nextState)
        
        if (!closedList.has(nextStateKey)) {
          // 计算代价
          nextState.g = currentState.g + 1
          nextState.h = this.calculateHeuristic(nextState, puzzle.targets)
          nextState.f = nextState.g + nextState.h
          
          // 检查是否已在开放列表中
          const existingIndex = openList.findIndex(state => 
            this.getStateKey(state) === nextStateKey
          )
          
          if (existingIndex === -1) {
            openList.push(nextState)
          } else if (nextState.g < openList[existingIndex].g) {
            openList[existingIndex] = nextState
          }
        }
      }
    }

    return null // 无解
  }

  // 生成下一步可能的状态
  generateNextStates(currentState, puzzle) {
    const nextStates = []
    
    for (const direction of this.directions) {
      const newPlayerX = currentState.player.x + direction.dx
      const newPlayerY = currentState.player.y + direction.dy
      
      // 检查玩家移动是否有效
      if (!this.isValidPosition(newPlayerX, newPlayerY, puzzle.grid)) {
        continue
      }
      
      // 检查是否有箱子在新位置
      const boxIndex = currentState.boxes.findIndex(box => 
        box.x === newPlayerX && box.y === newPlayerY
      )
      
      if (boxIndex !== -1) {
        // 推箱子
        const newBoxX = newPlayerX + direction.dx
        const newBoxY = newPlayerY + direction.dy
        
        // 检查箱子推动后的位置是否有效
        if (!this.isValidPosition(newBoxX, newBoxY, puzzle.grid) ||
            this.hasBoxAt(currentState.boxes, newBoxX, newBoxY)) {
          continue
        }
        
        // 创建新状态（推箱子）
        const newBoxes = [...currentState.boxes]
        newBoxes[boxIndex] = { x: newBoxX, y: newBoxY }
        
        const newState = {
          player: { x: newPlayerX, y: newPlayerY },
          boxes: newBoxes,
          steps: [...currentState.steps, `推${direction.name}`]
        }
        
        nextStates.push(newState)
      } else {
        // 只移动玩家
        const newState = {
          player: { x: newPlayerX, y: newPlayerY },
          boxes: [...currentState.boxes],
          steps: [...currentState.steps, `移${direction.name}`]
        }
        
        nextStates.push(newState)
      }
    }
    
    return nextStates
  }

  // 检查位置是否有效
  isValidPosition(x, y, grid) {
    if (y < 0 || y >= grid.length || x < 0 || x >= grid[0].length) {
      return false
    }
    return grid[y][x] !== '#' // 不是墙壁
  }

  // 检查指定位置是否有箱子
  hasBoxAt(boxes, x, y) {
    return boxes.some(box => box.x === x && box.y === y)
  }

  // 检查是否达到目标状态
  isGoalState(state, targets) {
    if (state.boxes.length !== targets.length) {
      return false
    }
    
    return state.boxes.every(box => 
      targets.some(target => target.x === box.x && target.y === box.y)
    )
  }

  // 计算启发式代价（曼哈顿距离）
  calculateHeuristic(state, targets) {
    let totalDistance = 0
    
    // 为每个箱子找到最近的目标点
    const usedTargets = new Set()
    
    for (const box of state.boxes) {
      let minDistance = Infinity
      let bestTarget = null
      
      for (let i = 0; i < targets.length; i++) {
        if (usedTargets.has(i)) continue
        
        const target = targets[i]
        const distance = Math.abs(box.x - target.x) + Math.abs(box.y - target.y)
        
        if (distance < minDistance) {
          minDistance = distance
          bestTarget = i
        }
      }
      
      if (bestTarget !== null) {
        usedTargets.add(bestTarget)
        totalDistance += minDistance
      }
    }
    
    return totalDistance
  }

  // 获取状态的唯一键
  getStateKey(state) {
    const playerKey = `${state.player.x},${state.player.y}`
    const boxesKey = state.boxes
      .map(box => `${box.x},${box.y}`)
      .sort()
      .join('|')
    
    return `${playerKey}:${boxesKey}`
  }

  // 简化版求解器（用于复杂情况的备用方案）
  async solveWithBFS(puzzle) {
    const initialState = {
      player: puzzle.player,
      boxes: [...puzzle.boxes],
      steps: []
    }

    const queue = [initialState]
    const visited = new Set()
    const maxStates = 5000 // 限制搜索状态数

    while (queue.length > 0 && visited.size < maxStates) {
      const currentState = queue.shift()
      
      // 检查是否达到目标
      if (this.isGoalState(currentState, puzzle.targets)) {
        return {
          steps: currentState.steps,
          totalCost: currentState.steps.length
        }
      }

      const stateKey = this.getStateKey(currentState)
      if (visited.has(stateKey)) {
        continue
      }
      visited.add(stateKey)

      // 生成下一步状态
      const nextStates = this.generateNextStates(currentState, puzzle)
      queue.push(...nextStates)
    }

    return null
  }

  // 创建示例解决方案（用于演示）
  createExampleSolution() {
    return {
      steps: [
        '移右', '移右', '推下', '移左', '移左', '移下',
        '移右', '推右', '推右', '移上', '移左', '移左',
        '推上', '推右', '移下', '移右', '推上'
      ],
      totalCost: 17
    }
  }
}

export default SokobanSolver