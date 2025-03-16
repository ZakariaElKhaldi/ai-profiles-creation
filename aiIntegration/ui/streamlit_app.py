import streamlit as st
import requests
import json
import os
import io
import time
import uuid
import pandas as pd
import matplotlib.pyplot as plt
import numpy as np
from datetime import datetime
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configuration
API_URL = os.getenv("API_URL", "http://localhost:8000/api")

st.set_page_config(
    page_title="School Management AI Assistant",
    page_icon="🏫",
    layout="wide"
)

# Initialize session state for error handling and settings
if "error_count" not in st.session_state:
    st.session_state.error_count = 0
if "last_error_time" not in st.session_state:
    st.session_state.last_error_time = 0
if "selected_model" not in st.session_state:
    st.session_state.selected_model = "openai/gpt-3.5-turbo"  # Default model
if "available_models" not in st.session_state:
    st.session_state.available_models = {}
if "uploaded_files" not in st.session_state:
    st.session_state.uploaded_files = []
if "upload_message" not in st.session_state:
    st.session_state.upload_message = None
if "session_id" not in st.session_state:
    st.session_state.session_id = str(uuid.uuid4())
if "ab_test_results" not in st.session_state:
    st.session_state.ab_test_results = []
if "current_tab" not in st.session_state:
    st.session_state.current_tab = "chat"
if "use_document_context" not in st.session_state:
    st.session_state.use_document_context = False
if "documents" not in st.session_state:
    st.session_state.documents = []

def handle_error(error_message, error_type="general"):
    """Handle errors with exponential backoff"""
    current_time = time.time()
    
    # Reset error count if last error was more than 5 minutes ago
    if current_time - st.session_state.last_error_time > 300:
        st.session_state.error_count = 0
    
    st.session_state.error_count += 1
    st.session_state.last_error_time = current_time
    
    # Calculate wait time with exponential backoff (max 30 seconds)
    wait_time = min(2 ** st.session_state.error_count, 30)
    
    if error_type == "connection":
        st.error(f"📡 Connection Error: {error_message}. Retrying in {wait_time} seconds...")
    elif error_type == "api":
        st.error(f"🚫 API Error: {error_message}. Please try again later.")
    else:
        st.error(f"❌ Error: {error_message}")
    
    # Add suggestion based on error type
    if error_type == "connection":
        st.info("💡 Check your network connection or server status.")
    elif error_type == "api":
        st.info("💡 The server might be overloaded. Please wait or contact support.")
    
    return wait_time

def get_models():
    """Fetch available models from the API"""
    try:
        response = requests.get(f"{API_URL}/models", timeout=10)
        if response.status_code == 200:
            st.session_state.available_models = response.json()
            return st.session_state.available_models
        else:
            handle_error(f"Failed to fetch models: {response.status_code}", "api")
            return {}
    except requests.RequestException as e:
        handle_error(str(e), "connection")
        return {}
    except Exception as e:
        handle_error(str(e))
        return {}

def get_model_categories():
    """Fetch model categories from the API"""
    try:
        response = requests.get(f"{API_URL}/models/categories", timeout=5)
        if response.status_code == 200:
            return response.json()
        else:
            return ["General Purpose", "Advanced", "Specialized"]
    except:
        return ["General Purpose", "Advanced", "Specialized"]

def get_chat_response(messages, model=None, use_document_context=False):
    """Send chat messages to the API and get a response"""
    try:
        payload = {
            "messages": messages,
            "user_id": "streamlit_user",
            "model": model or st.session_state.selected_model,
            "use_document_context": use_document_context,
            "session_id": st.session_state.session_id
        }
        
        response = requests.post(
            f"{API_URL}/chat",
            json=payload,
            timeout=30
        )
        
        if response.status_code == 200:
            return response.json()
        else:
            handle_error(f"{response.status_code} - {response.text}", "api")
            return {
                "message": {
                    "role": "assistant",
                    "content": "Sorry, I encountered an error processing your request. Please try again later."
                }
            }
    except requests.RequestException as e:
        wait_time = handle_error(str(e), "connection")
        time.sleep(wait_time)  # Implement backoff
        return {
            "message": {
                "role": "assistant", 
                "content": "I'm having trouble connecting to the server. Please check your connection and try again."
            }
        }
    except Exception as e:
        handle_error(str(e))
        return {
            "message": {
                "role": "assistant",
                "content": "An unexpected error occurred. Please try again."
            }
        }

def upload_file(file):
    """Upload a file to the API"""
    try:
        files = {"file": (file.name, file.getvalue())}
        data = {"filename": file.name}
        
        response = requests.post(
            f"{API_URL}/upload",
            files=files,
            data=data,
            timeout=30
        )
        
        if response.status_code == 200:
            result = response.json()
            st.session_state.upload_message = f"✅ File {file.name} uploaded and processed successfully ({result.get('chunk_count', '0')} chunks)"
            fetch_documents()  # Refresh document list
            return True
        else:
            st.session_state.upload_message = f"❌ Error uploading file: {response.status_code} - {response.text}"
            return False
    except Exception as e:
        st.session_state.upload_message = f"❌ Error uploading file: {str(e)}"
        return False

def fetch_documents():
    """Fetch list of uploaded documents"""
    try:
        response = requests.get(f"{API_URL}/documents", timeout=10)
        if response.status_code == 200:
            st.session_state.documents = response.json()
        else:
            handle_error(f"Failed to fetch documents: {response.status_code}", "api")
    except Exception as e:
        handle_error(f"Error fetching documents: {str(e)}")

def delete_document(doc_id):
    """Delete a document"""
    try:
        response = requests.delete(f"{API_URL}/documents/{doc_id}", timeout=10)
        if response.status_code == 200:
            st.success(f"Document deleted successfully")
            fetch_documents()  # Refresh document list
        else:
            handle_error(f"Failed to delete document: {response.status_code}", "api")
    except Exception as e:
        handle_error(f"Error deleting document: {str(e)}")

def get_metrics():
    """Fetch performance metrics"""
    try:
        response = requests.get(
            f"{API_URL}/metrics?session_id={st.session_state.session_id}", 
            timeout=10
        )
        if response.status_code == 200:
            return response.json().get("metrics", {})
        else:
            handle_error(f"Failed to fetch metrics: {response.status_code}", "api")
            return {}
    except Exception as e:
        handle_error(f"Error fetching metrics: {str(e)}")
        return {}

def perform_ab_test(model_a, model_b, messages):
    """Perform A/B test between two models"""
    try:
        # Format messages for the API
        formatted_messages = [{"role": msg["role"], "content": msg["content"]} for msg in messages]
        
        # Log the request for debugging
        st.session_state.last_test_request = {
            "model_a": model_a,
            "model_b": model_b,
            "messages": formatted_messages
        }
        
        # Show loading indicator
        with st.spinner(f"Comparing {model_a} with {model_b}..."):
            response = requests.post(
                f"{API_URL}/compare_models?model_a={model_a}&model_b={model_b}",
                json=formatted_messages,
                timeout=60
            )
        
        if response.status_code == 200:
            result = response.json()
            # Save response for debugging
            st.session_state.last_test_response = result
            
            # Store result in session state
            st.session_state.ab_test_results.append({
                "timestamp": datetime.now().strftime("%H:%M:%S"),
                "model_a": model_a,
                "model_b": model_b,
                "query": result.get("query", ""),
                "result_a": result.get("result_a", {}),
                "result_b": result.get("result_b", {}),
                "metrics": result.get("metrics", {})
            })
            return True
        else:
            error_msg = f"A/B test failed: {response.status_code}"
            try:
                error_msg += f" - {response.json().get('detail', response.text)}"
            except:
                error_msg += f" - {response.text}"
            
            handle_error(error_msg, "api")
            return False
    except Exception as e:
        handle_error(f"Error performing A/B test: {str(e)}")
        return False

def render_metrics_dashboard():
    """Render the performance metrics dashboard"""
    st.subheader("🔍 Performance Metrics Dashboard")
    
    # Check if we have sent at least one message in this session
    if not st.session_state.messages or len(st.session_state.messages) <= 1:
        st.info("No chat data available yet. Start a conversation to collect metrics.")
        
        # Add a sample test button
        if st.button("Generate Sample Data", key="sample_data"):
            with st.spinner("Generating sample data..."):
                # Send a test message
                test_messages = [{"role": "user", "content": "Tell me about educational systems"}]
                get_chat_response(test_messages)
                st.success("Sample data generated! Refresh this page to see metrics.")
        return
    
    # Fetch metrics data
    metrics_data = get_metrics()
    
    # Check if we have data for current session
    if not metrics_data or st.session_state.session_id not in metrics_data:
        st.warning("No metrics data available for this session. This could be due to:")
        st.markdown("""
        1. The session is new and no requests have been logged yet
        2. There was an error collecting metrics
        3. The API server was restarted and metrics were lost
        """)
        
        # Add refresh button
        if st.button("Refresh Metrics", key="refresh_metrics"):
            st.rerun()
        return
    
    # Get metrics for current session
    session_metrics = metrics_data.get(st.session_state.session_id, [])
    
    if not session_metrics:
        st.info("No metrics data available for this session.")
        return
    
    # Convert to DataFrame for easier analysis
    df = pd.DataFrame(session_metrics)
    
    # Add time elapsed column
    if not df.empty and 'timestamp' in df.columns:
        first_timestamp = df['timestamp'].iloc[0]
        df['time_elapsed'] = df['timestamp'] - first_timestamp
        df['time_readable'] = df['time_elapsed'].apply(lambda x: f"{x:.1f}s")
    
    # Display session info
    st.write("### Session Information")
    session_col1, session_col2, session_col3 = st.columns(3)
    with session_col1:
        st.metric("Total Requests", len(df))
    with session_col2:
        if 'tokens' in df.columns:
            st.metric("Total Tokens Used", int(df['tokens'].sum()))
    with session_col3:
        if 'model' in df.columns:
            models_used = df['model'].unique()
            st.metric("Models Used", len(models_used))
    
    # Display model distribution if multiple models were used
    if 'model' in df.columns and len(df['model'].unique()) > 1:
        st.write("### Model Usage Distribution")
        model_counts = df['model'].value_counts().reset_index()
        model_counts.columns = ['Model', 'Count']
        
        fig, ax = plt.subplots()
        ax.bar(model_counts['Model'], model_counts['Count'])
        ax.set_xlabel('Model')
        ax.set_ylabel('Number of Requests')
        ax.set_title('Requests by Model')
        plt.xticks(rotation=45, ha='right')
        st.pyplot(fig)
    
    # Create metrics visualizations
    st.write("### Performance Metrics")
    metric_tabs = st.tabs(["Response Time", "Token Usage", "Request Size"])
    
    with metric_tabs[0]:  # Response Time tab
        if 'response_time' in df.columns:
            # Line chart for response time
            fig, ax = plt.subplots(figsize=(10, 4))
            ax.plot(df.index, df['response_time'], marker='o', linestyle='-', color='blue')
            ax.set_xlabel('Request #')
            ax.set_ylabel('Response Time (s)')
            ax.set_title('Response Time by Request')
            ax.grid(True, linestyle='--', alpha=0.7)
            
            # Add average line
            avg_time = df['response_time'].mean()
            ax.axhline(y=avg_time, color='r', linestyle='--', alpha=0.7)
            ax.text(0, avg_time*1.05, f'Average: {avg_time:.2f}s', color='r')
            
            st.pyplot(fig)
            
            # Add metrics
            col1, col2, col3 = st.columns(3)
            with col1:
                st.metric("Average", f"{df['response_time'].mean():.2f}s")
            with col2:
                st.metric("Maximum", f"{df['response_time'].max():.2f}s")
            with col3:
                st.metric("Minimum", f"{df['response_time'].min():.2f}s")
        else:
            st.info("No response time data available.")
    
    with metric_tabs[1]:  # Token Usage tab
        if 'tokens' in df.columns:
            # Bar chart for token usage
            fig, ax = plt.subplots(figsize=(10, 4))
            ax.bar(df.index, df['tokens'], color='green')
            ax.set_xlabel('Request #')
            ax.set_ylabel('Tokens Used')
            ax.set_title('Token Usage by Request')
            ax.grid(True, axis='y', linestyle='--', alpha=0.7)
            
            # Calculate trend line
            z = np.polyfit(df.index, df['tokens'], 1)
            p = np.poly1d(z)
            ax.plot(df.index, p(df.index), "r--", alpha=0.7)
            
            st.pyplot(fig)
            
            # Add metrics
            col1, col2, col3 = st.columns(3)
            with col1:
                st.metric("Total", f"{int(df['tokens'].sum())}")
            with col2:
                st.metric("Average", f"{df['tokens'].mean():.1f}")
            with col3:
                st.metric("Maximum", f"{df['tokens'].max()}")
                
            # Add cost estimation if available
            if 'model' in df.columns:
                st.write("### Cost Estimation")
                st.info("This is an approximate cost estimation based on average pricing.")
                
                # Simplified pricing model (very approximate)
                pricing_per_1k = {
                    'openai/gpt-3.5-turbo': 0.0015,
                    'openai/gpt-4': 0.03,
                    'anthropic/claude-3-opus': 0.015,
                    'anthropic/claude-3-sonnet': 0.008,
                    'default': 0.005  # fallback rate
                }
                
                # Calculate cost for each request
                if 'model' in df.columns and 'tokens' in df.columns:
                    df['cost'] = df.apply(
                        lambda row: (row['tokens'] / 1000) * pricing_per_1k.get(row['model'], pricing_per_1k['default']), 
                        axis=1
                    )
                    
                    total_cost = df['cost'].sum()
                    st.metric("Estimated Cost", f"${total_cost:.4f}")
                    
                    if len(df['model'].unique()) > 1:
                        # Cost breakdown by model
                        cost_by_model = df.groupby('model')['cost'].sum().reset_index()
                        cost_by_model.columns = ['Model', 'Cost']
                        
                        fig, ax = plt.subplots()
                        ax.pie(cost_by_model['Cost'], labels=cost_by_model['Model'], autopct='%1.1f%%')
                        ax.set_title('Cost Distribution by Model')
                        st.pyplot(fig)
        else:
            st.info("No token usage data available.")
    
    with metric_tabs[2]:  # Request Size tab
        if 'request_size' in df.columns and 'response_size' in df.columns:
            # Create a DataFrame with both request and response sizes
            size_df = pd.DataFrame({
                'Request Size': df['request_size'],
                'Response Size': df['response_size']
            })
            
            # Stacked bar chart
            fig, ax = plt.subplots(figsize=(10, 4))
            size_df.plot(kind='bar', stacked=True, ax=ax)
            ax.set_xlabel('Request #')
            ax.set_ylabel('Size (characters)')
            ax.set_title('Request and Response Size by Request')
            ax.legend(loc='upper left')
            ax.grid(True, axis='y', linestyle='--', alpha=0.7)
            
            st.pyplot(fig)
            
            # Add metrics
            col1, col2 = st.columns(2)
            with col1:
                st.metric("Average Request Size", f"{df['request_size'].mean():.0f} chars")
            with col2:
                st.metric("Average Response Size", f"{df['response_size'].mean():.0f} chars")
        else:
            st.info("No request/response size data available.")
    
    # Show data table with metrics
    with st.expander("View Raw Metrics Data"):
        # Create a cleaned version of the DataFrame for display
        display_df = df.copy()
        if 'timestamp' in display_df.columns:
            display_df['timestamp'] = pd.to_datetime(display_df['timestamp'], unit='s')
        
        # Round numerical columns
        for col in display_df.select_dtypes(include=['float']).columns:
            display_df[col] = display_df[col].round(3)
            
        st.dataframe(display_df)

def render_ab_testing():
    """Render the A/B testing interface"""
    st.subheader("🔬 A/B Testing")
    
    # Initialize debug states if not present
    if "show_debug" not in st.session_state:
        st.session_state.show_debug = False
    if "last_test_request" not in st.session_state:
        st.session_state.last_test_request = None
    if "last_test_response" not in st.session_state:
        st.session_state.last_test_response = None
    
    col1, col2 = st.columns(2)
    
    with col1:
        st.write("### Select models to compare:")
        # Get model options
        model_options = list(st.session_state.available_models.keys())
        if not model_options:
            st.warning("No models available. Please refresh models in the sidebar.")
            return
            
        model_display = {k: f"{v.get('name', k)} ({v.get('provider', 'Unknown')})" 
                       for k, v in st.session_state.available_models.items()}
        
        # Model selection
        model_a = st.selectbox(
            "Model A",
            model_options,
            format_func=lambda x: model_display.get(x, x),
            index=model_options.index(st.session_state.selected_model) if st.session_state.selected_model in model_options else 0
        )
        
        model_b = st.selectbox(
            "Model B",
            model_options,
            format_func=lambda x: model_display.get(x, x),
            index=min(1, len(model_options)-1)  # Select second model by default
        )
    
    with col2:
        st.write("### Enter your test prompt:")
        test_prompt = st.text_area(
            "Prompt for testing", 
            "Compare and contrast the educational systems in Finland and the United States.",
            height=100
        )
        
        test_col1, test_col2 = st.columns([3, 1])
        with test_col1:
            test_button = st.button("Run Comparison Test", type="primary")
        with test_col2:
            # Add a debug toggle for developers
            st.session_state.show_debug = st.toggle("Show Debug", value=st.session_state.show_debug)
        
        if test_button:
            if model_a == model_b:
                st.warning("Please select different models for comparison")
            else:
                # Create test messages
                test_messages = [{"role": "user", "content": test_prompt}]
                success = perform_ab_test(model_a, model_b, test_messages)
                if success:
                    st.success("A/B test completed successfully!")
    
    # Display debug info if enabled
    if st.session_state.show_debug and st.session_state.last_test_request:
        with st.expander("Debug Information"):
            st.write("### Last Test Request")
            st.json(st.session_state.last_test_request)
            if st.session_state.last_test_response:
                st.write("### Last Test Response")
                st.json(st.session_state.last_test_response)
    
    # Display test results
    if st.session_state.ab_test_results:
        st.write("### Test Results")
        
        # Show the most recent test result
        latest_test = st.session_state.ab_test_results[-1]
        
        # Check if we actually have results
        has_result_a = "content" in latest_test.get("result_a", {}) and latest_test.get("result_a", {}).get("content")
        has_result_b = "content" in latest_test.get("result_b", {}) and latest_test.get("result_b", {}).get("content")
        
        if not has_result_a or not has_result_b:
            st.error("Test results are incomplete. One or both models returned empty responses.")
            
            col1, col2 = st.columns(2)
            
            with col1:
                st.write(f"**Model A**: {model_display.get(latest_test['model_a'], latest_test['model_a'])}")
                content_a = latest_test['result_a'].get('content', 'No content returned')
                st.text_area(
                    "Response A", 
                    "⚠️ Empty response received" if not content_a else content_a, 
                    height=200
                )
                st.metric("Response Time", f"{latest_test['result_a'].get('response_time', 0):.2f}s")
                st.metric("Token Count", latest_test['result_a'].get('token_count', 0))
            
            with col2:
                st.write(f"**Model B**: {model_display.get(latest_test['model_b'], latest_test['model_b'])}")
                content_b = latest_test['result_b'].get('content', 'No content returned')
                st.text_area(
                    "Response B", 
                    "⚠️ Empty response received" if not content_b else content_b, 
                    height=200
                )
                st.metric("Response Time", f"{latest_test['result_b'].get('response_time', 0):.2f}s")
                st.metric("Token Count", latest_test['result_b'].get('token_count', 0))
            
            st.info("This could be due to API rate limits, insufficient permissions for these models, or a server-side issue. Try again or try different models.")
            return
        
        col1, col2 = st.columns(2)
        
        with col1:
            st.write(f"**Model A**: {model_display.get(latest_test['model_a'], latest_test['model_a'])}")
            st.text_area(
                "Response A", 
                latest_test['result_a'].get('content', 'No content available'), 
                height=200
            )
            st.metric("Response Time", f"{latest_test['result_a'].get('response_time', 0):.2f}s")
            st.metric("Token Count", latest_test['result_a'].get('token_count', 0))
        
        with col2:
            st.write(f"**Model B**: {model_display.get(latest_test['model_b'], latest_test['model_b'])}")
            st.text_area(
                "Response B", 
                latest_test['result_b'].get('content', 'No content available'), 
                height=200
            )
            st.metric("Response Time", f"{latest_test['result_b'].get('response_time', 0):.2f}s")
            st.metric("Token Count", latest_test['result_b'].get('token_count', 0))
        
        # Comparison metrics
        st.write("### Comparison Metrics")
        metrics = latest_test.get('metrics', {})
        
        if not metrics:
            st.warning("No comparison metrics available.")
        else:
            cols = st.columns(3)
            with cols[0]:
                response_time_diff = metrics.get('response_time_diff', 0)
                st.metric(
                    "Response Time Difference", 
                    f"{abs(response_time_diff):.2f}s",
                    delta=f"Model {'B' if response_time_diff > 0 else 'A'} was faster"
                )
            
            with cols[1]:
                token_diff = metrics.get('token_count_diff', 0)
                st.metric(
                    "Token Usage Difference", 
                    abs(token_diff),
                    delta=f"Model {'A' if token_diff < 0 else 'B'} used more tokens"
                )
            
            with cols[2]:
                length_diff = metrics.get('response_length_diff', 0)
                st.metric(
                    "Response Length Difference", 
                    abs(length_diff),
                    delta=f"Model {'A' if length_diff < 0 else 'B'} had a longer response"
                )
        
        # Show history of test results
        with st.expander("View Test History"):
            if len(st.session_state.ab_test_results) > 1:
                for i, test in enumerate(reversed(st.session_state.ab_test_results[:-1])):
                    st.write(f"**Test {len(st.session_state.ab_test_results) - i - 1}** - {test['timestamp']}")
                    st.write(f"Prompt: {test['query']}")
                    st.write(f"Models: {model_display.get(test['model_a'], test['model_a'])} vs. {model_display.get(test['model_b'], test['model_b'])}")
                    st.write("---")
            else:
                st.info("No test history available yet. Run more tests to build history.")

def render_document_management():
    """Render the document management interface"""
    st.subheader("📄 Document Management")
    
    # Initialize
    if "selected_document" not in st.session_state:
        st.session_state.selected_document = None
    if "document_preview" not in st.session_state:
        st.session_state.document_preview = None
    
    col1, col2 = st.columns([2, 3])
    
    with col1:
        st.write("### Upload Document")
        st.write("Upload documents to provide context for the AI assistant")
        
        uploaded_file = st.file_uploader(
            "Upload a document", 
            type=["pdf", "txt", "docx", "csv"],
            key="document_uploader"
        )
        
        if uploaded_file is not None:
            # Show file preview
            st.write("### Document Preview")
            
            if uploaded_file.type == "text/plain":
                st.session_state.document_preview = uploaded_file.getvalue().decode("utf-8")
                st.text_area("Content Preview", st.session_state.document_preview[:500] + "...", height=150)
            elif uploaded_file.type == "application/pdf":
                st.write("PDF document detected. Preview not available.")
            elif "spreadsheet" in uploaded_file.type or uploaded_file.type == "text/csv":
                try:
                    df = pd.read_csv(uploaded_file)
                    st.dataframe(df.head(5))
                except:
                    st.write("Could not preview CSV content.")
            else:
                st.write(f"Preview not available for {uploaded_file.type}")
                
            if st.button("Process Document", type="primary"):
                with st.spinner("Processing document..."):
                    success = upload_file(uploaded_file)
                    if success:
                        st.success(st.session_state.upload_message)
                    else:
                        st.error(st.session_state.upload_message)
                    # Reset preview after upload
                    st.session_state.document_preview = None
    
    with col2:
        st.write("### Uploaded Documents")
        
        # Fetch documents if list is empty
        if not st.session_state.documents:
            fetch_documents()
        
        if not st.session_state.documents:
            st.info("No documents uploaded yet. Upload documents to enhance AI context.")
        else:
            # Show document table
            df = pd.DataFrame(st.session_state.documents)
            if not df.empty:
                # Format timestamp to datetime
                df['uploaded'] = pd.to_datetime(df['timestamp'], unit='s').dt.strftime('%Y-%m-%d %H:%M')
                # Display table with selected columns
                st.dataframe(
                    df[['filename', 'uploaded', 'chunk_count']],
                    column_config={
                        "filename": "Document",
                        "uploaded": "Upload Date",
                        "chunk_count": "Chunks"
                    },
                    hide_index=True
                )
                
                # Document actions
                st.write("### Document Actions")
                select_cols = st.columns([3, 1])
                with select_cols[0]:
                    doc_to_select = st.selectbox(
                        "Select document:",
                        options=[doc['id'] for doc in st.session_state.documents],
                        format_func=lambda x: next((doc['filename'] for doc in st.session_state.documents if doc['id'] == x), x)
                    )
                    st.session_state.selected_document = doc_to_select
                
                action_cols = st.columns([1, 1])
                with action_cols[0]:
                    if st.button("View Document Info", key="view_doc"):
                        try:
                            # Get document chunks for preview
                            response = requests.get(f"{API_URL}/documents/{doc_to_select}", timeout=10)
                            if response.status_code == 200:
                                st.session_state.document_preview = response.json()
                            else:
                                st.error("Could not retrieve document information")
                        except Exception as e:
                            st.error(f"Error retrieving document: {str(e)}")
                
                with action_cols[1]:
                    if st.button("Delete Document", key="delete_doc"):
                        with st.spinner("Deleting document..."):
                            delete_document(doc_to_select)
                
                # Display document preview if available
                if st.session_state.document_preview:
                    st.write("### Document Information")
                    preview_data = st.session_state.document_preview
                    
                    if isinstance(preview_data, dict):
                        st.write(f"**Filename:** {preview_data.get('filename', 'Unknown')}")
                        st.write(f"**Chunks:** {preview_data.get('chunk_count', 0)}")
                        st.write(f"**Size:** {preview_data.get('size', 0)} bytes")
                        
                        # Display chunk samples if available
                        chunks = preview_data.get('chunks', [])
                        if chunks:
                            with st.expander("Document Chunks Preview"):
                                for i, chunk in enumerate(chunks[:3]):  # Show first 3 chunks
                                    st.write(f"**Chunk {i+1}:**")
                                    st.text_area(f"chunk_{i}", chunk, height=100)
                                if len(chunks) > 3:
                                    st.write(f"*...and {len(chunks) - 3} more chunks*")
    
    # Toggle for using document context
    st.write("### Document Context Settings")
    use_context = st.toggle(
        "Use uploaded documents as context for AI responses",
        value=st.session_state.use_document_context
    )
    
    if use_context != st.session_state.use_document_context:
        st.session_state.use_document_context = use_context
        if use_context:
            if not st.session_state.documents:
                st.warning("You've enabled document context, but no documents are uploaded yet.")
            st.success("Document context enabled! The AI will now reference your uploaded documents.")
        else:
            st.info("Document context disabled. The AI will not use your uploaded documents.")

# Sidebar with information and settings
with st.sidebar:
    st.title("School Management AI Assistant")
    st.markdown("---")
    
    # Navigation
    st.subheader("📊 Navigation")
    nav_options = {
        "chat": "💬 Chat",
        "documents": "📄 Document Management",
        "ab_testing": "🔬 A/B Testing",
        "metrics": "📈 Performance Metrics"
    }
    
    selected_tab = st.radio("Select View", list(nav_options.values()))
    st.session_state.current_tab = list(nav_options.keys())[list(nav_options.values()).index(selected_tab)]
    
    st.markdown("---")
    
    # Model selection section
    st.subheader("🤖 Model Selection")
    if st.button("Refresh Models"):
        with st.spinner("Fetching available models..."):
            models = get_models()
    
    # If models haven't been loaded yet, load them
    if not st.session_state.available_models:
        with st.spinner("Loading models..."):
            models = get_models()
    
    # Create model selection
    categories = get_model_categories()
    selected_category = st.selectbox("Model Category", categories, index=0)
    
    # Filter models by category
    filtered_models = {k: v for k, v in st.session_state.available_models.items() 
                      if v.get("category", "General Purpose") == selected_category}
    
    # Create model options
    model_options = list(filtered_models.keys())
    model_display = {k: f"{v.get('name', k)} ({v.get('provider', 'Unknown')})" 
                    for k, v in filtered_models.items()}
    
    if model_options:
        # Default to first model in category if current selection not in category
        default_index = 0
        if st.session_state.selected_model in model_options:
            default_index = model_options.index(st.session_state.selected_model)
            
        selected_model_key = st.selectbox(
            "Select Model", 
            model_options,
            format_func=lambda x: model_display.get(x, x),
            index=default_index
        )
        
        st.session_state.selected_model = selected_model_key
        
        # Show model details
        if selected_model_key in st.session_state.available_models:
            model_info = st.session_state.available_models[selected_model_key]
            with st.expander("Model Details"):
                st.markdown(f"**Provider**: {model_info.get('provider', 'Unknown')}")
                st.markdown(f"**Description**: {model_info.get('description', 'No description available')}")
                st.markdown(f"**Context Window**: {model_info.get('context_window', 'Unknown')} tokens")
                st.markdown(f"**Pricing**: {model_info.get('pricing', 'Unknown')}")
    else:
        st.warning("No models available in this category. Please refresh or select another category.")
    
    st.markdown("---")
    
    if st.button("Clear Conversation"):
        st.session_state.messages = [
            {"role": "assistant", "content": "Hello! I'm your school assistant. How can I help you today?"}
        ]
        st.rerun()

# Main content area based on selected tab
if st.session_state.current_tab == "chat":
    # Main chat interface
    st.title("School AI Assistant 🏫")
    
    if st.session_state.selected_model:
        model_name = model_display.get(st.session_state.selected_model, st.session_state.selected_model)
        context_status = "📄 Using document context" if st.session_state.use_document_context else ""
        st.caption(f"Using model: {model_name} {context_status}")
    
    # Initialize chat history
    if "messages" not in st.session_state:
        st.session_state.messages = [
            {"role": "assistant", "content": "Hello! I'm your school assistant. How can I help you today?"}
        ]
    
    # Display chat messages from history on app rerun
    for message in st.session_state.messages:
        with st.chat_message(message["role"]):
            st.markdown(message["content"])
    
    # React to user input
    if prompt := st.chat_input("What is your question?"):
        # Add user message to chat history
        st.session_state.messages.append({"role": "user", "content": prompt})
        
        # Display user message in chat message container
        with st.chat_message("user"):
            st.markdown(prompt)
        
        # Display assistant response in chat message container
        with st.chat_message("assistant"):
            message_placeholder = st.empty()
            message_placeholder.markdown("Thinking...")
            
            # Get assistant response
            response = get_chat_response(
                st.session_state.messages,
                use_document_context=st.session_state.use_document_context
            )
            
            # Update placeholder with assistant response
            message_placeholder.markdown(response["message"]["content"])
        
        # Add assistant response to chat history
        st.session_state.messages.append(response["message"])

elif st.session_state.current_tab == "documents":
    render_document_management()

elif st.session_state.current_tab == "ab_testing":
    render_ab_testing()

elif st.session_state.current_tab == "metrics":
    render_metrics_dashboard() 