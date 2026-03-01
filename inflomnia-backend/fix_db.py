import sqlite3

def fix_db():
    try:
        conn = sqlite3.connect('inflomnia_dev.db')
        cursor = conn.cursor()
        
        # Get existing columns
        cursor.execute("PRAGMA table_info(reels);")
        existing_cols = {row[1] for row in cursor.fetchall()}
        
        columns_to_add = [
            ("hook_quality_score", "FLOAT"),
            ("analysis_summary", "TEXT"),
            ("best_practices", "TEXT"),
            ("improvement_tips", "TEXT"),
            ("anomaly_type", "VARCHAR"),
            ("anomaly_confidence", "FLOAT"),
            ("anomaly_reasoning", "VARCHAR"),
            ("fetched_at", "DATETIME")
        ]
        
        for col_name, col_type in columns_to_add:
            if col_name not in existing_cols:
                print(f"Adding column {col_name}...")
                cursor.execute(f"ALTER TABLE reels ADD COLUMN {col_name} {col_type}")
                
        conn.commit()
        conn.close()
        print("Database schema successfully updated!")
    except Exception as e:
        print(f"Error updating database: {e}")

if __name__ == "__main__":
    fix_db()
