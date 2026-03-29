import sqlite3
import os

db_path = "enflomnia_dev.db"

if os.path.exists(db_path):
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute("SELECT id, name, owner_email FROM enterprises")
    rows = cursor.fetchall()
    
    with open("db_content.txt", "w") as f:
        for row in rows:
            f.write(f"ID={row['id']} NAME={row['name']} EMAIL={row['owner_email']}\n")
    conn.close()
    print("Done")
else:
    print("Not found")
