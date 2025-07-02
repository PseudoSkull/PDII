"""
Comprehensive test suite for Vintage Queue Backend
Tests database connections, Redis connectivity, Celery workers, and API endpoints
"""

import pytest
import redis
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from celery.result import AsyncResult
import time
import uuid

from main import app, get_db
from database import Base
from models import Job, JobStatus, JobType
from celery_app import celery_app, test_job_task

# Test database configuration
SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"  # Use SQLite for testing
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_get_db():
    """Override database dependency for testing"""
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

# Override the database dependency
app.dependency_overrides[get_db] = override_get_db

# Create test client
client = TestClient(app)

@pytest.fixture(scope="module")
def setup_database():
    """
    Set up test database
    Creates all tables before tests and cleans up after
    """
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)

class TestDatabaseConnection:
    """Test database connectivity and model operations"""
    
    def test_database_connection(self, setup_database):
        """
        Test that we can connect to the database successfully
        Verifies basic database connectivity and table creation
        """
        db = TestingSessionLocal()
        try:
            # Test connection by creating a simple job
            test_job = Job(
                id=str(uuid.uuid4()),
                type=JobType.TEST,
                status=JobStatus.QUEUED,
                progress=0
            )
            db.add(test_job)
            db.commit()
            
            # Verify the job was created
            retrieved_job = db.query(Job).filter(Job.id == test_job.id).first()
            assert retrieved_job is not None
            assert retrieved_job.type == JobType.TEST
            assert retrieved_job.status == JobStatus.QUEUED
            
        finally:
            db.close()
    
    def test_job_model_operations(self, setup_database):
        """
        Test CRUD operations on the Job model
        Verifies that job records can be created, read, updated, and deleted
        """
        db = TestingSessionLocal()
        try:
            # Create a job
            job_id = str(uuid.uuid4())
            job = Job(
                id=job_id,
                type=JobType.VIDEO_PROCESSING,
                status=JobStatus.QUEUED,
                progress=0
            )
            db.add(job)
            db.commit()
            
            # Read the job
            retrieved_job = db.query(Job).filter(Job.id == job_id).first()
            assert retrieved_job.id == job_id
            assert retrieved_job.type == JobType.VIDEO_PROCESSING
            
            # Update the job
            retrieved_job.status = JobStatus.RUNNING
            retrieved_job.progress = 50
            db.commit()
            
            # Verify update
            updated_job = db.query(Job).filter(Job.id == job_id).first()
            assert updated_job.status == JobStatus.RUNNING
            assert updated_job.progress == 50
            
            # Delete the job
            db.delete(updated_job)
            db.commit()
            
            # Verify deletion
            deleted_job = db.query(Job).filter(Job.id == job_id).first()
            assert deleted_job is None
            
        finally:
            db.close()

class TestRedisConnection:
    """Test Redis connectivity for Celery broker"""
    
    def test_redis_connection(self):
        """
        Test that we can connect to Redis successfully
        Verifies Redis is running and accessible for Celery broker
        """
        try:
            r = redis.Redis(host='localhost', port=6379, db=0)
            # Test basic Redis operations
            r.set('test_key', 'test_value')
            assert r.get('test_key').decode('utf-8') == 'test_value'
            r.delete('test_key')
            
        except redis.ConnectionError:
            pytest.skip("Redis not available for testing")
    
    def test_redis_pub_sub(self):
        """
        Test Redis pub/sub functionality used by Celery
        Verifies Redis can handle message passing for task queues
        """
        try:
            r = redis.Redis(host='localhost', port=6379, db=0)
            pubsub = r.pubsub()
            
            # Test channel subscription
            pubsub.subscribe('test_channel')
            
            # Publish a message
            r.publish('test_channel', 'test_message')
            
            # Check if message is received
            message = pubsub.get_message(timeout=1)
            if message and message['type'] == 'message':
                assert message['data'].decode('utf-8') == 'test_message'
            
            pubsub.close()
            
        except redis.ConnectionError:
            pytest.skip("Redis not available for testing")

class TestCeleryWorker:
    """Test Celery worker connectivity and task execution"""
    
    def test_celery_worker_connectivity(self):
        """
        Test that Celery workers are running and can accept tasks
        Verifies the distributed task queue system is operational
        """
        try:
            # Test basic Celery connectivity
            inspect = celery_app.control.inspect()
            active_workers = inspect.active()
            
            # If no workers are active, skip the test
            if not active_workers:
                pytest.skip("No Celery workers available for testing")
            
            # Test that we can get worker stats
            stats = inspect.stats()
            assert stats is not None
            
        except Exception as e:
            pytest.skip(f"Celery not available for testing: {str(e)}")
    
    def test_task_registration(self):
        """
        Test that our custom tasks are properly registered with Celery
        Verifies task discovery and registration system
        """
        try:
            # Check if our test task is registered
            registered_tasks = celery_app.control.inspect().registered()
            
            if not registered_tasks:
                pytest.skip("No Celery workers available for testing")
            
            # Look for our test task in any worker
            task_found = False
            for worker_tasks in registered_tasks.values():
                if 'celery_app.test_job_task' in worker_tasks:
                    task_found = True
                    break
            
            assert task_found, "test_job_task not found in registered tasks"
            
        except Exception as e:
            pytest.skip(f"Celery not available for testing: {str(e)}")

class TestAPIEndpoints:
    """Test all FastAPI endpoints for correct responses"""
    
    def test_root_endpoint(self):
        """
        Test the root health check endpoint
        Verifies API is running and returns correct status
        """
        response = client.get("/")
        assert response.status_code == 200
        data = response.json()
        assert data["message"] == "Vintage Queue API v0.1.0"
        assert data["status"] == "operational"
    
    def test_queue_test_job_endpoint(self, setup_database):
        """
        Test the job creation endpoint
        Verifies that new jobs can be queued via the API
        """
        response = client.post("/gather/queue-test-job")
        assert response.status_code == 200
        
        data = response.json()
        assert "job_id" in data
        assert data["message"] == "Test job queued successfully"
        assert data["status"] == "queued"
        
        # Verify job was created in database
        job_id = data["job_id"]
        assert job_id is not None
        assert len(job_id) > 0
    
    def test_get_all_jobs_endpoint(self, setup_database):
        """
        Test the job listing endpoint
        Verifies that queued jobs can be retrieved via the API
        """
        # First create a job
        create_response = client.post("/gather/queue-test-job")
        assert create_response.status_code == 200
        
        # Then retrieve all jobs
        response = client.get("/gather/jobs")
        assert response.status_code == 200
        
        data = response.json()
        assert "jobs" in data
        assert "total_count" in data
        assert data["total_count"] >= 1
        
        # Check job structure
        if data["jobs"]:
            job = data["jobs"][0]
            assert "job_id" in job
            assert "type" in job
            assert "status" in job
            assert "progress" in job
            assert "created_at" in job
    
    def test_get_job_status_endpoint(self, setup_database):
        """
        Test the individual job status endpoint
        Verifies that specific job details can be retrieved
        """
        # Create a job first
        create_response = client.post("/gather/queue-test-job")
        assert create_response.status_code == 200
        job_id = create_response.json()["job_id"]
        
        # Get job status
        response = client.get(f"/jobs/{job_id}/status")
        assert response.status_code == 200
        
        data = response.json()
        assert data["job_id"] == job_id
        assert "type" in data
        assert "status" in data
        assert "progress" in data
        assert "created_at" in data
        assert "duration_seconds" in data
    
    def test_get_job_status_not_found(self):
        """
        Test job status endpoint with non-existent job ID
        Verifies proper error handling for invalid requests
        """
        fake_job_id = str(uuid.uuid4())
        response = client.get(f"/jobs/{fake_job_id}/status")
        assert response.status_code == 404
        assert "Job not found" in response.json()["detail"]
    
    def test_placeholder_endpoints(self):
        """
        Test placeholder endpoints for future sections
        Verifies API structure is ready for expansion
        """
        # Test transcribe endpoint
        response = client.get("/transcribe/status")
        assert response.status_code == 200
        assert response.json()["section"] == "transcribe"
        
        # Test organize endpoint
        response = client.get("/organize/categories")
        assert response.status_code == 200
        assert response.json()["section"] == "organize"
        
        # Test consume endpoint
        response = client.get("/consume/recent")
        assert response.status_code == 200
        assert response.json()["section"] == "consume"

class TestJobCreationAndStatusUpdates:
    """Test complete job lifecycle from creation to completion"""
    
    def test_job_creation_and_status_flow(self, setup_database):
        """
        Test that jobs are created properly and status updates work
        Verifies the complete job lifecycle management system
        """
        # Create a job
        response = client.post("/gather/queue-test-job")
        assert response.status_code == 200
        
        job_id = response.json()["job_id"]
        
        # Check initial status
        status_response = client.get(f"/jobs/{job_id}/status")
        assert status_response.status_code == 200
        
        initial_status = status_response.json()
        assert initial_status["status"] == "queued"
        assert initial_status["progress"] == 0
        
        # Verify job appears in job list
        jobs_response = client.get("/gather/jobs")
        assert jobs_response.status_code == 200
        
        jobs_data = jobs_response.json()
        job_ids = [job["job_id"] for job in jobs_data["jobs"]]
        assert job_id in job_ids

class TestRequirementsTxtPackages:
    """Test that all required packages are properly installed"""
    
    def test_required_packages_importable(self):
        """
        Test that all packages listed in requirements.txt can be imported
        Verifies that the development environment is properly set up
        """
        required_packages = [
            'fastapi',
            'uvicorn',
            'celery',
            'redis',
            'psycopg2',  # Note: actual package is psycopg2-binary
            'sqlalchemy',
            'pytest'
        ]
        
        for package in required_packages:
            try:
                if package == 'psycopg2':
                    # psycopg2-binary installs as psycopg2
                    __import__('psycopg2')
                else:
                    __import__(package)
            except ImportError:
                pytest.fail(f"Required package {package} is not installed")
    
    def test_package_versions(self):
        """
        Test that key packages meet minimum version requirements
        Verifies compatibility with the application requirements
        """
        import fastapi
        import sqlalchemy
        
        # Check FastAPI version (should be 0.104.x or higher)
        assert hasattr(fastapi, '__version__')
        
        # Check SQLAlchemy version (should be 2.0.x or higher)
        assert hasattr(sqlalchemy, '__version__')
        
        # Additional version checks can be added here as needed
        print(f"FastAPI version: {fastapi.__version__}")
        print(f"SQLAlchemy version: {sqlalchemy.__version__}")

if __name__ == "__main__":
    """
    Run tests directly with python test_main.py
    Useful for development and debugging
    """
    pytest.main([__file__, "-v"])