from pathlib import Path

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker


# Project root:
# C:\Users\LENOVO LEGION\OneDrive\Desktop\Project
BASE_DIR = Path(__file__).resolve().parents[3]

DATABASE_URL = f"sqlite:///{BASE_DIR / 'users.db'}"


engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False},
)


SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()