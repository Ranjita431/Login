import uuid

from sqlalchemy import Boolean, Column, String, Uuid

from app.db.base import Base


class User(Base):
    __tablename__ = "users"

    id = Column(
        Uuid(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        index=True,
    )

    name = Column(String, nullable=False)

    email = Column(
        String,
        unique=True,
        nullable=False,
        index=True,
    )

    password = Column(String, nullable=True)

    is_email_verified = Column(
        Boolean,
        default=False,
        nullable=False,
    )