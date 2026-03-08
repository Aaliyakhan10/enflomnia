import sqlite3
import os

db_path = "inflomnia_dev.db"

def migrate():
    print(f"Connecting to {db_path}...")
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        print("Checking for is_ai_discovered column in brands table...")
        cursor.execute("PRAGMA table_info(brands)")
        columns = [col[1] for col in cursor.fetchall()]
        
        if "is_ai_discovered" not in columns:
            print("Adding is_ai_discovered column to brands table...")
            cursor.execute("ALTER TABLE brands ADD COLUMN is_ai_discovered TEXT DEFAULT 'false'")
            conn.commit()
            print("Column added successfully.")
        else:
            print("Column is_ai_discovered already exists.")
            
    except Exception as e:
        print(f"Error during migration: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    migrate()
