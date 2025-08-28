#!/usr/bin/env python3
"""
Script to create admin credentials for the Flask-Admin panel.
This sets up environment variables for admin authentication with support for multiple admins.
"""

import os
import json
from werkzeug.security import generate_password_hash

def load_admins():
    """Load existing admin credentials from .env file"""
    env_path = ".env"
    admins = {}
    
    if os.path.exists(env_path):
        with open(env_path, 'r') as f:
            content = f.read()
            for line in content.split('\n'):
                if line.startswith('ADMIN_CREDENTIALS='):
                    try:
                        admins_json = line.split('=', 1)[1]
                        admins = json.loads(admins_json)
                    except (json.JSONDecodeError, IndexError):
                        # Fallback to single admin format
                        pass
                elif line.startswith('ADMIN_USERNAME=') and not admins:
                    # Legacy single admin support
                    username = line.split('=', 1)[1]
                    # Look for corresponding password hash
                    for pwd_line in content.split('\n'):
                        if pwd_line.startswith('ADMIN_PASSWORD_HASH='):
                            password_hash = pwd_line.split('=', 1)[1]
                            admins[username] = password_hash
                            break
    
    return admins

def save_admins(admins):
    """Save admin credentials to .env file"""
    env_path = ".env"
    env_content = ""
    
    if os.path.exists(env_path):
        with open(env_path, 'r') as f:
            env_content = f.read()
    
    # Remove old admin entries
    lines = []
    for line in env_content.split('\n'):
        if not (line.startswith('ADMIN_USERNAME=') or 
                line.startswith('ADMIN_PASSWORD_HASH=') or 
                line.startswith('ADMIN_CREDENTIALS=')):
            lines.append(line)
    
    # Add new admin credentials as JSON
    admins_json = json.dumps(admins)
    lines.append(f'ADMIN_CREDENTIALS={admins_json}')
    
    # Write back to .env file
    with open(env_path, 'w') as f:
        f.write('\n'.join(lines))

def create_admin_env():
    """Create or update admin credentials"""
    print("=== Chillar Admin Setup ===")
    
    # Load existing admins
    existing_admins = load_admins()
    
    if existing_admins:
        print("� Existing admin users:")
        for username in existing_admins.keys():
            print(f"   • {username}")
        print()
    
    # Get new admin details
    while True:
        username = input("Enter admin name: ").strip()
        if not username:
            print("❌ Admin name cannot be empty!")
            continue
        
        if username in existing_admins:
            print(f"⚠️  Admin '{username}' already exists!")
            choice = input("Do you want to (u)pdate password, (c)hoose different name, or (q)uit? [u/c/q]: ").strip().lower()
            
            if choice == 'q' or choice == 'quit':
                print("❌ Setup cancelled.")
                return
            elif choice == 'c' or choice == 'choose':
                continue
            elif choice == 'u' or choice == 'update':
                print(f"🔄 Updating password for admin '{username}'...")
                break
            else:
                print("Invalid choice. Please try again.")
                continue
        else:
            print(f"✅ Creating new admin '{username}'...")
            break
    
    # Get password
    password = input("Enter admin password: ").strip()
    if not password:
        print("❌ Password cannot be empty!")
        return
    
    # Confirm password
    confirm_password = input("Confirm admin password: ").strip()
    if password != confirm_password:
        print("❌ Passwords do not match!")
        return
    
    # Generate password hash and save
    password_hash = generate_password_hash(password)
    existing_admins[username] = password_hash
    save_admins(existing_admins)
    
    print(f"\n✅ Admin '{username}' saved successfully!")
    print(f"Total admins: {len(existing_admins)}")
    print("\n🔐 Admin panel will be available at: http://localhost:5000/admin")
    print("⚠️  Make sure to restart your Flask server to load new credentials!")

def list_admins():
    """List all admin users"""
    admins = load_admins()
    
    if not admins:
        print("❌ No admin credentials found.")
        return
    
    print("📋 Configured admin users:")
    for i, username in enumerate(admins.keys(), 1):
        print(f"   {i}. {username}")
    print(f"\nTotal: {len(admins)} admin(s)")

def remove_admin():
    """Remove an admin user"""
    admins = load_admins()
    
    if not admins:
        print("❌ No admin credentials found.")
        return
    
    print("📋 Current admin users:")
    for i, username in enumerate(admins.keys(), 1):
        print(f"   {i}. {username}")
    
    username_to_remove = input("\nEnter admin name to remove: ").strip()
    
    if username_to_remove not in admins:
        print(f"❌ Admin '{username_to_remove}' not found.")
        return
    
    if len(admins) == 1:
        print("⚠️  Warning: This is the last admin user!")
        confirm = input("Are you sure you want to remove the last admin? [y/N]: ").strip().lower()
        if confirm != 'y' and confirm != 'yes':
            print("❌ Removal cancelled.")
            return
    
    del admins[username_to_remove]
    save_admins(admins)
    
    print(f"✅ Admin '{username_to_remove}' removed successfully!")
    print(f"Remaining admins: {len(admins)}")

if __name__ == "__main__":
    import sys
    
    if len(sys.argv) > 1:
        command = sys.argv[1].lower()
        if command == "list":
            list_admins()
        elif command == "remove":
            remove_admin()
        elif command == "check":
            list_admins()  # Same as list for backward compatibility
        else:
            print("Usage: python create_admin.py [list|remove|check]")
    else:
        create_admin_env()
