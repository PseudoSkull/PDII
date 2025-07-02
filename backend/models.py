"""
Database models for the Vintage Queue system
Defines Job table structure and related enums
"""

from sqlalchemy import Column, String, Integer, DateTime, Enum as SQLEnum
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime
import enum

from database import Base

class JobStatus(enum.Enum):
    """Job status enumeration for tracking job lifecycle"""
    QUEUED = "queued"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"

class JobType(enum.Enum):
    """Job type enumeration for different processing categories"""
    TEST = "test"
    VIDEO_PROCESSING = "video_processing"
    OCR_PROCESSING = "ocr_processing"
    CATEGORIZATION = "categorization"
    MEDIA_CONSUMPTION = "media_consumption"

class Job(Base):
    """
    Job model representing a queued task in the system
    Tracks job lifecycle from creation to completion
    """
    __tablename__ = "jobs"
    
    # Primary key - UUID string for distributed system compatibility
    id = Column(String, primary_key=True, index=True)
    
    # Job classification
    type = Column(SQLEnum(JobType), nullable=False, index=True)
    
    # Job status tracking
    status = Column(SQLEnum(JobStatus), nullable=False, default=JobStatus.QUEUED, index=True)
    
    # Progress tracking (0-100)
    progress = Column(Integer, default=0, nullable=False)
    
    # Timestamp tracking
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    completed_at = Column(DateTime, nullable=True)
    
    def __repr__(self):
        return f"<Job(id={self.id}, type={self.type.value}, status={self.status.value})>"
    
    def to_dict(self):
        """Convert job to dictionary for API responses"""
        return {
            "id": self.id,
            "type": self.type.value,
            "status": self.status.value,
            "progress": self.progress,
            "created_at": self.created_at.isoformat(),
            "completed_at": self.completed_at.isoformat() if self.completed_at else None
        }