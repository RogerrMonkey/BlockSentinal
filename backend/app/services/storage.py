"""Supabase Storage Service for managing report files"""
import logging
from pathlib import Path
from typing import Optional
from supabase import create_client, Client
from app.core.config import settings

logger = logging.getLogger(__name__)


class SupabaseStorageService:
    """Service for uploading and managing files in Supabase Storage"""
    
    def __init__(self):
        if not settings.SUPABASE_URL or not settings.SUPABASE_SERVICE_KEY:
            raise ValueError("Supabase credentials not configured")
        
        self.client: Client = create_client(
            settings.SUPABASE_URL,
            settings.SUPABASE_SERVICE_KEY
        )
        self.bucket_name = settings.SUPABASE_STORAGE_BUCKET
        
    def upload_report_content(self, scan_id: str, json_content: str) -> str:
        """
        Upload report content directly to Supabase Storage (no local file needed)
        
        Args:
            scan_id: UUID of the scan
            json_content: JSON string content to upload
            
        Returns:
            Public URL of the uploaded file
        """
        try:
            # Convert JSON string to bytes
            file_content = json_content.encode('utf-8')
            
            # Upload to Supabase Storage
            # Path format: reports/scan_{scan_id}.json
            storage_path = f"reports/scan_{scan_id}.json"
            
            response = self.client.storage.from_(self.bucket_name).upload(
                path=storage_path,
                file=file_content,
                file_options={
                    "content-type": "application/json",
                    "upsert": "true"  # Overwrite if exists
                }
            )
            
            logger.info(f"Uploaded report to Supabase Storage: {storage_path}")
            
            # Get public URL
            public_url = self.client.storage.from_(self.bucket_name).get_public_url(storage_path)
            
            return public_url
            
        except Exception as e:
            logger.error(f"Failed to upload report to Supabase Storage: {e}")
            raise
    
    def delete_report(self, scan_id: str) -> bool:
        """
        Delete a report file from Supabase Storage
        
        Args:
            scan_id: UUID of the scan
            
        Returns:
            True if deleted successfully
        """
        try:
            storage_path = f"reports/scan_{scan_id}.json"
            
            self.client.storage.from_(self.bucket_name).remove([storage_path])
            
            logger.info(f"Deleted report from Supabase Storage: {storage_path}")
            return True
            
        except Exception as e:
            logger.warning(f"Failed to delete report from Supabase Storage: {e}")
            return False
    
    def get_download_url(self, scan_id: str, format: str = "json") -> str:
        """
        Get a public download URL for a report
        
        Args:
            scan_id: UUID of the scan
            format: File format (currently only json supported in storage)
            
        Returns:
            Public download URL
        """
        storage_path = f"reports/scan_{scan_id}.json"
        return self.client.storage.from_(self.bucket_name).get_public_url(storage_path)


# Singleton instance
try:
    storage_service = SupabaseStorageService()
except ValueError as e:
    logger.warning(f"Supabase Storage not available: {e}")
    storage_service = None
