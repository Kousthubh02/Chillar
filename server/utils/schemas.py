from marshmallow import Schema, fields, validate

class TransactionSchema(Schema):
    person_id = fields.Integer(required=True)
    event_id = fields.Integer(allow_none=True)
    amount = fields.Float(required=True, validate=validate.Range(min=0.01))
    reason = fields.String(required=True, validate=validate.Length(min=1, max=500))
    due_date = fields.Date(required=True)
    status = fields.Boolean(missing=False)
    paid_amount = fields.Float(missing=0.0, validate=validate.Range(min=0))

class PersonSchema(Schema):
    person_name = fields.String(required=True, validate=validate.Length(min=1, max=50))

class EventSchema(Schema):
    event_name = fields.String(required=True, validate=validate.Length(min=1, max=50))

class LoginSchema(Schema):
    email = fields.Email(required=True)
    mPin = fields.String(required=True, validate=validate.Length(equal=4))

class OtpRequestSchema(Schema):
    email = fields.Email(required=True)

class OtpVerifySchema(Schema):
    email = fields.Email(required=True)
    otp = fields.String(required=True, validate=validate.Length(equal=6))
