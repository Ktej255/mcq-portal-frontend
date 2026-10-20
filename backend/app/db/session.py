from sqlalchemy import create_engine
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
