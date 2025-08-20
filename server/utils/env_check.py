import os

def check_environment():
    """Check if all required environment variables are set"""
    required_vars = [
        'DATABASE_URL',
        'JWT_SECRET_KEY',
        'MAIL_USERNAME',
        'MAIL_PASSWORD'
    ]
    
    missing = []
    for var in required_vars:
        if not os.getenv(var):
            missing.append(var)
    
    if missing:
        print(f"WARNING: Missing environment variables: {', '.join(missing)}")
        return False
    
    return True

if __name__ == "__main__":
    check_environment()
