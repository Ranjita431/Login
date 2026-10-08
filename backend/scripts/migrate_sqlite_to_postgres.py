import uuid

from sqlalchemy import create_engine, text

from app.db.session import engine
from app.models import User


SQLITE_URL = "sqlite:///../users.db"

sqlite_engine = create_engine(SQLITE_URL)


def migrate_users():
    with sqlite_engine.connect() as sqlite_db:
        users = sqlite_db.execute(
            text(
                """
                SELECT id, name, email, password
                FROM users
                ORDER BY id
                """
            )
        ).mappings().all()

    migrated = 0

    with engine.begin() as postgres_db:
        for old_user in users:
            existing = postgres_db.execute(
                text(
                    """
                    SELECT id
                    FROM users
                    WHERE email = :email
                    """
                ),
                {"email": old_user["email"]},
            ).first()

            if existing:
                print(f"Skipping existing user: {old_user['email']}")
                continue

            new_id = uuid.uuid4()

            postgres_db.execute(
                text(
                    """
                    INSERT INTO users
                        (id, name, email, password, is_email_verified)
                    VALUES
                        (:id, :name, :email, :password, :is_email_verified)
                    """
                ),
                {
                    "id": new_id,
                    "name": old_user["name"],
                    "email": old_user["email"],
                    "password": old_user["password"],
                    "is_email_verified": False,
                },
            )

            migrated += 1

            print(
                f"Migrated: {old_user['email']} -> {new_id}"
            )

    print(f"\nMigration complete. Users migrated: {migrated}")


if __name__ == "__main__":
    migrate_users()