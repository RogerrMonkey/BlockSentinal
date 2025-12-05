import json
import logging
from datetime import datetime
from pathlib import Path
from typing import Dict, Optional, List
from uuid import UUID
from sqlalchemy.orm import Session

from app.models.scan import Scan
from app.models.finding import Finding
from app.services.etherscan import etherscan_service
from app.services.slither import slither_service
from app.services.mythril import mythril_service
from app.services.ai_analyzer import ai_analyzer
from app.services.storage import storage_service
from app.core.config import settings

logger = logging.getLogger(__name__)


class ScannerService:
    """Main service to orchestrate contract scanning"""
    
    def __init__(self):
        self.reports_dir = Path(settings.REPORTS_DIR)
        self.reports_dir.mkdir(exist_ok=True, parents=True)
    
    async def process_scan(self, scan_id: UUID, db: Session):
        """
        Process a scan: fetch source, analyze, store results
        
        Args:
            scan_id: UUID of the scan to process
            db: Database session
        """
        scan = db.query(Scan).filter(Scan.id == scan_id).first()
        if not scan:
            logger.error(f"Scan {scan_id} not found in database")
            raise ValueError(f"Scan {scan_id} not found")
        
        logger.info(f"Processing scan {scan_id}")
        
        try:
            # Update status to running
            scan.status = "running"
            db.commit()
            logger.info(f"Scan {scan_id} status updated to RUNNING")
            
            # Get source code
            source_code = scan.source_code
            if not source_code and scan.contract_address:
                logger.info(f"Fetching source code from Etherscan for {scan.contract_address} on {scan.network or 'mainnet'}")
                # Fetch from Etherscan
                try:
                    network = scan.network or "mainnet"
                    source_code = await etherscan_service.get_contract_source(scan.contract_address, network)
                    if not source_code:
                        raise ValueError(f"Could not fetch source code for {scan.contract_address} on {network}")
                    
                    # Store fetched source code
                    scan.source_code = source_code
                    db.commit()
                    logger.info(f"Source code fetched and stored for {scan.contract_address} from {network}")
                except Exception as e:
                    logger.error(f"Failed to fetch source from Etherscan: {e}")
                    raise ValueError(f"Failed to fetch contract source: {str(e)}")
            
            if not source_code:
                raise ValueError("No source code available for analysis")
            
            # ==============================================================
            # MULTI-LAYER ANALYSIS: Slither + Mythril + AI
            # ==============================================================
            
            # Layer 1: Slither Static Analysis
            scan.current_stage = "slither"
            db.commit()
            logger.info(f"[1/3] Running Slither static analysis for scan {scan_id}...")
            analysis_result = await slither_service.analyze_contract(
                source_code, 
                scan.contract_address
            )
            
            if not analysis_result.get("success", False):
                error_msg = analysis_result.get("error", "Slither analysis failed")
                logger.error(f"Slither analysis failed for scan {scan_id}: {error_msg}")
                raise ValueError(f"Analysis failed: {error_msg}")
            
            slither_findings = analysis_result.get("findings", [])
            logger.info(f"[OK] Slither complete: {len(slither_findings)} findings")
            
            # Layer 2: Mythril Symbolic Execution
            scan.current_stage = "mythril"
            db.commit()
            logger.info(f"[2/3] Running Mythril symbolic execution for scan {scan_id}...")
            mythril_findings = []
            try:
                mythril_findings = await mythril_service.analyze_contract(source_code)
                logger.info(f"[OK] Mythril complete: {len(mythril_findings)} findings")
            except Exception as e:
                logger.warning(f"Mythril analysis failed: {e} - continuing with other analyzers")
            
            # Layer 3: AI-Powered Analysis
            scan.current_stage = "ai"
            db.commit()
            logger.info(f"[3/3] Running AI-powered analysis for scan {scan_id}...")
            ai_findings = []
            try:
                ai_findings = await ai_analyzer.analyze_contract(source_code, slither_findings)
                logger.info(f"[OK] AI analysis complete: {len(ai_findings)} findings")
            except Exception as e:
                logger.warning(f"AI analysis failed: {e} - continuing without AI findings")
            
            # Combine and deduplicate findings
            all_findings = slither_findings + mythril_findings + ai_findings
            deduplicated_findings = self._deduplicate_findings(all_findings)
            
            findings_count = len(deduplicated_findings)
            logger.info(f"SUMMARY: Total findings after deduplication: {findings_count}")
            logger.info(f"  - Slither: {len(slither_findings)}")
            logger.info(f"  - Mythril: {len(mythril_findings)}")
            logger.info(f"  - AI: {len(ai_findings)}")
            
            # Store all findings
            for finding_data in deduplicated_findings:
                try:
                    # Map to Supabase schema: title, description, severity, category, confidence, line_number, recommendation, detected_by
                    finding = Finding(
                        scan_id=scan.id,
                        title=finding_data["type"],  # vulnerability_type -> title
                        description=finding_data["description"],
                        severity=finding_data["severity"].lower(),  # Store as string: "low", "medium", "high"
                        category=finding_data.get("category"),
                        confidence=str(finding_data["confidence"]),  # Convert float to string
                        line_number=finding_data.get("line"),
                        recommendation=finding_data.get("remediation", ""),  # remediation -> recommendation
                        detected_by=finding_data.get("source", "unknown")  # Store which analyzer(s) found it
                    )
                    db.add(finding)
                except Exception as e:
                    logger.warning(f"Failed to store finding: {e}")
                    continue
            
            db.commit()
            logger.info(f"Stored {findings_count} findings for scan {scan_id}")
            
            # Generate report and upload directly to Supabase Storage
            scan.current_stage = "report"
            db.commit()
            logger.info(f"Generating report for scan {scan_id}")
            
            if storage_service:
                try:
                    # Generate report in memory
                    report_content = await self._generate_report_content(scan, db)
                    # Upload directly to Supabase Storage
                    public_url = storage_service.upload_report_content(str(scan.id), report_content)
                    scan.report_path = public_url
                    logger.info(f"Report uploaded to Supabase Storage: {public_url}")
                except Exception as e:
                    logger.error(f"Failed to upload report to Supabase Storage: {e}")
                    raise
            else:
                raise ValueError("Supabase Storage not configured")
            
            # Update scan status
            scan.status = "completed"
            scan.completed_at = datetime.utcnow()
            db.commit()
            
            logger.info(f"Scan {scan_id} completed successfully")
            return {"success": True, "scan_id": str(scan.id)}
            
        except Exception as e:
            # Update scan with error
            logger.error(f"Scan {scan_id} failed: {str(e)}", exc_info=True)
            scan.status = "failed"
            scan.completed_at = datetime.utcnow()
            db.commit()
            
            return {"success": False, "error": str(e)}
    
    def _extract_code_snippet(self, source_code: str, line_number: Optional[int], context_lines: int = 2) -> Optional[str]:
        """Extract code snippet around the specified line"""
        if not line_number:
            return None
        
        lines = source_code.split('\n')
        start = max(0, line_number - context_lines - 1)
        end = min(len(lines), line_number + context_lines)
        
        snippet_lines = lines[start:end]
        return '\n'.join(snippet_lines)
    
    async def _generate_report_content(self, scan: Scan, db: Session) -> str:
        """Generate JSON report content for the scan (returns JSON string, no file saved)"""
        findings = db.query(Finding).filter(Finding.scan_id == scan.id).all()
        
        report = {
            "scan_id": str(scan.id),
            "contract_address": scan.contract_address,
            "scan_date": scan.created_at.isoformat(),
            "completed_at": scan.completed_at.isoformat() if scan.completed_at else None,
            "status": scan.status,
            "summary": self._generate_summary(findings),
            "findings": [
                {
                    "id": str(f.id),
                    "type": f.vulnerability_type,
                    "severity": f.severity,  # Already a string
                    "confidence": f.confidence,  # Already a string
                    "line_number": f.line_number,
                    "description": f.description,
                    "remediation": f.remediation,
                    "code_snippet": f.code_snippet,
                    "detected_by": f.detected_by if f.detected_by else "unknown",  # Show which analyzer(s) found it
                    "source": f.source  # Backwards compat
                }
                for f in findings
            ]
        }
        
        # Return JSON string directly (no local file)
        return json.dumps(report, indent=2)
    
    def _generate_summary(self, findings: list) -> Dict:
        """Generate summary statistics for findings"""
        summary = {
            "total_findings": len(findings),
            "critical": 0,
            "high": 0,
            "medium": 0,
            "low": 0,
            "by_source": {
                "slither": 0,
                "mythril": 0,
                "ai-gpt4": 0,
                "multiple": 0
            }
        }
        
        for finding in findings:
            # finding.severity is now a string, not an Enum
            severity = finding.severity.lower() if finding.severity else "low"
            if severity in summary:
                summary[severity] += 1
            
            # Count by source/detected_by
            detected_by = finding.detected_by if hasattr(finding, 'detected_by') and finding.detected_by else "unknown"
            
            # Handle multiple sources
            if "multiple" in detected_by.lower():
                summary["by_source"]["multiple"] += 1
            elif "slither" in detected_by.lower():
                summary["by_source"]["slither"] += 1
            elif "mythril" in detected_by.lower():
                summary["by_source"]["mythril"] += 1
            elif "ai" in detected_by.lower() or "gpt" in detected_by.lower():
                summary["by_source"]["ai-gpt4"] += 1
        
        return summary
    
    def _deduplicate_findings(self, findings: List[Dict]) -> List[Dict]:
        """
        Intelligently merge duplicate findings from different analyzers.
        Combines information from multiple sources when they detect the same issue.
        """
        # Group findings by their core issue (type + line)
        grouped_findings = {}
        
        for finding in findings:
            # Normalize finding type for better matching
            finding_type = finding.get("type", "").lower().strip()
            line = finding.get("line")
            severity = finding.get("severity", "").lower()
            
            # Create grouping key - match by type and line (or just type if no line)
            if line:
                key = (finding_type, line)
            else:
                # For findings without line numbers, use type + severity
                key = (finding_type, severity)
            
            if key not in grouped_findings:
                # First occurrence - store it
                grouped_findings[key] = {
                    "finding": finding,
                    "sources": [finding.get("source", "unknown")],
                    "descriptions": [finding.get("description", "")],
                    "remediations": [finding.get("remediation", "")],
                    "confidences": [finding.get("confidence", 0.5)]
                }
            else:
                # Duplicate found - merge information
                group = grouped_findings[key]
                source = finding.get("source", "unknown")
                
                if source not in group["sources"]:
                    group["sources"].append(source)
                
                # Collect unique descriptions and remediations
                desc = finding.get("description", "")
                if desc and desc not in group["descriptions"]:
                    group["descriptions"].append(desc)
                
                remed = finding.get("remediation", "")
                if remed and remed not in group["remediations"]:
                    group["remediations"].append(remed)
                
                # Track confidence scores
                group["confidences"].append(finding.get("confidence", 0.5))
                
                # Upgrade severity if a more severe one is found
                current_severity = group["finding"].get("severity", "low").lower()
                new_severity = finding.get("severity", "low").lower()
                severity_order = {"critical": 4, "high": 3, "medium": 2, "low": 1}
                if severity_order.get(new_severity, 1) > severity_order.get(current_severity, 1):
                    group["finding"]["severity"] = new_severity
        
        # Build final deduplicated list with merged information
        deduplicated = []
        for key, group in grouped_findings.items():
            finding = group["finding"].copy()
            
            # Add source attribution if multiple sources detected it
            if len(group["sources"]) > 1:
                sources_str = ", ".join(sorted(set(group["sources"])))
                finding["source"] = f"multiple ({sources_str})"
                
                # Merge descriptions from multiple sources
                unique_descs = [d for d in group["descriptions"] if d]
                if len(unique_descs) > 1:
                    finding["description"] = f"{unique_descs[0]}\n\nAlso detected by {sources_str}:\n" + "\n".join(f"- {d}" for d in unique_descs[1:])
                
                # Use highest confidence when multiple sources agree
                finding["confidence"] = max(group["confidences"])
                
                logger.debug(f"Merged finding '{finding.get('type')}' from sources: {sources_str}")
            
            deduplicated.append(finding)
        
        logger.info(f"Deduplicated {len(findings)} findings down to {len(deduplicated)} unique issues")
        return deduplicated
    
    def get_scan_summary(self, scan_id: UUID, db: Session) -> Dict:
        """Get summary for a specific scan"""
        findings = db.query(Finding).filter(Finding.scan_id == scan_id).all()
        return self._generate_summary(findings)


scanner_service = ScannerService()
