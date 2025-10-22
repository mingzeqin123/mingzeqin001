#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
配置文件
管理AI评论分类器的各种配置参数
"""

import os
from typing import Dict, List

class Config:
    """配置管理类"""
    
    # 服务器配置
    SERVER_HOST = os.getenv('SERVER_HOST', '0.0.0.0')
    SERVER_PORT = int(os.getenv('SERVER_PORT', 5000))
    DEBUG_MODE = os.getenv('DEBUG_MODE', 'True').lower() == 'true'
    
    # 分类器配置
    MAX_BATCH_SIZE = int(os.getenv('MAX_BATCH_SIZE', 100))
    SIMILARITY_THRESHOLD = float(os.getenv('SIMILARITY_THRESHOLD', 0.8))
    HISTORY_SIZE = int(os.getenv('HISTORY_SIZE', 100))
    
    # 置信度阈值
    AD_CONFIDENCE_THRESHOLD = float(os.getenv('AD_CONFIDENCE_THRESHOLD', 0.5))
    SPAM_CONFIDENCE_THRESHOLD = float(os.getenv('SPAM_CONFIDENCE_THRESHOLD', 0.4))
    MEANINGLESS_CONFIDENCE_THRESHOLD = float(os.getenv('MEANINGLESS_CONFIDENCE_THRESHOLD', 0.5))
    
    # 特征权重
    CONTACT_WEIGHT = float(os.getenv('CONTACT_WEIGHT', 0.4))
    URL_WEIGHT = float(os.getenv('URL_WEIGHT', 0.3))
    SHORT_LENGTH_WEIGHT = float(os.getenv('SHORT_LENGTH_WEIGHT', 0.3))
    REPEAT_WEIGHT = float(os.getenv('REPEAT_WEIGHT', 0.2))
    KEYWORD_WEIGHT = float(os.getenv('KEYWORD_WEIGHT', 0.1))
    PUNCTUATION_WEIGHT = float(os.getenv('PUNCTUATION_WEIGHT', 0.2))
    
    # 长度阈值
    MIN_COMMENT_LENGTH = int(os.getenv('MIN_COMMENT_LENGTH', 5))
    MIN_WORD_COUNT = int(os.getenv('MIN_WORD_COUNT', 2))
    
    # 比例阈值
    MAX_PUNCTUATION_RATIO = float(os.getenv('MAX_PUNCTUATION_RATIO', 0.3))
    MAX_NUMBER_RATIO = float(os.getenv('MAX_NUMBER_RATIO', 0.8))
    MAX_ENGLISH_RATIO = float(os.getenv('MAX_ENGLISH_RATIO', 0.8))
    
    # 日志配置
    LOG_LEVEL = os.getenv('LOG_LEVEL', 'INFO')
    LOG_FORMAT = os.getenv('LOG_FORMAT', '%(asctime)s - %(levelname)s - %(message)s')
    
    # 关键词配置
    ENABLE_CUSTOM_KEYWORDS = os.getenv('ENABLE_CUSTOM_KEYWORDS', 'True').lower() == 'true'
    CUSTOM_KEYWORDS_FILE = os.getenv('CUSTOM_KEYWORDS_FILE', 'custom_keywords.json')
    
    @classmethod
    def get_all_config(cls) -> Dict:
        """获取所有配置"""
        config_dict = {}
        for attr_name in dir(cls):
            if not attr_name.startswith('_') and not callable(getattr(cls, attr_name)):
                config_dict[attr_name] = getattr(cls, attr_name)
        return config_dict
    
    @classmethod
    def print_config(cls):
        """打印配置信息"""
        print("=" * 50)
        print("当前配置信息")
        print("=" * 50)
        config = cls.get_all_config()
        for key, value in sorted(config.items()):
            print(f"{key}: {value}")
        print("=" * 50)

# 默认关键词配置
DEFAULT_KEYWORDS = {
    "ad_keywords": {
        "联系方式": ["微信", "QQ", "电话", "手机", "联系", "加我", "私聊", "咨询"],
        "商品推销": ["代购", "批发", "零售", "优惠", "打折", "促销", "特价", "包邮"],
        "服务推广": ["加盟", "代理", "招商", "合作", "兼职", "赚钱", "投资", "理财"],
        "网址链接": ["www", "http", ".com", ".cn", "点击", "链接", "网址", "官网"]
    },
    "spam_keywords": {
        "无意义字符": ["哈哈哈", "呵呵呵", "嘿嘿嘿", "嗯嗯嗯", "额额额"],
        "简单回复": ["顶", "沙发", "板凳", "路过", "支持", "赞", "好的", "嗯"],
        "表情符号": ["😂", "😄", "😊", "👍", "💪", "🔥", "❤️", "😍"]
    },
    "offensive_keywords": {
        "脏话": ["傻逼", "白痴", "智障", "垃圾", "废物", "滚蛋"],
        "攻击性": ["死", "杀", "打", "揍", "骂", "恨"],
        "歧视性": ["歧视", "仇恨", "种族", "性别", "地域"]
    }
}

# 默认正则表达式模式
DEFAULT_PATTERNS = {
    "contact_patterns": [
        r'微信[：:]\s*[a-zA-Z0-9_-]+',
        r'QQ[：:]\s*\d{5,12}',
        r'电话[：:]?\s*1[3-9]\d{9}',
        r'手机[：:]?\s*1[3-9]\d{9}',
        r'加我.*[a-zA-Z0-9_-]{6,}'
    ],
    "url_patterns": [
        r'https?://[^\s]+',
        r'www\.[^\s]+',
        r'[a-zA-Z0-9-]+\.(com|cn|net|org)[^\s]*'
    ],
    "repeat_patterns": [
        r'(.)\1{4,}',
        r'([哈呵嘿嗯额])\1{2,}',
        r'[！!]{3,}',
        r'[？?]{3,}'
    ]
}

# 分类类别配置
CATEGORIES = {
    'normal': '正常评论',
    'spam': '灌水评论', 
    'advertisement': '广告评论',
    'offensive': '恶意评论',
    'duplicate': '重复评论',
    'meaningless': '无意义评论'
}

def load_custom_keywords(file_path: str = None) -> Dict:
    """加载自定义关键词"""
    import json
    
    if not file_path:
        file_path = Config.CUSTOM_KEYWORDS_FILE
        
    try:
        if os.path.exists(file_path):
            with open(file_path, 'r', encoding='utf-8') as f:
                custom_keywords = json.load(f)
                print(f"已加载自定义关键词: {file_path}")
                return custom_keywords
    except Exception as e:
        print(f"加载自定义关键词失败: {e}")
        
    return DEFAULT_KEYWORDS

def save_custom_keywords(keywords: Dict, file_path: str = None):
    """保存自定义关键词"""
    import json
    
    if not file_path:
        file_path = Config.CUSTOM_KEYWORDS_FILE
        
    try:
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(keywords, f, ensure_ascii=False, indent=2)
            print(f"自定义关键词已保存: {file_path}")
    except Exception as e:
        print(f"保存自定义关键词失败: {e}")

if __name__ == "__main__":
    # 显示配置信息
    Config.print_config()
    
    # 测试关键词加载
    keywords = load_custom_keywords()
    print(f"\n关键词类别数: {len(keywords)}")
    for category, subcategories in keywords.items():
        print(f"{category}: {len(subcategories)} 个子类别")