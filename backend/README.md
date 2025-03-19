# AI Profiles API Backend

This is the backend for the AI Profiles application, providing API endpoints for managing profiles, document management, and integrating with OpenRouter.

## Features

- **Profile Management**: Create, update, list, and delete AI agent profiles
- **Document Management**: Upload, process, and manage documents for AI profiles
- **OpenRouter Integration**: Connect to various AI models via OpenRouter API
- **API Key Management**: Store and manage OpenRouter API keys securely

## Technology Stack

- **FastAPI**: Modern, fast web framework for building APIs
- **Pydantic**: Data validation and settings management
- **Python 3.9+**: Modern Python with type annotations
- **Async I/O**: Asynchronous request handling for better performance

## Project Structure

```
backend/
├── app/
│   ├── api/                 # API endpoints
│   │   ├── documents/       # Document management endpoints
│   │   ├── openrouter/      # OpenRouter integration endpoints
│   │   └── profiles/        # Profile management endpoints
│   ├── core/                # Core functionality
│   │   └── config.py        # Application configuration
│   ├── models/              # Pydantic models
│   │   ├── documents.py     # Document models
│   │   ├── openrouter.py    # OpenRouter models
│   │   └── profiles.py      # Profile models
│   ├── services/            # Business logic services
│   │   ├── documents/       # Document services
│   │   ├── openrouter/      # OpenRouter services
│   │   └── profiles/        # Profile services
│   └── main.py              # Main application entry point
├── data/                    # Data storage (in production would use a database)
│   ├── documents/           # Stored document files
│   ├── openrouter_keys.json # API keys storage
│   └── profiles/            # Profile data
├── tests/                   # Test cases
├── requirements.txt         # Python dependencies
└── README.md                # This file
```

## Getting Started

### Prerequisites

- Python 3.9 or higher
- pip (Python package installer)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/ai-profiles-app.git
   cd ai-profiles-app/backend
   ```

2. Create a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Create an `.env` file in the backend directory with the following content:
   ```
   OPENROUTER_API_KEY=your_openrouter_api_key
   ```

### Running the Application

Start the FastAPI server:

```bash
cd backend
uvicorn app.main:app --reload
```

The API will be available at http://localhost:8000

### API Documentation

- Interactive API documentation: http://localhost:8000/api/docs
- ReDoc documentation: http://localhost:8000/api/redoc

## API Endpoints

### Profiles

- `GET /api/profiles`: List all profiles
- `POST /api/profiles`: Create a new profile
- `GET /api/profiles/{profile_id}`: Get profile details
- `PUT /api/profiles/{profile_id}`: Update a profile
- `DELETE /api/profiles/{profile_id}`: Delete a profile
- `POST /api/profiles/{profile_id}/query`: Query an AI profile
- `GET /api/profiles/{profile_id}/stats`: Get profile usage statistics

### Documents

- `GET /api/documents`: List all documents
- `POST /api/documents`: Upload a new document
- `GET /api/documents/{document_id}`: Get document details
- `PUT /api/documents/{document_id}`: Update document information
- `DELETE /api/documents/{document_id}`: Delete a document
- `PUT /api/documents/{document_id}/status`: Update document processing status

### OpenRouter

- `GET /api/openrouter/models`: Get available AI models
- `POST /api/openrouter/chat/completions`: Create a chat completion
- `GET /api/openrouter/keys`: List all API keys
- `POST /api/openrouter/keys`: Add a new API key
- `DELETE /api/openrouter/keys/{key}`: Delete an API key
- `POST /api/openrouter/keys/active`: Set the active API key
- `GET /api/openrouter/keys/active`: Get information about the active API key

## Development

### File Structure Conventions

- API routes are defined in `app/api/{feature}/router.py`
- Models are defined in `app/models/{feature}.py`
- Services are defined in `app/services/{feature}/{service_name}.py`

### Adding a New Feature

1. Create models in `app/models/`
2. Create services in `app/services/`
3. Create API endpoints in `app/api/`
4. Include the router in `app/main.py`

## License

This project is licensed under the MIT License - see the LICENSE file for details. 