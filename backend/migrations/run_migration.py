"""
Run all SQL migrations in backend/migrations.

This script is idempotent because migration SQL files use IF NOT EXISTS where needed.
"""
from pathlib import Path
import os
import sys

from dotenv import load_dotenv
import psycopg2


def main() -> int:
    # Load DATABASE_URL from project root .env
    env_path = Path(__file__).parent.parent.parent / ".env"
    print(f"Looking for .env at: {env_path}")
    load_dotenv(env_path)

    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        print("ERROR: DATABASE_URL not found in .env file")
        return 1

    migrations_dir = Path(__file__).parent
    migration_files = sorted(
        [
            p
            for p in migrations_dir.glob("*.sql")
            if p.name.startswith("add_")
        ]
    )

    if not migration_files:
        print("No SQL migration files found.")
        return 0

    print("Connecting to database...")

    try:
        conn = psycopg2.connect(database_url)
        cursor = conn.cursor()

        print("Running migrations...")
        for migration_path in migration_files:
            print(f"  - Applying {migration_path.name}")
            with open(migration_path, encoding="utf-8") as f:
                migration_sql = f.read()
            cursor.execute(migration_sql)

        conn.commit()
        cursor.close()
        conn.close()

        print("✓ Migrations completed successfully!")
        for migration_path in migration_files:
            print(f"  - {migration_path.name}")
        return 0

    except Exception as e:
        print(f"ERROR: Migration failed: {e}")
        return 1


if __name__ == "__main__":
    sys.exit(main())
