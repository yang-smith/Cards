from flask import Blueprint

# 创建主API蓝图
bp = Blueprint('api', __name__)

# 导入并注册子蓝图
from .cards import bp as cards_bp
from .chat import bp as chat_bp

# 注册子蓝图，指定URL前缀
bp.register_blueprint(cards_bp, url_prefix='/cards')
bp.register_blueprint(chat_bp, url_prefix='/chat')

