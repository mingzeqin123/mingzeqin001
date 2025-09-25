class TodoList {
    constructor() {
        this.tasks = this.loadTasks();
        this.currentFilter = 'all';
        this.editingTaskId = null;
        
        this.initializeElements();
        this.bindEvents();
        this.render();
    }

    initializeElements() {
        this.taskInput = document.getElementById('taskInput');
        this.addBtn = document.getElementById('addBtn');
        this.tasksList = document.getElementById('tasksList');
        this.emptyState = document.getElementById('emptyState');
        this.filterBtns = document.querySelectorAll('.filter-btn');
        
        // 统计元素
        this.totalTasksEl = document.getElementById('totalTasks');
        this.pendingTasksEl = document.getElementById('pendingTasks');
        this.inProgressTasksEl = document.getElementById('inProgressTasks');
        this.completedTasksEl = document.getElementById('completedTasks');
        
        this.createEditModal();
    }

    createEditModal() {
        const modalHTML = `
            <div id="editModal" class="edit-modal">
                <div class="edit-content">
                    <h3>编辑任务</h3>
                    <div class="edit-input-group">
                        <label for="editTaskText">任务内容</label>
                        <input type="text" id="editTaskText" maxlength="100">
                    </div>
                    <div class="edit-input-group">
                        <label for="editTaskStatus">状态</label>
                        <select id="editTaskStatus">
                            <option value="pending">待办</option>
                            <option value="in-progress">进行中</option>
                            <option value="completed">已完成</option>
                        </select>
                    </div>
                    <div class="edit-buttons">
                        <button class="btn btn-cancel" id="cancelEdit">取消</button>
                        <button class="btn btn-save" id="saveEdit">保存</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        this.editModal = document.getElementById('editModal');
        this.editTaskText = document.getElementById('editTaskText');
        this.editTaskStatus = document.getElementById('editTaskStatus');
        this.cancelEditBtn = document.getElementById('cancelEdit');
        this.saveEditBtn = document.getElementById('saveEdit');
    }

    bindEvents() {
        // 添加任务
        this.addBtn.addEventListener('click', () => this.addTask());
        this.taskInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addTask();
        });

        // 筛选按钮
        this.filterBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.setFilter(e.target.dataset.filter);
            });
        });

        // 编辑模态框
        this.cancelEditBtn.addEventListener('click', () => this.closeEditModal());
        this.saveEditBtn.addEventListener('click', () => this.saveEdit());
        
        // 点击模态框背景关闭
        this.editModal.addEventListener('click', (e) => {
            if (e.target === this.editModal) this.closeEditModal();
        });
    }

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    addTask() {
        const text = this.taskInput.value.trim();
        if (!text) {
            this.showNotification('请输入任务内容！', 'warning');
            return;
        }

        const task = {
            id: this.generateId(),
            text: text,
            status: 'pending',
            createdAt: new Date().toISOString(),
            completedAt: null
        };

        this.tasks.unshift(task);
        this.taskInput.value = '';
        this.saveTasks();
        this.render();
        this.showNotification('任务添加成功！', 'success');
    }

    editTask(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (!task) return;

        this.editingTaskId = taskId;
        this.editTaskText.value = task.text;
        this.editTaskStatus.value = task.status;
        this.editModal.classList.add('show');
        this.editTaskText.focus();
    }

    saveEdit() {
        const text = this.editTaskText.value.trim();
        if (!text) {
            this.showNotification('请输入任务内容！', 'warning');
            return;
        }

        const task = this.tasks.find(t => t.id === this.editingTaskId);
        if (task) {
            task.text = text;
            task.status = this.editTaskStatus.value;
            
            if (task.status === 'completed' && !task.completedAt) {
                task.completedAt = new Date().toISOString();
            } else if (task.status !== 'completed') {
                task.completedAt = null;
            }
            
            this.saveTasks();
            this.render();
            this.closeEditModal();
            this.showNotification('任务更新成功！', 'success');
        }
    }

    closeEditModal() {
        this.editModal.classList.remove('show');
        this.editingTaskId = null;
    }

    deleteTask(taskId) {
        if (confirm('确定要删除这个任务吗？')) {
            this.tasks = this.tasks.filter(t => t.id !== taskId);
            this.saveTasks();
            this.render();
            this.showNotification('任务已删除！', 'info');
        }
    }

    toggleTaskStatus(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (!task) return;

        if (task.status === 'pending') {
            task.status = 'in-progress';
        } else if (task.status === 'in-progress') {
            task.status = 'completed';
            task.completedAt = new Date().toISOString();
        } else {
            task.status = 'pending';
            task.completedAt = null;
        }

        this.saveTasks();
        this.render();
    }

    setFilter(filter) {
        this.currentFilter = filter;
        
        // 更新按钮状态
        this.filterBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.filter === filter);
        });
        
        this.render();
    }

    getFilteredTasks() {
        if (this.currentFilter === 'all') {
            return this.tasks;
        }
        return this.tasks.filter(task => task.status === this.currentFilter);
    }

    updateStats() {
        const total = this.tasks.length;
        const pending = this.tasks.filter(t => t.status === 'pending').length;
        const inProgress = this.tasks.filter(t => t.status === 'in-progress').length;
        const completed = this.tasks.filter(t => t.status === 'completed').length;

        this.totalTasksEl.textContent = total;
        this.pendingTasksEl.textContent = pending;
        this.inProgressTasksEl.textContent = inProgress;
        this.completedTasksEl.textContent = completed;
    }

    render() {
        this.updateStats();
        
        const filteredTasks = this.getFilteredTasks();
        
        if (filteredTasks.length === 0) {
            this.tasksList.innerHTML = '';
            this.emptyState.classList.add('show');
            return;
        }

        this.emptyState.classList.remove('show');
        
        this.tasksList.innerHTML = filteredTasks.map(task => {
            const statusText = {
                'pending': '待办',
                'in-progress': '进行中',
                'completed': '已完成'
            };

            const statusClass = {
                'pending': 'status-pending',
                'in-progress': 'status-in-progress',
                'completed': 'status-completed'
            };

            return `
                <div class="task-item ${task.status === 'completed' ? 'completed' : ''}" data-task-id="${task.id}">
                    <input type="checkbox" class="task-checkbox" ${task.status === 'completed' ? 'checked' : ''} 
                           onchange="todoList.toggleTaskStatus('${task.id}')">
                    <div class="task-text">${this.escapeHtml(task.text)}</div>
                    <span class="task-status ${statusClass[task.status]}">${statusText[task.status]}</span>
                    <div class="task-actions">
                        <button class="task-btn btn-edit" onclick="todoList.editTask('${task.id}')">编辑</button>
                        <button class="task-btn btn-delete" onclick="todoList.deleteTask('${task.id}')">删除</button>
                    </div>
                </div>
            `;
        }).join('');
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    showNotification(message, type = 'info') {
        // 创建通知元素
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        // 添加样式
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 8px;
            color: white;
            font-weight: 600;
            z-index: 2000;
            transform: translateX(100%);
            transition: transform 0.3s ease;
            max-width: 300px;
            word-wrap: break-word;
        `;
        
        // 根据类型设置颜色
        const colors = {
            'success': '#28a745',
            'warning': '#ffc107',
            'error': '#dc3545',
            'info': '#17a2b8'
        };
        notification.style.backgroundColor = colors[type] || colors.info;
        
        document.body.appendChild(notification);
        
        // 显示动画
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);
        
        // 自动隐藏
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    saveTasks() {
        localStorage.setItem('todolist-tasks', JSON.stringify(this.tasks));
    }

    loadTasks() {
        const saved = localStorage.getItem('todolist-tasks');
        return saved ? JSON.parse(saved) : [];
    }
}

// 初始化应用
let todoList;
document.addEventListener('DOMContentLoaded', () => {
    todoList = new TodoList();
    
    // 添加一些示例任务（如果没有任何任务）
    if (todoList.tasks.length === 0) {
        const sampleTasks = [
            {
                id: todoList.generateId(),
                text: '欢迎使用待办事项列表！',
                status: 'pending',
                createdAt: new Date().toISOString(),
                completedAt: null
            },
            {
                id: todoList.generateId(),
                text: '点击复选框可以快速更改任务状态',
                status: 'in-progress',
                createdAt: new Date().toISOString(),
                completedAt: null
            },
            {
                id: todoList.generateId(),
                text: '使用筛选按钮查看不同状态的任务',
                status: 'completed',
                createdAt: new Date().toISOString(),
                completedAt: new Date().toISOString()
            }
        ];
        
        todoList.tasks = sampleTasks;
        todoList.saveTasks();
        todoList.render();
    }
});