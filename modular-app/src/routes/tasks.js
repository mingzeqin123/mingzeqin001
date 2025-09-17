/**
 * 任务路由模块
 * 定义任务管理相关的API路由
 */
import express from 'express';
import {
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
} from '../controllers/TaskController.js';
import { authenticateToken } from '../middleware/auth.js';
import { validateRequest, validationRules } from '../middleware/validation.js';

const router = express.Router();

// 所有任务路由都需要认证
router.use(authenticateToken);

/**
 * @route   POST /api/v1/tasks
 * @desc    创建新任务
 * @access  Private
 */
router.post('/',
  validateRequest(validationRules.taskCreation),
  createTask
);

/**
 * @route   GET /api/v1/tasks
 * @desc    获取用户任务列表
 * @access  Private
 */
router.get('/',
  validateRequest({
    query: {
      fields: {
        page: {
          type: 'number'
        },
        limit: {
          type: 'number'
        },
        status: {
          type: 'string',
          validator: (value) => {
            const validStatuses = ['pending', 'in_progress', 'completed', 'cancelled'];
            return validStatuses.includes(value) ? [] : ['无效的任务状态'];
          }
        },
        priority: {
          type: 'string',
          validator: (value) => {
            const validPriorities = ['low', 'medium', 'high', 'urgent'];
            return validPriorities.includes(value) ? [] : ['无效的任务优先级'];
          }
        },
        search: {
          type: 'string',
          maxLength: 100
        },
        sortBy: {
          type: 'string',
          validator: (value) => {
            const validSortFields = ['createdAt', 'updatedAt', 'title', 'priority', 'dueDate'];
            return validSortFields.includes(value) ? [] : ['无效的排序字段'];
          }
        },
        sortOrder: {
          type: 'string',
          validator: (value) => {
            const validOrders = ['asc', 'desc'];
            return validOrders.includes(value) ? [] : ['无效的排序顺序'];
          }
        }
      }
    }
  }),
  getUserTasks
);

/**
 * @route   GET /api/v1/tasks/stats
 * @desc    获取任务统计信息
 * @access  Private
 */
router.get('/stats', getTaskStats);

/**
 * @route   GET /api/v1/tasks/search
 * @desc    搜索任务
 * @access  Private
 */
router.get('/search',
  validateRequest({
    query: {
      required: ['q'],
      fields: {
        q: {
          type: 'string',
          minLength: 1,
          maxLength: 100
        },
        page: {
          type: 'number'
        },
        limit: {
          type: 'number'
        }
      }
    }
  }),
  searchTasks
);

/**
 * @route   GET /api/v1/tasks/overdue
 * @desc    获取过期任务
 * @access  Private
 */
router.get('/overdue',
  validateRequest({
    query: {
      fields: {
        page: {
          type: 'number'
        },
        limit: {
          type: 'number'
        }
      }
    }
  }),
  getOverdueTasks
);

/**
 * @route   GET /api/v1/tasks/:id
 * @desc    获取任务详情
 * @access  Private
 */
router.get('/:id',
  validateRequest(validationRules.idParam),
  getTask
);

/**
 * @route   PUT /api/v1/tasks/:id
 * @desc    更新任务
 * @access  Private
 */
router.put('/:id',
  validateRequest({
    ...validationRules.idParam,
    ...validationRules.taskUpdate
  }),
  updateTask
);

/**
 * @route   PATCH /api/v1/tasks/:id/status
 * @desc    更新任务状态
 * @access  Private
 */
router.patch('/:id/status',
  validateRequest({
    ...validationRules.idParam,
    body: {
      required: ['status'],
      fields: {
        status: {
          type: 'string',
          validator: (value) => {
            const validStatuses = ['pending', 'in_progress', 'completed', 'cancelled'];
            return validStatuses.includes(value) ? [] : ['无效的任务状态'];
          }
        }
      }
    }
  }),
  updateTaskStatus
);

/**
 * @route   PATCH /api/v1/tasks/:id/assign
 * @desc    分配任务
 * @access  Private
 */
router.patch('/:id/assign',
  validateRequest({
    ...validationRules.idParam,
    body: {
      required: ['assigneeId'],
      fields: {
        assigneeId: {
          type: 'string',
          minLength: 1
        }
      }
    }
  }),
  assignTask
);

/**
 * @route   DELETE /api/v1/tasks/:id
 * @desc    删除任务
 * @access  Private
 */
router.delete('/:id',
  validateRequest(validationRules.idParam),
  deleteTask
);

/**
 * @route   PATCH /api/v1/tasks/batch/status
 * @desc    批量更新任务状态
 * @access  Private
 */
router.patch('/batch/status',
  validateRequest({
    body: {
      required: ['taskIds', 'status'],
      fields: {
        taskIds: {
          type: 'array',
          validator: (value) => {
            if (!Array.isArray(value) || value.length === 0) {
              return ['任务ID列表不能为空'];
            }
            if (value.some(id => typeof id !== 'string' || id.length === 0)) {
              return ['任务ID格式无效'];
            }
            return [];
          }
        },
        status: {
          type: 'string',
          validator: (value) => {
            const validStatuses = ['pending', 'in_progress', 'completed', 'cancelled'];
            return validStatuses.includes(value) ? [] : ['无效的任务状态'];
          }
        }
      }
    }
  }),
  batchUpdateTaskStatus
);

export default router;