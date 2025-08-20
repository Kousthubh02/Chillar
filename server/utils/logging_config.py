import os
import logging
from logging.handlers import RotatingFileHandler

def setup_logging(app):
    if not os.path.exists('logs'):
        os.mkdir('logs')
        
    # File Handler
    file_handler = RotatingFileHandler(
        'logs/chillar.log', 
        maxBytes=10240000,  # 10MB
        backupCount=10
    )
    file_handler.setFormatter(logging.Formatter(
        '%(asctime)s %(levelname)s: %(message)s [in %(pathname)s:%(lineno)d]'
    ))
    file_handler.setLevel(logging.INFO)
    app.logger.addHandler(file_handler)
    
    # General logging setup
    app.logger.setLevel(logging.INFO)
    app.logger.info('Chillar startup')
