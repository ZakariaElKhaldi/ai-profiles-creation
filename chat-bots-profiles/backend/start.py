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
import logging
import socket
import colorama
from colorama import Fore, Style
import requests
from datetime import datetime

# Initialize colorama for cross-platform colored terminal output
colorama.init()

# Set up logging
LOG_FILE = "backend_server.log"
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
    handlers=[
        logging.FileHandler(LOG_FILE),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger("backend_starter")

def print_colored(message, color=Fore.WHITE, bold=False):
    """Print colored message to console."""
    style = Style.BRIGHT if bold else ""
    print(f"{style}{color}{message}{Style.RESET_ALL}")

def log_info(message):
    """Log info message and print to console."""
    logger.info(message)
    print_colored(message, Fore.CYAN)

def log_success(message):
    """Log success message and print to console."""
    logger.info(message)
    print_colored(message, Fore.GREEN, bold=True)

def log_warning(message):
    """Log warning message and print to console."""
    logger.warning(message)
    print_colored(message, Fore.YELLOW, bold=True)

def log_error(message):
    """Log error message and print to console."""
    logger.error(message)
    print_colored(message, Fore.RED, bold=True)

def check_dependencies():
    """Check if all required dependencies are installed."""
    log_info("Checking dependencies...")
    missing_deps = []
    
    # Define dependencies with their import names
    dependencies = {
        "fastapi": {"import_name": "fastapi", "description": "FastAPI framework"},
        "uvicorn": {"import_name": "uvicorn", "description": "ASGI server"},
        "httpx": {"import_name": "httpx", "description": "HTTP client"},
        "python-dotenv": {"import_name": "dotenv", "description": "Environment variable management"},
        "pydantic": {"import_name": "pydantic", "description": "Data validation"},
        "psutil": {"import_name": "psutil", "description": "Process management"},
        "colorama": {"import_name": "colorama", "description": "Terminal colors"},
        "requests": {"import_name": "requests", "description": "HTTP requests library"}
    }
    
    for package_name, info in dependencies.items():
        try:
            __import__(info["import_name"])
            logger.debug(f"✓ {package_name} is installed")
        except ImportError:
            missing_deps.append(f"{package_name} ({info['description']})")
    
    if missing_deps:
        log_error(f"Missing dependencies: {', '.join(missing_deps)}")
        log_info("Please install all dependencies using: pip install -r requirements.txt")
        return False
    
    log_success("All required dependencies are installed")
    return True

def check_env_file():
    """Check if the .env file exists and has required variables."""
    log_info("Checking environment configuration...")
    
    try:
        from dotenv import load_dotenv
        
        env_path = Path(".env")
        if not env_path.exists():
            log_error(f".env file not found at {env_path.absolute()}")
            log_info("Creating a template .env file...")
            
            with open(env_path, "w") as f:
                f.write("# API Keys\n")
                f.write("OPENROUTER_API_KEY=your_api_key_here\n\n")
                f.write("# Model Configuration\n")
                f.write("DEFAULT_MODEL=openai/gpt-3.5-turbo\n")
            
            log_info(f"Template .env file created at {env_path.absolute()}")
            log_info("Please edit the file and add your API keys")
            return False
        
        load_dotenv()
        
        required_vars = ['OPENROUTER_API_KEY']
        missing_vars = []
        
        for var in required_vars:
            if not os.getenv(var):
                missing_vars.append(var)
        
        if missing_vars:
            log_error(f"Missing required environment variables: {', '.join(missing_vars)}")
            log_info("Please add them to your .env file")
            return False
        
        # Validate API key format
        api_key = os.getenv('OPENROUTER_API_KEY')
        if api_key == 'your_api_key_here':
            log_error("OPENROUTER_API_KEY is set to the default value. Please update it with your actual API key.")
            log_info("You can get an API key at https://openrouter.ai/keys")
            return False
            
        log_success("Environment variables verified")
        return True
    except Exception as e:
        log_error(f"Error checking environment variables: {str(e)}")
        return False

def test_api_key():
    """Test if the OpenRouter API key is valid."""
    log_info("Testing OpenRouter API key...")
    
    api_key = os.getenv('OPENROUTER_API_KEY')
    if not api_key:
        return False
        
    try:
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
        
        response = requests.get(
            "https://openrouter.ai/api/v1/models",
            headers=headers,
            timeout=5
        )
        
        if response.status_code == 200:
            log_success("API key is valid")
            return True
        else:
            log_error(f"API key validation failed: {response.status_code} - {response.text}")
            return False
    except Exception as e:
        log_error(f"Error testing API key: {str(e)}")
        return False

def is_port_in_use(port):
    """Check if a port is already in use."""
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        return s.connect_ex(('localhost', port)) == 0

def get_process_on_port(port):
    """Get the process ID using the specified port."""
    try:
        for proc in psutil.process_iter(['pid', 'name', 'connections']):
            try:
                for conn in proc.connections():
                    if conn.laddr.port == port and conn.status == 'LISTEN':
                        return proc.pid, proc.name()
            except (psutil.AccessDenied, psutil.NoSuchProcess):
                continue
                
        # Fallback to command line tools if psutil doesn't find it
        if platform.system() == "Windows":
            # For Windows
            result = subprocess.run(
                ["netstat", "-ano"],
                capture_output=True,
                text=True
            )
            if result.stdout:
                # Parse the output to get the PID
                for line in result.stdout.strip().split('\n'):
                    if f":{port}" in line and "LISTENING" in line:
                        parts = line.strip().split()
                        if parts:
                            pid = int(parts[-1])
                            try:
                                proc = psutil.Process(pid)
                                return pid, proc.name()
                            except:
                                return pid, "Unknown"
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
                        pid = int(parts[1])
                        try:
                            proc = psutil.Process(pid)
                            return pid, proc.name()
                        except:
                            return pid, "Unknown"
    except Exception as e:
        log_error(f"Error identifying process on port {port}: {str(e)}")
    
    return None, None

def kill_process(pid):
    """Kill a process by its PID."""
    try:
        process = psutil.Process(pid)
        process_name = process.name()
        
        log_info(f"Attempting to terminate process {process_name} (PID: {pid})...")
        
        # Try graceful termination first
        process.terminate()
        
        # Wait for a timeout
        gone, alive = psutil.wait_procs([process], timeout=3)
        
        if process in alive:
            log_warning(f"Process {pid} did not terminate gracefully, forcing...")
            process.kill()
            
        return True
    except Exception as e:
        log_error(f"Error killing process {pid}: {str(e)}")
        
        # Fallback to system commands
        try:
            if platform.system() == "Windows":
                subprocess.run(["taskkill", "/PID", str(pid), "/F"], check=True)
            else:
                os.kill(pid, signal.SIGKILL)
            log_info(f"Process {pid} killed using system commands")
            return True
        except Exception as e2:
            log_error(f"Failed to kill process using system commands: {str(e2)}")
            return False

def handle_port_conflict(port, force=False):
    """Handle a port conflict by identifying and optionally killing the process."""
    log_warning(f"Port {port} is already in use")
    
    pid, process_name = get_process_on_port(port)
    if not pid:
        log_error(f"Cannot identify which process is using port {port}")
        return False
    
    log_info(f"Process using port {port}: {process_name} (PID: {pid})")
    
    if force:
        if kill_process(pid):
            log_success(f"Successfully killed process on port {port}")
            # Give time for the port to be released
            time.sleep(1)
            return True
        else:
            log_error(f"Failed to kill process on port {port}")
            return False
    
    while True:
        choice = input(f"{Fore.YELLOW}Do you want to kill {process_name} (PID: {pid}) to free up port {port}? (y/n/a): {Style.RESET_ALL}").lower()
        if choice in ['y', 'yes']:
            if kill_process(pid):
                log_success(f"Successfully killed process on port {port}")
                # Give time for the port to be released
                time.sleep(1)
                return True
            else:
                log_error(f"Failed to kill process on port {port}")
                return False
        elif choice in ['n', 'no']:
            log_warning(f"Port {port} will remain in use. API server may not start correctly.")
            return False
        elif choice in ['a', 'alternate']:
            # Find an available port
            test_port = port + 1
            while is_port_in_use(test_port) and test_port < port + 10:
                test_port += 1
                
            if test_port < port + 10:
                log_info(f"Found available port: {test_port}")
                return test_port
            else:
                log_error("Could not find an available port in range")
                return False
        else:
            print("Invalid choice. Please enter 'y' (yes), 'n' (no), or 'a' (find alternate port).")

def monitor_process_output(process, timeout=5):
    """Monitor process output for a specified time to catch startup errors."""
    start_time = time.time()
    output_lines = []
    error_lines = []
    
    while time.time() - start_time < timeout:
        # Check if process has terminated
        if process.poll() is not None:
            break
            
        # Read output
        if process.stdout:
            line = process.stdout.readline()
            if line:
                line_str = line.decode('utf-8', errors='replace').strip()
                output_lines.append(line_str)
                logger.debug(f"STDOUT: {line_str}")
                
                # Check for successful startup indicators
                if "Application startup complete" in line_str:
                    return True, output_lines, error_lines
                    
        # Read errors
        if process.stderr:
            line = process.stderr.readline()
            if line:
                line_str = line.decode('utf-8', errors='replace').strip()
                error_lines.append(line_str)
                logger.debug(f"STDERR: {line_str}")
                
                # Check for critical errors
                if "Error:" in line_str or "Exception:" in line_str:
                    return False, output_lines, error_lines
                    
        time.sleep(0.1)
    
    # If we get here, we didn't see a definitive success or failure message
    # We'll assume it's running if the process is still alive
    return process.poll() is None, output_lines, error_lines

def start_api(port=8000, debug=False):
    """Start the FastAPI backend server."""
    if is_port_in_use(port):
        result = handle_port_conflict(port)
        if isinstance(result, int):
            # We got an alternate port
            port = result
            log_info(f"Using alternate port: {port}")
        elif not result:
            log_warning(f"Attempting to start server on port {port} anyway, but it may fail")
    
    log_info(f"Starting API server on port {port}...")
    
    # Check if main.py exists
    if not Path("main.py").exists():
        log_error("main.py not found in the current directory")
        log_info(f"Current directory: {os.getcwd()}")
        log_info("Make sure you're running this script from the backend directory or that main.py exists")
        return None
    
    # Create the command
    api_cmd = [sys.executable, "-m", "uvicorn", "main:app", "--reload"]
    
    # Add port
    api_cmd.append(f"--port={port}")
    
    # Add host to bind to all interfaces
    api_cmd.append("--host=0.0.0.0")
    
    # Add debug flag if requested
    if debug:
        api_cmd.append("--log-level=debug")
    else:
        api_cmd.append("--log-level=info")
    
    # Log the command
    logger.debug(f"Running command: {' '.join(api_cmd)}")
    
    try:
        # Start the process
        api_process = subprocess.Popen(
            api_cmd, 
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            bufsize=1,  # Line buffered
            universal_newlines=False,  # Binary mode
            shell=False  # Don't use shell to avoid potential security issues
        )
        
        # Monitor the process output for a short time to catch startup errors
        success, output, errors = monitor_process_output(api_process, timeout=5)
        
        if not success:
            log_error("API server failed to start")
            
            # Display the error messages
            if errors:
                log_error("Error details:")
                for line in errors[-10:]:  # Show last 10 error lines
                    print_colored(f"  {line}", Fore.RED)
            
            # Check for specific errors
            error_text = "\n".join(errors)
            
            if "OPENROUTER_API_KEY" in error_text:
                log_error("API key issue detected. Make sure your .env file has a valid OPENROUTER_API_KEY")
                log_info("You can get an API key at https://openrouter.ai/keys")
            elif "ModuleNotFound" in error_text:
                log_error("Missing module detected. Try running: pip install -r requirements.txt")
                
                # Extract the missing module name
                import re
                match = re.search(r"ModuleNotFoundError: No module named '([^']+)'", error_text)
                if match:
                    module = match.group(1)
                    log_info(f"Try installing the missing module: pip install {module}")
            elif "Address already in use" in error_text:
                log_error(f"Port {port} is still in use")
                log_info(f"Try manually killing the process or use a different port: --port={port+1}")
            elif "SyntaxError" in error_text:
                log_error("Syntax error in the code")
                # Extract the file and line number
                match = re.search(r"File \"([^\"]+)\", line (\d+)", error_text)
                if match:
                    file, line = match.groups()
                    log_info(f"Check {file} around line {line}")
            
            return None
        
        log_success(f"API server running at http://localhost:{port}")
        log_success(f"API documentation available at http://localhost:{port}/docs")
        
        # Start a thread to continuously read and log output
        def log_output_continuously():
            while api_process.poll() is None:
                if api_process.stdout:
                    line = api_process.stdout.readline()
                    if line:
                        logger.debug(f"SERVER: {line.decode('utf-8', errors='replace').strip()}")
                if api_process.stderr:
                    line = api_process.stderr.readline()
                    if line:
                        logger.warning(f"SERVER ERROR: {line.decode('utf-8', errors='replace').strip()}")
                time.sleep(0.1)
        
        import threading
        output_thread = threading.Thread(target=log_output_continuously, daemon=True)
        output_thread.start()
        
        return api_process
        
    except Exception as e:
        log_error(f"Error starting API server: {str(e)}")
        return None

def safe_terminate_process(process):
    """Safely terminate a process."""
    if process is None:
        return
        
    try:
        # Get process ID
        pid = process.pid
        
        log_info(f"Terminating process {pid}...")
        
        # Try graceful termination first
        process.terminate()
        
        # Wait for a timeout
        timeout = 5
        start_time = time.time()
        while process.poll() is None and time.time() - start_time < timeout:
            time.sleep(0.1)
        
        # If still running, force kill
        if process.poll() is None:
            log_warning(f"Process {pid} did not terminate gracefully, force killing...")
            if platform.system() == "Windows":
                subprocess.run(["taskkill", "/PID", str(pid), "/F"], check=True)
            else:
                os.kill(pid, signal.SIGKILL)
                
        log_success(f"Process {pid} terminated")
    except Exception as e:
        log_error(f"Error while terminating process: {str(e)}")

def check_for_updates():
    """Check if there are updates available for the application."""
    log_info("Checking for updates...")
    
    try:
        # This is a placeholder - in a real application, you would check a version endpoint
        # or a GitHub repository for the latest version
        return False
    except Exception as e:
        logger.error(f"Error checking for updates: {str(e)}")
        return False

def main():
    """Main function to start the application."""
    parser = argparse.ArgumentParser(description="Start the AI Chatbot Profiles backend")
    parser.add_argument("--port", type=int, default=8000, help="Port for the API server")
    parser.add_argument("--no-open", action="store_true", help="Don't open browser automatically")
    parser.add_argument("--kill-port", action="store_true", help="Kill any process using the specified port before starting")
    parser.add_argument("--debug", action="store_true", help="Enable debug mode with verbose logging")
    parser.add_argument("--check-api-key", action="store_true", help="Test the OpenRouter API key")
    parser.add_argument("--skip-checks", action="store_true", help="Skip dependency and environment checks (for troubleshooting)")
    args = parser.parse_args()
    
    # Set debug level if requested
    if args.debug:
        logger.setLevel(logging.DEBUG)
        log_info("Debug mode enabled")
    
    # Print header
    print("\n" + "=" * 60)
    print_colored("   🤖 AI Chatbot Profiles Backend", Fore.CYAN, bold=True)
    print("=" * 60 + "\n")
    
    # Log startup information
    logger.info(f"Starting backend server at {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    logger.info(f"Python version: {sys.version}")
    logger.info(f"Platform: {platform.platform()}")
    
    # Check for updates
    if check_for_updates():
        log_warning("Updates are available for this application")
    
    # Ensure we're in the backend directory
    # Get the script's directory
    script_dir = Path(__file__).parent.absolute()
    os.chdir(script_dir)
    logger.debug(f"Working directory: {os.getcwd()}")
    
    # Skip checks if requested
    if args.skip_checks:
        log_warning("Skipping dependency and environment checks (--skip-checks flag used)")
    else:
        # Check dependencies
        if not check_dependencies():
            log_error("Dependency check failed. Please fix the issues above.")
            log_info("To bypass this check, use the --skip-checks flag (for troubleshooting only)")
            sys.exit(1)
        
        # Check environment variables
        if not check_env_file():
            log_error("Environment check failed. Please fix the issues above.")
            log_info("If you don't have an OpenRouter API key, get one at https://openrouter.ai/keys")
            log_info("To bypass this check, use the --skip-checks flag (for troubleshooting only)")
            sys.exit(1)
    
    # Test API key if requested
    if args.check_api_key:
        if not test_api_key():
            log_error("API key test failed. Please check your API key.")
            sys.exit(1)
    
    # Force kill process on port if requested
    if args.kill_port and is_port_in_use(args.port):
        pid, process_name = get_process_on_port(args.port)
        if pid:
            log_warning(f"Force killing process {process_name} (PID: {pid}) on port {args.port}")
            
            if kill_process(pid):
                log_success(f"Successfully killed process on port {args.port}")
                time.sleep(1)
            else:
                log_error(f"Failed to kill process on port {args.port}")
                sys.exit(1)
    
    # Start API server
    api_process = start_api(port=args.port, debug=args.debug)
    if not api_process:
        log_error("Could not start API server. Exiting.")
        sys.exit(1)
    
    # Open browser if requested
    if not args.no_open:
        log_info("Opening API documentation...")
        try:
            webbrowser.open(f"http://localhost:{args.port}/docs")
        except Exception as e:
            log_warning(f"Could not open browser: {str(e)}")
    
    try:
        print("\n" + "=" * 60)
        print_colored("   Server is running. Press Ctrl+C to stop", Fore.GREEN, bold=True)
        print_colored("   Log file: " + LOG_FILE, Fore.CYAN)
        print("=" * 60 + "\n")
        
        # Keep the script running and monitor the process
        while api_process.poll() is None:
            time.sleep(1)
            
        # If we get here, the process has terminated unexpectedly
        exit_code = api_process.poll()
        log_error(f"API server process terminated unexpectedly with exit code {exit_code}")
        
        # Try to get any final output
        stdout, stderr = api_process.communicate()
        if stderr:
            log_error("Error output:")
            for line in stderr.decode('utf-8', errors='replace').strip().split('\n')[-10:]:
                print_colored(f"  {line}", Fore.RED)
                
        sys.exit(1)
        
    except KeyboardInterrupt:
        log_info("\nShutting down...")
        
        # Terminate process
        if api_process:
            safe_terminate_process(api_process)
        
        log_success("Server stopped. Goodbye! 👋")


if __name__ == "__main__":
    main() 