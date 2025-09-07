#!/usr/bin/env python3
# /// script
# requires-python = ">=3.8"
# dependencies = [
#   "duckdb>=0.9",
#   "pandas>=2.0",
# ]
# ///
"""
Create a tiny DuckDB database file for the widget example.

This script creates examples/data/blog.duckdb with a simple table main.orders.

Run with uv (recommended):
  uv run examples/create-blog-db.py

Or install deps manually:
  pip install duckdb pandas

Usage:
  python3 examples/create-blog-db.py

After creating the file, serve the repo and open the example:
  python3 -m http.server 8080
  open http://localhost:8080/examples/local-duckdb.html
"""

import os
from pathlib import Path

import duckdb  # type: ignore
import pandas as pd  # type: ignore


def main() -> None:
    data_dir = Path(__file__).parent / "data"
    data_dir.mkdir(parents=True, exist_ok=True)
    db_path = data_dir / "blog.duckdb"

    # Small synthetic dataset
    df = pd.DataFrame(
        [
            {"order_id": 1, "customer": "Alice", "amount": 29.99, "created_at": "2024-01-05"},
            {"order_id": 2, "customer": "Bob", "amount": 49.50, "created_at": "2024-01-12"},
            {"order_id": 3, "customer": "Charlie", "amount": 15.00, "created_at": "2024-02-01"},
            {"order_id": 4, "customer": "Diana", "amount": 99.95, "created_at": "2024-02-14"},
            {"order_id": 5, "customer": "Eve", "amount": 10.00, "created_at": "2024-03-02"},
        ]
    )

    # Create database and persist the DataFrame as main.orders
    con = duckdb.connect(str(db_path))
    try:
        con.execute("CREATE SCHEMA IF NOT EXISTS main;")
        con.register("orders_df", df)
        con.execute("CREATE OR REPLACE TABLE main.orders AS SELECT * FROM orders_df;")
        # Also add a small second table to show joins if desired
        customers = pd.DataFrame(
            [
                {"customer": "Alice", "tier": "gold"},
                {"customer": "Bob", "tier": "silver"},
                {"customer": "Charlie", "tier": "bronze"},
                {"customer": "Diana", "tier": "gold"},
                {"customer": "Eve", "tier": "silver"},
            ]
        )
        con.register("customers_df", customers)
        con.execute("CREATE OR REPLACE TABLE main.customers AS SELECT * FROM customers_df;")
    finally:
        con.close()

    size_kb = os.path.getsize(db_path) / 1024.0
    print(f"Created {db_path} ({size_kb:.1f} KB)")
    print("Tables:")
    print(" - main.orders (5 rows)")
    print(" - main.customers (5 rows)")


if __name__ == "__main__":
    main()
