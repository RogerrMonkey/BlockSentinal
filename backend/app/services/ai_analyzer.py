"""AI-Powered Smart Contract Analysis using Ollama"""
import logging
import json
import httpx
from typing import Dict, List, Optional
from app.core.config import settings

logger = logging.getLogger(__name__)


class AIAnalyzer:
    """AI-powered vulnerability detection using Ollama (local LLM)"""
    
    def __init__(self):
        self.ollama_url = settings.OLLAMA_API_URL
        self.ollama_model = settings.OLLAMA_MODEL
        logger.info(f"AI Analyzer initialized with Ollama ({self.ollama_model}) at {self.ollama_url}")
    
    async def analyze_contract(self, source_code: str, slither_findings: List[Dict]) -> List[Dict]:
        """
        Perform AI-powered analysis on smart contract using Ollama
        
        Args:
            source_code: Solidity source code
            slither_findings: Findings from Slither analysis for context
            
        Returns:
            List of AI-detected vulnerabilities
        """
        try:
            logger.info("Starting AI-powered vulnerability analysis with Ollama...")
            
            # Analyze in chunks if contract is too large
            if len(source_code) > 12000:
                return await self._analyze_large_contract(source_code, slither_findings)
            
            findings = await self._analyze_with_ollama(source_code, slither_findings)
            logger.info(f"AI analysis complete: {len(findings)} additional findings")
            return findings
            
        except Exception as e:
            logger.error(f"AI analysis failed: {e}")
            return []
    
    async def _analyze_with_ollama(self, source_code: str, slither_findings: List[Dict]) -> List[Dict]:
        """Run analysis using local Ollama model"""
        try:
            # Build context from Slither findings
            slither_context = self._build_slither_context(slither_findings)
            
            # Create comprehensive prompt
            prompt = self._build_analysis_prompt(source_code, slither_context)
            
            logger.info(f"Sending analysis request to Ollama (prompt length: {len(prompt)} chars)")
            
            # Call Ollama API
            async with httpx.AsyncClient(timeout=120.0) as client:
                try:
                    response = await client.post(
                        f"{self.ollama_url}/api/generate",
                        json={
                            "model": self.ollama_model,
                            "prompt": prompt,
                            "stream": False
                        }
                    )
                    
                    if response.status_code != 200:
                        logger.error(f"Ollama returned status {response.status_code}: {response.text}")
                        return []
                    
                    result = response.json()
                    ai_response = result.get("response", "{}")
                    
                    logger.info(f"Received response from Ollama (length: {len(ai_response)} chars)")
                    
                except httpx.HTTPStatusError as e:
                    logger.error(f"Ollama HTTP error: {e}")
                    return []
                
                # Parse response - try to extract JSON
                try:
                    # First try direct JSON parse
                    ai_results = json.loads(ai_response)
                except json.JSONDecodeError:
                    # Try to extract JSON from markdown code blocks
                    import re
                    json_match = re.search(r'```json\s*(.*?)\s*```', ai_response, re.DOTALL)
                    if json_match:
                        try:
                            ai_results = json.loads(json_match.group(1))
                        except json.JSONDecodeError:
                            logger.warning("Could not parse JSON from code block")
                            return []
                    else:
                        # Try to find JSON object in response
                        json_match = re.search(r'\{.*\}', ai_response, re.DOTALL)
                        if json_match:
                            try:
                                ai_results = json.loads(json_match.group(0))
                            except json.JSONDecodeError:
                                logger.warning("Could not parse JSON from response text")
                                return []
                        else:
                            logger.warning("No JSON found in Ollama response")
                            return []
                
                # Convert to standardized format
                findings = self._parse_ai_findings(ai_results)
                logger.info(f"Parsed {len(findings)} findings from AI response")
                return findings
                
        except Exception as e:
            logger.error(f"Ollama analysis failed: {e}")
            return []
    
    async def _analyze_large_contract(self, source_code: str, slither_findings: List[Dict]) -> List[Dict]:
        """Analyze large contracts in chunks"""
        try:
            # Split into functions/sections
            chunks = self._split_contract(source_code)
            all_findings = []
            
            for i, chunk in enumerate(chunks[:3]):  # Limit to 3 chunks
                logger.info(f"Analyzing chunk {i+1}/{min(len(chunks), 3)}")
                findings = await self._analyze_with_ollama(chunk, slither_findings)
                all_findings.extend(findings)
            
            return all_findings
            
        except Exception as e:
            logger.error(f"Large contract analysis failed: {e}")
            return []
    
    def _build_slither_context(self, slither_findings: List[Dict]) -> str:
        """Build context from Slither findings"""
        if not slither_findings:
            return "No static analysis findings."
        
        context = f"Static analyzer found {len(slither_findings)} issues:\n"
        for finding in slither_findings[:5]:  # Top 5 for context
            context += f"- {finding.get('type')}: {finding.get('severity')} severity\n"
        
        return context
    
    def _build_analysis_prompt(self, source_code: str, slither_context: str) -> str:
        """Build comprehensive analysis prompt"""
        return f"""Analyze this Solidity smart contract for security vulnerabilities and provide findings in JSON format.

{slither_context}

Contract Code:
```solidity
{source_code[:8000]}
```

Provide your analysis in this JSON format:
{{
    "findings": [
        {{
            "title": "Vulnerability Title",
            "severity": "critical|high|medium|low",
            "confidence": 0.0-1.0,
            "line": line_number_or_null,
            "description": "Detailed description of the issue",
            "remediation": "How to fix this issue",
            "category": "reentrancy|access-control|arithmetic|etc"
        }}
    ]
}}

Focus on:
1. Business logic flaws that static analyzers miss
2. Complex attack vectors
3. Economic/game-theoretic vulnerabilities
4. Context-specific security issues

Return ONLY valid JSON, no additional text."""
    
    def _parse_ai_findings(self, ai_results: Dict) -> List[Dict]:
        """Parse AI findings into standardized format"""
        findings = []
        
        try:
            raw_findings = ai_results.get("findings", [])
            
            for finding in raw_findings:
                standardized = {
                    "type": finding.get("title", "AI-Detected Issue"),
                    "severity": self._normalize_severity(finding.get("severity", "medium")),
                    "confidence": float(finding.get("confidence", 0.75)),
                    "line": finding.get("line"),
                    "description": finding.get("description", ""),
                    "remediation": finding.get("remediation", "Review and fix this issue"),
                    "source": "ai-gpt4",
                    "category": finding.get("category", "unknown"),
                    "code_snippet": None
                }
                findings.append(standardized)
            
            return findings
            
        except Exception as e:
            logger.error(f"Failed to parse AI findings: {e}")
            return []
    
    def _normalize_severity(self, severity: str) -> str:
        """Normalize severity levels"""
        severity = severity.lower()
        if severity in ["critical", "high"]:
            return "high"
        elif severity == "medium":
            return "medium"
        else:
            return "low"
    
    def _split_contract(self, source_code: str) -> List[str]:
        """Split large contract into analyzable chunks"""
        # Simple split by functions
        chunks = []
        lines = source_code.split('\n')
        current_chunk = []
        
        for line in lines:
            current_chunk.append(line)
            if len('\n'.join(current_chunk)) > 8000:
                chunks.append('\n'.join(current_chunk))
                current_chunk = []
        
        if current_chunk:
            chunks.append('\n'.join(current_chunk))
        
        return chunks


# Singleton instance
ai_analyzer = AIAnalyzer()
