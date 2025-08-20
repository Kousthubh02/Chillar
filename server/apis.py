from flask_restx import Api, Resource, fields, Namespace
from flask import Blueprint

# Create Blueprint for APIs
api_bp = Blueprint('api', __name__)
api = Api(
    api_bp,
    version='1.0',
    title='Chillar API',
    description='A financial tracking API for managing transactions and events',
    doc='/docs',
    authorizations={
        'Bearer Auth': {
            'type': 'apiKey',
            'in': 'header',
            'name': 'Authorization',
            'description': 'Add a JWT token to the header: Bearer &lt;token&gt;'
        },
    },
    security='Bearer Auth'
)

# Create namespaces
auth = api.namespace('auth', description='Authentication operations')
transactions = api.namespace('transactions', description='Transaction operations')
events = api.namespace('events', description='Event operations')
people = api.namespace('people', description='People operations')

# Request Models
user_model = api.model('User', {
    'username': fields.String(required=True, description='Username'),
    'email': fields.String(required=True, description='Email address'),
    'mPin': fields.String(required=True, description='4-digit MPIN')
})

login_model = api.model('Login', {
    'email': fields.String(required=True, description='Email address'),
    'mPin': fields.String(required=True, description='4-digit MPIN')
})

otp_request_model = api.model('OTPRequest', {
    'email': fields.String(required=True, description='Email address')
})

otp_verify_model = api.model('OTPVerify', {
    'email': fields.String(required=True, description='Email address'),
    'otp': fields.String(required=True, description='6-digit OTP')
})

reset_mpin_model = api.model('ResetMPIN', {
    'email': fields.String(required=True, description='Email address'),
    'new_mPin': fields.String(required=True, description='New 4-digit MPIN')
})

transaction_model = api.model('Transaction', {
    'person_id': fields.Integer(required=True, description='Person ID'),
    'event_id': fields.Integer(description='Event ID'),
    'amount': fields.Float(required=True, description='Transaction amount'),
    'reason': fields.String(required=True, description='Transaction reason'),
    'due_date': fields.String(required=True, description='Due date (DD-MM-YYYY)'),
    'status': fields.Boolean(default=False, description='Payment status'),
    'paid_amount': fields.Float(default=0.0, description='Amount paid')
})

transaction_response = api.model('TransactionResponse', {
    'transaction_id': fields.Integer(description='Transaction ID'),
    'person_id': fields.Integer(description='Person ID'),
    'person_name': fields.String(description='Person name'),
    'event_id': fields.Integer(description='Event ID'),
    'event_name': fields.String(description='Event name'),
    'amount': fields.Float(description='Transaction amount'),
    'paid_amount': fields.Float(description='Amount paid'),
    'reason': fields.String(description='Transaction reason'),
    'due_date': fields.String(description='Due date (DD-MM-YYYY)'),
    'status': fields.Boolean(description='Payment status'),
    'created_date': fields.String(description='Creation date (DD-MM-YYYY)')
})

person_model = api.model('Person', {
    'person_name': fields.String(required=True, description='Person name')
})

event_model = api.model('Event', {
    'event_name': fields.String(required=True, description='Event name')
})

# Response Models
auth_response = api.model('AuthResponse', {
    'msg': fields.String(description='Response message'),
    'access_token': fields.String(description='JWT access token'),
    'refresh_token': fields.String(description='JWT refresh token')
})

message_response = api.model('MessageResponse', {
    'msg': fields.String(description='Response message')
})

error_response = api.model('ErrorResponse', {
    'msg': fields.String(description='Error message')
})
