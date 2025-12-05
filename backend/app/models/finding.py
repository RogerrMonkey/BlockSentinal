from sqlalchemy import Column, String, Text, Integer, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid
from app.core.database import Base


class Finding(Base):
    __tablename__ = "findings"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    scan_id = Column(UUID(as_uuid=True), ForeignKey("scans.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    severity = Column(String(20), nullable=False, index=True)
    category = Column(String(50), nullable=True)
    confidence = Column(String(20), nullable=True)
    line_number = Column(Integer, nullable=True)
    recommendation = Column(Text, nullable=True)
    detected_by = Column(String(100), nullable=True)  # e.g., "slither", "mythril", "ai-gpt4", "multiple (slither, mythril)"
    
    # Relationships
    scan = relationship("Scan", back_populates="findings")
    
    # Backwards compatibility properties
    @property
    def vulnerability_type(self):
        return self.title
    
    @property
    def code_snippet(self):
        # Extract from description if needed
        return None
    
    @property
    def remediation(self):
        return self.recommendation
    
    @property
    def source(self):
        return self.detected_by if self.detected_by else "unknown"
    
    def __repr__(self):
        return f"<Finding {self.title} - {self.severity}>"
