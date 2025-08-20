from flask_restx import Api, Resource, fields, Namespace
from flask import url_for

# Initialize API
authorizations = {
    'Bearer Auth': {
        'type': 'apiKey',
        'in': 'header',
        'name': 'Authorization',
        'description': 'Add a JWT token to the header with format: Bearer &lt;token&gt;'
    },
}

api = Api(
    title='Chillar API',
    version='1.0',
    description='A financial tracking API for managing transactions and events',
    authorizations=authorizations,
    security='Bearer Auth'
)

# Create namespaces
auth_ns = Namespace('auth', description='Authentication operations')
transactions_ns = Namespace('api/transactions', description='Transaction operations')
events_ns = Namespace('api/events', description='Event operations')
people_ns = Namespace('api/people', description='People operations')

# Add namespaces to API
api.add_namespace(auth_ns)
api.add_namespace(transactions_ns)
api.add_namespace(events_ns)
api.add_namespace(people_ns)

# Model definitions
user_model = api.model('User', {
    'username': fields.String(required=True, description='User username'),
    'email': fields.String(required=True, description='User email'),
    'mPin': fields.String(required=True, description='4-digit MPIN')
})

login_model = api.model('Login', {
    'email': fields.String(required=True, description='User email'),
    'mPin': fields.String(required=True, description='4-digit MPIN')
})

otp_request_model = api.model('OTPRequest', {
    'email': fields.String(required=True, description='User email')
})

otp_verify_model = api.model('OTPVerify', {
    'email': fields.String(required=True, description='User email'),
    'otp': fields.String(required=True, description='6-digit OTP')
})

reset_mpin_model = api.model('ResetMPIN', {
    'email': fields.String(required=True, description='User email'),
    'new_mPin': fields.String(required=True, description='New 4-digit MPIN')
})

transaction_model = api.model('Transaction', {
    'transaction_id': fields.Integer(description='Transaction ID'),
    'person_id': fields.Integer(required=True, description='Person ID'),
    'event_id': fields.Integer(description='Event ID'),
    'amount': fields.Float(required=True, description='Transaction amount'),
    'paid_amount': fields.Float(description='Amount paid so far'),
    'reason': fields.String(required=True, description='Transaction reason'),
    'due_date': fields.String(required=True, description='Due date (DD-MM-YYYY)'),
    'status': fields.Boolean(description='Payment status'),
    'created_date': fields.String(description='Creation date (DD-MM-YYYY)')
})

person_model = api.model('Person', {
    'person_id': fields.Integer(description='Person ID'),
    'person_name': fields.String(required=True, description='Person name')
})

event_model = api.model('Event', {
    'event_id': fields.Integer(description='Event ID'),
    'event_name': fields.String(required=True, description='Event name')
})

# Response models
auth_response = api.model('AuthResponse', {
    'msg': fields.String(description='Response message'),
    'access_token': fields.String(description='JWT access token'),
    'refresh_token': fields.String(description='JWT refresh token')
})
