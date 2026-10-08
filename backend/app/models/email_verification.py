from datetime import datetime

from sqlalchemy import Column, DateTime, Integer, String

from app.db.base import Base


class EmailVerification(Base):
    __tablename__ = "email_verifications"

    id = Column(Integer, primary_key=True, index=True)

    email = Column(String, nullable=False, index=True)

    token = Column(String, nullable=False)

    expires_at = Column(DateTime, nullable=False)

    created_at = Column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )