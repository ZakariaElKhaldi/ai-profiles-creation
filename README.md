# AI Profiles Management Dashboard

A single-page application for creating, managing, and querying AI profiles with secure authentication and data processing.

## Features

- **User Authentication**: Secure login system using Supabase
- **Profile Management**: Create and manage AI profiles through an intuitive dashboard
- **Document Processing**: Upload and process CSV/PDF documents for AI consumption
- **Secure Key Generation**: Generate cryptographically secure keys for API access
- **AI Querying**: Query processed data using external AI models via Open Router

## Tech Stack

### Frontend
- React
- Modern UI components library (Chakra UI or Material-UI)

### Backend
- FastAPI (Python)
- Asynchronous processing for document handling

### Data Storage
- PostgreSQL via Supabase
- Supabase Authentication

### AI Integration
- Open Router API for AI model access

## Getting Started

### Prerequisites
- Node.js (v16+)
- Python (v3.8+)
- PostgreSQL
- Supabase account
- Open Router API access

### Installation

1. Clone the repository
   ```
   git clone https://github.com/yourusername/ai-profiles-creation.git
   cd ai-profiles-creation
   ```

2. Install frontend dependencies
   ```
   cd frontend
   npm install
   ```

3. Install backend dependencies
   ```
   cd ../backend
   pip install -r requirements.txt
   ```

4. Set up environment variables
   - Create `.env` files in both frontend and backend directories
   - Add Supabase and Open Router credentials

5. Start the development servers
   ```
   # In frontend directory
   npm run dev
   
   # In backend directory
   uvicorn main:app --reload
   ```

## Project Structure

```
ai-profiles-creation/
├── frontend/              # React application
│   ├── public/            # Static files
│   ├── src/               # Source code
│   │   ├── components/    # React components
│   │   ├── hooks/         # Custom React hooks
│   │   ├── pages/         # Application pages
│   │   ├── services/      # API services
│   │   └── utils/         # Utility functions
│   └── package.json       # Frontend dependencies
├── backend/               # FastAPI application
│   ├── api/               # API endpoints
│   ├── core/              # Core functionality
│   ├── db/                # Database models and operations
│   ├── services/          # Business logic
│   ├── utils/             # Utility functions
│   └── main.py            # Application entry point
└── README.md              # Project documentation
```

## API Endpoints

- `POST /api/auth/login` - User authentication
- `GET /api/profiles` - Get user's AI profiles
- `POST /api/profiles` - Create a new AI profile
- `POST /api/profiles/{id}/upload` - Upload document to a profile
- `POST /api/profiles/{id}/generate-key` - Generate API key for a profile
- `POST /api/query` - Query an AI profile with authentication

## Security Considerations

- All API endpoints are protected with authentication
- Document validation to prevent malicious uploads
- Secure key generation using Python's secrets module
- Rate limiting to prevent abuse
- HTTPS for all communications

## License

MIT

## Contributors

- Your Name - Lead Developer 