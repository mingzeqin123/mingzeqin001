#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
评论分类API服务器
提供HTTP API接口供外部系统调用
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import json
import logging
from datetime import datetime
from comment_classifier import CommentClassifier, CommentClassification

# 配置日志
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)  # 允许跨域请求

# 初始化分类器
classifier = CommentClassifier()

@app.route('/health', methods=['GET'])
def health_check():
    """健康检查接口"""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'service': 'comment-classifier-api'
    })

@app.route('/classify', methods=['POST'])
def classify_single_comment():
    """单条评论分类接口"""
    try:
        data = request.get_json()
        
        if not data or 'comment' not in data:
            return jsonify({
                'error': '请提供评论内容',
                'code': 'MISSING_COMMENT'
            }), 400
            
        comment = data['comment']
        user_id = data.get('user_id')
        
        # 分类评论
        result = classifier.classify_comment(comment, user_id)
        
        # 转换为字典格式
        response = {
            'success': True,
            'data': {
                'comment': comment,
                'category': result.category,
                'category_name': classifier.CATEGORIES[result.category],
                'confidence': result.confidence,
                'reasons': result.reasons,
                'keywords': result.keywords,
                'timestamp': result.timestamp
            }
        }
        
        logger.info(f"分类完成: {comment[:50]}... -> {result.category}")
        return jsonify(response)
        
    except Exception as e:
        logger.error(f"分类错误: {str(e)}")
        return jsonify({
            'error': '分类处理失败',
            'code': 'CLASSIFICATION_ERROR',
            'details': str(e)
        }), 500

@app.route('/classify/batch', methods=['POST'])
def classify_batch_comments():
    """批量评论分类接口"""
    try:
        data = request.get_json()
        
        if not data or 'comments' not in data:
            return jsonify({
                'error': '请提供评论列表',
                'code': 'MISSING_COMMENTS'
            }), 400
            
        comments = data['comments']
        
        if not isinstance(comments, list):
            return jsonify({
                'error': '评论必须是列表格式',
                'code': 'INVALID_FORMAT'
            }), 400
            
        if len(comments) > 100:
            return jsonify({
                'error': '单次最多处理100条评论',
                'code': 'TOO_MANY_COMMENTS'
            }), 400
            
        # 批量分类
        results = classifier.batch_classify(comments)
        
        # 转换为响应格式
        classified_comments = []
        for comment, result in zip(comments, results):
            classified_comments.append({
                'comment': comment,
                'category': result.category,
                'category_name': classifier.CATEGORIES[result.category],
                'confidence': result.confidence,
                'reasons': result.reasons,
                'keywords': result.keywords,
                'timestamp': result.timestamp
            })
            
        # 获取统计信息
        stats = classifier.get_statistics(results)
        
        response = {
            'success': True,
            'data': {
                'results': classified_comments,
                'statistics': stats
            }
        }
        
        logger.info(f"批量分类完成: {len(comments)} 条评论")
        return jsonify(response)
        
    except Exception as e:
        logger.error(f"批量分类错误: {str(e)}")
        return jsonify({
            'error': '批量分类处理失败',
            'code': 'BATCH_CLASSIFICATION_ERROR',
            'details': str(e)
        }), 500

@app.route('/categories', methods=['GET'])
def get_categories():
    """获取所有分类类别"""
    return jsonify({
        'success': True,
        'data': {
            'categories': classifier.CATEGORIES
        }
    })

@app.route('/statistics', methods=['POST'])
def get_classification_statistics():
    """获取分类统计信息"""
    try:
        data = request.get_json()
        
        if not data or 'classifications' not in data:
            return jsonify({
                'error': '请提供分类结果',
                'code': 'MISSING_CLASSIFICATIONS'
            }), 400
            
        classifications_data = data['classifications']
        
        # 转换为CommentClassification对象
        classifications = []
        for item in classifications_data:
            classification = CommentClassification(
                category=item['category'],
                confidence=item['confidence'],
                reasons=item['reasons'],
                keywords=item['keywords'],
                timestamp=item['timestamp']
            )
            classifications.append(classification)
            
        # 获取统计信息
        stats = classifier.get_statistics(classifications)
        
        return jsonify({
            'success': True,
            'data': stats
        })
        
    except Exception as e:
        logger.error(f"统计信息错误: {str(e)}")
        return jsonify({
            'error': '统计信息处理失败',
            'code': 'STATISTICS_ERROR',
            'details': str(e)
        }), 500

@app.errorhandler(404)
def not_found(error):
    """404错误处理"""
    return jsonify({
        'error': '接口不存在',
        'code': 'NOT_FOUND'
    }), 404

@app.errorhandler(405)
def method_not_allowed(error):
    """405错误处理"""
    return jsonify({
        'error': '请求方法不允许',
        'code': 'METHOD_NOT_ALLOWED'
    }), 405

@app.errorhandler(500)
def internal_error(error):
    """500错误处理"""
    return jsonify({
        'error': '服务器内部错误',
        'code': 'INTERNAL_ERROR'
    }), 500

if __name__ == '__main__':
    print("=" * 60)
    print("评论分类API服务器")
    print("=" * 60)
    print("API接口说明:")
    print("GET  /health           - 健康检查")
    print("POST /classify         - 单条评论分类")
    print("POST /classify/batch   - 批量评论分类")
    print("GET  /categories       - 获取分类类别")
    print("POST /statistics       - 获取统计信息")
    print("=" * 60)
    print("服务器启动中...")
    
    app.run(host='0.0.0.0', port=5000, debug=True)