from flask import Flask, Blueprint
from config import config
from extensions import db, bcrypt, jwt, mail, limiter
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
    limiter.init_app(app)
    migrate = Migrate(app, db)

    # Register Blueprints
    from routes.api_routes import api_bp
    app.register_blueprint(auth_bp, url_prefix='/auth')
    app.register_blueprint(api_bp, url_prefix='/api')
    admin.init_app(app)

    @app.route('/')
    def home():
        return "This is the home page"

    @app.route('/health')
    def health_check():
        try:
            # Test database connection (SQLAlchemy 2.0 style)
            with db.engine.connect() as connection:
                connection.execute(db.text('SELECT 1'))
            return {"status": "healthy", "database": "connected"}, 200
        except Exception as e:
            return {"status": "unhealthy", "database": "disconnected", "error": str(e)}, 500

    @app.route('/db-status')
    def db_status():
        try:
            from models import User, Person, Event, Transaction
            user_count = User.query.count()
            person_count = Person.query.count()
            event_count = Event.query.count()
            transaction_count = Transaction.query.count()
            return {
                "status": "ok",
                "tables": {
                    "users": user_count,
                    "people": person_count,
                    "events": event_count,
                    "transactions": transaction_count
                }
            }, 200
        except Exception as e:
            return {"status": "error", "message": str(e)}, 500

    @app.route('/init-db')
    def init_db():
        try:
            # Create all tables if they don't exist
            db.create_all()
            return {"status": "success", "message": "Database tables created"}, 200
        except Exception as e:
            return {"status": "error", "message": str(e)}, 500

    return app

if __name__ == '__main__':
    app = create_app()
    port = int(os.environ.get("FLASK_RUN_PORT", 5000))
    app.run(host='0.0.0.0', debug=True, port=port)
