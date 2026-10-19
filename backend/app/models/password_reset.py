import uuid
from datetime import datetime
from sqlalchemy import Column, DateTime, Index, Integer, String, Uuid, text
from app.db.base import Base


class PasswordReset(Base):
    __tablename__ = "password_resets"

    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    legacy_id = Column(Integer, nullable=False, server_default=text("nextval('password_resets_id_seq'::regclass)"))
    email = Column(String, nullable=False)
    token = Column(String, nullable=False)
    expires_at = Column(DateTime, nullable=False)
