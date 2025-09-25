// todolist.js
Page({
  data: {
    todoList: [],
    newTask: '',
    inputFocus: false,
    showEditModal: false,
    editingId: null,
    editingText: '',
    uncompletedTasks: [],
    completedTasks: []
  },

  onLoad() {
    this.loadTodoList()
  },

  onShow() {
    this.loadTodoList()
  },

  // 加载待办事项列表
  loadTodoList() {
    try {
      const todoList = wx.getStorageSync('todoList') || []
      this.setData({
        todoList: todoList
      })
      this.updateTaskGroups()
    } catch (e) {
      console.error('加载待办事项失败:', e)
      wx.showToast({
        title: '加载失败',
        icon: 'error'
      })
    }
  },

  // 保存待办事项列表
  saveTodoList() {
    try {
      wx.setStorageSync('todoList', this.data.todoList)
    } catch (e) {
      console.error('保存待办事项失败:', e)
      wx.showToast({
        title: '保存失败',
        icon: 'error'
      })
    }
  },

  // 更新任务分组
  updateTaskGroups() {
    const { todoList } = this.data
    const uncompletedTasks = todoList.filter(task => !task.completed)
    const completedTasks = todoList.filter(task => task.completed)
    
    this.setData({
      uncompletedTasks,
      completedTasks
    })
  },

  // 输入框内容变化
  onInputChange(e) {
    this.setData({
      newTask: e.detail.value
    })
  },

  // 添加新任务
  addTask() {
    const { newTask, todoList } = this.data
    const taskText = newTask.trim()
    
    if (!taskText) {
      wx.showToast({
        title: '请输入任务内容',
        icon: 'none'
      })
      return
    }

    const newTaskItem = {
      id: Date.now() + Math.random(), // 生成唯一ID
      text: taskText,
      completed: false,
      createTime: new Date().toISOString(),
      updateTime: new Date().toISOString()
    }

    const updatedTodoList = [newTaskItem, ...todoList]
    
    this.setData({
      todoList: updatedTodoList,
      newTask: '',
      inputFocus: true
    }, () => {
      this.updateTaskGroups()
      this.saveTodoList()
    })

    wx.showToast({
      title: '添加成功',
      icon: 'success',
      duration: 1000
    })
  },

  // 切换任务完成状态
  toggleTask(e) {
    const taskId = e.currentTarget.dataset.id
    const { todoList } = this.data
    
    const updatedTodoList = todoList.map(task => {
      if (task.id === taskId) {
        return {
          ...task,
          completed: !task.completed,
          updateTime: new Date().toISOString()
        }
      }
      return task
    })

    this.setData({
      todoList: updatedTodoList
    }, () => {
      this.updateTaskGroups()
      this.saveTodoList()
    })

    const task = updatedTodoList.find(t => t.id === taskId)
    wx.showToast({
      title: task.completed ? '任务完成' : '取消完成',
      icon: 'success',
      duration: 1000
    })
  },

  // 编辑任务
  editTask(e) {
    const taskId = e.currentTarget.dataset.id
    const task = this.data.todoList.find(t => t.id === taskId)
    
    if (task) {
      this.setData({
        showEditModal: true,
        editingId: taskId,
        editingText: task.text
      })
    }
  },

  // 编辑输入框内容变化
  onEditInputChange(e) {
    this.setData({
      editingText: e.detail.value
    })
  },

  // 确认编辑
  confirmEdit() {
    const { editingId, editingText, todoList } = this.data
    const newText = editingText.trim()
    
    if (!newText) {
      wx.showToast({
        title: '请输入任务内容',
        icon: 'none'
      })
      return
    }

    const updatedTodoList = todoList.map(task => {
      if (task.id === editingId) {
        return {
          ...task,
          text: newText,
          updateTime: new Date().toISOString()
        }
      }
      return task
    })

    this.setData({
      todoList: updatedTodoList,
      showEditModal: false,
      editingId: null,
      editingText: ''
    }, () => {
      this.updateTaskGroups()
      this.saveTodoList()
    })

    wx.showToast({
      title: '编辑成功',
      icon: 'success',
      duration: 1000
    })
  },

  // 关闭编辑弹窗
  closeEditModal() {
    this.setData({
      showEditModal: false,
      editingId: null,
      editingText: ''
    })
  },

  // 防止弹窗关闭
  preventClose() {
    // 阻止事件冒泡
  },

  // 删除任务
  deleteTask(e) {
    const taskId = e.currentTarget.dataset.id
    const task = this.data.todoList.find(t => t.id === taskId)
    
    wx.showModal({
      title: '确认删除',
      content: `确定要删除任务"${task.text}"吗？`,
      success: (res) => {
        if (res.confirm) {
          const updatedTodoList = this.data.todoList.filter(t => t.id !== taskId)
          
          this.setData({
            todoList: updatedTodoList
          }, () => {
            this.updateTaskGroups()
            this.saveTodoList()
          })

          wx.showToast({
            title: '删除成功',
            icon: 'success',
            duration: 1000
          })
        }
      }
    })
  },

  // 清空已完成的任务
  clearCompleted() {
    const { completedTasks } = this.data
    
    if (completedTasks.length === 0) {
      return
    }

    wx.showModal({
      title: '确认清空',
      content: `确定要清空所有已完成的任务吗？(${completedTasks.length}项)`,
      success: (res) => {
        if (res.confirm) {
          const updatedTodoList = this.data.todoList.filter(task => !task.completed)
          
          this.setData({
            todoList: updatedTodoList
          }, () => {
            this.updateTaskGroups()
            this.saveTodoList()
          })

          wx.showToast({
            title: '清空成功',
            icon: 'success',
            duration: 1000
          })
        }
      }
    })
  },

  // 页面分享
  onShareAppMessage() {
    return {
      title: '我的待办事项清单',
      path: '/pages/todolist/todolist'
    }
  }
})