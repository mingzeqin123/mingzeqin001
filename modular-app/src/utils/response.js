/**
 * HTTP响应工具模块
 * 统一API响应格式
 */

/**
 * 成功响应
 */
export const successResponse = (res, data = null, message = '操作成功', statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
    timestamp: new Date().toISOString()
  });
};

/**
 * 错误响应
 */
export const errorResponse = (res, message = '操作失败', statusCode = 400, errors = null) => {
  return res.status(statusCode).json({
    success: false,
    message,
    errors,
    timestamp: new Date().toISOString()
  });
};

/**
 * 分页响应
 */
export const paginatedResponse = (res, data, pagination, message = '获取成功') => {
  return res.status(200).json({
    success: true,
    message,
    data,
    pagination: {
      page: pagination.page,
      limit: pagination.limit,
      total: pagination.total,
      totalPages: Math.ceil(pagination.total / pagination.limit)
    },
    timestamp: new Date().toISOString()
  });
};

/**
 * 创建响应
 */
export const createdResponse = (res, data, message = '创建成功') => {
  return successResponse(res, data, message, 201);
};

/**
 * 无内容响应
 */
export const noContentResponse = (res) => {
  return res.status(204).send();
};

/**
 * 未找到响应
 */
export const notFoundResponse = (res, message = '资源未找到') => {
  return errorResponse(res, message, 404);
};

/**
 * 未授权响应
 */
export const unauthorizedResponse = (res, message = '未授权访问') => {
  return errorResponse(res, message, 401);
};

/**
 * 禁止访问响应
 */
export const forbiddenResponse = (res, message = '禁止访问') => {
  return errorResponse(res, message, 403);
};

/**
 * 验证错误响应
 */
export const validationErrorResponse = (res, errors, message = '数据验证失败') => {
  return errorResponse(res, message, 422, errors);
};

/**
 * 服务器错误响应
 */
export const serverErrorResponse = (res, message = '服务器内部错误') => {
  return errorResponse(res, message, 500);
};