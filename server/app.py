from flask import Flask, Blueprint
from config import config
from extensions import db, bcrypt, jwt, mail
from flask_migrate import Migrate
from flask_cors import CORS
from routes.auth_routes import auth_bp
from utils.api_docs import api
import admin
import os

def create_app(config_name='default'):
    # Initialize Flask App
    app = Flask(__name__)
    app.config.from_object(config[config_name])
    
    # Enable CORS with proper configuration for production
    CORS(app, resources={
        r"/*": {
            "origins": os.getenv('ALLOWED_ORIGINS', '*').split(','),
            "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            "allow_headers": ["Content-Type", "Authorization"]
        }
    })

    # Initialize Extensions
db.init_app(app)
bcrypt.init_app(app)
jwt.init_app(app)
mail.init_app(app)
migrate = Migrate(app, db)

# Register Blueprints

from routes.api_routes import api_bp
app.register_blueprint(auth_bp, url_prefix='/auth')
app.register_blueprint(api_bp, url_prefix='/api')
admin.init_app(app)

@app.route('/')
def home():
    return "This is the home page"

if __name__ == '__main__':
    port = int(os.environ.get("FLASK_RUN_PORT", 5000))
    app.run(host='0.0.0.0', debug=True, port=port)
