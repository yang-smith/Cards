from flask import Blueprint, request, jsonify, current_app
from app.utils.stream_handler import create_sse_response
from app.utils.ai_chat_client import ai_chat_stream, ai_chat

bp = Blueprint('chat', __name__)

@bp.route('/stream', methods=['GET', 'POST'])
def stream_chat():
    """流式生成文档"""
    try:
        if request.method == 'GET':
            message = request.args.get('message')
        else:
            data = request.get_json() or {}
            message = data.get('message')
        
        current_app.logger.info(f"收到聊天生成请求: message={message}")
        
        stream = ai_chat_stream(
            message=message,
            model="deepseek/deepseek-r1-distill-llama-70b"
        )
        
        return create_sse_response(stream, model='deepseek/deepseek-r1-distill-llama-70b')
            
    except Exception as e:
        current_app.logger.error(f"流式生成失败: {str(e)}")
        return jsonify({'error': '内部服务器错误'}), 500 

@bp.route('/atomize', methods=['POST'])
def atomize_content():
    """将内容拆分为卡片"""
    try:
        data = request.get_json() or {}
        content = data.get('content')
        
        current_app.logger.info(f"收到内容拆分请求: content={content}")
        
        response = ai_chat(
            message=content,
            model="deepseek/deepseek-r1-distill-llama-70b"
        )
        
        return jsonify({'content': response})
            
    except Exception as e:
        current_app.logger.error(f"内容拆分失败: {str(e)}")
        return jsonify({'error': '内部服务器错误'}), 500 