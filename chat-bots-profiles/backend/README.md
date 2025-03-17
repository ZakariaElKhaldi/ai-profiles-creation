# AI Chatbot Profiles Backend

This is the backend server for the AI Chatbot Profiles application.

## Setup

### Environment Variables

Before running the application, you need to set up your environment variables:

1. Create a `.env` file in the backend directory with the following variables:

```
# OpenRouter API Configuration
OPENROUTER_API_KEY=your_openrouter_api_key_here
OPENROUTER_API_URL=https://openrouter.ai/api/v1/chat/completions
OPENROUTER_REFERER=http://localhost:8000

# FastAPI Configuration
HOST=0.0.0.0
PORT=8000
DEBUG=true
LOG_LEVEL=INFO

# AI Service Configuration
DEFAULT_MODEL=openai/gpt-3.5-turbo
```

### Getting an OpenRouter API Key

To get an OpenRouter API key:

1. Go to [https://openrouter.ai/keys](https://openrouter.ai/keys)
2. Sign up or log in
3. Create a new API key
4. Copy the key and paste it in your `.env` file

## Running the Application

To run the backend server:

```bash
python start.py
```

Optional flags:
- `--port`: Specify a custom port (default: 8000)
- `--no-open`: Don't open the browser automatically

## API Documentation

When the server is running, you can access the API documentation at:

```
http://localhost:8000/docs
```

## Troubleshooting

If you see a 401 Unauthorized error when using the chat feature, it means there's an issue with your OpenRouter API key. Check that:

1. You have a valid API key in your `.env` file
2. The key is correctly formatted
3. The API key hasn't expired 