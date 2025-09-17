/**
 * 任务服务模块
 * 处理任务相关的业务逻辑
 */
import Task, { TaskStatus, TaskPriority } from '../models/Task.js';
import { DataStore } from '../data/DataStore.js';
import { 
  isValidTaskTitle, 
  isValidTaskStatus, 
  isValidPriority,
  validateRequired 
} from '../utils/validation.js';
import logger from '../utils/logger.js';

/**
 * 任务服务类
 */
export class TaskService {
  constructor() {
    this.dataStore = new DataStore();
  }

  /**
   * 创建新任务
   */
  async createTask(taskData, userId) {
    try {
      // 验证必需字段
      const validation = validateRequired(taskData, ['title']);
      if (!validation.isValid) {
        throw new Error(`缺少必需字段: ${validation.missing.join(', ')}`);
      }

      // 验证任务标题
      if (!isValidTaskTitle(taskData.title)) {
        throw new Error('任务标题无效，长度应在1-200字符之间');
      }

      // 验证状态（如果提供）
      if (taskData.status && !isValidTaskStatus(taskData.status)) {
        throw new Error('任务状态无效');
      }

      // 验证优先级（如果提供）
      if (taskData.priority && !isValidPriority(taskData.priority)) {
        throw new Error('任务优先级无效');
      }

      // 创建任务实例
      const task = new Task({
        ...taskData,
        userId
      });

      // 保存任务
      const savedTask = await this.dataStore.tasks.create(task);

      logger.info('任务创建成功', { taskId: savedTask.id, title: savedTask.title, userId });

      return savedTask;
    } catch (error) {
      logger.error('任务创建失败', { error: error.message, taskData, userId });
      throw error;
    }
  }

  /**
   * 根据ID获取任务
   */
  async getTaskById(taskId) {
    try {
      const task = await this.dataStore.tasks.findById(taskId);
      return task;
    } catch (error) {
      logger.error('获取任务失败', { taskId, error: error.message });
      throw error;
    }
  }

  /**
   * 获取用户的任务列表
   */
  async getUserTasks(userId, options = {}) {
    try {
      const { 
        page = 1, 
        limit = 10, 
        status, 
        priority, 
        search = '',
        sortBy = 'createdAt',
        sortOrder = -1
      } = options;

      // 构建过滤条件
      let filters = {
        $or: [
          { userId },
          { assigneeId: userId }
        ]
      };

      // 添加状态过滤
      if (status && isValidTaskStatus(status)) {
        filters.status = status;
      }

      // 添加优先级过滤
      if (priority && isValidPriority(priority)) {
        filters.priority = priority;
      }

      // 添加搜索过滤
      if (search) {
        filters.title = { $regex: search, $options: 'i' };
      }

      const tasks = await this.dataStore.tasks.findMany(filters, {
        page,
        limit,
        sort: { [sortBy]: sortOrder }
      });

      return tasks;
    } catch (error) {
      logger.error('获取用户任务列表失败', { userId, options, error: error.message });
      throw error;
    }
  }

  /**
   * 更新任务信息
   */
  async updateTask(taskId, updates, userId) {
    try {
      const task = await this.getTaskById(taskId);
      if (!task) {
        throw new Error('任务不存在');
      }

      // 检查权限（只有创建者或被分配者可以更新）
      if (task.userId !== userId && task.assigneeId !== userId) {
        throw new Error('无权限更新此任务');
      }

      // 验证更新数据
      if (updates.title && !isValidTaskTitle(updates.title)) {
        throw new Error('任务标题无效');
      }

      if (updates.status && !isValidTaskStatus(updates.status)) {
        throw new Error('任务状态无效');
      }

      if (updates.priority && !isValidPriority(updates.priority)) {
        throw new Error('任务优先级无效');
      }

      // 更新任务信息
      task.updateInfo(updates);

      // 保存更新
      const updatedTask = await this.dataStore.tasks.update(taskId, task);

      logger.info('任务信息更新成功', { taskId, updates, userId });

      return updatedTask;
    } catch (error) {
      logger.error('任务信息更新失败', { taskId, updates, userId, error: error.message });
      throw error;
    }
  }

  /**
   * 更新任务状态
   */
  async updateTaskStatus(taskId, status, userId) {
    try {
      const task = await this.getTaskById(taskId);
      if (!task) {
        throw new Error('任务不存在');
      }

      // 检查权限
      if (task.userId !== userId && task.assigneeId !== userId) {
        throw new Error('无权限更新此任务状态');
      }

      // 更新状态
      task.updateStatus(status);

      // 保存更新
      const updatedTask = await this.dataStore.tasks.update(taskId, task);

      logger.info('任务状态更新成功', { taskId, status, userId });

      return updatedTask;
    } catch (error) {
      logger.error('任务状态更新失败', { taskId, status, userId, error: error.message });
      throw error;
    }
  }

  /**
   * 分配任务
   */
  async assignTask(taskId, assigneeId, userId) {
    try {
      const task = await this.getTaskById(taskId);
      if (!task) {
        throw new Error('任务不存在');
      }

      // 只有任务创建者可以分配任务
      if (task.userId !== userId) {
        throw new Error('只有任务创建者可以分配任务');
      }

      // 分配任务
      task.assignTo(assigneeId);

      // 保存更新
      const updatedTask = await this.dataStore.tasks.update(taskId, task);

      logger.info('任务分配成功', { taskId, assigneeId, userId });

      return updatedTask;
    } catch (error) {
      logger.error('任务分配失败', { taskId, assigneeId, userId, error: error.message });
      throw error;
    }
  }

  /**
   * 删除任务
   */
  async deleteTask(taskId, userId) {
    try {
      const task = await this.getTaskById(taskId);
      if (!task) {
        throw new Error('任务不存在');
      }

      // 只有任务创建者可以删除任务
      if (task.userId !== userId) {
        throw new Error('只有任务创建者可以删除任务');
      }

      // 删除任务
      await this.dataStore.tasks.delete(taskId);

      logger.info('任务删除成功', { taskId, userId });

      return true;
    } catch (error) {
      logger.error('任务删除失败', { taskId, userId, error: error.message });
      throw error;
    }
  }

  /**
   * 获取任务统计信息
   */
  async getTaskStats(userId) {
    try {
      const allTasks = await this.dataStore.tasks.findMany({
        $or: [
          { userId },
          { assigneeId: userId }
        ]
      });

      const stats = {
        total: allTasks.length,
        pending: 0,
        inProgress: 0,
        completed: 0,
        cancelled: 0,
        overdue: 0,
        byPriority: {
          low: 0,
          medium: 0,
          high: 0,
          urgent: 0
        }
      };

      allTasks.forEach(task => {
        // 按状态统计
        stats[task.status.replace('_', '')]++;

        // 按优先级统计
        stats.byPriority[task.priority]++;

        // 过期任务统计
        if (task.isOverdue()) {
          stats.overdue++;
        }
      });

      return stats;
    } catch (error) {
      logger.error('获取任务统计失败', { userId, error: error.message });
      throw error;
    }
  }

  /**
   * 搜索任务
   */
  async searchTasks(query, userId, options = {}) {
    try {
      const { page = 1, limit = 10 } = options;

      const filters = {
        $and: [
          {
            $or: [
              { userId },
              { assigneeId: userId }
            ]
          },
          {
            $or: [
              { title: { $regex: query, $options: 'i' } },
              { description: { $regex: query, $options: 'i' } },
              { tags: { $in: [query] } }
            ]
          }
        ]
      };

      const tasks = await this.dataStore.tasks.findMany(filters, {
        page,
        limit,
        sort: { updatedAt: -1 }
      });

      logger.info('任务搜索完成', { query, userId, resultCount: tasks.data.length });

      return tasks;
    } catch (error) {
      logger.error('任务搜索失败', { query, userId, error: error.message });
      throw error;
    }
  }
}

export default TaskService;