"""
Migration script to add current_stage column to scans table
"""
import sys
import os
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from dotenv import load_dotenv
import psycopg2

# Load environment variables
env_path = Path(__file__).parent.parent.parent / ".env"
print(f"Looking for .env at: {env_path}")
load_dotenv(env_path)

# Get database URL
db_url = os.getenv("DATABASE_URL")
if not db_url:
    print("ERROR: DATABASE_URL not found in .env file")
    sys.exit(1)

print(f"Connecting to database...")

# Read migration SQL
migration_file = Path(__file__).parent / "add_current_stage_column.sql"
with open(migration_file, 'r') as f:
    migration_sql = f.read()

try:
    # Connect to database
    conn = psycopg2.connect(db_url)
    cursor = conn.cursor()
    
    print("Running migration...")
    
    # Execute migration
    cursor.execute(migration_sql)
    conn.commit()
    
    print("✓ Migration completed successfully!")
    print("  - Added 'current_stage' column to scans table")
    print("  - Created index on current_stage")
    print("  - Updated existing scans")
    
    cursor.close()
    conn.close()
    
except Exception as e:
    print(f"ERROR: Migration failed: {e}")
    sys.exit(1)
