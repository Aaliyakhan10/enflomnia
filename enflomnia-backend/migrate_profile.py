import sqlite3
import os
from app.config import get_settings

def migrate():
    settings = get_settings()
    db_path = settings.database_url.replace("sqlite:///", "")
    
    if not os.path.exists(db_path):
        print(f"Database not found at {db_path}, skipping migration.")
        return

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    new_cols = [
        ("primary_product", "TEXT"),
        ("target_audience", "TEXT"),
        ("brand_voice", "TEXT"),
        ("main_objectives", "TEXT")
    ]
    
    for col_name, col_type in new_cols:
        try:
            cursor.execute(f"ALTER TABLE enterprises ADD COLUMN {col_name} {col_type} DEFAULT ''")
            print(f"Added column {col_name}")
        except sqlite3.OperationalError as e:
            if "duplicate column name" in str(e).lower():
                print(f"Column {col_name} already exists.")
            else:
                print(f"Error adding {col_name}: {e}")
                
    conn.commit()
    conn.close()

if __name__ == "__main__":
    migrate()
