"""Mythril Symbolic Execution Analyzer"""
import json
import tempfile
import subprocess
import logging
from typing import Dict, List
from pathlib import Path

logger = logging.getLogger(__name__)


class MythrilService:
    """Service to run Mythril symbolic execution on Solidity contracts"""
    
    def __init__(self):
        self.docker_image = "mythril/myth:latest"
        self.severity_mapping = {
            "High": "high",
            "Medium": "medium",
            "Low": "low"
        }
    
    async def analyze_contract(self, source_code: str) -> List[Dict]:
        """
        Run Mythril symbolic execution analysis
        
        Args:
            source_code: Solidity source code
            
        Returns:
            List of findings from symbolic execution
        """
        try:
            logger.info("Starting Mythril symbolic execution analysis...")
            
            with tempfile.TemporaryDirectory() as temp_dir:
                temp_path = Path(temp_dir)
                contract_file = temp_path / "contract.sol"
                contract_file.write_text(source_code, encoding='utf-8')
                
                # Run Mythril analysis
                findings = await self._run_mythril(str(contract_file))
                logger.info(f"Mythril analysis complete: {len(findings)} findings")
                return findings
                
        except Exception as e:
            logger.error(f"Mythril analysis failed: {e}")
            return []
    
    async def _run_mythril(self, contract_path: str) -> List[Dict]:
        """Execute Mythril in Docker"""
        try:
            contract_dir = Path(contract_path).parent
            contract_name = Path(contract_path).name
            
            # Mythril command with optimized settings
            cmd = [
                "docker", "run", "--rm",
                "-v", f"{contract_dir}:/tmp",
                self.docker_image,
                "analyze",
                f"/tmp/{contract_name}",
                "--execution-timeout", "60",  # 1 minute timeout
                "--max-depth", "10",  # Limit search depth for speed
                "-o", "json"
            ]
            
            logger.info("Running Mythril symbolic execution...")
            
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=90  # 90 second total timeout
            )
            
            logger.debug(f"Mythril exit code: {result.returncode}")
            logger.debug(f"Mythril stdout length: {len(result.stdout)}")
            logger.debug(f"Mythril stderr length: {len(result.stderr)}")
            
            # Log actual output for debugging
            if result.stdout:
                logger.debug(f"Mythril stdout (first 1000 chars): {result.stdout[:1000]}")
            if result.stderr:
                logger.debug(f"Mythril stderr (first 500 chars): {result.stderr[:500]}")
            
            if result.stdout:
                try:
                    mythril_output = json.loads(result.stdout)
                    return self._parse_mythril_output(mythril_output)
                except json.JSONDecodeError:
                    logger.warning("Mythril output not in JSON format")
                    return []
            
            return []
            
        except subprocess.TimeoutExpired:
            logger.warning("Mythril analysis timed out - skipping")
            return []
        except Exception as e:
            logger.error(f"Mythril execution failed: {e}")
            return []
    
    def _parse_mythril_output(self, mythril_output: Dict) -> List[Dict]:
        """Parse Mythril JSON output"""
        findings = []
        
        try:
            issues = mythril_output.get("issues", [])
            
            for issue in issues:
                finding = {
                    "type": issue.get("title", "Mythril Finding"),
                    "severity": self._map_severity(issue.get("severity", "Medium")),
                    "confidence": 0.80,  # Mythril has high confidence in symbolic execution
                    "line": issue.get("lineno"),
                    "description": issue.get("description", ""),
                    "remediation": self._generate_remediation(issue.get("swc-id", "")),
                    "source": "mythril",
                    "code_snippet": issue.get("code", None),
                    "swc_id": issue.get("swc-id")
                }
                findings.append(finding)
            
            return findings
            
        except Exception as e:
            logger.error(f"Failed to parse Mythril output: {e}")
            return []
    
    def _map_severity(self, severity: str) -> str:
        """Map Mythril severity to standard levels"""
        return self.severity_mapping.get(severity, "medium")
    
    def _generate_remediation(self, swc_id: str) -> str:
        """Generate remediation based on SWC ID"""
        swc_remediations = {
            "SWC-107": "Use ReentrancyGuard or checks-effects-interactions pattern",
            "SWC-101": "Use SafeMath library or Solidity 0.8.0+ with built-in overflow checks",
            "SWC-116": "Avoid using block.timestamp for critical logic, use block.number instead",
            "SWC-105": "Add proper access control checks using modifiers like onlyOwner",
            "SWC-104": "Check return values of external calls or use transfer() instead of send()",
            "SWC-115": "Use pull payment pattern instead of direct transfers in loops"
        }
        
        return swc_remediations.get(swc_id, "Review and address this security issue")


# Singleton instance
mythril_service = MythrilService()
