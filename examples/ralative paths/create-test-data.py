#!/usr/bin/env python3
"""
Create a test parquet file for testing relative path support in PondPilot widget.
Requires: pip install pandas pyarrow
"""

import pandas as pd
import numpy as np
from datetime import datetime, timedelta

# Generate sample data
np.random.seed(42)
n_rows = 1000

data = {
    'id': range(1, n_rows + 1),
    'user_id': np.random.randint(1, 100, n_rows),
    'event_type': np.random.choice(['click', 'view', 'purchase', 'signup'], n_rows),
    'timestamp': [datetime.now() - timedelta(days=np.random.randint(0, 30)) for _ in range(n_rows)],
    'value': np.random.uniform(0, 100, n_rows).round(2),
    'category': np.random.choice(['electronics', 'clothing', 'books', 'food'], n_rows),
    'is_mobile': np.random.choice([True, False], n_rows)
}

# Create DataFrame
df = pd.DataFrame(data)

# Save to parquet
df.to_parquet('analytics.parquet', index=False)

print(f"Created analytics.parquet with {n_rows} rows")
print(f"Columns: {', '.join(df.columns)}")
print(f"File size: {df.memory_usage(deep=True).sum() / 1024:.2f} KB")
print("\nFirst 5 rows:")
print(df.head())