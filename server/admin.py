from flask_admin import Admin
from flask_admin.contrib.sqla import ModelView
from models import db, User

# Initialize Flask-Admin
admin = Admin(name="Admin Panel", template_mode="bootstrap4")

# Create a User Admin View
class UserAdmin(ModelView):
    column_list = ["id", "username", "email"]  # Show these columns
    form_columns = ["username", "email", "mPin_hash"]  # Allow editing these fields
    can_create = True  # Allow adding users
    can_edit = True  # Allow editing users
    can_delete = True  # Allow deleting users

def init_app(app):
    admin.init_app(app)  # Attach Flask-Admin to the app
    admin.add_view(UserAdmin(User, db.session))  # Register the User model correctly
