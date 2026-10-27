"""
Elexon BMRS Data Ingestion Utility for UK Day-Ahead Power Procurement Suite.
Ingests FUELHH (Actual Wind Generation) and WINDFOR (Day-Ahead Forecasts)
into the backend SQLite database (elexon_jan2026.db).
"""

import urllib.request
import json
import sqlite3
import os
import time
from datetime import datetime, timedelta
from pathlib import Path
import argparse

DB_PATH = Path(__file__).resolve().parent / "elexon_jan2026.db"

def init_db(conn):
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
    conn.commit()

def ingest_actuals(start_date="2026-01-01", end_date="2026-02-01"):
    print(f"[*] Ingesting FUELHH wind actuals ({start_date} to {end_date})...", flush=True)
    conn = sqlite3.connect(DB_PATH)
    init_db(conn)
    
    url = f"https://data.elexon.co.uk/bmrs/api/v1/datasets/FUELHH/stream?settlementDateFrom={start_date}&settlementDateTo={end_date}"
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    
    with urllib.request.urlopen(req, timeout=60) as resp:
        data = json.loads(resp.read().decode('utf-8'))
        
    wind_items = [x for x in data if x.get('fuelType') == 'WIND']
    rows = [
        (x['startTime'], x.get('settlementDate'), x.get('settlementPeriod'), x.get('generation'), x.get('publishTime'))
        for x in wind_items if x.get('startTime')
    ]
    
    conn.executemany("""
    INSERT OR REPLACE INTO actuals (startTime, settlementDate, settlementPeriod, generation, publishTime)
    VALUES (?, ?, ?, ?, ?)
    """, rows)
    conn.commit()
    conn.close()
    print(f"[+] Saved {len(rows)} actual wind generation records.", flush=True)

def ingest_forecasts(start_pub="2025-12-30T00:00:00Z", end_pub="2026-02-01T23:59:59Z", chunk_days=3):
    print(f"[*] Ingesting WINDFOR forecast revisions ({start_pub} to {end_pub})...", flush=True)
    conn = sqlite3.connect(DB_PATH)
    init_db(conn)
    
    start_dt = datetime.strptime(start_pub, "%Y-%m-%dT%H:%M:%SZ")
    end_dt = datetime.strptime(end_pub, "%Y-%m-%dT%H:%M:%SZ")
    curr = start_dt
    total = 0
    
    while curr < end_dt:
        chunk_end = min(curr + timedelta(days=chunk_days) - timedelta(seconds=1), end_dt)
        p_from = curr.strftime("%Y-%m-%dT%H:%M:%SZ")
        p_to = chunk_end.strftime("%Y-%m-%dT%H:%M:%SZ")
        
        url = f"https://data.elexon.co.uk/bmrs/api/v1/datasets/WINDFOR/stream?publishDateTimeFrom={p_from}&publishDateTimeTo={p_to}"
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        
        try:
            with urllib.request.urlopen(req, timeout=60) as resp:
                data = json.loads(resp.read().decode('utf-8'))
            
            rows = [
                (x['startTime'], x['publishTime'], x.get('generation'))
                for x in data if x.get('startTime') and x.get('publishTime')
            ]
            conn.executemany("""
            INSERT OR REPLACE INTO forecasts (startTime, publishTime, generation)
            VALUES (?, ?, ?)
            """, rows)
            conn.commit()
            total += len(rows)
            print(f"    Chunk {p_from} -> {p_to}: {len(rows)} records (Total: {total})", flush=True)
        except Exception as e:
            print(f"    Error on chunk {p_from}: {e}", flush=True)
            time.sleep(2)
            
        curr = chunk_end + timedelta(seconds=1)
        
    conn.close()
    print(f"[+] Successfully ingested {total} forecast records.", flush=True)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Ingest Elexon BMRS Data for Day-Ahead Power Desk")
    parser.add_argument("--actuals", action="store_true", help="Ingest actuals")
    parser.add_argument("--forecasts", action="store_true", help="Ingest forecasts")
    parser.add_argument("--all", action="store_true", help="Ingest both actuals and forecasts")
    args = parser.parse_args()
    
    if args.all or (not args.actuals and not args.forecasts):
        ingest_actuals()
        ingest_forecasts()
    else:
        if args.actuals:
            ingest_actuals()
        if args.forecasts:
            ingest_forecasts()
