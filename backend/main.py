"""
FastAPI application with PostgreSQL, Redis, and Celery integration
"""

from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from datetime import datetime
from typing import List
import uuid

from database import get_db, engine
from models import Job, JobStatus, JobType
from celery_app import test_job_task
import models

# Create database tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Vintage Queue API",
    description="A 1920s Art Deco styled job queue management system",
    version="0.1.0"
)

# CORS middleware for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Vite default port
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health check endpoint
@app.get("/")
async def root():
    """Root endpoint - API health check"""
    return {"message": "Vintage Queue API v0.1.0", "status": "operational"}

# GATHER ENDPOINTS
@app.post("/gather/queue-test-job")
async def queue_test_job(db: Session = Depends(get_db)):
    """
    Create a test job that runs for 20 seconds
    Demonstrates the job queuing and progress tracking system
    """
    try:
        # Create job record in database
        job = Job(
            id=str(uuid.uuid4()),
            type=JobType.TEST,
            status=JobStatus.QUEUED,
            progress=0,
            created_at=datetime.utcnow()
        )
        
        db.add(job)
        db.commit()
        db.refresh(job)
        
        # Queue the Celery task
        test_job_task.delay(job.id)
        
        return {
            "job_id": job.id,
            "message": "Test job queued successfully",
            "status": job.status.value
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to queue job: {str(e)}")

@app.get("/gather/jobs")
async def get_all_jobs(db: Session = Depends(get_db)):
    """
    Retrieve all jobs for the Gather section display
    Returns job list with status and timing information
    """
    try:
        jobs = db.query(Job).order_by(Job.created_at.desc()).all()
        
        return {
            "jobs": [
                {
                    "job_id": job.id,
                    "type": job.type.value,
                    "status": job.status.value,
                    "progress": job.progress,
                    "created_at": job.created_at.isoformat(),
                    "completed_at": job.completed_at.isoformat() if job.completed_at else None
                }
                for job in jobs
            ],
            "total_count": len(jobs)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve jobs: {str(e)}")

@app.get("/jobs/{job_id}/status")
async def get_job_status(job_id: str, db: Session = Depends(get_db)):
    """
    Get detailed status information for a specific job
    Used for real-time status updates in the frontend
    """
    try:
        job = db.query(Job).filter(Job.id == job_id).first()
        
        if not job:
            raise HTTPException(status_code=404, detail="Job not found")
        
        return {
            "job_id": job.id,
            "type": job.type.value,
            "status": job.status.value,
            "progress": job.progress,
            "created_at": job.created_at.isoformat(),
            "completed_at": job.completed_at.isoformat() if job.completed_at else None,
            "duration_seconds": (
                (job.completed_at - job.created_at).total_seconds() 
                if job.completed_at else 
                (datetime.utcnow() - job.created_at).total_seconds()
            )
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get job status: {str(e)}")

# PLACEHOLDER ENDPOINTS FOR OTHER SECTIONS
# These demonstrate the API structure for future development

@app.get("/transcribe/status")
async def transcribe_status():
    """Placeholder for transcription service status"""
    return {"section": "transcribe", "status": "ready", "message": "Transcription services ready"}

@app.get("/organize/categories")
async def get_categories():
    """Placeholder for content organization categories"""
    return {"section": "organize", "categories": ["documents", "media", "archives"], "status": "ready"}

@app.get("/consume/recent")
async def get_recent_content():
    """Placeholder for recent content consumption"""
    return {"section": "consume", "recent_items": [], "status": "ready"}

# Import dependency after app creation to avoid circular imports
from fastapi import Depends