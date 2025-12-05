from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, Query
from fastapi.responses import Response, JSONResponse, StreamingResponse
from sqlalchemy.orm import Session
from typing import Optional
from uuid import UUID
from pathlib import Path
import logging
import re
from io import BytesIO

from app.core.database import get_db
from app.models.scan import Scan
from app.models.finding import Finding
from app.schemas.scan import (
    ScanCreate, ScanResponse, ScanListResponse, ScanListItem,
    ReportResponse, ScanSummary, FindingResponse
)
from app.services.scanner import scanner_service
from app.services.report_generator import report_generator
from app.services.storage import storage_service

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/scans", tags=["scans"])


def validate_ethereum_address(address: str) -> bool:
    """Validate Ethereum address format"""
    pattern = r'^0x[a-fA-F0-9]{40}$'
    return bool(re.match(pattern, address))


def validate_solidity_code(code: str) -> bool:
    """Basic validation for Solidity code"""
    if not code or len(code.strip()) < 10:
        return False
    # Check for basic Solidity patterns
    has_pragma = 'pragma solidity' in code.lower()
    has_contract = 'contract ' in code or 'library ' in code or 'interface ' in code
    return has_pragma or has_contract


@router.post("/", response_model=ScanResponse)
async def create_scan(
    scan_data: ScanCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """
    Create a new scan
    
    - **source_type**: Either 'upload' or 'address'
    - **contract_address**: Required if source_type='address'
    - **source_code**: Required if source_type='upload'
    """
    logger.info(f"Creating new scan: source_type={scan_data.source_type}")
    
    # Validate input based on source type
    if scan_data.source_type == 'address':
        if not scan_data.contract_address:
            logger.warning("Contract address missing for address scan")
            raise HTTPException(
                status_code=400,
                detail="Contract address is required when source_type is 'address'"
            )
        
        if not validate_ethereum_address(scan_data.contract_address):
            logger.warning(f"Invalid Ethereum address: {scan_data.contract_address}")
            raise HTTPException(
                status_code=400,
                detail="Invalid Ethereum address format. Must be 0x followed by 40 hex characters"
            )
    
    elif scan_data.source_type == 'upload':
        if not scan_data.source_code:
            logger.warning("Source code missing for upload scan")
            raise HTTPException(
                status_code=400,
                detail="Source code is required when source_type is 'upload'"
            )
        
        if not validate_solidity_code(scan_data.source_code):
            logger.warning("Invalid Solidity code provided")
            raise HTTPException(
                status_code=400,
                detail="Invalid Solidity code. Must contain 'pragma solidity' or 'contract' declaration"
            )
        
        # Limit source code size (10MB)
        if len(scan_data.source_code) > 10 * 1024 * 1024:
            logger.warning(f"Source code too large: {len(scan_data.source_code)} bytes")
            raise HTTPException(
                status_code=400,
                detail="Source code too large. Maximum size is 10MB"
            )
    
    try:
        # Create scan record with retry logic
        from sqlalchemy.exc import OperationalError
        import time
        
        max_retries = 3
        retry_delay = 1
        
        for attempt in range(max_retries):
            try:
                scan = Scan(
                    contract_address=scan_data.contract_address,
                    network=scan_data.network,
                    source_code=scan_data.source_code,
                    status="pending"
                )
                
                db.add(scan)
                db.commit()
                db.refresh(scan)
                
                logger.info(f"Scan created successfully: {scan.id}")
                
                # Schedule background task to process scan
                background_tasks.add_task(scanner_service.process_scan, scan.id, db)
                
                return ScanResponse(
                    scan_id=scan.id,
                    status=scan.status,
                    contract_address=scan.contract_address,
                    created_at=scan.created_at,
                    completed_at=scan.completed_at,
                    summary=None,
                    report_url=None,
                    error_message=None
                )
                
            except OperationalError as e:
                db.rollback()
                if attempt < max_retries - 1:
                    logger.warning(f"Database connection error on attempt {attempt + 1}, retrying in {retry_delay}s...")
                    time.sleep(retry_delay)
                    retry_delay *= 2  # Exponential backoff
                    # Get a fresh database session
                    db.close()
                    from app.core.database import SessionLocal
                    db = SessionLocal()
                else:
                    raise
                    
    except Exception as e:
        logger.error(f"Failed to create scan: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to create scan")


@router.get("/{scan_id}", response_model=ScanResponse)
def get_scan(scan_id: UUID, db: Session = Depends(get_db)):
    """Get scan status and summary"""
    logger.debug(f"Fetching scan: {scan_id}")
    
    scan = db.query(Scan).filter(Scan.id == scan_id).first()
    
    if not scan:
        logger.warning(f"Scan not found: {scan_id}")
        raise HTTPException(status_code=404, detail="Scan not found")
    
    # Get summary if completed
    summary = None
    report_url = None
    
    if scan.status == "completed":
        try:
            summary_data = scanner_service.get_scan_summary(scan.id, db)
            summary = ScanSummary(**summary_data)
            report_url = f"/api/v1/scans/{scan.id}/report"
        except Exception as e:
            logger.error(f"Failed to get scan summary: {e}")
    
    return ScanResponse(
        scan_id=scan.id,
        status=scan.status,
        contract_address=scan.contract_address,
        created_at=scan.created_at,
        completed_at=scan.completed_at,
        summary=summary,
        report_url=report_url,
        error_message=scan.error_message
    )


@router.get("/", response_model=ScanListResponse)
def list_scans(
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    status: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """List scans with pagination"""
    query = db.query(Scan)
    
    # Filter by status if provided
    if status:
        try:
            query = query.filter(Scan.status == status)
        except ValueError:
            raise HTTPException(status_code=400, detail=f"Invalid status: {status}")
    
    # Get total count
    total = query.count()
    
    # Get paginated results
    scans = query.order_by(Scan.created_at.desc()).offset(offset).limit(limit).all()
    
    # Build response
    scan_items = []
    for scan in scans:
        findings_count = db.query(Finding).filter(Finding.scan_id == scan.id).count()
        scan_items.append(
            ScanListItem(
                scan_id=scan.id,
                status=scan.status,
                contract_address=scan.contract_address,
                created_at=scan.created_at,
                findings_count=findings_count
            )
        )
    
    return ScanListResponse(
        scans=scan_items,
        total=total,
        limit=limit,
        offset=offset
    )


@router.get("/{scan_id}/report", response_model=ReportResponse)
def get_scan_report(scan_id: UUID, db: Session = Depends(get_db)):
    """Get full scan report with findings"""
    scan = db.query(Scan).filter(Scan.id == scan_id).first()
    
    if not scan:
        raise HTTPException(status_code=404, detail="Scan not found")
    
    if scan.status != "completed":
        raise HTTPException(status_code=400, detail="Scan not completed yet")
    
    # Get findings
    findings = db.query(Finding).filter(Finding.scan_id == scan.id).all()
    
    # Build summary
    summary_data = scanner_service.get_scan_summary(scan.id, db)
    summary = ScanSummary(**summary_data)
    
    # Build response
    findings_response = [
        FindingResponse(
            id=f.id,
            scan_id=f.scan_id,
            vulnerability_type=f.vulnerability_type,
            severity=f.severity,  # Already a string
            confidence=float(f.confidence) if isinstance(f.confidence, (int, float)) else 0.0,
            line_number=f.line_number,
            code_snippet=f.code_snippet,
            description=f.description,
            remediation=f.remediation,
            source=f.source  # Already a string (backwards compat property)
        )
        for f in findings
    ]
    
    return ReportResponse(
        scan_id=scan.id,
        contract_address=scan.contract_address,
        status=scan.status,
        created_at=scan.created_at,
        completed_at=scan.completed_at,
        summary=summary,
        findings=findings_response
    )


@router.get("/{scan_id}/download/{format}")
async def download_scan_report(
    scan_id: UUID,
    format: str,
    db: Session = Depends(get_db)
):
    """
    Download scan report in specified format
    
    - **format**: json, pdf, csv, or html
    """
    # Validate format
    valid_formats = ['json', 'pdf', 'csv', 'html']
    if format.lower() not in valid_formats:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid format. Must be one of: {', '.join(valid_formats)}"
        )
    
    # Get scan
    scan = db.query(Scan).filter(Scan.id == scan_id).first()
    if not scan:
        raise HTTPException(status_code=404, detail="Scan not found")
    
    if scan.status != "completed":
        raise HTTPException(status_code=400, detail="Scan not completed yet")
    
    # Get findings
    findings = db.query(Finding).filter(Finding.scan_id == scan.id).all()
    
    # Generate report based on format
    filename = f"blocksentinel_report_{scan_id}"
    
    try:
        if format == 'json':
            content = report_generator.generate_json_report(scan, findings)
            media_type = "application/json"
            filename += ".json"
            return Response(
                content=content,
                media_type=media_type,
                headers={
                    "Content-Disposition": f"attachment; filename={filename}"
                }
            )
        
        elif format == 'csv':
            content = report_generator.generate_csv_report(scan, findings)
            media_type = "text/csv"
            filename += ".csv"
            return Response(
                content=content,
                media_type=media_type,
                headers={
                    "Content-Disposition": f"attachment; filename={filename}"
                }
            )
        
        elif format == 'html':
            content = report_generator.generate_html_report(scan, findings)
            media_type = "text/html"
            filename += ".html"
            return Response(
                content=content,
                media_type=media_type,
                headers={
                    "Content-Disposition": f"attachment; filename={filename}"
                }
            )
        
        elif format == 'pdf':
            content = report_generator.generate_pdf_report(scan, findings)
            filename += ".pdf"
            return StreamingResponse(
                BytesIO(content),
                media_type="application/pdf",
                headers={
                    "Content-Disposition": f"attachment; filename={filename}"
                }
            )
    
    except Exception as e:
        logger.error(f"Failed to generate {format} report: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate report: {str(e)}"
        )


from app.services.storage import storage_service


@router.delete("/{scan_id}", status_code=200)
def delete_scan(
    scan_id: UUID, 
    db: Session = Depends(get_db)
):
    """
    Delete a scan and all associated data permanently
    
    This will delete:
    - Scan record from database
    - All findings associated with the scan
    - Report file from Supabase Storage
    
    This action cannot be undone.
    """
    scan = db.query(Scan).filter(Scan.id == scan_id).first()
    
    if not scan:
        raise HTTPException(status_code=404, detail="Scan not found")
    
    # Delete report from Supabase Storage
    if storage_service:
        try:
            storage_service.delete_report(str(scan.id))
            logger.info(f"Deleted report from Supabase Storage for scan {scan_id}")
        except Exception as e:
            logger.warning(f"Could not delete report from storage: {e}")
    
    # Delete scan (findings will be cascade deleted)
    deleted_findings_count = len(scan.findings) if scan.findings else 0
    db.delete(scan)
    db.commit()
    
    logger.info(f"Scan {scan_id} deleted successfully")
    
    return {
        "message": "Scan and all associated data deleted permanently",
        "scan_id": str(scan_id),
        "deleted_findings": deleted_findings_count
    }
