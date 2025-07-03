# PDII (Public Domain Integration Infrastructure) v0.1.0

A sophisticated 1920s Art Deco styled job queue management system built with React, FastAPI, PostgreSQL, Redis, and Celery.

## ✨ Features

- **Elegant 1920s Art Deco Design**: Gold accents, geometric patterns, and vintage typography
- **Real-time Job Monitoring**: Auto-refreshing job status every 2 seconds
- **Modern Tech Stack**: React + Vite frontend, FastAPI backend, PostgreSQL database
- **Background Processing**: Redis + Celery for distributed task queues
- **Comprehensive Testing**: Full test suite covering all components
- **Docker Integration**: Easy setup with Docker Compose

## 🏗️ Architecture

```
Frontend (React + Vite)  ←→  Backend (FastAPI)  ←→  Database (PostgreSQL)
                                    ↓
                            Queue System (Redis + Celery)
```

## 📋 Prerequisites

- **Node.js** (v18 or higher)
- **Python** (3.9 or higher) 
- **Docker & Docker Compose**
- **Git**

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd pdii
```

### 2. Start Database Services

```bash
# Start PostgreSQL and Redis with Docker
docker-compose up -d
```

### 3. Backend Setup

```bash
# Create backend directory and navigate
mkdir backend
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On macOS/Linux:
source venv/bin/activate
# On Windows:
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Start FastAPI server
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### 4. Start Celery Worker (New Terminal)

```bash
cd backend
source venv/bin/activate  # Activate virtual environment

# Start Celery worker
celery -A celery_app worker --loglevel=info
```

### 5. Frontend Setup (New Terminal)

```bash
# Create React app with Vite
npm create vite@latest frontend -- --template react
cd frontend

# Install dependencies
npm install
npm install axios react-router-dom

# Copy the component files (see file structure below)
# Then start development server
npm run dev
```

## 📁 Project Structure

```
pdii/
├── docker-compose.yml
├── requirements.txt
├── README.md
├── backend/
│   ├── main.py
│   ├── database.py
│   ├── models.py
│   ├── celery_app.py
│   └── test_main.py
└── frontend/
    ├── src/
    │   ├── App.jsx
    │   ├── main.jsx
    │   ├── components/
    │   │   ├── Navigation.jsx
    │   │   ├── Gather.jsx
    │   │   ├── Transcribe.jsx
    │   │   ├── Organize.jsx
    │   │   └── Consume.jsx
    │   └── styles/
    │       └── App.css
    ├── index.html
    ├── package.json
    └── vite.config.js
```

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the backend directory:

```env
DATABASE_URL=postgresql://pdii_user:pdii_pass@localhost:5432/pdii
REDIS_URL=redis://localhost:6379/0
```

### Database Configuration

The application uses PostgreSQL with the following default settings:
- **Host**: localhost
- **Port**: 5432
- **Database**: pdii
- **Username**: pdii_user
- **Password**: pdii_pass

### Redis Configuration

- **Host**: localhost
- **Port**: 6379
- **Database**: 0

## 🧪 Running Tests

### Backend Tests

```bash
cd backend
source venv/bin/activate

# Run all tests
pytest test_main.py -v

# Run specific test categories
pytest test_main.py::TestDatabaseConnection -v
pytest test_main.py::TestAPIEndpoints -v
pytest test_main.py::TestCeleryWorker -v
```

### Test Coverage

The test suite covers:
- ✅ Database connection and model operations
- ✅ Redis connectivity for Celery broker
- ✅ Celery worker registration and task execution
- ✅ All API endpoints with correct responses
- ✅ Job creation and status update workflows
- ✅ Package installation verification

## 📡 API Endpoints

### Job Management
- `POST /gather/queue-test-job` - Create a new test job
- `GET /gather/jobs` - Retrieve all jobs
- `GET /jobs/{job_id}/status` - Get specific job status

### Section Placeholders
- `GET /transcribe/status` - Transcription service status
- `GET /organize/categories` - Organization categories
- `GET /consume/recent` - Recent content

### Health Check
- `GET /` - API health check

## 🎨 Design System

### Color Palette
- **Primary Gold**: #D4AF37
- **Light Gold**: #F4E4BC  
- **Dark Gold**: #B8860B
- **Primary Black**: #1A1A1A
- **Soft Black**: #2D2D2D
- **Cream**: #F5F5DC

### Typography
- **Display Font**: Playfair Display (elegant serif)
- **Title Font**: Bebas Neue (bold sans-serif)
- **Body Font**: Cormorant Garamond (readable serif)

### Components
- Art Deco geometric patterns
- Gold accent borders and highlights
- Smooth animations and transitions
- Responsive grid layouts

## 🔄 Job Lifecycle

1. **Queued**: Job created and waiting for processing
2. **Running**: Job actively being processed with progress updates
3. **Completed**: Job finished successfully
4. **Failed**: Job encountered an error
5. **Cancelled**: Job manually cancelled (future feature)

## 🚀 Development Workflow

### Adding New Job Types

1. **Define Job Type** in `models.py`:
```python
class JobType(enum.Enum):
    YOUR_NEW_TYPE = "your_new_type"
```

2. **Create Celery Task** in `celery_app.py`:
```python
@celery_app.task
def your_new_task(job_id: str):
    # Task implementation
    pass
```

3. **Add API Endpoint** in `main.py`:
```python
@app.post("/your-section/queue-job")
async def queue_your_job():
    # Endpoint implementation
    pass
```

### Adding New Sections

1. Create new React component in `components/`
2. Add route in `App.jsx`
3. Update navigation in `Navigation.jsx`
4. Add corresponding API endpoints

## 🐳 Docker Commands

```bash
# Start services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Reset data
docker-compose down -v
```

## 🔍 Troubleshooting

### Common Issues

**Backend won't start:**
- Check PostgreSQL and Redis are running: `docker-compose ps`
- Verify virtual environment is activated
- Ensure all dependencies installed: `pip install -r requirements.txt`

**Frontend won't connect to API:**
- Verify backend is running on port 8000
- Check CORS configuration in `main.py`
- Ensure axios requests use correct URL

**Celery tasks not processing:**
- Verify Redis is running: `redis-cli ping`
- Check Celery worker is active: `celery -A celery_app inspect active`
- Verify task registration: `celery -A celery_app inspect registered`

**Database connection issues:**
- Check PostgreSQL container: `docker-compose logs postgres`
- Verify database credentials in connection string
- Ensure database exists: `docker-compose exec postgres psql -U pdii_user -d pdii`

### Debug Mode

Enable debug logging:
```python
# In database.py
engine = create_engine(DATABASE_URL, echo=True)  # SQL query logging

# In celery_app.py
celery_app.conf.worker_log_level = 'DEBUG'
```

## 🎯 Future Enhancements

- [ ] User authentication and authorization
- [ ] File upload and processing capabilities
- [ ] Real-time WebSocket updates
- [ ] Job scheduling and cron-like functionality
- [ ] Advanced progress tracking with sub-tasks
- [ ] Export functionality for job reports
- [ ] Dark/light theme toggle
- [ ] Internationalization support

## 📄 License

This project is licensed under the MIT License.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📞 Support

For issues and questions:
- Create an issue on GitHub
- Check the troubleshooting section
- Review the test suite for examples

---

**PDII (Public Domain Integration Infrastructure) v0.1.0** -✨