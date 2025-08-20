from flask import Flask
from config import Config
from extensions import db, bcrypt, jwt, mail
from flask_migrate import Migrate
from flask_cors import CORS
from routes.auth_routes import auth_bp
import admin
import os

# Initialize Flask App

app = Flask(__name__)
app.config.from_object(Config)
app.secret_key = 'super-secret-key-1234567890'  # Set a unique secret key for session management
CORS(app)

# Mail Configuration
app.config.update(
    MAIL_SERVER='smtp.gmail.com',
    MAIL_PORT=587,
    MAIL_USE_TLS=True,
    MAIL_USERNAME='kosu.studies@gmail.com',
    MAIL_PASSWORD='ncyv zrpn sxzr qfsr',
)

# Initialize Extensions
db.init_app(app)
bcrypt.init_app(app)
jwt.init_app(app)
mail.init_app(app)
migrate = Migrate(app, db)

# Register Blueprints

from routes.api_routes import api_bp
app.register_blueprint(auth_bp, url_prefix='/auth')
app.register_blueprint(api_bp, url_prefix='/api')
admin.init_app(app)

@app.route('/')
def home():
    return "This is the home page"

if __name__ == '__main__':
    port = int(os.environ.get("FLASK_RUN_PORT", 5000))
    app.run(host='0.0.0.0', debug=True, port=port)
