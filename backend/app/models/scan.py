from sqlalchemy import Column, String, DateTime, Text, ForeignKey, Enum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import uuid
import enum
from app.core.database import Base


class ScanStatus(str, enum.Enum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"


class NetworkType(str, enum.Enum):
    MAINNET = "mainnet"
    SEPOLIA = "sepolia"


class Scan(Base):
    __tablename__ = "scans"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True, index=True)
    contract_address = Column(String, nullable=True)
    network = Column(String, nullable=True, default="mainnet")  # mainnet or sepolia
    source_code = Column(Text, nullable=True)
    scan_type = Column(String, nullable=False, default="full")
    status = Column(String, nullable=False, default="pending", index=True)
    current_stage = Column(String, nullable=True)  # init, slither, mythril, ai, report
    report_path = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    findings = relationship("Finding", back_populates="scan", cascade="all, delete-orphan")
    
    @property
    def error_message(self):
        """Backwards compatibility - returns None since we don't store errors"""
        return None
    
    def __repr__(self):
        return f"<Scan {self.id} - {self.status}>"
