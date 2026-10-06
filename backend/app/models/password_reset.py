from datetime import datetime

from sqlalchemy import Column, DateTime, Integer, String

from app.db.base import Base


class PasswordReset(Base):
    __tablename__ = "password_resets"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, nullable=False)
    token = Column(String, nullable=False)
    expires_at = Column(DateTime, nullable=False)