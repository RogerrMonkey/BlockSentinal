import json
import tempfile
import subprocess
import os
import logging
from typing import Dict, List, Optional
from pathlib import Path

logger = logging.getLogger(__name__)


class SlitherService:
    """Service to run Slither static analysis on Solidity contracts using Docker"""
    
    def __init__(self):
        self.reports_dir = Path("./reports")
        self.reports_dir.mkdir(exist_ok=True)
        self.docker_image = "blocksentinel-slither:latest"
        self.severity_mapping = {
            "High": "high",
            "Medium": "medium",
            "Low": "low",
            "Informational": "low",
            "Optimization": "low"
        }
        self.confidence_mapping = {
            "High": 0.90,
            "Medium": 0.70,
            "Low": 0.50
        }
    
    async def analyze_contract(self, source_code: str, contract_address: Optional[str] = None) -> Dict:
        """
        Run Slither analysis on contract source code using Docker
        
        Args:
            source_code: Solidity source code
            contract_address: Optional contract address for reference
            
        Returns:
            Dictionary with analysis results
        """
        try:
            # Create temporary directory for analysis
            with tempfile.TemporaryDirectory() as temp_dir:
                temp_path = Path(temp_dir)
                contract_file = temp_path / "contract.sol"
                
                # Write source code to file
                contract_file.write_text(source_code, encoding='utf-8')
                
                # Ensure Docker image exists
                await self._ensure_docker_image()
                
                # Run Slither analysis
                findings = await self._run_slither_docker(str(contract_file))
                
                return {
                    "success": True,
                    "findings": findings,
                    "analysis_time": None
                }
                
        except Exception as e:
            logger.error(f"Slither analysis failed: {str(e)}", exc_info=True)
            return {
                "success": False,
                "findings": [],
                "error": str(e)
            }
    
    async def _ensure_docker_image(self):
        """Build Docker image if it doesn't exist"""
        try:
            # Check if image exists
            check_cmd = ["docker", "images", "-q", self.docker_image]
            result = subprocess.run(check_cmd, capture_output=True, text=True, timeout=10)
            
            if not result.stdout.strip():
                logger.info(f"Docker image {self.docker_image} not found, building...")
                
                # Get backend directory
                backend_dir = Path(__file__).parent.parent.parent
                dockerfile_path = backend_dir / "Dockerfile.slither"
                
                if not dockerfile_path.exists():
                    raise Exception(f"Dockerfile.slither not found at {dockerfile_path}")
                
                # Build image
                build_cmd = [
                    "docker", "build",
                    "-f", str(dockerfile_path),
                    "-t", self.docker_image,
                    str(backend_dir)
                ]
                
                logger.info(f"Building Docker image...")
                result = subprocess.run(
                    build_cmd, 
                    check=True, 
                    capture_output=True,
                    text=True,
                    timeout=300  # 5 minute build timeout
                )
                logger.info("Docker image built successfully")
            else:
                logger.debug(f"Docker image {self.docker_image} already exists")
                
        except subprocess.TimeoutExpired:
            raise Exception("Docker build timed out")
        except subprocess.CalledProcessError as e:
            logger.error(f"Failed to build Docker image: {e.stderr}")
            raise Exception(f"Failed to build Slither Docker image: {e.stderr}")
        except Exception as e:
            logger.error(f"Docker image check failed: {e}")
            raise
    
    async def _run_slither_docker(self, contract_path: str) -> List[Dict]:
        """Execute Slither in Docker container"""
        try:
            contract_dir = os.path.dirname(contract_path)
            contract_name = os.path.basename(contract_path)
            
            # Prepare Docker command with comprehensive detection
            cmd = [
                "docker", "run", "--rm",
                "-v", f"{contract_dir}:/contracts",
                self.docker_image,
                "slither", f"/contracts/{contract_name}",
                "--json", "-",
                "--exclude-informational",  # Exclude low-value findings
                "--filter-paths", "node_modules"  # Exclude dependencies
            ]
            
            logger.info(f"Running Slither analysis on {contract_name}")
            logger.debug(f"Slither command: {' '.join(cmd)}")
            
            # Run Slither with timeout
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=120  # 2 minute timeout per contract
            )
            
            logger.debug(f"Slither exit code: {result.returncode}")
            logger.debug(f"Slither stdout length: {len(result.stdout)}")
            logger.debug(f"Slither stderr length: {len(result.stderr)}")
            
            # Log first 1000 chars of output for debugging
            if result.stdout:
                logger.debug(f"Slither stdout (first 1000 chars): {result.stdout[:1000]}")
            if result.stderr:
                logger.debug(f"Slither stderr (first 1000 chars): {result.stderr[:1000]}")
            
            # Slither returns non-zero even on successful analysis with findings
            # Check if we have valid JSON output
            if result.stdout:
                try:
                    slither_output = json.loads(result.stdout)
                    findings = self._parse_slither_output(slither_output)
                    logger.info(f"Slither analysis complete: {len(findings)} findings")
                    return findings
                except json.JSONDecodeError as e:
                    logger.error(f"Failed to parse Slither JSON output: {e}")
                    logger.debug(f"Slither stdout: {result.stdout[:500]}")
                    logger.debug(f"Slither stderr: {result.stderr[:500]}")
                    raise Exception("Failed to parse Slither output")
            else:
                # No output but might have stderr
                if result.stderr:
                    logger.warning(f"Slither stderr: {result.stderr[:200]}")
                    
                    # Check for compilation errors
                    if "Error" in result.stderr or "compilation failed" in result.stderr.lower():
                        raise Exception(f"Contract compilation failed: {result.stderr[:200]}")
                
                # No findings detected
                logger.info("Slither analysis complete: No findings detected")
                return []
                
        except subprocess.TimeoutExpired:
            logger.error("Slither analysis timed out after 2 minutes")
            raise Exception("Analysis timed out - contract may be too complex")
        except Exception as e:
            logger.error(f"Slither Docker execution failed: {e}")
            raise
    
    def _parse_slither_output(self, slither_output: Dict) -> List[Dict]:
        """Parse Slither JSON output into standardized findings format"""
        findings = []
        
        try:
            # Slither JSON format: {"success": bool, "error": str, "results": {"detectors": [...]}}
            if not slither_output.get("success", True):
                error_msg = slither_output.get("error", "Unknown error")
                logger.error(f"Slither reported error: {error_msg}")
                return findings
            
            results = slither_output.get("results", {})
            detectors = results.get("detectors", [])
            
            logger.debug(f"Parsing {len(detectors)} Slither detectors")
            
            for detector in detectors:
                try:
                    # Extract detector information
                    check = detector.get("check", "unknown-detector")
                    impact = detector.get("impact", "Low")
                    confidence = detector.get("confidence", "Medium")
                    description = detector.get("description", "")
                    markdown = detector.get("markdown", "")
                    
                    # Extract elements for line numbers
                    elements = detector.get("elements", [])
                    line_number = None
                    code_snippet = None
                    
                    if elements:
                        # Get first element's source mapping
                        first_element = elements[0]
                        source_mapping = first_element.get("source_mapping", {})
                        if source_mapping:
                            lines = source_mapping.get("lines", [])
                            if lines:
                                line_number = lines[0]
                            
                            # Get code snippet
                            starting_column = source_mapping.get("starting_column")
                            ending_column = source_mapping.get("ending_column")
                            if starting_column and ending_column:
                                # Extract code snippet from source mapping
                                code_snippet = first_element.get("source_mapping", {}).get("content", "")
                    
                    # Create standardized finding
                    finding = {
                        "type": self._format_detector_name(check),
                        "severity": self._map_severity(impact),
                        "confidence": self._map_confidence(confidence),
                        "line": line_number,
                        "description": description or f"Slither detector: {check}",
                        "remediation": self._generate_remediation(check, markdown),
                        "source": "slither",
                        "code_snippet": code_snippet
                    }
                    
                    findings.append(finding)
                    
                except Exception as e:
                    logger.warning(f"Failed to parse detector: {e}")
                    continue
            
            return findings
            
        except Exception as e:
            logger.error(f"Failed to parse Slither output: {e}", exc_info=True)
            return []
    
    def _format_detector_name(self, check: str) -> str:
        """Format detector name for display"""
        # Convert hyphenated names to title case
        return check.replace("-", " ").title()
    
    def _map_severity(self, impact: str) -> str:
        """Map Slither impact to severity levels"""
        return self.severity_mapping.get(impact, "medium")
    
    def _map_confidence(self, confidence: str) -> float:
        """Map Slither confidence to numeric value"""
        return self.confidence_mapping.get(confidence, 0.70)
    
    def _generate_remediation(self, check: str, markdown: str) -> str:
        """Generate remediation advice based on detector type"""
        # Common remediation patterns
        remediation_map = {
            "reentrancy": "Follow the checks-effects-interactions pattern. Update state variables before making external calls.",
            "tx-origin": "Use msg.sender instead of tx.origin for authentication.",
            "unchecked-send": "Check the return value of send() or use transfer() instead.",
            "suicidal": "Remove selfdestruct or add strict access controls with multi-sig.",
            "delegatecall": "Only use delegatecall with trusted contracts. Consider using libraries.",
            "uninitialized-state": "Initialize all state variables explicitly in the constructor.",
            "locked-ether": "Add a withdraw function to allow ether recovery.",
            "arbitrary-send": "Restrict who can trigger transfers using access control modifiers.",
            "controlled-array-length": "Validate array lengths and prevent user-controlled manipulation.",
            "controlled-delegatecall": "Never allow user input to determine delegatecall target.",
        }
        
        # Check if we have a specific remediation
        for key, value in remediation_map.items():
            if key in check.lower():
                return value
        
        # Fallback to markdown if available
        if markdown and len(markdown) > 10:
            return markdown[:200] + "..." if len(markdown) > 200 else markdown
        
        return "Review this finding and consult Slither documentation for remediation steps."


# Singleton instance
slither_service = SlitherService()
