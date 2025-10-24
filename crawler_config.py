#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
IT新闻爬虫配置文件
"""

# 爬虫设置
CRAWLER_CONFIG = {
    # 请求设置
    'timeout': 10,
    'retry_times': 3,
    'delay_between_requests': 1,  # 秒
    
    # 用户代理
    'user_agents': [
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    ],
    
    # 每个源爬取的新闻数量限制
    'max_news_per_source': 20,
    
    # 热度计算权重
    'heat_weights': {
        'view_count': 0.4,
        'comment_count': 0.3,
        'like_count': 0.2,
        'time_freshness': 0.1
    },
    
    # 输出设置
    'output_format': 'json',  # json, csv, txt
    'output_directory': './output/',
    'include_summary': True,
    'max_summary_length': 200
}

# 新闻源配置
NEWS_SOURCES = {
    '36kr': {
        'name': '36氪',
        'enabled': True,
        'api_url': 'https://36kr.com/api/search-column/mainsite',
        'web_url': 'https://36kr.com/',
        'priority': 1
    },
    'huxiu': {
        'name': '虎嗅网',
        'enabled': True,
        'web_url': 'https://www.huxiu.com/',
        'priority': 2
    },
    'infoq': {
        'name': 'InfoQ',
        'enabled': True,
        'web_url': 'https://www.infoq.cn/news',
        'priority': 3
    },
    'csdn': {
        'name': 'CSDN',
        'enabled': True,
        'web_url': 'https://www.csdn.net/news',
        'priority': 4
    },
    'ithome': {
        'name': 'IT之家',
        'enabled': True,
        'web_url': 'https://www.ithome.com/',
        'priority': 5
    }
}

# 关键词过滤（可选）
KEYWORD_FILTERS = {
    'include_keywords': [
        'AI', '人工智能', '机器学习', '深度学习',
        '区块链', '比特币', '加密货币',
        '云计算', '大数据', '物联网', 'IoT',
        '5G', '6G', '移动通信',
        '芯片', '半导体', '处理器',
        '编程', '开发', '软件', '开源',
        '互联网', '科技', '创业', '投资'
    ],
    'exclude_keywords': [
        '广告', '推广', '营销'
    ],
    'enable_filtering': False  # 是否启用关键词过滤
}

# 数据库配置（可选，用于持久化存储）
DATABASE_CONFIG = {
    'enabled': False,
    'type': 'sqlite',  # sqlite, mysql, postgresql
    'connection': {
        'database': 'it_news.db',
        'host': 'localhost',
        'port': 3306,
        'username': '',
        'password': ''
    }
}

# 通知配置（可选）
NOTIFICATION_CONFIG = {
    'enabled': False,
    'email': {
        'smtp_server': 'smtp.gmail.com',
        'smtp_port': 587,
        'username': '',
        'password': '',
        'recipients': []
    },
    'webhook': {
        'url': '',
        'method': 'POST'
    }
}

# 定时任务配置
SCHEDULER_CONFIG = {
    'enabled': False,
    'interval_hours': 2,  # 每2小时运行一次
    'run_times': [  # 每天运行的时间点
        '08:00',
        '12:00',
        '16:00',
        '20:00'
    ]
}