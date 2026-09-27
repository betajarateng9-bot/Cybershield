"""
Create an admin user for CyberShield
Run this in your Render shell or locally
"""

import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal, engine, Base
from app import models, security

Base.metadata.create_all(bind=engine)

db = SessionLocal()

# Admin credentials
ADMIN_EMAIL = "betajarateng9@gmail.com"
ADMIN_PASSWORD = "0758411418@Bj"

# Check if admin already exists
existing = db.query(models.User).filter(models.User.email == ADMIN_EMAIL).first()

if existing:
    print("=" * 50)
    print("Admin user already exists!")
    print("=" * 50)
    print(f"Email: {existing.email}")
    print(f"Role: {existing.role}")
    print(f"Active: {existing.is_active}")
    print("=" * 50)
else:
    # Create admin user
    admin = models.User(
        email=ADMIN_EMAIL,
        hashed_password=security.hash_password(ADMIN_PASSWORD),
        role="admin",
        is_active=True
    )

    db.add(admin)
    db.commit()
    db.refresh(admin)

    print("=" * 50)
    print("Admin user created successfully!")
    print("=" * 50)
    print(f"Email: {ADMIN_EMAIL}")
    print(f"Password: {ADMIN_PASSWORD}")
    print(f"Role: {admin.role}")
    print("=" * 50)

db.close()
