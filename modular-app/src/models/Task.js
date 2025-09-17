/**
 * 任务数据模型
 * 定义任务相关的数据结构和业务逻辑
 */
import { v4 as uuidv4 } from 'uuid';

/**
 * 任务状态枚举
 */
export const TaskStatus = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
};

/**
 * 任务优先级枚举
 */
export const TaskPriority = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  URGENT: 'urgent'
};

/**
 * 任务类
 */
export class Task {
  constructor({
    id = uuidv4(),
    title,
    description = '',
    status = TaskStatus.PENDING,
    priority = TaskPriority.MEDIUM,
    userId,
    assigneeId = null,
    dueDate = null,
    completedAt = null,
    createdAt = new Date(),
    updatedAt = new Date(),
    tags = []
  }) {
    this.id = id;
    this.title = title;
    this.description = description;
    this.status = status;
    this.priority = priority;
    this.userId = userId; // 任务创建者
    this.assigneeId = assigneeId; // 任务执行者
    this.dueDate = dueDate;
    this.completedAt = completedAt;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
    this.tags = tags;
  }

  /**
   * 更新任务状态
   */
  updateStatus(newStatus) {
    if (!Object.values(TaskStatus).includes(newStatus)) {
      throw new Error(`无效的任务状态: ${newStatus}`);
    }

    this.status = newStatus;
    this.updatedAt = new Date();

    // 如果标记为完成，设置完成时间
    if (newStatus === TaskStatus.COMPLETED) {
      this.completedAt = new Date();
    } else {
      this.completedAt = null;
    }
  }

  /**
   * 更新任务优先级
   */
  updatePriority(newPriority) {
    if (!Object.values(TaskPriority).includes(newPriority)) {
      throw new Error(`无效的任务优先级: ${newPriority}`);
    }

    this.priority = newPriority;
    this.updatedAt = new Date();
  }

  /**
   * 分配任务给用户
   */
  assignTo(userId) {
    this.assigneeId = userId;
    this.updatedAt = new Date();
  }

  /**
   * 设置截止日期
   */
  setDueDate(dueDate) {
    this.dueDate = dueDate ? new Date(dueDate) : null;
    this.updatedAt = new Date();
  }

  /**
   * 添加标签
   */
  addTag(tag) {
    if (typeof tag === 'string' && tag.trim() && !this.tags.includes(tag)) {
      this.tags.push(tag.trim());
      this.updatedAt = new Date();
    }
  }

  /**
   * 移除标签
   */
  removeTag(tag) {
    const index = this.tags.indexOf(tag);
    if (index > -1) {
      this.tags.splice(index, 1);
      this.updatedAt = new Date();
    }
  }

  /**
   * 更新任务信息
   */
  updateInfo(updates) {
    const allowedUpdates = ['title', 'description', 'priority', 'dueDate', 'tags'];
    
    for (const [key, value] of Object.entries(updates)) {
      if (allowedUpdates.includes(key) && value !== undefined) {
        if (key === 'priority') {
          this.updatePriority(value);
        } else if (key === 'dueDate') {
          this.setDueDate(value);
        } else {
          this[key] = value;
        }
      }
    }
    
    this.updatedAt = new Date();
  }

  /**
   * 检查任务是否过期
   */
  isOverdue() {
    if (!this.dueDate || this.status === TaskStatus.COMPLETED) {
      return false;
    }
    
    return new Date() > new Date(this.dueDate);
  }

  /**
   * 获取任务进度状态
   */
  getProgressStatus() {
    return {
      status: this.status,
      isCompleted: this.status === TaskStatus.COMPLETED,
      isOverdue: this.isOverdue(),
      daysUntilDue: this.dueDate ? Math.ceil((new Date(this.dueDate) - new Date()) / (1000 * 60 * 60 * 24)) : null
    };
  }

  /**
   * 转换为JSON对象
   */
  toJSON() {
    return {
      id: this.id,
      title: this.title,
      description: this.description,
      status: this.status,
      priority: this.priority,
      userId: this.userId,
      assigneeId: this.assigneeId,
      dueDate: this.dueDate,
      completedAt: this.completedAt,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      tags: this.tags,
      progress: this.getProgressStatus()
    };
  }
}

export default Task;