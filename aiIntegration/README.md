# School Management AI Assistant

A powerful AI-powered assistant designed to streamline school management tasks, built with FastAPI backend and Streamlit frontend.

## Overview

This system provides an intelligent interface for handling various school management tasks including:
- Student information management
- Academic planning assistance  
- Administrative task automation
- Document processing and analysis
- Educational resource recommendations

## Technical Stack

- **Backend**: FastAPI
- **Frontend**: Streamlit
- **AI Integration**: OpenRouter API (supporting multiple AI models)
- **Environment Management**: python-dotenv
- **Error Handling**: Robust error management with exponential backoff

## Getting Started

### Prerequisites

- Python 3.8 or higher
- pip package manager
- Git

### Installation

1. Clone the repository:

2. Navigate to the project directory:
   ```bash
   cd ai-and-automation/aiIntegration
   ```

3. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows use: venv\Scripts\activate
   ```

4. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

5. Set up environment variables:
   - Copy `.env.example` to `.env`
   - Update the variables with your configuration

### Running the Application

You can run the application in two ways:

1. Using the start script:
   ```bash
   python start.py
   ```
   This will launch both the backend and frontend automatically.

2. Or manually start each component:

   Start the FastAPI backend:
   ```bash
   uvicorn main:app --reload --host 0.0.0.0 --port 8000
   ```

   Launch the Streamlit frontend:
   ```bash
   streamlit run ui/streamlit_app.py
   ```

The application will be available at:
- Backend API: http://localhost:8000
- Frontend UI: http://localhost:8501
