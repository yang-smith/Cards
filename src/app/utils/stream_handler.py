import json
import time
from flask import Response

def generate_sse(contents_generator, model: str):
    """
    将普通生成器转换为SSE格式
    
    :param contents_generator: ai_chat_stream_sync返回的生成器
    :param model: 模型名称（用于元数据）
    """
    try:
        # 发送初始元数据
        yield f"data: {json.dumps({'model': model, 'status': 'start'})}\n\n"
        
        # 流式内容处理
        for content in contents_generator:
            # 错误处理
            if content.startswith("[ERROR] "):
                error_data = json.dumps({
                    "error": content[8:],
                    "finish_reason": "error"
                })
                yield f"data: {error_data}\n\n"
                break
            
            # 正常数据块
            chunk_data = json.dumps({
                "content": content,
                "finish_reason": None
            })
            yield f"data: {chunk_data}\n\n"
        
        # 结束标记
        yield "data: [DONE]\n\n"
    
    except Exception as e:
        # 生成器异常处理
        error_data = json.dumps({
            "error": str(e),
            "finish_reason": "error"
        })
        yield f"data: {error_data}\n\n"

def create_sse_response(generator, model: str):
    """
    创建SSE响应对象
    
    Args:
        generator: 生成器
        model: 模型名称
    """
    return Response(
        generate_sse(generator, model),
        mimetype="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )