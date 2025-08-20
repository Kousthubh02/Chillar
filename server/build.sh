#!/usr/bin/env bash
set -o errexit

echo "Installing dependencies..."
pip install --upgrade pip
pip install -r requirements.txt

echo "Running database migrations..."
flask db upgrade

echo "Build completed successfully!"
