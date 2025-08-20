import os
import sys

def check_deployment_readiness():
    """
    Checks if all necessary conditions for deployment are met.
    Returns (bool, str) tuple: (is_ready, message)
    """
    checks = []
    
    # Check environment variables
    required_vars = [
        'DATABASE_URL',
        'JWT_SECRET_KEY',
        'MAIL_USERNAME',
        'MAIL_PASSWORD',
        'SECRET_KEY'
    ]
    
    missing_vars = [var for var in required_vars if not os.getenv(var)]
    if missing_vars:
        checks.append(f"Missing environment variables: {', '.join(missing_vars)}")
    
    # Check database URL format
    db_url = os.getenv('DATABASE_URL', '')
    if db_url.startswith('sqlite:'):
        checks.append("WARNING: Using SQLite in production is not recommended")
    
    # Check debug mode
    if os.getenv('FLASK_ENV') == 'development' or os.getenv('FLASK_DEBUG') == '1':
        checks.append("WARNING: Debug mode is enabled")
    
    # Check mail configuration
    mail_config = {
        'MAIL_SERVER': os.getenv('MAIL_SERVER'),
        'MAIL_PORT': os.getenv('MAIL_PORT'),
        'MAIL_USE_TLS': os.getenv('MAIL_USE_TLS'),
        'MAIL_USERNAME': os.getenv('MAIL_USERNAME'),
        'MAIL_PASSWORD': os.getenv('MAIL_PASSWORD')
    }
    if not all(mail_config.values()):
        checks.append("Mail configuration is incomplete")
    
    # Return results
    if not checks:
        return True, "All deployment checks passed!"
    else:
        return False, "\n".join(checks)

if __name__ == '__main__':
    is_ready, message = check_deployment_readiness()
    print("\nDeployment Readiness Check:")
    print("-" * 50)
    print(message)
    print("-" * 50)
    sys.exit(0 if is_ready else 1)
