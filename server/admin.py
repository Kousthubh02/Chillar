from flask import session, request, redirect, url_for, flash, render_template_string
from flask_admin import Admin, AdminIndexView, expose
from flask_admin.contrib.sqla import ModelView
from werkzeug.security import check_password_hash
from models import db, User
import os
import json

def load_admin_credentials():
    """Load admin credentials - hardcoded for now"""
    from werkzeug.security import generate_password_hash
    
    # Hardcoded admin credentials
    return {
        "kosu": generate_password_hash("1402")
    }

# Simple Admin Index View without Flask-Admin authentication
class SimpleAdminIndexView(AdminIndexView):
    
    @expose('/')
    def index(self):
        # More robust session check
        try:
            if not session.get('admin_logged_in', False):
                return redirect('/admin/login/')
        except Exception as e:
            # If session check fails, redirect to login but don't crash
            print(f"Session check error: {e}")
            return redirect('/admin/login/')
        
        # Get the default Flask-Admin index page
        response = super(SimpleAdminIndexView, self).index()
        
        # Add logout button via JavaScript injection
        logout_script = '''
        <script>
        document.addEventListener('DOMContentLoaded', function() {
            // Find the navbar
            var navbar = document.querySelector('.navbar') || document.querySelector('nav');
            if (navbar) {
                // Create logout button
                var logoutBtn = document.createElement('div');
                logoutBtn.style.cssText = 'position: absolute; top: 10px; right: 10px;';
                logoutBtn.innerHTML = '<a href="/admin/logout/" class="btn btn-danger btn-sm">Logout</a>';
                navbar.appendChild(logoutBtn);
            } else {
                // Fallback - add to body
                var logoutBtn = document.createElement('div');
                logoutBtn.style.cssText = 'position: fixed; top: 10px; right: 10px; z-index: 9999;';
                logoutBtn.innerHTML = '<a href="/admin/logout/" class="btn btn-danger btn-sm">Logout</a>';
                document.body.appendChild(logoutBtn);
            }
            
            // Auto-logout when browser tab/window is closed (not on navigation)
            var isNavigating = false;
            
            // Track navigation events
            document.addEventListener('click', function(e) {
                var target = e.target;
                if (target.tagName === 'A' || target.closest('a')) {
                    isNavigating = true;
                    // Reset navigation flag after a short delay
                    setTimeout(function() {
                        isNavigating = false;
                    }, 1000);
                }
            });
            
            // Only logout on actual browser close, not navigation
            window.addEventListener('beforeunload', function(e) {
                // Only send logout if it's not a navigation within the admin panel
                if (!isNavigating) {
                    navigator.sendBeacon('/admin/logout/');
                }
            });
            
            // Remove the visibility change logout - too aggressive
            // document.addEventListener('visibilitychange', function() {
            //     if (document.hidden) {
            //         setTimeout(function() {
            //             if (document.hidden) {
            //                 navigator.sendBeacon('/admin/logout/');
            //             }
            //         }, 300000); // 5 minutes of inactivity
            //     }
            // });
        });
        </script>
        </body>
        '''
        
        # Inject the script before closing body tag
        if isinstance(response, str):
            response = response.replace('</body>', logout_script)
        else:
            response.data = response.data.decode('utf-8').replace('</body>', logout_script).encode('utf-8')
        
        return response
    
    @expose('/login/', methods=('GET', 'POST'))
    def login_view(self):
        # Login route should always be accessible
        admin_credentials = load_admin_credentials()
        
        # Check if admin credentials are configured
        if not admin_credentials:
            return '<h2>Admin Setup Required</h2><p>Run <code>python create_admin.py</code> to set up admin credentials.</p>'
        
        if request.method == 'POST':
            username = request.form.get('username')
            password = request.form.get('password')
            
            if username in admin_credentials and check_password_hash(admin_credentials[username], password):
                session['admin_logged_in'] = True
                session['admin_username'] = username
                # Make session expire when browser closes
                session.permanent = False
                flash(f'Successfully logged in as {username}!', 'success')
                return redirect('/admin/')
            else:
                flash('Invalid credentials. Please try again.', 'error')
        
        return '''
        <!DOCTYPE html>
        <html>
        <head>
            <title>Admin Login</title>
            <style>
                body { 
                    font-family: Arial, sans-serif;
                    margin: 0;
                    padding: 0;
                    min-height: 100vh;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .login-box {
                    border: 1px solid #ddd;
                    padding: 30px;
                    border-radius: 5px;
                    width: 300px;
                }
                h2 {
                    text-align: center;
                    margin-bottom: 20px;
                }
                input[type="text"], input[type="password"] {
                    width: 100%;
                    padding: 10px;
                    margin: 5px 0 15px 0;
                    border: 1px solid #ddd;
                    border-radius: 3px;
                    box-sizing: border-box;
                }
                input[type="submit"] {
                    width: 100%;
                    background: #007bff;
                    color: white;
                    padding: 10px;
                    border: none;
                    border-radius: 3px;
                    cursor: pointer;
                }
                input[type="submit"]:hover {
                    background: #0056b3;
                }
            </style>
        </head>
        <body>
            <div class="login-box">
                <form method="POST">
                    <h2>Admin Login</h2>
                    <p>Username:</p>
                    <input type="text" name="username" required>
                    <p>Password:</p>
                    <input type="password" name="password" required>
                    <input type="submit" value="Login">
                </form>
            </div>
        </body>
        </html>
        '''
    
    @expose('/logout/', methods=['GET', 'POST'])
    def logout_view(self):
        session.pop('admin_logged_in', None)
        session.pop('admin_username', None)
        
        # Handle beacon requests (from beforeunload event)
        if request.method == 'POST' or 'beacon' in request.headers.get('Content-Type', ''):
            return '', 204  # No content response for beacon
        
        return '''
        <h2>Logged Out</h2>
        <p>You have been successfully logged out.</p>
        <p><a href="/admin/login/">Login Again</a></p>
        '''

# Simple Model View without Flask-Admin authentication
class SimpleModelView(ModelView):
    def is_accessible(self):
        # More robust session check - only redirect if truly not logged in
        return session.get('admin_logged_in', False)
    
    def inaccessible_callback(self, name, **kwargs):
        # Custom callback when access is denied
        return redirect('/admin/login/')
    
    def _handle_view(self, name, **kwargs):
        # Additional safety check with better error handling
        try:
            if not session.get('admin_logged_in', False):
                return redirect('/admin/login/')
            return super(SimpleModelView, self)._handle_view(name, **kwargs)
        except Exception as e:
            # If there's any error, don't logout - just log and continue
            print(f"Warning: Admin view error (not logging out): {e}")
            return super(SimpleModelView, self)._handle_view(name, **kwargs)

# Initialize Flask-Admin with simple index view
admin = Admin(name="Chillar Admin Panel", template_mode="bootstrap4", index_view=SimpleAdminIndexView(name='Home', endpoint='admin'))

# Create a User Admin View
class UserAdmin(SimpleModelView):
    column_list = ["id", "username", "email"]  # Show these columns
    form_columns = ["username", "email"]  # Only allow editing username and email
    can_create = True  # Allow adding users
    can_edit = True  # Allow editing users
    can_delete = True  # Allow deleting users

def init_app(app):
    try:
        from models import Person, Event, Transaction
        print("🔍 Initializing Flask-Admin...")
        
        # Initialize admin with app
        admin.init_app(app)
        print("✅ Admin initialized with app")
        
        # Add views
        admin.add_view(UserAdmin(User, db.session))
        print("✅ UserAdmin view added")
        
        admin.add_view(SimpleModelView(Person, db.session))
        print("✅ Person view added")
        
        admin.add_view(SimpleModelView(Event, db.session))
        print("✅ Event view added")

        # Custom Transaction Admin View with dropdowns for Person and Event
        try:
            from wtforms_sqlalchemy.fields import QuerySelectField
            
            class TransactionAdmin(SimpleModelView):
                form_columns = [
                    'person', 'event', 'amount', 'paid_amount', 'reason', 'due_date', 'status', 'created_date'
                ]
                column_list = [
                    'transaction_id', 'person', 'event', 'amount', 'paid_amount', 'reason', 'due_date', 'status', 'created_date'
                ]
                form_overrides = {
                    'person': QuerySelectField,
                    'event': QuerySelectField,
                }
                form_args = {
                    'person': {
                        'query_factory': lambda: db.session.query(Person),
                        'allow_blank': False,
                        'get_label': 'person_name'
                    },
                    'event': {
                        'query_factory': lambda: db.session.query(Event),
                        'allow_blank': True,
                        'get_label': 'event_name'
                    }
                }
            admin.add_view(TransactionAdmin(Transaction, db.session))
            print("✅ TransactionAdmin view added")
        except ImportError:
            # Fallback if wtforms_sqlalchemy is not available
            admin.add_view(SimpleModelView(Transaction, db.session))
            print("✅ Transaction view added (fallback)")
            
        print("🎉 All admin views registered successfully!")
        
    except Exception as e:
        print(f"❌ Error in admin initialization: {e}")
        import traceback
        traceback.print_exc()
