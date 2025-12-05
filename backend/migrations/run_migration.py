"""
Run database migration to add detected_by column to findings table
"""
import psycopg2
import os
from pathlib import Path

# Load DATABASE_URL from .env
env_path = Path(__file__).parent.parent.parent / ".env"  # Go up to project root
database_url = None

print(f"Looking for .env at: {env_path}")

with open(env_path) as f:
    for line in f:
        if line.startswith("DATABASE_URL="):
            database_url = line.strip().split("=", 1)[1]
            break

if not database_url:
    print("ERROR: DATABASE_URL not found in .env file")
    exit(1)

print(f"Connecting to database...")

try:
    # Connect to database
    conn = psycopg2.connect(database_url)
    cursor = conn.cursor()
    
    # Read migration file
    migration_path = Path(__file__).parent / "add_detected_by_column.sql"
    with open(migration_path) as f:
        migration_sql = f.read()
    
    print("Running migration...")
    cursor.execute(migration_sql)
    conn.commit()
    
    print("✓ Migration completed successfully!")
    print("  - Added 'detected_by' column to findings table")
    print("  - Updated existing findings with default value 'slither'")
    
    cursor.close()
    conn.close()
    
except Exception as e:
    print(f"ERROR: Migration failed: {e}")
    exit(1)
