# Installation Guide

This guide will help you set up the AI Profiles application for both development and production environments.

## Prerequisites

Before installing the AI Profiles application, ensure you have the following prerequisites installed:

- **Python 3.9+** - For the backend server
- **Node.js 16+** - For the frontend application
- **pip** - Python package manager
- **npm** - Node.js package manager
- **PostgreSQL 13+** - For database storage

## Quick Start with Docker

For the quickest setup, you can use Docker Compose:

1. Install [Docker](https://docs.docker.com/get-docker/) and [Docker Compose](https://docs.docker.com/compose/install/)
2. Clone the repository:
   ```bash
   git clone https://github.com/your-org/ai-profiles.git
   cd ai-profiles
   ```
3. Create a `.env` file in the root directory with the following content:
   ```
   # Database
   DATABASE_URL=postgresql://postgres:postgres@db:5432/ai_profiles
   
   # API Keys
   OPENROUTER_API_KEY=your_openrouter_api_key
   
   # Storage paths
   UPLOAD_DIR=./data/uploads
   PROCESSED_DIR=./data/processed
   ```
4. Start the application:
   ```bash
   docker-compose up
   ```
5. Access the application at http://localhost:3000

## Manual Installation

### Backend Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/your-org/ai-profiles.git
   cd ai-profiles
   ```

2. Create a Python virtual environment and activate it:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install the backend dependencies:
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

4. Create a `.env` file in the `backend` directory:
   ```
   # Database
   DATABASE_URL=postgresql://postgres:postgres@localhost:5432/ai_profiles
   
   # API Keys
   OPENROUTER_API_KEY=your_openrouter_api_key
   
   # Storage paths
   UPLOAD_DIR=./data/uploads
   PROCESSED_DIR=./data/processed
   
   # Server settings
   HOST=0.0.0.0
   PORT=8000
   DEBUG=True
   ```

5. Initialize the database:
   ```bash
   python -m app.db.init_db
   ```

6. Start the backend server:
   ```bash
   python -m app.main
   ```

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install the frontend dependencies:
   ```bash
   npm install
   ```

3. Create a `.env.local` file in the `frontend` directory:
   ```
   VITE_API_URL=http://localhost:8000
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Access the application at http://localhost:3000

## Production Deployment

For production deployments, additional steps are recommended:

### Backend

1. Use a production WSGI server like Gunicorn:
   ```bash
   pip install gunicorn
   gunicorn -w 4 -k uvicorn.workers.UvicornWorker app.main:app
   ```

2. Set up proper database credentials and ensure they're securely stored.

3. Configure a reverse proxy (Nginx or Apache) to handle requests and serve static files.

### Frontend

1. Build the frontend for production:
   ```bash
   npm run build
   ```

2. Serve the static files from the `dist` directory using Nginx or another web server.

## OpenRouter API Key Setup

To use the AI Profiles application, you'll need an OpenRouter API key:

1. Sign up at [OpenRouter](https://openrouter.ai/)
2. Create a new API key
3. Add the API key to your environment variables or settings

You can set the API key in the application using:
- Environment variable: `OPENROUTER_API_KEY=your_key`
- API endpoint: `POST /api/keys/openrouter` with the key in the request body

## Data Storage Configuration

The application uses two main directories for data storage:

- `UPLOAD_DIR`: Where uploaded documents are initially stored
- `PROCESSED_DIR`: Where processed documents and extracted text are stored

These directories need to be:
1. Writable by the application
2. Persistent across application restarts
3. Backed up regularly in production environments

## Common Installation Issues

### Database Connection Errors

If you encounter database connection errors:
1. Ensure PostgreSQL is running
2. Verify the connection string in your `.env` file
3. Check that the database exists and the user has proper permissions

### Missing API Key Errors

If you see "No API key provided" errors:
1. Check that you've set the OpenRouter API key
2. Verify the key is active and valid
3. Try setting the key using the API endpoint

### Document Processing Failures

If documents fail to process:
1. Ensure the `UPLOAD_DIR` and `PROCESSED_DIR` are writable
2. Check that you have the necessary dependencies installed for document processing
3. Look for specific error messages in the application logs

## Next Steps

After installation:
1. Create your first AI profile
2. Upload a document to the profile
3. Test querying the profile to see the AI response

For more information, refer to:
- [API Reference](./api-reference.md)
- [Profile Management](./profile-management.md)
- [Document Processing](./document-processing.md) 