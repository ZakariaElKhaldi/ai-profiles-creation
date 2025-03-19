# AI Profiles Application

A web application for creating, managing, and using AI profiles with custom system prompts. Connects to OpenRouter API for accessing various AI models.

## Project Structure

```
/
├── backend/             # FastAPI backend
│   ├── app/             # Application code
│   ├── data/            # Data storage
│   └── requirements.txt # Backend dependencies
├── frontend/            # React frontend (separate repo)
├── run.py               # Convenience script to run the backend
└── setup.py             # Development setup
```

## Getting Started

### Prerequisites

- Python 3.9 or higher
- pip (Python package installer)

### Backend Setup

1. Create a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

2. Install backend dependencies:
   ```bash
   pip install -r backend/requirements.txt
   ```

3. Install the package in development mode:
   ```bash
   pip install -e .
   ```

4. Create or update the `.env` file in the backend directory:
   ```
   # OpenRouter settings - add your key here
   OPENROUTER_API_KEY=your_api_key_here
   
   # Basic app settings
   DEBUG=True
   CORS_ORIGINS=http://localhost:3000
   ```

### Running the Backend

Option 1: Use the run script:
```bash
python run.py
```

Option 2: Use uvicorn directly:
```bash
uvicorn backend.app.main:app --reload
```

The API will be available at http://localhost:8000

- API Documentation: http://localhost:8000/api/docs
- ReDoc: http://localhost:8000/api/redoc

## API Features

- **Profile Management**: Create and manage AI agent profiles with custom prompts
- **Document Management**: Upload and process documents for context
- **OpenRouter Integration**: Connect to various AI models via OpenRouter
- **API Key Management**: Store and manage OpenRouter API keys

## Development Notes

- Check the backend README for more details about the API
- When running in production, make sure to set proper environment variables
