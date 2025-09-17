/**
 * 任务控制器
 * 处理任务相关的HTTP请求
 */
import TaskService from '../services/TaskService.js';
import { 
  successResponse, 
  createdResponse, 
  noContentResponse,
  paginatedResponse,
  notFoundResponse
} from '../utils/response.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import logger from '../utils/logger.js';

/**
 * 任务控制器类
 */
export class TaskController {
  constructor() {
    this.taskService = new TaskService();
  }

  /**
   * 创建任务
   */
  createTask = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const taskData = req.body;

    // 创建任务
    const task = await this.taskService.createTask(taskData, userId);

    logger.info('任务创建成功', { taskId: task.id, userId });

    return createdResponse(res, task, '任务创建成功');
  });

  /**
   * 获取任务详情
   */
  getTask = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;

    // 获取任务
    const task = await this.taskService.getTaskById(id);
    
    if (!task) {
      return notFoundResponse(res, '任务不存在');
    }

    // 检查权限（只有创建者或被分配者可以查看）
    if (task.userId !== userId && task.assigneeId !== userId) {
      return notFoundResponse(res, '任务不存在');
    }

    return successResponse(res, task, '获取任务成功');
  });

  /**
   * 获取用户任务列表
   */
  getUserTasks = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { 
      page = 1, 
      limit = 10, 
      status, 
      priority, 
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      status,
      priority,
      search,
      sortBy,
      sortOrder: sortOrder === 'desc' ? -1 : 1
    };

    // 获取任务列表
    const result = await this.taskService.getUserTasks(userId, options);

    return paginatedResponse(res, result.data, result.pagination, '获取任务列表成功');
  });

  /**
   * 更新任务
   */
  updateTask = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;
    const updates = req.body;

    // 更新任务
    const updatedTask = await this.taskService.updateTask(id, updates, userId);

    logger.info('任务更新成功', { taskId: id, userId });

    return successResponse(res, updatedTask, '任务更新成功');
  });

  /**
   * 更新任务状态
   */
  updateTaskStatus = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    const userId = req.user.id;

    // 更新任务状态
    const updatedTask = await this.taskService.updateTaskStatus(id, status, userId);

    logger.info('任务状态更新成功', { taskId: id, status, userId });

    return successResponse(res, updatedTask, '任务状态更新成功');
  });

  /**
   * 分配任务
   */
  assignTask = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { assigneeId } = req.body;
    const userId = req.user.id;

    // 分配任务
    const updatedTask = await this.taskService.assignTask(id, assigneeId, userId);

    logger.info('任务分配成功', { taskId: id, assigneeId, userId });

    return successResponse(res, updatedTask, '任务分配成功');
  });

  /**
   * 删除任务
   */
  deleteTask = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;

    // 删除任务
    await this.taskService.deleteTask(id, userId);

    logger.info('任务删除成功', { taskId: id, userId });

    return noContentResponse(res);
  });

  /**
   * 获取任务统计信息
   */
  getTaskStats = asyncHandler(async (req, res) => {
    const userId = req.user.id;

    // 获取统计信息
    const stats = await this.taskService.getTaskStats(userId);

    return successResponse(res, stats, '获取任务统计成功');
  });

  /**
   * 搜索任务
   */
  searchTasks = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { q: query, page = 1, limit = 10 } = req.query;

    if (!query || query.trim().length === 0) {
      return successResponse(res, { data: [], pagination: { page: 1, limit, total: 0, totalPages: 0 } }, '请提供搜索关键词');
    }

    const options = {
      page: parseInt(page),
      limit: parseInt(limit)
    };

    // 搜索任务
    const result = await this.taskService.searchTasks(query.trim(), userId, options);

    return paginatedResponse(res, result.data, result.pagination, '搜索任务完成');
  });

  /**
   * 获取过期任务
   */
  getOverdueTasks = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { page = 1, limit = 10 } = req.query;

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sortBy: 'dueDate',
      sortOrder: 1 // 按截止日期升序排列
    };

    // 获取用户所有任务，然后过滤出过期的
    const result = await this.taskService.getUserTasks(userId, options);
    
    // 过滤过期任务
    const overdueTasks = result.data.filter(task => task.isOverdue());

    const overdueResult = {
      data: overdueTasks,
      pagination: {
        ...result.pagination,
        total: overdueTasks.length,
        totalPages: Math.ceil(overdueTasks.length / options.limit)
      }
    };

    return paginatedResponse(res, overdueResult.data, overdueResult.pagination, '获取过期任务成功');
  });

  /**
   * 批量更新任务状态
   */
  batchUpdateTaskStatus = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { taskIds, status } = req.body;

    if (!Array.isArray(taskIds) || taskIds.length === 0) {
      return errorResponse(res, '请提供要更新的任务ID列表', 400);
    }

    const results = [];
    const errors = [];

    // 批量更新任务状态
    for (const taskId of taskIds) {
      try {
        const updatedTask = await this.taskService.updateTaskStatus(taskId, status, userId);
        results.push({
          taskId,
          success: true,
          task: updatedTask
        });
      } catch (error) {
        errors.push({
          taskId,
          success: false,
          error: error.message
        });
      }
    }

    logger.info('批量任务状态更新完成', { 
      userId, 
      totalTasks: taskIds.length, 
      successCount: results.length, 
      errorCount: errors.length 
    });

    return successResponse(res, {
      results,
      errors,
      summary: {
        total: taskIds.length,
        success: results.length,
        failed: errors.length
      }
    }, '批量任务状态更新完成');
  });
}

// 创建控制器实例
const taskController = new TaskController();

// 导出控制器方法
export const {
  createTask,
  getTask,
  getUserTasks,
  updateTask,
  updateTaskStatus,
  assignTask,
  deleteTask,
  getTaskStats,
  searchTasks,
  getOverdueTasks,
  batchUpdateTaskStatus
} = taskController;

export default taskController;