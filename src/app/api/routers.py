from flask import Blueprint, request, jsonify, current_app, Response
from app.utils.stream_handler import create_sse_response
from app.utils.ai_chat_client import ai_chat_stream


bp = Blueprint('api', __name__)



@bp.route('/chat_stream', methods=['GET','POST'])
def stream_chat():
    """流式生成文档"""
    try:
        if request.method == 'GET':
            message = request.args.get('message')
        else:
            data = request.get_json() or {}
            message = data.get('message')
        
        current_app.logger.info(f"收到聊天生成请求: message={message}")
        
        try:
            # 创建生成器流
            stream = ai_chat_stream(
                message=message,
                model="deepseek/deepseek-r1-distill-llama-70b"
            )
            
            # 创建SSE响应
            return create_sse_response(stream, model='deepseek/deepseek-r1-distill-llama-70b')
            
        except Exception as e:
            current_app.logger.error(f"生成文档失败: {str(e)}")
            raise ValueError(f"生成文档失败: {str(e)}")
            
    except NotFound as e:
        return jsonify({'error': str(e)}), 404
    except ValueError as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        current_app.logger.error(f"流式生成失败: {str(e)}")
        return jsonify({'error': '内部服务器错误'}), 500

# 错误处理
@bp.errorhandler(404)
def not_found_error(error):
    return jsonify({'error': 'Not found'}), 404

@bp.errorhandler(500)
def internal_error(error):
    current_app.logger.error(f"Server Error: {error}")
    return jsonify({'error': 'Internal server error'}), 500