from flask_admin import Admin
from flask_admin.contrib.sqla import ModelView
from flask import session, redirect, url_for
from models import db, User, Person, Event, Transaction

def create_simple_admin():
    """Create a simple admin without authentication for testing"""
    simple_admin = Admin(name='Simple Admin', template_mode='bootstrap4')
    
    class SimpleModelView(ModelView):
        def is_accessible(self):
            return True  # No authentication for testing
    
    simple_admin.add_view(SimpleModelView(User, db.session))
    simple_admin.add_view(SimpleModelView(Person, db.session))
    simple_admin.add_view(SimpleModelView(Event, db.session))
    simple_admin.add_view(SimpleModelView(Transaction, db.session))
    
    return simple_admin
