from datetime import datetime, timedelta
from flask import Blueprint, request, jsonify
from flask_jwt_extended import (
    create_access_token, 
    create_refresh_token,
    jwt_required,
    get_jwt_identity
)
from models import User, db
from extensions import mail, limiter
from flask_mail import Message
from utils.schemas import LoginSchema, OtpRequestSchema, OtpVerifySchema
from utils.security import validate_json
import random

auth_bp = Blueprint('auth', __name__)

# Signup Route
@auth_bp.route('/signup', methods=['POST'])
def signup():
    data = request.json
    username = data.get('username')
    email = data.get('email')
    mPin = data.get('mPin')

    if User.query.filter_by(email=email).first():
        return jsonify({'msg': 'An account with this email already exists'}), 409

    new_user = User(username=username, email=email)
    new_user.set_mPin(mPin)
    db.session.add(new_user)
    db.session.commit()

    return jsonify({'msg': 'Account created successfully'}), 201

# Login Route
@auth_bp.route('/login', methods=['POST'])
@limiter.limit("5 per minute")  # Limit login attempts
def login():
    data = request.json
    email = data.get('email')
    mPin = data.get('mPin')

    user = User.query.filter_by(email=email).first()
    if not user or not user.check_mPin(mPin):
        return jsonify({'msg': 'Invalid email or PIN'}), 401

    access_token = create_access_token(identity=user.id)
    refresh_token = create_refresh_token(identity=user.id)

    return jsonify({
        'msg': 'Login successful',
        'access_token': access_token,
        'refresh_token': refresh_token
    }), 200


# 📩 Request OTP
@auth_bp.route('/request-otp', methods=['POST'])
@limiter.limit("3 per hour")  # Limit OTP requests
def request_otp():
    data = request.json
    email = data.get('email')

    if not email:
        return jsonify({'msg': 'Email is required'}), 400

    user = User.query.filter_by(email=email).first()
    if not user:
        return jsonify({'msg': 'No user found with this email'}), 404

    otp = '{:06d}'.format(random.randint(0, 999999))
    user.otp = otp
    user.otp_expiry = datetime.utcnow() + timedelta(minutes=10)
    db.session.commit()

    msg = Message(
        subject='Your OTP for MPIN Reset',
        sender='kosu.studies@gmail.com',
        recipients=[email],
        body=f'Your OTP is: {otp}. It will expire in 10 minutes.'
    )
    mail.send(msg)

    return jsonify({'msg': 'OTP sent to email'}), 200


# ✅ Verify OTP
@auth_bp.route('/verify-otp', methods=['POST'])
def verify_otp():
    data = request.json
    email = data.get('email')
    otp = data.get('otp')

    if not email or not otp:
        return jsonify({'msg': 'Email and OTP are required'}), 400

    user = User.query.filter_by(email=email).first()
    if not user:
        return jsonify({'msg': 'User not found'}), 404

    if user.otp != otp:
        return jsonify({'msg': 'Invalid OTP'}), 400

    if not user.otp_expiry or datetime.utcnow() > user.otp_expiry:
        return jsonify({'msg': 'OTP has expired'}), 400

    user.otp_verified = True
    db.session.commit()

    return jsonify({'msg': 'OTP verified'}), 200



# 🔐 Reset MPIN
@auth_bp.route('/reset-mpin', methods=['POST'])
def reset_mpin():
    data = request.json
    email = data.get('email')
    new_mpin = data.get('new_mPin')

    if not email or not new_mpin:
        return jsonify({'msg': 'Email and new MPIN are required'}), 400

    user = User.query.filter_by(email=email).first()
    if not user:
        return jsonify({'msg': 'User not found'}), 404

    if not user.otp_verified:
        return jsonify({'msg': 'OTP not verified yet'}), 400

    user.set_mPin(new_mpin)
    user.otp = None
    user.otp_expiry = None
    user.otp_verified = False  # Reset the verification state
    db.session.commit()

    return jsonify({'msg': 'MPIN has been reset successfully'}), 200


