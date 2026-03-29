import sqlite3
import os

def fix_schema():
    db_path = "enflomnia_dev.db" # Standard local SQLite db
    
    if not os.path.exists(db_path):
        print(f"Database {db_path} not found. Ensure you are in the enflomnia-backend directory.")
        return

    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        print(f"Connected to {db_path}")
        
        # Check if column exists
        cursor.execute("PRAGMA table_info(enterprises)")
        columns = [col[1] for col in cursor.fetchall()]
        
        if "owner_email" not in columns:
            print("Adding column: owner_email to enterprises table...")
            cursor.execute("ALTER TABLE enterprises ADD COLUMN owner_email VARCHAR(255)")
            conn.commit()
            print("Successfully added owner_email column.")
        else:
            print("Column 'owner_email' already exists in enterprises table. No change needed.")
            
        conn.close()
    except Exception as e:
        print(f"Error during migration: {e}")

if __name__ == "__main__":
    fix_schema()
