from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
import os
from dotenv import load_dotenv

from app.api import api_router

# Load environment variables
load_dotenv()

# Verify that critical environment variables are set
if not os.getenv('OPENROUTER_API_KEY'):
    raise ValueError("OPENROUTER_API_KEY environment variable is not set. Please check your .env file.")

# Create FastAPI app
app = FastAPI(
    title="AI Chatbot Profiles API",
    description="Backend API for managing AI chatbot profiles and interactions",
    version="1.0.0"
)

# Add CORS middleware to allow requests from the frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
    expose_headers=["*"],  # Expose all headers
)

# Add root endpoint
@app.get("/")
def read_root():
    """Base endpoint that returns a welcome message."""
    return {"message": "Welcome to the AI Chatbot Profiles API"}

# Add health check endpoint
@app.get("/health")
def health_check():
    """Health check endpoint."""
    return {"status": "ok", "api_key_configured": bool(os.getenv('OPENROUTER_API_KEY'))}

# Add favicon endpoint
@app.get("/favicon.ico", include_in_schema=False)
async def favicon():
    """Handle favicon.ico requests to prevent 404 errors."""
    return Response(content="", media_type="image/x-icon")

# Include all API routers
app.include_router(api_router) 