import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', 'default_secret_key')  # Default value
    SQLALCHEMY_DATABASE_URI = str(os.getenv('SQLALCHEMY_DATABASE_URI', 'sqlite:///database.db'))  # Ensure string
    SQLALCHEMY_TRACK_MODIFICATIONS = False
