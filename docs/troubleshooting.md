# Troubleshooting Guide

This guide addresses common issues you might encounter when using the AI Profiles system and provides solutions.

## API Key Issues

### "No API Key Provided" Error

**Problem**: You receive a 500 error with message "Failed to query profile: No API key provided" when querying a profile.

**Solutions**:
1. Verify an OpenRouter API key has been set:
   ```bash
   curl http://localhost:8000/api/keys/openrouter/status
   ```
   
2. If no active key is found, set one:
   ```bash
   curl -X POST http://localhost:8000/api/keys/openrouter \
     -H "Content-Type: application/json" \
     -d '{"key": "your_openrouter_api_key"}'
   ```
   
3. Check that the key is valid by testing it directly with OpenRouter.

4. Inspect server logs for more detailed error messages.

### Invalid API Key

**Problem**: Your OpenRouter API key is rejected as invalid.

**Solutions**:
1. Verify the key is correctly copied without extra spaces or characters.
2. Ensure the key hasn't expired or been revoked from the OpenRouter dashboard.
3. Create a new API key if necessary.

### External API Key Authentication Fails

**Problem**: You can't authenticate using your external API key.

**Solutions**:
1. Ensure you're passing the key correctly in the header:
   ```
   X-API-Key: your_api_key
   ```
   
2. Verify the key exists in the system:
   ```bash
   curl http://localhost:8000/api/keys
   ```
   
3. Check that you're using the correct endpoint for external access.

## Document Processing Issues

### Document Upload Fails

**Problem**: File uploads fail or timeout.

**Solutions**:
1. Check the file size is under the limit (default: 50MB).
2. Verify the file format is supported.
3. Ensure the upload directory is writable by the application.
4. Check server logs for specific error messages.

### Document Stuck in "Processing" Status

**Problem**: A document remains in "processing" status for an extended period.

**Solutions**:
1. Check server logs for processing errors.
2. Verify the document isn't corrupted:
   ```bash
   # For PDFs
   pdfinfo your_document.pdf
   ```
   
3. Restart the document processing:
   ```bash
   curl -X POST http://localhost:8000/api/documents/{document_id}/reprocess
   ```
   
4. If issues persist, try uploading a different version of the document.

### "No such file or directory" Errors

**Problem**: You get file not found errors when processing documents.

**Solutions**:
1. Verify the `UPLOAD_DIR` and `PROCESSED_DIR` settings are correct.
2. Check that the directories exist and are writable.
3. Ensure the application has proper permissions to access those directories.
4. If using Docker, check volume mappings are correct.

### Documents Not Appearing in AI Responses

**Problem**: Documents are uploaded but not referenced in AI responses.

**Solutions**:
1. Verify the documents are marked as "completed" in the Documents tab.
2. Check that the document IDs are associated with the profile:
   ```bash
   curl http://localhost:8000/api/profiles/{profile_id}
   ```
   Look for the `document_ids` array in the response.
   
3. Run the document synchronization endpoint:
   ```bash
   curl -X POST http://localhost:8000/api/documents/sync-with-profiles
   ```
   
4. Try reprocessing the document if the extracted text appears to be empty.

## Profile Issues

### Profile Creation Fails

**Problem**: You can't create a new profile.

**Solutions**:
1. Ensure all required fields are provided.
2. Check that the model name is valid (should be one from the available models list).
3. Verify the server has database connectivity.
4. Check for detailed error messages in the server logs.

### Profile Query Returns Empty or Irrelevant Responses

**Problem**: When querying a profile, you get responses that don't reference your documents.

**Solutions**:
1. Verify the profile has associated documents and they're marked as "completed".
2. Check that the system prompt doesn't override the document context.
3. Ensure your query is relevant to the content of the documents.
4. Try modifying the temperature setting (lower for more deterministic responses).
5. Check the profile is using an appropriate model capable of handling your document complexity.

### Rate Limit Exceeded

**Problem**: You receive a "Rate limit exceeded" error.

**Solutions**:
1. Wait for the rate limit to reset (usually within minutes).
2. Reduce the frequency of your API calls.
3. If you need higher rate limits, consider upgrading your OpenRouter plan.

## Installation and Setup Issues

### Database Connection Errors

**Problem**: The application can't connect to the database.

**Solutions**:
1. Verify PostgreSQL is running:
   ```bash
   pg_isready -h localhost -p 5432
   ```
   
2. Check the `DATABASE_URL` in your environment variables:
   ```
   DATABASE_URL=postgresql://username:password@host:port/database
   ```
   
3. Ensure the database exists and the user has proper permissions.
4. If using Docker, ensure the database container is running and properly linked.

### Frontend Can't Connect to Backend

**Problem**: The frontend can't connect to the backend API.

**Solutions**:
1. Verify the backend is running:
   ```bash
   curl http://localhost:8000/api/health
   ```
   
2. Check that CORS is properly configured if running frontend and backend on different origins.
3. Verify the `VITE_API_URL` in your frontend environment is correctly pointing to the backend.
4. Check for network issues or firewalls blocking the connection.

### Server Starts But Crashes Soon After

**Problem**: The server starts but crashes after a short time.

**Solutions**:
1. Check the server logs for error messages.
2. Verify all required dependencies are installed.
3. Ensure the system has enough memory and resources.
4. Check disk space is sufficient for document storage.

## Performance Issues

### Slow Document Processing

**Problem**: Documents take a long time to process.

**Solutions**:
1. Large documents (especially PDFs) naturally take longer to process.
2. Check server resources (CPU, memory) are not constrained.
3. Consider increasing server resources if processing many documents.
4. For very large documents, consider splitting them into smaller files.

### Slow Profile Queries

**Problem**: Profile queries take a long time to respond.

**Solutions**:
1. Check the size of documents associated with the profile - larger context requires more processing time.
2. Verify the OpenRouter API isn't experiencing slowdowns.
3. Select a faster model if query speed is critical.
4. Reduce the number of documents associated with a single profile.

## Common Error Messages and Solutions

### "Failed to query profile: context_length_exceeded"

**Problem**: The combined document content exceeds the model's context limit.

**Solutions**:
1. Reduce the number of documents associated with the profile.
2. Use smaller documents or split large documents.
3. Select a model with a larger context window (like GPT-4 Turbo or Claude 3 Opus).

### "Invalid content type"

**Problem**: The API received a request with an incorrect content type.

**Solutions**:
1. Ensure API requests include the appropriate Content-Type header:
   ```
   Content-Type: application/json
   ```
   
2. For file uploads, use:
   ```
   Content-Type: multipart/form-data
   ```

### "Document processing failed: unsupported file type"

**Problem**: You attempted to upload a file format that isn't supported.

**Solutions**:
1. Convert the file to a supported format (.pdf, .docx, .txt, .csv, .xlsx).
2. Check the file extension matches the actual file type.

## Advanced Troubleshooting

### Enabling Debug Logging

For more detailed logs:

1. Set the DEBUG environment variable to True:
   ```
   DEBUG=True
   ```
   
2. Restart the application to apply the change.
3. Check the logs for more detailed information.

### Database Investigation

To directly inspect the database:

```bash
# Connect to the database
psql postgresql://username:password@localhost:5432/ai_profiles

# List profiles
SELECT id, name, created_at, status FROM profiles;

# Check document-profile associations
SELECT p.name, d.title, d.status FROM profiles p 
JOIN documents d ON d.id = ANY(p.document_ids);
```

### Clearing Cached Data

If you suspect caching issues:

1. Clear the browser cache for frontend issues.
2. Restart the backend server to clear in-memory caches.
3. If using Redis for caching, flush the cache:
   ```bash
   redis-cli flushall
   ```

## Getting Help

If you're still experiencing issues after trying these solutions:

1. Check the logs for more specific error messages.
2. Search for similar issues in our GitHub repository.
3. Create a new issue with:
   - Detailed description of the problem
   - Steps to reproduce
   - Relevant error messages
   - System information (OS, browser, etc.)
4. Contact support at support@example.com with the above information. 