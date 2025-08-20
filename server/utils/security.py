from functools import wraps
from flask import request, jsonify
from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity

def admin_required():
    def wrapper(fn):
        @wraps(fn)
        def decorator(*args, **kwargs):
            verify_jwt_in_request()
            claims = get_jwt_identity()
            if not claims.get('is_admin'):
                return jsonify(msg="Admins only!"), 403
            return fn(*args, **kwargs)
        return decorator
    return wrapper

def validate_json(schema_class):
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            if not request.is_json:
                return jsonify({"msg": "Missing JSON in request"}), 400
            
            schema = schema_class()
            errors = schema.validate(request.json)
            if errors:
                return jsonify({"msg": "Invalid input", "errors": errors}), 400
            
            return f(*args, **kwargs)
        return decorated_function
    return decorator
