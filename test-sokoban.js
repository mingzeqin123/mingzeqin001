// test-sokoban.js - 推箱子求解器测试脚本
// 这个文件用于在Node.js环境中测试求解算法

class SokobanSolverTest {
  constructor() {
    this.directions = [
      { dx: 0, dy: -1, name: '上' },
      { dx: 0, dy: 1, name: '下' },
      { dx: -1, dy: 0, name: '左' },
      { dx: 1, dy: 0, name: '右' }
    ]
  }

  // 简化版求解器（用于测试）
  async solve(puzzle) {
    console.log('开始求解推箱子...')
    console.log(`关卡大小: ${puzzle.rows}x${puzzle.cols}`)
    console.log(`箱子数量: ${puzzle.boxes.length}`)
    console.log(`目标数量: ${puzzle.targets.length}`)
    
    const processedPuzzle = this.preprocessPuzzle(puzzle)
    if (!processedPuzzle) {
      throw new Error('推箱子布局无效')
    }

    const solution = await this.solveWithAStar(processedPuzzle)
    
    if (!solution) {
      throw new Error('无法找到解决方案')
    }

    console.log(`找到解决方案，共${solution.steps.length}步`)
    return solution
  }

  preprocessPuzzle(puzzle) {
    const processed = {
      rows: puzzle.rows,
      cols: puzzle.cols,
      grid: puzzle.grid.map(row => [...row]),
      player: puzzle.player ? { ...puzzle.player } : null,
      boxes: puzzle.boxes ? puzzle.boxes.map(box => ({ ...box })) : [],
      targets: puzzle.targets ? puzzle.targets.map(target => ({ ...target })) : []
    }

    if (!processed.player || processed.boxes.length === 0 || 
        processed.boxes.length !== processed.targets.length) {
      return null
    }

    return processed
  }

  async solveWithAStar(puzzle) {
    const initialState = {
      player: puzzle.player,
      boxes: [...puzzle.boxes],
      steps: [],
      g: 0,
      h: 0,
      f: 0
    }

    initialState.h = this.calculateHeuristic(initialState, puzzle.targets)
    initialState.f = initialState.g + initialState.h

    const openList = [initialState]
    const closedList = new Set()
    const maxIterations = 1000
    let iterations = 0

    while (openList.length > 0 && iterations < maxIterations) {
      iterations++
      
      if (iterations % 100 === 0) {
        console.log(`搜索进度: ${iterations}/${maxIterations}`)
        await new Promise(resolve => setTimeout(resolve, 0))
      }

      openList.sort((a, b) => a.f - b.f)
      const currentState = openList.shift()

      if (this.isGoalState(currentState, puzzle.targets)) {
        console.log(`搜索完成，迭代次数: ${iterations}`)
        return {
          steps: currentState.steps,
          totalCost: currentState.g
        }
      }

      const stateKey = this.getStateKey(currentState)
      if (closedList.has(stateKey)) {
        continue
      }
      closedList.add(stateKey)

      const nextStates = this.generateNextStates(currentState, puzzle)
      
      for (const nextState of nextStates) {
        const nextStateKey = this.getStateKey(nextState)
        
        if (!closedList.has(nextStateKey)) {
          nextState.g = currentState.g + 1
          nextState.h = this.calculateHeuristic(nextState, puzzle.targets)
          nextState.f = nextState.g + nextState.h
          
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

    console.log(`搜索结束，迭代次数: ${iterations}`)
    return null
  }

  generateNextStates(currentState, puzzle) {
    const nextStates = []
    
    for (const direction of this.directions) {
      const newPlayerX = currentState.player.x + direction.dx
      const newPlayerY = currentState.player.y + direction.dy
      
      if (!this.isValidPosition(newPlayerX, newPlayerY, puzzle.grid)) {
        continue
      }
      
      const boxIndex = currentState.boxes.findIndex(box => 
        box.x === newPlayerX && box.y === newPlayerY
      )
      
      if (boxIndex !== -1) {
        const newBoxX = newPlayerX + direction.dx
        const newBoxY = newPlayerY + direction.dy
        
        if (!this.isValidPosition(newBoxX, newBoxY, puzzle.grid) ||
            this.hasBoxAt(currentState.boxes, newBoxX, newBoxY)) {
          continue
        }
        
        const newBoxes = [...currentState.boxes]
        newBoxes[boxIndex] = { x: newBoxX, y: newBoxY }
        
        const newState = {
          player: { x: newPlayerX, y: newPlayerY },
          boxes: newBoxes,
          steps: [...currentState.steps, `推${direction.name}`]
        }
        
        nextStates.push(newState)
      } else {
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

  isValidPosition(x, y, grid) {
    if (y < 0 || y >= grid.length || x < 0 || x >= grid[0].length) {
      return false
    }
    return grid[y][x] !== '#'
  }

  hasBoxAt(boxes, x, y) {
    return boxes.some(box => box.x === x && box.y === y)
  }

  isGoalState(state, targets) {
    if (state.boxes.length !== targets.length) {
      return false
    }
    
    return state.boxes.every(box => 
      targets.some(target => target.x === box.x && target.y === box.y)
    )
  }

  calculateHeuristic(state, targets) {
    let totalDistance = 0
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

  getStateKey(state) {
    const playerKey = `${state.player.x},${state.player.y}`
    const boxesKey = state.boxes
      .map(box => `${box.x},${box.y}`)
      .sort()
      .join('|')
    
    return `${playerKey}:${boxesKey}`
  }

  // 打印关卡布局
  printPuzzle(puzzle) {
    console.log('\n关卡布局:')
    for (let row = 0; row < puzzle.rows; row++) {
      let line = ''
      for (let col = 0; col < puzzle.cols; col++) {
        let cell = puzzle.grid[row][col]
        
        // 检查是否有玩家
        if (puzzle.player && puzzle.player.x === col && puzzle.player.y === row) {
          cell = '@'
        }
        
        // 检查是否有箱子
        const hasBox = puzzle.boxes && puzzle.boxes.some(box => box.x === col && box.y === row)
        if (hasBox) {
          cell = '$'
        }
        
        // 检查是否有目标
        const hasTarget = puzzle.targets && puzzle.targets.some(target => target.x === col && target.y === row)
        if (hasTarget && cell === ' ') {
          cell = '.'
        }
        
        line += cell
      }
      console.log(line)
    }
    console.log('')
  }
}

// 测试用例
const testPuzzles = [
  {
    name: "简单测试",
    rows: 6,
    cols: 8,
    grid: [
      ['#', '#', '#', '#', '#', '#', '#', '#'],
      ['#', ' ', ' ', ' ', ' ', ' ', ' ', '#'],
      ['#', ' ', '$', ' ', '.', ' ', ' ', '#'],
      ['#', ' ', '@', ' ', ' ', ' ', ' ', '#'],
      ['#', ' ', ' ', ' ', ' ', ' ', ' ', '#'],
      ['#', '#', '#', '#', '#', '#', '#', '#']
    ],
    player: { x: 2, y: 3 },
    boxes: [{ x: 2, y: 2 }],
    targets: [{ x: 4, y: 2 }]
  }
]

// 运行测试
async function runTests() {
  const solver = new SokobanSolverTest()
  
  for (const testPuzzle of testPuzzles) {
    console.log(`\n=== 测试关卡: ${testPuzzle.name} ===`)
    
    // 使用预设的数据
    const puzzle = {
      rows: testPuzzle.rows,
      cols: testPuzzle.cols,
      grid: testPuzzle.grid.map(row => [...row]),
      player: testPuzzle.player,
      boxes: testPuzzle.boxes,
      targets: testPuzzle.targets
    }

    // 清理网格中的玩家、箱子、目标标记
    for (let row = 0; row < puzzle.rows; row++) {
      for (let col = 0; col < puzzle.cols; col++) {
        const cell = puzzle.grid[row][col]
        if (cell === '@' || cell === '$' || cell === '.') {
          puzzle.grid[row][col] = ' '
        }
      }
    }
    
    solver.printPuzzle(puzzle)
    
    try {
      const startTime = Date.now()
      const solution = await solver.solve(puzzle)
      const endTime = Date.now()
      
      console.log(`求解成功！`)
      console.log(`用时: ${endTime - startTime}ms`)
      console.log(`步数: ${solution.steps.length}`)
      console.log(`解决方案: ${solution.steps.join(' -> ')}`)
      
    } catch (error) {
      console.error(`求解失败: ${error.message}`)
    }
  }
}

// 如果在Node.js环境中运行
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { SokobanSolverTest, runTests }
  
  // 直接运行测试
  if (require.main === module) {
    runTests().catch(console.error)
  }
}