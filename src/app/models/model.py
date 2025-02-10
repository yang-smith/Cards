from datetime import datetime
from app import db
from enum import Enum
import uuid
import os
import json


class Links(db.Model):
    __tablename__ = 'card_links'
    
    source_id = db.Column(db.String(14), db.ForeignKey('cards.id'), primary_key=True)
    target_id = db.Column(db.String(14), db.ForeignKey('cards.id'), primary_key=True)
    weight = db.Column(db.Float, default=1.0)

    @staticmethod
    def get_card_links(card_id):
        """获取卡片的所有链接"""
        links = Links.query.filter_by(source_id=card_id).all()
        return {link.target_id: link.weight for link in links}

class Card(db.Model):
    __tablename__ = 'cards'

    id = db.Column(db.String(14), primary_key=True) #卡片时间戳id
    content = db.Column(db.Text)  #卡片内容
    context = db.Column(db.Text) #卡片环境信息。例如来源、触发等
    links = db.Column(db.Text)  #json格式的links {target_id: weight}

    def to_dict(self):
        """转换为字典，包含所有链接信息"""
        return {
            'id': self.id,
            'content': self.content,
            'context': self.context,
            'links': json.loads(self.links) if self.links else {},
        }

    def __repr__(self):
        return f"<Card(id={self.id}, content={self.content[:30]}...)>"