#!/usr/bin/env python

import os
import sys
import subprocess
import time
import argparse
import webbrowser
from pathlib import Path
import platform
import signal
import psutil


def check_dependencies():
    """Check if all required dependencies are installed."""
    try:
        import fastapi
        import uvicorn
        import httpx
        import dotenv
        import pydantic
        return True
    except ImportError as e:
        print(f"Missing dependency: {e}")
        print("Please install all dependencies using: pip install -r requirements.txt")
        return False


def check_env_file():
    """Check if the .env file exists and has required variables."""
    from dotenv import load_dotenv
    
    env_path = Path(".env")
    if not env_path.exists():
        print(f"❌ .env file not found at {env_path.absolute()}")
        return False
    
    load_dotenv()
    
    required_vars = ['OPENROUTER_API_KEY']
    missing_vars = []
    
    for var in required_vars:
        if not os.getenv(var):
            missing_vars.append(var)
    
    if missing_vars:
        print(f"❌ Missing required environment variables: {', '.join(missing_vars)}")
        print("Please add them to your .env file")
        return False
    
    print("✅ Environment variables verified")
    return True


def is_port_in_use(port):
    """Check if a port is already in use."""
    import socket
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        return s.connect_ex(('localhost', port)) == 0


def get_process_on_port(port):
    """Get the process ID using the specified port."""
    try:
        if platform.system() == "Windows":
            # For Windows
            result = subprocess.run(
                ["netstat", "-ano", "|", "findstr", f":{port}"],
                capture_output=True,
                text=True,
                shell=True
            )
            if result.stdout:
                # Parse the output to get the PID
                for line in result.stdout.strip().split('\n'):
                    if f":{port}" in line and "LISTENING" in line:
                        parts = line.strip().split()
                        if parts:
                            return int(parts[-1])
        else:
            # For Unix-like systems (Linux/Mac)
            result = subprocess.run(
                ["lsof", "-i", f":{port}"],
                capture_output=True,
                text=True
            )
            if result.stdout:
                # Parse the output to get the PID
                for line in result.stdout.strip().split('\n')[1:]:  # Skip header
                    parts = line.strip().split()
                    if len(parts) > 1:
                        return int(parts[1])
    except Exception as e:
        print(f"Error identifying process on port {port}: {e}")
    
    return None


def kill_process(pid):
    """Kill a process by its PID."""
    try:
        if platform.system() == "Windows":
            subprocess.run(["taskkill", "/PID", str(pid), "/F"], check=True)
            return True
        else:
            os.kill(pid, signal.SIGKILL)
            return True
    except Exception as e:
        print(f"Error killing process {pid}: {e}")
        return False


def handle_port_conflict(port):
    """Handle a port conflict by identifying and optionally killing the process."""
    print(f"⚠️ Port {port} is already in use.")
    
    pid = get_process_on_port(port)
    if not pid:
        print("Cannot identify which process is using this port.")
        return False
    
    try:
        process = psutil.Process(pid)
        process_name = process.name()
        print(f"Process using port {port}: {process_name} (PID: {pid})")
    except:
        process_name = "Unknown"
        print(f"Process using port {port}: PID {pid}")
    
    while True:
        choice = input(f"Do you want to kill {process_name} (PID: {pid}) to free up port {port}? (y/n): ").lower()
        if choice in ['y', 'yes']:
            if kill_process(pid):
                print(f"✅ Successfully killed process on port {port}")
                # Give time for the port to be released
                time.sleep(1)
                return True
            else:
                print(f"❌ Failed to kill process on port {port}")
                return False
        elif choice in ['n', 'no']:
            print(f"Port {port} will remain in use. API server may not start correctly.")
            return False
        else:
            print("Invalid choice. Please enter 'y' or 'n'.")


def start_api(port=8000):
    """Start the FastAPI backend server."""
    if is_port_in_use(port):
        if not handle_port_conflict(port):
            print(f"⚠️ Attempting to start server on port {port} anyway, but it may fail.")
    
    print(f"🚀 Starting API server on port {port}...")
    
    # Create the command
    api_cmd = [sys.executable, "-m", "uvicorn", "main:app", "--reload", f"--port={port}"]
    
    # Check if on Windows
    if platform.system() == "Windows":
        api_process = subprocess.Popen(
            api_cmd, 
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            shell=True
        )
    else:
        api_process = subprocess.Popen(
            api_cmd, 
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
        )
    
    # Give the server some time to start
    time.sleep(2)
    
    # Check if process is still running
    if api_process.poll() is not None:
        print("❌ API server failed to start.")
        stdout, stderr = api_process.communicate()
        error_msg = stderr.decode()
        print("Error:", error_msg)
        
        # Check for specific errors
        if "OPENROUTER_API_KEY" in error_msg:
            print("\n⚠️ API key issue detected. Make sure your .env file has a valid OPENROUTER_API_KEY.")
            print("You can get an API key at https://openrouter.ai/keys")
        elif "ModuleNotFound" in error_msg:
            print("\n⚠️ Missing module detected. Try running: pip install -r requirements.txt")
        elif "Address already in use" in error_msg:
            print(f"\n⚠️ Port {port} is still in use. Try manually killing the process or use a different port:")
            print(f"   --port={port+1}")
            
        return None
    
    print(f"✅ API server running at http://localhost:{port}")
    print(f"📚 API documentation available at http://localhost:{port}/docs")
    return api_process


def safe_terminate_process(process):
    """Safely terminate a process."""
    if process is None:
        return
        
    try:
        # Get process ID
        pid = process.pid
        
        # Try graceful termination first
        print(f"Terminating process {pid}...")
        process.terminate()
        
        # Wait for a timeout
        timeout = 5
        start_time = time.time()
        while process.poll() is None and time.time() - start_time < timeout:
            time.sleep(0.1)
        
        # If still running, force kill
        if process.poll() is None:
            print(f"Force killing process {pid}...")
            if platform.system() == "Windows":
                subprocess.run(["taskkill", "/PID", str(pid), "/F"], check=True)
            else:
                os.kill(pid, signal.SIGKILL)
    except Exception as e:
        print(f"Error while terminating process: {e}")


def main():
    """Main function to start the application."""
    parser = argparse.ArgumentParser(description="Start the AI Chatbot Profiles backend")
    parser.add_argument("--port", type=int, default=8000, help="Port for the API server")
    parser.add_argument("--no-open", action="store_true", help="Don't open browser automatically")
    parser.add_argument("--kill-port", action="store_true", help="Kill any process using the specified port before starting")
    args = parser.parse_args()
    
    print("=" * 60)
    print("   🤖 AI Chatbot Profiles Backend")
    print("=" * 60)
    
    # Ensure we're in the backend directory
    # Get the script's directory
    script_dir = Path(__file__).parent.absolute()
    os.chdir(script_dir)
    
    # Check dependencies
    if not check_dependencies():
        print("\nPlease install required dependencies and try again.")
        sys.exit(1)
    
    # Check environment variables
    if not check_env_file():
        print("\n❌ Environment check failed. Please fix the issues above.")
        print("If you don't have an OpenRouter API key, get one at https://openrouter.ai/keys")
        sys.exit(1)
    
    # Force kill process on port if requested
    if args.kill_port and is_port_in_use(args.port):
        pid = get_process_on_port(args.port)
        if pid:
            try:
                process = psutil.Process(pid)
                process_name = process.name()
                print(f"Force killing process {process_name} (PID: {pid}) on port {args.port}")
            except:
                print(f"Force killing process with PID {pid} on port {args.port}")
            
            if kill_process(pid):
                print(f"✅ Successfully killed process on port {args.port}")
                time.sleep(1)
            else:
                print(f"❌ Failed to kill process on port {args.port}")
                sys.exit(1)
    
    # Start API server
    api_process = start_api(port=args.port)
    if not api_process:
        print("Could not start API server. Exiting.")
        sys.exit(1)
    
    # Open browser if requested
    if not args.no_open:
        print("Opening API documentation...")
        webbrowser.open(f"http://localhost:{args.port}/docs")
    
    try:
        print("\n" + "=" * 60)
        print("   Press Ctrl+C to stop the server")
        print("=" * 60 + "\n")
        
        # Keep the script running
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\nShutting down...")
        
        # Terminate process
        if api_process:
            safe_terminate_process(api_process)
        
        print("Server stopped. Goodbye! 👋")


if __name__ == "__main__":
    main() 