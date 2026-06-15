# Verified Migration Order

Current local Alembic head:

`b29e6d8c4a12`

Required order from the current branch:

1. `9d91e7261997_fix_db_drift_missing_columns.py`
2. `a18f2c7d9e41_fix_upsc_batch_marking_scheme.py`
3. `b29e6d8c4a12_quarantine_corrupted_environment_batch1.py`

Local command used:

```powershell
cd backend
$env:DATABASE_URL='sqlite:///./production.db'
.\venv\Scripts\python.exe -m alembic upgrade head
```

Production must run the same Alembic head before frontend release validation.
