import sqlite3
import os

db_path = "enflomnia_dev.db"

if os.path.exists(db_path):
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM enterprises")
    rows = cursor.fetchall()
    
    with open("db_dump.txt", "w") as f:
        for row in rows:
            f.write(str(dict(row)) + "\n")
    conn.close()
    print("Dumped to db_dump.txt")
else:
    print(f"Database {db_path} not found.")
