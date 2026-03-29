import sqlite3
import os

db_path = "enflomnia_dev.db"

if os.path.exists(db_path):
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    # Correct escaping for SQL: '' for a single quote
    cursor.execute("UPDATE enterprises SET owner_email = 'aaliyakhan4352@gmail.com' WHERE owner_email = 'Video Studio' OR owner_email IS NULL")
    cursor.execute("UPDATE enterprises SET name = 'aaliyakhan4352''s Workspace' WHERE name = 'inflomnia' OR name = 'Video Studio'")
    conn.commit()
    print(f"Update complete. Total changes: {conn.total_changes}")
    conn.close()
else:
    print("Database not found.")
