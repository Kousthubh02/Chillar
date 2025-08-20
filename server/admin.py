from flask_admin import Admin
from flask_admin.contrib.sqla import ModelView
from models import db, User

# Initialize Flask-Admin
admin = Admin(name="Admin Panel", template_mode="bootstrap4")

# Create a User Admin View
class UserAdmin(ModelView):
    column_list = ["id", "username", "email"]  # Show these columns
    form_columns = ["username", "email"]  # Only allow editing username and email
    can_create = True  # Allow adding users
    can_edit = True  # Allow editing users
    can_delete = True  # Allow deleting users

def init_app(app):
    from models import Person, Event, Transaction
    admin.init_app(app)  # Attach Flask-Admin to the app
    admin.add_view(UserAdmin(User, db.session))  # Register the User model correctly
    admin.add_view(ModelView(Person, db.session))
    admin.add_view(ModelView(Event, db.session))

    # Custom Transaction Admin View with dropdowns for Person and Event
    from wtforms_sqlalchemy.fields import QuerySelectField
    class TransactionAdmin(ModelView):
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
