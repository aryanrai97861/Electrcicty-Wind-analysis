import sqlite3
import os
from pathlib import Path

# Database path can be configured via environment variable or default
DB_DIR = Path(__file__).resolve().parent.parent
DB_PATH = os.environ.get("DATABASE_PATH", str(DB_DIR / "elexon_jan2026.db"))

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    with conn:
        conn.execute("""
        CREATE TABLE IF NOT EXISTS actuals (
            startTime TEXT PRIMARY KEY,
            settlementDate TEXT,
            settlementPeriod INTEGER,
            generation REAL,
            publishTime TEXT
        )
        """)
        conn.execute("""
        CREATE TABLE IF NOT EXISTS forecasts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            startTime TEXT,
            publishTime TEXT,
            generation REAL,
            UNIQUE(startTime, publishTime)
        )
        """)
        conn.execute("CREATE INDEX IF NOT EXISTS idx_forecast_start ON forecasts(startTime)")
        conn.execute("CREATE INDEX IF NOT EXISTS idx_forecast_pub ON forecasts(publishTime)")
        conn.execute("CREATE INDEX IF NOT EXISTS idx_actual_start ON actuals(startTime)")
        conn.execute("CREATE INDEX IF NOT EXISTS idx_actual_date ON actuals(settlementDate)")
    conn.close()
