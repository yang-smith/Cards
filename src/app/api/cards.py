from flask import Blueprint, request, jsonify, current_app
from app.models.model import Card, Links
from app import db
import json

# 创建cards蓝图
bp = Blueprint('cards', __name__)

@bp.route('/', methods=['GET'])
def get_cards():
    """获取所有卡片"""
    try:
        cards = Card.query.all()
        return jsonify([card.to_dict() for card in cards])
    except Exception as e:
        current_app.logger.error(f"获取卡片失败: {str(e)}")
        return jsonify({'error': '获取卡片失败'}), 500

@bp.route('/<id>', methods=['GET'])
def get_card(id):
    """获取单个卡片"""
    try:
        card = Card.query.get_or_404(id)
        return jsonify(card.to_dict())
    except Exception as e:
        current_app.logger.error(f"获取卡片失败: {str(e)}")
        return jsonify({'error': '获取卡片失败'}), 500

@bp.route('/new', methods=['POST'])
def create_card():
    """创建新卡片"""
    try:
        data = request.get_json()
        
        # 验证必需字段
        if not all(key in data for key in ['id', 'content']):
            return jsonify({'error': '缺少必需字段'}), 400

        # 创建卡片
        card = Card(
            id=data['id'],
            content=data['content'],
            context=data.get('context', {}),
            links=json.dumps(data.get('links', {}))
        )
        
        db.session.add(card)
        
        # 创建链接关系
        if data.get('links'):
            for target_id, weight in data['links'].items():
                link = Links(source_id=card.id, target_id=target_id, weight=weight)
                db.session.add(link)
        
        db.session.commit()
        return jsonify(card.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"创建卡片失败: {str(e)}")
        return jsonify({'error': '创建卡片失败'}), 500

@bp.route('/<id>', methods=['PUT'])
def update_card(id):
    """更新卡片，如果不存在则创建"""

    try:
        card = Card.query.get(id)
        data = request.get_json()

        if not all(key in data for key in ['id', 'content']):
            return jsonify({'error': '缺少必需字段'}), 400
        
        is_new = False
        if card is None:
            # 如果卡片不存在，创建新卡片
            is_new = True
            card = Card(
                id=id,
                content=data.get('content', ''),
                context=data.get('context', {}),
                links=json.dumps(data.get('links', {}))
            )
            db.session.add(card)
        else:
            # 更新现有卡片
            if 'content' in data:
                card.content = data['content']
            if 'context' in data:
                card.context = data['context']
            if 'links' in data:
                card.links = json.dumps(data['links'])

        # 处理链接关系（无论是新建还是更新）
        if 'links' in data:
            # 删除旧的链接
            Links.query.filter_by(source_id=id).delete()
            
            # 添加新的链接
            for target_id, weight in data['links'].items():
                link = Links(source_id=id, target_id=target_id, weight=weight)
                db.session.add(link)
        
        db.session.commit()
        return jsonify(card.to_dict()), 201 if is_new else 200
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"{'创建' if is_new else '更新'}卡片失败: {str(e)}")
        return jsonify({'error': f"{'创建' if is_new else '更新'}卡片失败"}), 500

@bp.route('/<id>', methods=['DELETE'])
def delete_card(id):
    """删除卡片"""
    try:
        card = Card.query.get_or_404(id)
        # 删除相关的链接
        Links.query.filter_by(source_id=id).delete()
        # 删除卡片
        db.session.delete(card)
        db.session.commit()
        return '', 204
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"删除卡片失败: {str(e)}")
        return jsonify({'error': '删除卡片失败'}), 500