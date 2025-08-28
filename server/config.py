import os
from dotenv import load_dotenv
from datetime import timedelta

load_dotenv()

class Config:
    SECRET_KEY = os.getenv('SECRET_KEY', 'default_secret_key')
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', 'default_secret_key')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=1)
    MAIL_SERVER = os.getenv('MAIL_SERVER', 'smtp.gmail.com')
    MAIL_PORT = int(os.getenv('MAIL_PORT', '587'))
    MAIL_USE_TLS = os.getenv('MAIL_USE_TLS', 'True').lower() == 'true'
    MAIL_USERNAME = os.getenv('MAIL_USERNAME')
    MAIL_PASSWORD = os.getenv('MAIL_PASSWORD')

class DevelopmentConfig(Config):
    DEBUG = True
    SQLALCHEMY_DATABASE_URI = os.getenv('DATABASE_URL') or 'sqlite:///chillar_dev.db'

class ProductionConfig(Config):
    DEBUG = False
    
    # Set SQLALCHEMY_DATABASE_URI at class definition time
    _database_url = os.getenv('DATABASE_URL')
    if _database_url:
        # Handle both postgres:// and postgresql:// schemes and use psycopg dialect
        if _database_url.startswith('postgres://'):
            _database_url = _database_url.replace('postgres://', 'postgresql+psycopg://', 1)
        elif _database_url.startswith('postgresql://'):
            _database_url = _database_url.replace('postgresql://', 'postgresql+psycopg://', 1)
        SQLALCHEMY_DATABASE_URI = _database_url
    else:
        # Fallback for development/testing
        SQLALCHEMY_DATABASE_URI = 'sqlite:///chillar_prod.db'

class TestingConfig(Config):
    TESTING = True
    SQLALCHEMY_DATABASE_URI = 'sqlite:///test_chillar.db'

config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'testing': TestingConfig,
    'default': DevelopmentConfig
}
