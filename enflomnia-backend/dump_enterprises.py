import sqlite3
import os

db_path = "enflomnia_dev.db"

if os.path.exists(db_path):
    conn = sqlite3.connect(db_path)
    # Return rows as dictionaries
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM enterprises")
    rows = cursor.fetchall()
    
    for row in rows:
        print(dict(row))
    conn.close()
else:
    print(f"Database {db_path} not found.")
