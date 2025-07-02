import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000';

/**
 * Gather component - Main job queue management interface
 * Features job listing, creation, and real-time status updates
 */
function Gather() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isCreatingJob, setIsCreatingJob] = useState(false);

  /**
   * Fetch all jobs from the API
   * Called on component mount and for refreshes
   */
  const fetchJobs = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/gather/jobs`);
      setJobs(response.data.jobs);
      setError(null);
    } catch (err) {
      setError('Failed to fetch jobs. Please ensure the backend is running.');
      console.error('Error fetching jobs:', err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Create a new test job
   * Demonstrates job creation and immediate status update
   */
  const createTestJob = async () => {
    setIsCreatingJob(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/gather/queue-test-job`);
      console.log('Job created:', response.data);
      
      // Immediately refresh the job list to show the new job
      await fetchJobs();
      setError(null);
    } catch (err) {
      setError('Failed to create job. Please ensure the backend is running.');
      console.error('Error creating job:', err);
    } finally {
      setIsCreatingJob(false);
    }
  };

  /**
   * Format timestamp for display
   * Converts ISO timestamp to readable format
   */
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp).toLocaleString('en-US', {
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  /**
   * Get status badge class for styling
   * Returns appropriate CSS class based on job status
   */
  const getStatusBadgeClass = (status) => {
    const baseClass = 'status-badge';
    switch (status.toLowerCase()) {
      case 'completed': return `${baseClass} status-completed`;
      case 'running': return `${baseClass} status-running`;
      case 'failed': return `${baseClass} status-failed`;
      case 'queued': return `${baseClass} status-queued`;
      default: return baseClass;
    }
  };

  /**
   * Get progress bar class for animation
   * Returns appropriate CSS class for progress visualization
   */
  const getProgressBarClass = (status, progress) => {
    const baseClass = 'progress-fill';
    if (status === 'completed') return `${baseClass} progress-completed`;
    if (status === 'running') return `${baseClass} progress-running`;
    if (status === 'failed') return `${baseClass} progress-failed`;
    return baseClass;
  };

  // Set up auto-refresh every 2 seconds
  useEffect(() => {
    fetchJobs();
    
    const interval = setInterval(fetchJobs, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="gather-container">
      {/* Section header with ornamental design */}
      <div className="section-header">
        <div className="header-ornament left"></div>
        <div className="header-content">
          <h2 className="section-title">GATHER</h2>
          <p className="section-subtitle">Queue Management & Job Processing</p>
        </div>
        <div className="header-ornament right"></div>
      </div>

      {/* Action buttons */}
      <div className="action-bar">
        <button
          onClick={createTestJob}
          disabled={isCreatingJob}
          className={`btn-primary ${isCreatingJob ? 'btn-loading' : ''}`}
        >
          {isCreatingJob ? (
            <>
              <span className="btn-spinner"></span>
              Creating Job...
            </>
          ) : (
            'Add Queue Item'
          )}
        </button>
      </div>

      {/* Error message display */}
      {error && (
        <div className="error-message">
          <div className="error-icon">⚠</div>
          <span>{error}</span>
        </div>
      )}

      {/* Job list */}
      <div className="jobs-container">
        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading job queue...</p>
          </div>
        ) : jobs.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📋</div>
            <h3>No Jobs Found</h3>
            <p>Create your first job to get started</p>
          </div>
        ) : (
          <div className="jobs-grid">
            {jobs.map((job) => (
              <div key={job.job_id} className="job-card">
                <div className="job-header">
                  <div className="job-id">
                    <span className="job-id-label">JOB</span>
                    <span className="job-id-value">{job.job_id.slice(0, 8)}</span>
                  </div>
                  <div className={getStatusBadgeClass(job.status)}>
                    {job.status.toUpperCase()}
                  </div>
                </div>

                <div className="job-details">
                  <div className="job-type">
                    <span className="detail-label">Type:</span>
                    <span className="detail-value">{job.type}</span>
                  </div>
                  
                  <div className="job-progress">
                    <div className="progress-header">
                      <span className="detail-label">Progress:</span>
                      <span className="progress-percentage">{job.progress}%</span>
                    </div>
                    <div className="progress-bar">
                      <div
                        className={getProgressBarClass(job.status, job.progress)}
                        style={{ width: `${job.progress}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="job-timing">
                    <div className="timing-item">
                      <span className="detail-label">Created:</span>
                      <span className="detail-value">{formatTimestamp(job.created_at)}</span>
                    </div>
                    {job.completed_at && (
                      <div className="timing-item">
                        <span className="detail-label">Completed:</span>
                        <span className="detail-value">{formatTimestamp(job.completed_at)}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="job-footer">
                  <div className="job-ornament"></div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Auto-refresh indicator */}
      <div className="refresh-indicator">
        <div className="refresh-dot"></div>
        <span>Auto-refreshing every 2 seconds</span>
      </div>
    </div>
  );
}

export default Gather;