import uuid
from datetime import datetime
from sqlalchemy import Column, DateTime, ForeignKey, Index, Integer, String, Uuid, text
from app.db.base import Base


class RefreshToken(Base):
    __tablename__ = "refresh_tokens"

    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    legacy_id = Column(Integer, nullable=False, server_default=text("nextval('refresh_tokens_id_seq'::regclass)"))
    user_id = Column(Uuid(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    token_id = Column(String(64), unique=True, nullable=False, index=True)
    expires_at = Column(DateTime, nullable=False)
    revoked_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    __table_args__ = (Index("ix_refresh_tokens_id", "legacy_id"),)
