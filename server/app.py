from flask import Flask, Blueprint, redirect
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
    
    # Initialize Flask-Admin
    try:
        admin.init_app(app)
        print("✅ Flask-Admin initialized successfully")
    except Exception as e:
        print(f"❌ Flask-Admin initialization failed: {e}")
        print("🔄 Trying simple admin fallback...")
        try:
            from simple_admin import create_simple_admin
            simple_admin = create_simple_admin()
            simple_admin.init_app(app)
            print("✅ Simple admin fallback initialized")
        except Exception as e2:
            print(f"❌ Simple admin fallback also failed: {e2}")
            import traceback
            traceback.print_exc()

    @app.route('/')
    def home():
        return "This is the home page"

    @app.route('/admin-test')
    def admin_test():
        from admin import load_admin_credentials
        import os
        
        # Debug information
        admin_creds = load_admin_credentials()
        admin_count = len(admin_creds) if admin_creds else 0
        
        debug_info = f"""
        <h1>Admin Debug Information</h1>
        <p><strong>Admin Credentials Found:</strong> {admin_count} admin(s)</p>
        <p><strong>Admin Usernames:</strong> {list(admin_creds.keys()) if admin_creds else 'None'}</p>
        <p><strong>ADMIN_CREDENTIALS env var:</strong> {'Set' if os.getenv('ADMIN_CREDENTIALS') else 'Not Set'}</p>
        <p><strong>ADMIN_USERNAME env var:</strong> {os.getenv('ADMIN_USERNAME', 'Not Set')}</p>
        <hr>
        <p><a href='/admin/' target='_blank'>Go to Admin Panel</a></p>
        <p><a href='/admin/login/' target='_blank'>Go to Admin Login (Direct)</a></p>
        """
        return debug_info

    @app.route('/simple-admin-login', methods=['GET', 'POST'])
    def simple_admin_login():
        from flask import request, session
        from admin import load_admin_credentials
        from werkzeug.security import check_password_hash
        
        if request.method == 'POST':
            username = request.form.get('username')
            password = request.form.get('password')
            admin_creds = load_admin_credentials()
            
            if username in admin_creds and check_password_hash(admin_creds[username], password):
                session['admin_logged_in'] = True
                session['admin_username'] = username
                return f"<h1>✅ Login Successful!</h1><p>Welcome {username}!</p><p><a href='/admin/'>Go to Admin Panel</a></p>"
            else:
                return "<h1>❌ Login Failed!</h1><p>Invalid credentials</p><p><a href='/simple-admin-login'>Try Again</a></p>"
        
        return '''
        <h1>Simple Admin Login Test</h1>
        <form method="POST">
            <p>Username: <input type="text" name="username"></p>
            <p>Password: <input type="password" name="password"></p>
            <p><input type="submit" value="Login"></p>
        </form>
        '''

    @app.route('/routes')
    def list_routes():
        """List all registered routes for debugging"""
        routes = []
        for rule in app.url_map.iter_rules():
            routes.append(f"{rule.rule} -> {rule.endpoint} ({', '.join(rule.methods)})")
        
        routes_html = "<h1>All Registered Routes:</h1><ul>"
        for route in sorted(routes):
            routes_html += f"<li>{route}</li>"
        routes_html += "</ul>"
        
        return routes_html

    @app.route('/debug-admin')
    def debug_admin():
        """Debug admin access directly"""
        from flask import session
        from admin import load_admin_credentials
        
        admin_creds = load_admin_credentials()
        session_data = dict(session)
        
        debug_html = f"""
        <h1>Admin Debug Information</h1>
        <h3>Admin Credentials:</h3>
        <p>Found {len(admin_creds)} admin(s): {list(admin_creds.keys())}</p>
        
        <h3>Session Data:</h3>
        <p>{session_data}</p>
        
        <h3>Is Admin Accessible:</h3>
        <p>admin_logged_in: {session.get('admin_logged_in', False)}</p>
        
        <h3>Test Links:</h3>
        <ul>
            <li><a href="/admin/">Try Admin (should work after force login)</a></li>
            <li><a href="/force-admin-login">Force Admin Login</a></li>
            <li><a href="/simple-admin-login">Simple Login Test</a></li>
        </ul>
        """
        return debug_html

    @app.route('/minimal-admin')
    def minimal_admin():
        """Minimal admin interface that bypasses Flask-Admin"""
        from flask import session
        
        if not session.get('admin_logged_in'):
            return redirect('/simple-admin-login')
            
        return """
        <h1>✅ Minimal Admin Interface</h1>
        <p>If you can see this, authentication is working!</p>
        <p>Session: admin_logged_in = True</p>
        <ul>
            <li><a href="/admin/">Try Real Flask-Admin</a></li>
            <li><a href="/admin/logout/">Logout</a></li>
        </ul>
        """

    @app.route('/test-session')
    def test_session():
        """Test if Flask sessions are working"""
        from flask import session
        session['test'] = 'Session is working!'
        return f"<h1>Session Test</h1><p>Session data: {dict(session)}</p><p>Secret Key: {'Set' if app.secret_key else 'Not Set'}</p>"

    @app.route('/force-admin-login')
    def force_admin_login():
        """Force set admin session and redirect to admin"""
        from flask import session, redirect
        session['admin_logged_in'] = True
        session['admin_username'] = 'admin'
        return f"<h1>Session Set!</h1><p>Session: {dict(session)}</p><p><a href='/admin/'>Try Admin Now</a></p>"

    @app.route('/create-tables')
    def create_tables():
        """Create all database tables"""
        try:
            db.create_all()
            return "<h1>✅ Database Tables Created!</h1><p><a href='/admin/'>Go to Admin</a></p>"
        except Exception as e:
            return f"<h1>❌ Error Creating Tables</h1><p>{str(e)}</p>"

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
