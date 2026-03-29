import sqlite3
import os

for db in ["enflomnia_dev.db", "inflomnia_dev.db"]:
    if os.path.exists(db):
        print(f"--- {db} ---")
        try:
            conn = sqlite3.connect(db)
            cursor = conn.cursor()
            cursor.execute("PRAGMA table_info(enterprises)")
            columns = [col[1] for col in cursor.fetchall()]
            print(f"Columns: {columns}")
            conn.close()
        except Exception as e:
            print(f"Error checking {db}: {e}")
    else:
        print(f"Database {db} not found.")
