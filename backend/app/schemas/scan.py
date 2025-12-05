from pydantic import BaseModel, Field, validator
from typing import Optional, Literal
from datetime import datetime
from uuid import UUID


# Scan Request Schemas
class ScanCreate(BaseModel):
    source_type: Literal["upload", "address"] = Field(..., description="Source type: upload or address")
    contract_address: Optional[str] = Field(None, description="Contract address if source_type=address")
    network: Literal["mainnet", "sepolia"] = Field("mainnet", description="Ethereum network: mainnet or sepolia")
    source_code: Optional[str] = Field(None, description="Solidity source code if source_type=upload")
    
    @validator('contract_address')
    def validate_address(cls, v, values):
        if values.get('source_type') == 'address' and not v:
            raise ValueError('contract_address is required when source_type=address')
        if v and not v.startswith('0x'):
            raise ValueError('contract_address must start with 0x')
        return v
    
    @validator('source_code')
    def validate_source(cls, v, values):
        if values.get('source_type') == 'upload' and not v:
            raise ValueError('source_code is required when source_type=upload')
        return v


# Scan Response Schemas
class ScanSummary(BaseModel):
    total_findings: int
    critical: int
    high: int
    medium: int
    low: int


class ScanResponse(BaseModel):
    scan_id: UUID
    status: str
    contract_address: Optional[str]
    created_at: datetime
    completed_at: Optional[datetime]
    summary: Optional[ScanSummary]
    report_url: Optional[str]
    error_message: Optional[str]
    
    class Config:
        from_attributes = True


class ScanListItem(BaseModel):
    scan_id: UUID
    status: str
    contract_address: Optional[str]
    created_at: datetime
    findings_count: int
    
    class Config:
        from_attributes = True


class ScanListResponse(BaseModel):
    scans: list[ScanListItem]
    total: int
    limit: int
    offset: int


# Finding Schemas
class FindingBase(BaseModel):
    vulnerability_type: str
    severity: str
    confidence: float
    line_number: Optional[int]
    code_snippet: Optional[str]
    description: str
    remediation: Optional[str]
    source: str


class FindingResponse(FindingBase):
    id: UUID
    scan_id: UUID
    
    class Config:
        from_attributes = True


# Report Schema
class ReportResponse(BaseModel):
    scan_id: UUID
    contract_address: Optional[str]
    status: str
    created_at: datetime
    completed_at: Optional[datetime]
    summary: ScanSummary
    findings: list[FindingResponse]
    
    class Config:
        from_attributes = True
