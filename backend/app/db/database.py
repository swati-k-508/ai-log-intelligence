import os
from sqlalchemy import create_engine, event
from sqlalchemy.orm import declarative_base, sessionmaker

DB_PATH = os.getenv("DATABASE_URL", "sqlite:///./ulpf.db")

engine = create_engine(
    DB_PATH, connect_args={"check_same_thread": False} if DB_PATH.startswith("sqlite") else {}
)

if DB_PATH.startswith("sqlite"):
    @event.listens_for(engine, "connect")
    def set_sqlite_pragma(dbapi_connection, connection_record):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA journal_mode = WAL")
        cursor.execute("PRAGMA synchronous = NORMAL")
        cursor.execute("PRAGMA cache_size = -64000") # 64MB cache
        cursor.execute("PRAGMA temp_store = MEMORY")
        cursor.close()

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
