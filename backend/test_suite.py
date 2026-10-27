"""
Automated Test Suite for UK Day-Ahead Power Procurement & Wind Forecast Analytics.
Verifies API endpoints, domain calculation correctness, and absence of data leakage.
"""

import sys
import os
import unittest
import numpy as np
import pandas as pd
from pathlib import Path

# Ensure backend package is in path
backend_dir = Path(__file__).resolve().parent
sys.path.insert(0, str(backend_dir.parent))

from backend.app.database import get_db_connection
from backend.app.data_service import DataService
from backend.app.analytics import compute_error_metrics, calculate_settlement_period_profile, generate_uk_demand_profile

class TestElexonAnalytics(unittest.TestCase):
    def test_database_counts(self):
        """Verify database contains complete January 2026 data."""
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("SELECT count(*) FROM actuals")
        act_count = cur.fetchone()[0]
        cur.execute("SELECT count(*) FROM forecasts")
        fc_count = cur.fetchone()[0]
        conn.close()
        
        self.assertGreaterEqual(act_count, 1488, "Must contain at least 1,488 actual wind records (31 days * 48 SPs)")
        self.assertGreater(fc_count, 15000, "Must contain forecast revisions for all delivery days")

    def test_gate_closure_cutoff_no_lookahead(self):
        """Verify no forecasts published after cutoff time are included in Day-Ahead decisions."""
        df = DataService.get_day_ahead_dataset(start_date="2026-01-05", end_date="2026-01-05", cutoff_time="11:00")
        self.assertFalse(df.empty, "Should retrieve merged dataset for 2026-01-05")
        self.assertEqual(len(df), 48, "Must contain exactly 48 settlement periods")
        
        # Verify forecast_publishTime <= 2026-01-04T11:00:00Z
        expected_cutoff = "2026-01-04T11:00:00Z"
        for pub_time in df['forecast_publishTime'].dropna():
            self.assertLessEqual(pub_time, expected_cutoff, f"Data leakage detected: {pub_time} > {expected_cutoff}")

    def test_january_summary_metrics(self):
        """Verify January 2026 error metrics match empirical benchmarks."""
        df = DataService.get_day_ahead_dataset(start_date="2026-01-01", end_date="2026-01-31", cutoff_time="11:00")
        metrics = compute_error_metrics(df['forecast_mw'].values, df['actual_mw'].values)
        
        self.assertEqual(metrics['count'], 1488)
        self.assertAlmostEqual(metrics['mae'], 2126.12, delta=5.0)
        self.assertAlmostEqual(metrics['bias'], 1840.30, delta=5.0)
        self.assertEqual(metrics['bias_direction'], "OVER_FORECAST")
        self.assertGreater(metrics['correlation'], 0.90)

    def test_settlement_period_profile(self):
        """Verify all 48 settlement periods are represented in diurnal profile."""
        df = DataService.get_day_ahead_dataset(start_date="2026-01-01", end_date="2026-01-31", cutoff_time="11:00")
        profile = calculate_settlement_period_profile(df)
        self.assertEqual(len(profile), 48)
        
        # Verify peak periods (SPs 33-39) are tagged
        for p in profile:
            if 33 <= p['settlementPeriod'] <= 39:
                self.assertTrue(p['is_peak'])
            else:
                self.assertFalse(p['is_peak'])

    def test_lead_time_decay_monotonicity(self):
        """Verify forecast error decays as real-time approaches (48h down to 2h)."""
        stats = DataService.get_lead_time_decay_metrics()
        self.assertEqual(len(stats), 5)
        
        d2 = next(s for s in stats if "48 Hours" in s['horizon_name'])
        da = next(s for s in stats if "24 Hours" in s['horizon_name'])
        intraday = next(s for s in stats if "6 Hours" in s['horizon_name'])
        gate_closure = next(s for s in stats if "2 Hours" in s['horizon_name'])
        
        # MAE should strictly decrease from D-2 to real-time
        self.assertGreater(d2['mae'], da['mae'], "48h MAE should exceed 24h MAE")
        self.assertGreater(da['mae'], intraday['mae'], "24h MAE should exceed 6h Intraday MAE")
        self.assertGreater(intraday['mae'], gate_closure['mae'], "6h Intraday MAE should exceed 2h pre-gate MAE")

if __name__ == "__main__":
    unittest.main()
