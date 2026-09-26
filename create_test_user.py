from app.database.session import SessionLocal
from app.database.models import User
from app.security.password import PasswordService


EMAIL = "test@example.com"
PASSWORD = "TestPassword123!"


def main():
    db = SessionLocal()

    try:
        existing = (
            db.query(User)
            .filter(User.email == EMAIL)
            .first()
        )

        if existing:
            print("User already exists.")
            print("ID:", existing.id)
            print("Email:", existing.email)
            return

        password_hash = PasswordService.hash(
            PASSWORD
        )

        user = User(
            email=EMAIL,
            password_hash=password_hash,
            is_active=True,
        )

        db.add(user)
        db.commit()
        db.refresh(user)

        print("TEST USER CREATED")
        print("ID:", user.id)
        print("Email:", user.email)
        print("Active:", user.is_active)

    finally:
        db.close()


if __name__ == "__main__":
    main()