"""
Celery application configuration and task definitions
Handles background job processing with Redis broker
"""

from celery import Celery
import time
from datetime import datetime
from sqlalchemy.orm import Session

from database import SessionLocal
from models import Job, JobStatus

# Create Celery application instance
celery_app = Celery(
    "vintage_queue",
    broker="redis://localhost:6379/0",  # Redis broker URL
    backend="redis://localhost:6379/0",  # Redis result backend
    include=["celery_app"]  # Include this module for task discovery
)

# Celery configuration
celery_app.conf.update(
    # Task execution settings
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    
    # Worker settings
    worker_prefetch_multiplier=1,  # Process one task at a time
    task_acks_late=True,  # Acknowledge task after completion
    worker_disable_rate_limits=False,
    
    # Result settings
    result_expires=3600,  # Results expire after 1 hour
    
    # Task routing (for future expansion)
    task_routes={
        "celery_app.test_job_task": {"queue": "test_queue"},
    }
)

def get_db_session():
    """Get database session for Celery tasks"""
    return SessionLocal()

@celery_app.task(bind=True)
def test_job_task(self, job_id: str):
    """
    Test job task that runs for 20 seconds with progress updates
    Demonstrates job lifecycle management and progress tracking
    
    Args:
        job_id (str): The ID of the job to process
        
    Returns:
        dict: Task completion status and timing information
    """
    db = get_db_session()
    
    try:
        # Get job from database
        job = db.query(Job).filter(Job.id == job_id).first()
        if not job:
            raise Exception(f"Job {job_id} not found")
        
        # Update job status to running
        job.status = JobStatus.RUNNING
        job.progress = 0
        db.commit()
        
        print(f"Starting test job {job_id}")
        
        # Simulate work with progress updates
        total_duration = 20  # 20 seconds total
        progress_steps = [0, 25, 50, 75, 100]
        
        for i, progress in enumerate(progress_steps):
            if i > 0:  # Don't sleep before first update
                time.sleep(total_duration / (len(progress_steps) - 1))
            
            # Update progress in database
            job.progress = progress
            db.commit()
            
            # Update task state for Celery monitoring
            self.update_state(
                state="PROGRESS",
                meta={
                    "current": progress,
                    "total": 100,
                    "job_id": job_id,
                    "message": f"Processing... {progress}% complete"
                }
            )
            
            print(f"Job {job_id}: {progress}% complete")
        
        # Mark job as completed
        job.status = JobStatus.COMPLETED
        job.progress = 100
        job.completed_at = datetime.utcnow()
        db.commit()
        
        result = {
            "job_id": job_id,
            "status": "completed",
            "message": "Test job completed successfully",
            "duration_seconds": total_duration,
            "completed_at": job.completed_at.isoformat()
        }
        
        print(f"Completed test job {job_id}")
        return result
        
    except Exception as e:
        # Handle task failure
        print(f"Job {job_id} failed: {str(e)}")
        
        if 'job' in locals():
            job.status = JobStatus.FAILED
            job.progress = 0
            db.commit()
        
        # Update task state to failed
        self.update_state(
            state="FAILURE",
            meta={
                "job_id": job_id,
                "error": str(e),
                "message": "Test job failed"
            }
        )
        
        raise
        
    finally:
        db.close()

# Additional task for future expansion
@celery_app.task
def cleanup_old_jobs():
    """
    Cleanup task to remove old completed jobs
    Can be scheduled to run periodically
    """
    db = get_db_session()
    try:
        # This would contain logic to clean up old jobs
        # For now, just return a status message
        return {"message": "Job cleanup completed", "timestamp": datetime.utcnow().isoformat()}
    finally:
        db.close()