# AI Chatbot Profiles

<div align="center">
  <img src="frontend/public/logo.png" alt="AI Chatbot Profiles Logo" width="200" />
  <h3>A modern framework for creating and managing AI chatbot profiles with document context</h3>
</div>

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.95+-blue.svg)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-18.0+-61DAFB.svg?logo=react&logoColor=white)](https://reactjs.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC.svg?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

## 📋 Overview

AI Chatbot Profiles is a complete solution for creating, testing, and deploying AI-powered chatbots with support for document context and customization. The application provides an intuitive interface to manage AI profiles, configure AI models, upload documents for context, and test chatbot responses.

**[Live Demo](#)** | **[API Documentation](#)** | **[Contributing](#)**

<p align="center">
  <img src="frontend/public/screenshot.png" alt="AI Chatbot Profiles Screenshot" width="80%" />
</p>

## ✨ Features

- **Customizable Chatbot Profiles**: Create multiple chatbot profiles with different configurations
- **Document Context**: Upload documents to provide context for chatbot responses
- **Multiple AI Models**: Connect to various AI models through OpenRouter API
- **Real-time Chat Interface**: Test your chatbots in a sleek, modern chat UI
- **Profile Management**: Create, edit, delete, and organize chatbot profiles
- **API Key Management**: Generate and manage API keys for programmatic access
- **Document Upload & Processing**: Upload various document types (PDF, DOCX, TXT, etc.)
- **User-friendly Interface**: Modern, responsive UI built with React and Tailwind CSS
- **Secure API Endpoints**: Well-documented API built with FastAPI
- **Dark Mode**: Sleek dark interface for comfortable viewing

## 🚀 Getting Started

### Prerequisites

- Python 3.8+ for the backend
- Node.js 16+ for the frontend
- npm or yarn
- Git

### Installation

1. **Clone the repository**

```bash
git clone https://github.com/yourusername/ai-chatbot-profiles.git
cd ai-chatbot-profiles
```

2. **Set up the backend**

```bash
cd backend
pip install -r requirements.txt
cp .env.example .env
```

3. **Configure environment variables**

Edit the `.env` file with your API keys and configuration:

```
OPENROUTER_API_KEY=your_openrouter_api_key
DEFAULT_MODEL=google/gemini-2.0-pro-exp-02-05:free
```

4. **Set up the frontend**

```bash
cd ../frontend
npm install
```

5. **Start the application**

In one terminal, start the backend:
```bash
cd backend
python start.py
```

In another terminal, start the frontend:
```bash
cd frontend
npm run dev
```

6. **Open your browser**

Visit http://localhost:3000 to see the application in action.

## 📝 Usage

### Creating a Chatbot Profile

1. Navigate to the Profiles page
2. Click "Create New Profile"
3. Fill in the profile details:
   - Name
   - Description
   - AI Model
   - Temperature
   - Max Tokens
   - System Prompt (optional)
4. Click "Create Profile"

### Adding Documents

1. Open a profile
2. Click "Add Documents"
3. Upload documents or select from existing documents
4. The documents will be processed and made available for context

### Testing Your Chatbot

1. Navigate to the Chat page
2. Select a profile from the dropdown
3. Start chatting with your configured chatbot
4. The chatbot will use the profile settings and document context to generate responses

### Using the API

1. Generate an API key from the profile settings
2. Use the API key to make requests to the chatbot API
3. See the [API Documentation](#api-documentation) for details

## 🌐 Deployment Options

### Free Platforms for Backend Deployment

You can deploy the FastAPI backend to several free platforms:

#### Render

1. Sign up at [render.com](https://render.com)
2. Create a new Web Service
3. Connect to your GitHub repository
4. Set the build command: `pip install -r requirements.txt`
5. Set the start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
6. Add your environment variables from `.env.example`

#### Railway

1. Sign up at [railway.app](https://railway.app)
2. Create a new project from GitHub
3. Set the build command: `pip install -r requirements.txt`
4. Set the start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
5. Configure environment variables

#### Fly.io

1. Sign up at [fly.io](https://fly.io)
2. Install the Fly CLI: `curl -L https://fly.io/install.sh | sh`
3. Create a `Dockerfile` or use the provided one
4. Run `fly launch`
5. Set secrets: `fly secrets set OPENROUTER_API_KEY=your_key`

### Frontend Deployment

You can deploy the React frontend to platforms like:

- [Vercel](https://vercel.com)
- [Netlify](https://netlify.com)
- [GitHub Pages](https://pages.github.com)

## 🔧 Configuration

### Backend Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `OPENROUTER_API_KEY` | Your OpenRouter API key | - |
| `OPENROUTER_API_URL` | OpenRouter API URL | https://openrouter.ai/api/v1/chat/completions |
| `OPENROUTER_REFERER` | Referer header for OpenRouter | http://localhost:3000 |
| `HOST` | Host to bind the server to | 0.0.0.0 |
| `PORT` | Port to run the server on | 8000 |
| `DEBUG` | Enable debug mode | false |
| `LOG_LEVEL` | Logging level | INFO |
| `DEFAULT_MODEL` | Default AI model to use | google/gemini-2.0-pro-exp-02-05:free |

### Frontend Environment Variables

Create a `.env` file in the `frontend` directory:

```
VITE_API_BASE_URL=http://localhost:8000
```

## 📚 API Documentation

When the backend is running, you can access the API documentation at:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

### Key Endpoints

- `/api/chat`: Send messages to a chatbot profile
- `/api/profiles`: Manage chatbot profiles
- `/api/documents`: Upload and manage documents
- `/api/models`: Get available AI models
- `/api/tags`: Manage document tags

## 🧩 Project Structure

```
ai-chatbot-profiles/
├── backend/             # FastAPI backend
│   ├── app/             # Application modules
│   │   ├── api/         # API endpoints
│   │   ├── core/        # Core functionality
│   │   ├── models/      # Data models
│   │   ├── schemas/     # Pydantic schemas
│   │   ├── services/    # Business logic
│   │   └── utils/       # Utility functions
│   ├── data/            # Data storage
│   ├── documents/       # Document storage
│   ├── uploads/         # Uploaded files
│   ├── main.py          # Main application entry point
│   └── requirements.txt # Python dependencies
├── frontend/            # React frontend
│   ├── public/          # Static assets
│   ├── src/             # Source code
│   │   ├── components/  # UI components
│   │   ├── context/     # React context
│   │   ├── hooks/       # Custom hooks
│   │   ├── pages/       # Page components
│   │   └── services/    # API services
│   ├── package.json     # Node dependencies
│   └── vite.config.ts   # Vite configuration
├── .env.example         # Example environment variables
├── .gitignore           # Git ignore file
└── README.md            # This file
```

## 🤝 Contributing

We welcome contributions to AI Chatbot Profiles! Here's how to get started:

1. Fork the repository
2. Create a new branch: `git checkout -b feature/your-feature`
3. Make your changes
4. Commit your changes: `git commit -m 'Add some feature'`
5. Push to the branch: `git push origin feature/your-feature`
6. Open a pull request

Please make sure to update tests as appropriate.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📬 Contact

If you have any questions or feedback, please open an issue or contact us at:

- Email: example@example.com
- Twitter: [@example](https://twitter.com/example)

---

Made with ❤️ by [Your Name]
