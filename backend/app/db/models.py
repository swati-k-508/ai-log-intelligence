import uuid
from datetime import datetime, timezone
# pyrefly: ignore [missing-import]
from sqlalchemy import Column, String, Text, DateTime, Integer, Boolean, ForeignKey
# pyrefly: ignore [missing-import]
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
    source_name = Column(String(64), nullable=False, default="unknown")
    received_at = Column(DateTime, default=utc_now)

    normalized_logs = relationship("NormalizedLog", back_populates="raw_log", cascade="all, delete-orphan")

class NormalizedLog(Base):
    __tablename__ = "normalized_logs"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    raw_event_id = Column(String(36), ForeignKey("raw_logs.id", ondelete="CASCADE"), nullable=False)
    
    timestamp = Column(String(32), nullable=False) # ISO 8601 UTC
    event_type = Column(String(64), nullable=False) # e.g. AUTHENTICATION_FAILURE
    category = Column(String(32), nullable=False, default="SECURITY") # AUTH, NETWORK, SECURITY, SYSTEM
    severity = Column(String(16), nullable=False, default="MEDIUM") # LOW, MEDIUM, HIGH, CRITICAL, INFO
    
    source_ip = Column(String(45), nullable=True)
    destination_ip = Column(String(45), nullable=True)
    source_port = Column(Integer, nullable=True)
    destination_port = Column(Integer, nullable=True)
    
    user = Column(String(128), nullable=True)
    hostname = Column(String(128), nullable=True)
    service = Column(String(64), nullable=True)
    process_id = Column(Integer, nullable=True)
    
    action = Column(String(32), nullable=False, default="UNKNOWN") # ALLOW, DENY, DROP, ALERT, SUCCESS, FAILURE
    protocol = Column(String(16), nullable=True)
    bytes_sent = Column(Integer, default=0)
    bytes_received = Column(Integer, default=0)
    
    is_noise = Column(Boolean, default=False)
    dup_count = Column(Integer, default=1)
    first_seen = Column(String(32), nullable=False)
    last_seen = Column(String(32), nullable=False)
    
    format_detected = Column(String(32), nullable=False, default="UNKNOWN")
    extracted_fields_json = Column(Text, default="{}")
    normalized_at = Column(String(32), nullable=False)

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
