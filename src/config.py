import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    # 基础配置
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))
    
    # SQLite配置
    SQLALCHEMY_DATABASE_URI = f"sqlite:///{os.path.join(BASE_DIR, 'app.db')}"
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # 项目配置
    PROJECT_FOLDER = os.path.join(BASE_DIR, 'projects')
    MAX_CONTENT_LENGTH = 50 * 1024 * 1024  # 50MB
     
    # 安全配置
    SECRET_KEY = os.getenv('SECRET_KEY', 'dev-key')
