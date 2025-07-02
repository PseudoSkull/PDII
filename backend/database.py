"""
Database configuration and session management
PostgreSQL connection with SQLAlchemy ORM
"""

from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os

# Database configuration
DATABASE_URL = os.getenv(
    "DATABASE_URL", 
    "postgresql://vintage_user:vintage_pass@localhost:5432/vintage_queue"
)

# Create SQLAlchemy engine
engine = create_engine(
    DATABASE_URL,
    # Connection pool settings for production readiness
    pool_size=10,
    max_overflow=20,
    pool_pre_ping=True,  # Validates connections before use
    echo=False  # Set to True for SQL query logging during development
)

# Create SessionLocal class for database sessions
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create Base class for models
Base = declarative_base()

def get_db():
    """
    Database dependency for FastAPI endpoints
    Provides database session with automatic cleanup
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()