from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker, declarative_base
from app.core.config import settings

_is_sqlite = settings.DATABASE_URL and settings.DATABASE_URL.startswith("sqlite")

# SQLite needs check_same_thread=False for FastAPI's threading model.
# PostgreSQL (Neon/production) works without extra connect_args but benefits
# from pool_size=0 on serverless to avoid connection exhaustion.
if _is_sqlite:
    engine = create_engine(
        settings.DATABASE_URL,
        connect_args={"check_same_thread": False},
        pool_pre_ping=True,
    )

    @event.listens_for(engine, "connect")
    def _enable_sqlite_foreign_keys(dbapi_connection, _connection_record):
        """SQLite ignores FK constraints unless enabled per connection.

        Without this, deleting a syllabus node silently orphaned learner
        progress rows (the June 2026 destructive reseed did exactly that).
        PostgreSQL enforces FKs natively; this brings local SQLite in line so
        a broken delete fails loudly instead of corrupting history.
        """
        cursor = dbapi_connection.cursor()
        try:
            cursor.execute("PRAGMA foreign_keys=ON")
        finally:
            cursor.close()
else:
    # Serverless-safe PostgreSQL pool: NullPool avoids holding connections
    # across Lambda/Vercel invocations which would exhaust the DB.
    from sqlalchemy.pool import NullPool
    engine = create_engine(
        settings.DATABASE_URL,
        pool_pre_ping=True,
        poolclass=NullPool,
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
