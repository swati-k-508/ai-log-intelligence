import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Text, DateTime, Integer, Boolean, ForeignKey, Index
from sqlalchemy.orm import relationship
from .database import Base

def generate_uuid():
    return str(uuid.uuid4())

def utc_now():
    return datetime.now(timezone.utc)

class RawLog(Base):
    __tablename__ = "raw_logs"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    raw_text = Column(Text, nullable=False)
    source_name = Column(String(64), nullable=False, default="unknown", index=True)
    received_at = Column(DateTime, default=utc_now, index=True)

    normalized_logs = relationship("NormalizedLog", back_populates="raw_log", cascade="all, delete-orphan")

class NormalizedLog(Base):
    __tablename__ = "normalized_logs"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    raw_event_id = Column(String(36), ForeignKey("raw_logs.id", ondelete="CASCADE"), nullable=False, index=True)
    
    timestamp = Column(String(32), nullable=False, index=True) # ISO 8601 UTC
    event_type = Column(String(64), nullable=False, index=True) # e.g. AUTHENTICATION_FAILURE
    category = Column(String(32), nullable=False, default="SECURITY", index=True) # AUTH, NETWORK, SECURITY, SYSTEM
    severity = Column(String(16), nullable=False, default="MEDIUM", index=True) # LOW, MEDIUM, HIGH, CRITICAL, INFO
    
    source_ip = Column(String(45), nullable=True, index=True)
    destination_ip = Column(String(45), nullable=True, index=True)
    source_port = Column(Integer, nullable=True)
    destination_port = Column(Integer, nullable=True)
    
    user = Column(String(128), nullable=True, index=True)
    hostname = Column(String(128), nullable=True)
    service = Column(String(64), nullable=True, index=True)
    process_id = Column(Integer, nullable=True)
    
    action = Column(String(32), nullable=False, default="UNKNOWN", index=True) # ALLOW, DENY, DROP, ALERT, SUCCESS, FAILURE
    protocol = Column(String(16), nullable=True)
    bytes_sent = Column(Integer, default=0)
    bytes_received = Column(Integer, default=0)
    
    is_noise = Column(Boolean, default=False, index=True)
    dup_count = Column(Integer, default=1)
    first_seen = Column(String(32), nullable=False)
    last_seen = Column(String(32), nullable=False)
    
    format_detected = Column(String(32), nullable=False, default="UNKNOWN", index=True)
    extracted_fields_json = Column(Text, default="{}")
    normalized_at = Column(String(32), nullable=False, index=True)

    __table_args__ = (
        Index("ix_dedup_signature", "event_type", "source_ip", "user", "destination_ip", "action"),
    )

    raw_log = relationship("RawLog", back_populates="normalized_logs")

class Alert(Base):
    __tablename__ = "alerts"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    title = Column(String(128), nullable=False)
    threat_type = Column(String(64), nullable=False) # e.g. SSH_BRUTE_FORCE
    severity = Column(String(16), nullable=False) # HIGH, CRITICAL
    explanation = Column(Text, nullable=False)
    trigger_event_ids_json = Column(Text, nullable=False, default="[]")
    source_ip = Column(String(45), nullable=True)
    target_user = Column(String(128), nullable=True)
    event_count = Column(Integer, default=1)
    created_at = Column(String(32), nullable=False)

class ParserPluginConfig(Base):
    __tablename__ = "parser_plugin_configs"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(64), unique=True, nullable=False)
    pattern = Column(Text, nullable=False)
    field_mappings_json = Column(Text, nullable=False) # JSON dict of capture group -> canonical field
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
