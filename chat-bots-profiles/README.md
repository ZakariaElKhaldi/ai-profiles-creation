# AI Chatbot Profiles

A modern application for creating and managing AI chatbot profiles with a React frontend and FastAPI backend.

## Features

- **Chat Interface**: Test and interact with various AI models in real-time
- **Profile Management**: Create, update, and delete chatbot profiles
- **API Key Generation**: Generate and manage API keys for programmatic access
- **Document Context**: Upload and manage documents for contextual responses
- **Model Selection**: Choose from a variety of AI models from different providers
- **Training Data**: Upload custom training data for profile customization
- **A/B Testing**: Compare the performance of different AI models
- **Metrics Tracking**: Monitor usage and performance metrics

## Project Structure

```
ai-chatbot-profiles/
├── backend/             # FastAPI backend
│   ├── app/             # Application modules
│   ├── data/            # Data storage
│   ├── documents/       # Document storage
│   ├── logs/            # Log files
│   ├── uploads/         # Uploaded files
│   ├── main.py          # Main API entry point
│   ├── requirements.txt # Python dependencies
│   └── start.py         # Backend starter script
├── frontend/            # React frontend
│   ├── public/          # Static assets
│   ├── src/             # Source code
│   │   ├── components/  # UI components
│   │   ├── context/     # Context providers
│   │   ├── hooks/       # Custom React hooks
│   │   ├── pages/       # Page components
│   │   └── services/    # API service modules
│   ├── package.json     # Node dependencies
│   └── vite.config.ts   # Vite configuration
├── .env                 # Environment variables
├── README.md            # Project documentation
└── start.py             # Main starter script
```

## Getting Started

### Prerequisites

- Python 3.8 or higher
- Node.js 16 or higher
- npm or yarn

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/ai-chatbot-profiles.git
   cd ai-chatbot-profiles
   ```

2. Install Python dependencies:
   ```
   cd backend
   pip install -r requirements.txt
   cd ..
   ```

3. Install frontend dependencies:
   ```
   cd frontend
   npm install
   cd ..
   ```

4. Create a `.env` file in the root directory with the following environment variables:
   ```
   OPENROUTER_API_KEY=your_openrouter_api_key
   DEFAULT_MODEL=openai/gpt-3.5-turbo
   ```

### Running the Application

Use the `start.py` script to run both the backend and frontend:

```
python start.py
```

Options:
- `--api-port PORT`: Set custom API port (default: 8000)
- `--frontend-port PORT`: Set custom frontend port (default: 3000)
- `--api-only`: Run only the API server
- `--frontend-only`: Run only the frontend server
- `--no-open`: Don't open browser automatically

### API Documentation

API documentation is available at [http://localhost:8000/docs](http://localhost:8000/docs) when the backend is running.

## Development

### Backend (FastAPI)

The backend is built with FastAPI and provides endpoints for:
- Chat interactions
- Profile management
- Model selection and details
- Document processing
- API key management

Key files:
- `backend/main.py`: Main FastAPI application
- `backend/app/models.py`: Model configuration and management
- `backend/app/utils/`: Utility modules for document processing, etc.

### Frontend (React)

The frontend is built with React, Vite, and Tailwind CSS, providing:
- Modern and responsive UI
- Real-time chat interface
- Profile management forms
- Document upload capabilities
- Settings management

Key directories:
- `frontend/src/components/`: UI components
- `frontend/src/pages/`: Page components
- `frontend/src/services/`: API service modules
- `frontend/src/hooks/`: Custom React hooks
- `frontend/src/context/`: React context providers

## License

This project is licensed under the MIT License - see the LICENSE file for details.
