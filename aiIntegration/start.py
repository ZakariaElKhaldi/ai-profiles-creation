#!/usr/bin/env python

import os
import sys
import subprocess
import time
import argparse
import webbrowser
from pathlib import Path


def check_dependencies():
    """Check if all required dependencies are installed."""
    try:
        import fastapi
        import uvicorn
        import streamlit
        import dotenv
        return True
    except ImportError as e:
        print(f"Missing dependency: {e}")
        print("Please install all dependencies using: pip install -r requirements.txt")
        return False


def is_port_in_use(port):
    """Check if a port is already in use."""
    import socket
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        return s.connect_ex(('localhost', port)) == 0


def start_api(port=8000):
    """Start the FastAPI backend."""
    if is_port_in_use(port):
        print(f"⚠️ Warning: Port {port} is already in use. The API server might not start properly.")
    
    print(f"🚀 Starting FastAPI backend on port {port}...")
    api_process = subprocess.Popen(
        [sys.executable, "-m", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", str(port), "--reload"],
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True
    )
    
    # Give the server a moment to start
    time.sleep(2)
    
    if api_process.poll() is not None:
        print("❌ Failed to start FastAPI backend")
        return None
    
    print(f"✅ FastAPI backend is running on http://localhost:{port}")
    print(f"📚 API documentation is available at http://localhost:{port}/docs")
    
    return api_process


def start_ui(port=8501, api_url=None):
    """Start the Streamlit UI."""
    if is_port_in_use(port):
        print(f"⚠️ Warning: Port {port} is already in use. The Streamlit UI might not start properly.")
    
    print(f"🚀 Starting Streamlit UI on port {port}...")
    
    env = os.environ.copy()
    if api_url:
        env["API_URL"] = api_url
    
    ui_process = subprocess.Popen(
        [sys.executable, "-m", "streamlit", "run", "ui/streamlit_app.py", 
         "--server.port", str(port),
         "--server.address", "127.0.0.1",  # Ensure binding to localhost
         "--server.headless", "true"],      # Run in headless mode
        env=env,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,  # Capture stderr separately
        text=True
    )
    
    # Give the server a moment to start
    time.sleep(5)
    
    if ui_process.poll() is not None:
        print("❌ Failed to start Streamlit UI")
        # Print any error output
        stderr = ui_process.stderr.read()
        if stderr:
            print(f"Error: {stderr}")
        return None
    
    print(f"✅ Streamlit UI is running on http://127.0.0.1:{port}")
    
    return ui_process


def main():
    """Main function to start the application."""
    parser = argparse.ArgumentParser(description="Start the School Management AI Assistant")
    parser.add_argument("--api-only", action="store_true", help="Start only the API backend")
    parser.add_argument("--ui-only", action="store_true", help="Start only the Streamlit UI")
    parser.add_argument("--api-port", type=int, default=8000, help="Port for the API server (default: 8000)")
    parser.add_argument("--ui-port", type=int, default=8501, help="Port for the Streamlit UI (default: 8501)")
    parser.add_argument("--no-browser", action="store_true", help="Don't open browser automatically")
    
    args = parser.parse_args()
    
    # Change to the script's directory
    os.chdir(Path(__file__).parent)
    
    # Check dependencies
    if not check_dependencies():
        return
    
    try:
        api_process = None
        ui_process = None
        
        if not args.ui_only:
            api_process = start_api(args.api_port)
            if not api_process:
                return
                
        if not args.api_only:
            api_url = f"http://localhost:{args.api_port}/api" if api_process else None
            ui_process = start_ui(args.ui_port, api_url)
            if not ui_process:
                if api_process:
                    api_process.terminate()
                return
            
            # Open browser if not disabled
            if not args.no_browser:
                webbrowser.open(f"http://localhost:{args.ui_port}")
        
        print("\n💡 Press Ctrl+C to stop the application\n")
        
        # Keep the script running
        try:
            if api_process:
                for line in api_process.stdout:
                    print(f"[API] {line.strip()}")
            elif ui_process:
                for line in ui_process.stdout:
                    print(f"[UI] {line.strip()}")
        except KeyboardInterrupt:
            print("\n🛑 Stopping the application...")
            
    finally:
        # Clean up processes
        if api_process:
            api_process.terminate()
            print("API server stopped")
            
        if ui_process:
            ui_process.terminate()
            print("UI server stopped")
    
    print("✨ Application terminated successfully")


if __name__ == "__main__":
    main() 