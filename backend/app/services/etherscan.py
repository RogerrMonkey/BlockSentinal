import httpx
import json
from typing import Optional
from app.core.config import settings


class EtherscanService:
    """Service to interact with Etherscan API"""
    
    def __init__(self):
        self.api_key = settings.ETHERSCAN_API_KEY
        self.network_config = {
            "mainnet": {
                "url": "https://api.etherscan.io/v2/api",
                "chainid": "1",
                "version": "v2"
            },
            "sepolia": {
                "url": "https://api.etherscan.io/v2/api",  # Same V2 API for all networks
                "chainid": "11155111",
                "version": "v2"
            }
        }
    
    async def get_contract_source(self, contract_address: str, network: str = "mainnet") -> Optional[str]:
        """
        Fetch verified contract source code from Etherscan
        
        Args:
            contract_address: Ethereum contract address (0x...)
            network: Network to query (mainnet or sepolia)
            
        Returns:
            Source code string if found, None otherwise
        """
        if not self.api_key:
            raise ValueError("ETHERSCAN_API_KEY not configured in environment variables")
        
        # Validate contract address format
        if not contract_address or not contract_address.startswith("0x") or len(contract_address) != 42:
            raise ValueError(f"Invalid contract address format: {contract_address}. Expected 42-character hex string starting with 0x")
        
        # Get network configuration
        config = self.network_config.get(network.lower(), self.network_config["mainnet"])
        
        params = {
            "module": "contract",
            "action": "getsourcecode",
            "address": contract_address,
            "apikey": self.api_key
        }
        
        # Add chainid only for V2 API
        if config.get("version") == "v2":
            params["chainid"] = config["chainid"]
        
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.get(config["url"], params=params)
                response.raise_for_status()
                
                data = response.json()
                
                # Check for API errors
                if data["status"] == "0":
                    error_msg = data.get("result", "Unknown error")
                    if "Invalid API Key" in error_msg:
                        raise ValueError("Invalid Etherscan API key")
                    raise ValueError(f"Etherscan API error: {error_msg}")
                
                if data["status"] == "1" and data["result"]:
                    result = data["result"][0]
                    
                    # Check if contract is verified
                    if result.get("ABI") == "Contract source code not verified":
                        raise ValueError(f"Contract at {contract_address} is not verified on {network}. Only verified contracts can be scanned.")
                    
                    source_code = result.get("SourceCode", "")
                    
                    if not source_code:
                        raise ValueError(f"No source code found for contract {contract_address} on {network}")
                    
                    # Handle multi-file contracts (Etherscan returns them as JSON)
                    if source_code.startswith("{{") or source_code.startswith("{"):
                        try:
                            # Try to parse as JSON
                            source_code_clean = source_code.strip("{}")
                            parsed = json.loads(source_code_clean)
                            
                            # Extract all source files
                            if "sources" in parsed:
                                # Standard format: {"sources": {"Contract.sol": {"content": "..."}}}
                                all_sources = []
                                for file_path, file_data in parsed["sources"].items():
                                    content = file_data.get("content", "")
                                    if content:
                                        all_sources.append(f"// File: {file_path}\n{content}")
                                
                                if all_sources:
                                    return "\n\n".join(all_sources)
                            
                            # Fallback: return as-is if parsing fails
                            return source_code
                            
                        except json.JSONDecodeError:
                            # If JSON parsing fails, return raw source
                            return source_code
                    
                    return source_code
                
                raise ValueError(f"No contract found at address {contract_address} on {network}")
                
        except httpx.TimeoutException:
            raise Exception(f"Timeout while fetching contract from Etherscan. Please try again.")
        except httpx.HTTPError as e:
            raise Exception(f"Network error while connecting to Etherscan: {str(e)}")
        except Exception as e:
            if isinstance(e, ValueError):
                raise
            raise Exception(f"Failed to fetch contract source: {str(e)}")
    
    async def verify_contract_exists(self, contract_address: str, network: str = "mainnet") -> bool:
        """Check if contract exists and is verified on Etherscan"""
        try:
            source = await self.get_contract_source(contract_address, network)
            return source is not None and len(source) > 0
        except Exception:
            return False


etherscan_service = EtherscanService()
