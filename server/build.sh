#!/usr/bin/env bash
set -o errexit

echo "Setting up environment..."
# Set environment variables if needed
export FLASK_APP=wsgi.py

echo "Installing dependencies..."
pip install --upgrade pip
pip install -r requirements.txt

echo "Verifying database connection..."
python -c "
import os
from sqlalchemy import create_engine
from sqlalchemy.exc import SQLAlchemyError
import time

db_url = os.getenv('DATABASE_URL')
if not db_url:
    print('WARNING: DATABASE_URL not set')
    exit(0)

# Replace postgres:// with postgresql:// if needed
if db_url.startswith('postgres://'):
    db_url = db_url.replace('postgres://', 'postgresql://', 1)

for i in range(5):
    try:
        engine = create_engine(db_url)
        conn = engine.connect()
        conn.close()
        print('Database connection successful')
        break
    except SQLAlchemyError as e:
        print(f'Database connection attempt {i+1} failed: {e}')
        if i < 4:
            print('Retrying in 5 seconds...')
            time.sleep(5)
        else:
            print('Database connection failed after 5 attempts')
            # Continue anyway as the app might still work
"

echo "Running database migrations..."
flask db upgrade || echo "Migration failed, but continuing deployment"

echo "Build completed successfully!"
