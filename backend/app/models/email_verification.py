import uuid
from datetime import datetime
from sqlalchemy import Column, DateTime, Index, Integer, String, Uuid, text
from app.db.base import Base


class EmailVerification(Base):
    __tablename__ = "email_verifications"

    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    legacy_id = Column(Integer, nullable=False, server_default=text("nextval('email_verifications_id_seq'::regclass)"))
    email = Column(String, nullable=False, index=True)
    token = Column(String, nullable=False)
    expires_at = Column(DateTime, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    __table_args__ = (Index("ix_email_verifications_id", "legacy_id"),)
