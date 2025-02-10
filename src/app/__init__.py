from flask import Flask, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from config import Config
import os
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime

db = SQLAlchemy()
thread_pool = ThreadPoolExecutor(max_workers=10)  

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)
    
    # 初始化扩展
    # 配置CORS
    CORS(app, resources={
        r"/api/*": {
            "origins": ["http://localhost:3000",
            "http://localhost:5173",
            ], 
            "supports_credentials": True,   
            "expose_headers": ["Content-Type"],
            "allow_headers": ["Content-Type"],     
            "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"] 
        }
    })
    
    db.init_app(app)
    
    from app.api import bp as api_bp
    app.register_blueprint(api_bp, url_prefix='/api')
    

    os.makedirs(app.config['PROJECT_FOLDER'], exist_ok=True)
    
        
    with app.app_context():
        db.create_all()
        
    return app
