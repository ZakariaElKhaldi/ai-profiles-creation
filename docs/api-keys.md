# API Keys Management

This guide explains how to manage API keys in the AI Profiles system. There are two types of API keys used in the system:

1. **OpenRouter API Keys**: Used to connect to the OpenRouter service for AI model access
2. **External API Keys**: Used by external applications to access the AI Profiles API

## OpenRouter API Keys

### What is OpenRouter?

[OpenRouter](https://openrouter.ai) is a unified API that provides access to many different AI models from providers like OpenAI, Anthropic, and others. The AI Profiles system uses OpenRouter to query these models.

### Obtaining an OpenRouter API Key

1. Create an account at [OpenRouter](https://openrouter.ai)
2. Navigate to your account settings
3. Create a new API key
4. Copy the key for use in the AI Profiles system

### Setting the OpenRouter API Key

There are several ways to set your OpenRouter API key:

#### 1. Environment Variable

Set the `OPENROUTER_API_KEY` environment variable:

```bash
# Linux/macOS
export OPENROUTER_API_KEY=your_openrouter_api_key

# Windows Command Prompt
set OPENROUTER_API_KEY=your_openrouter_api_key

# Windows PowerShell
$env:OPENROUTER_API_KEY="your_openrouter_api_key"
```

#### 2. Web Interface

1. Navigate to the Settings page
2. Select the "API Keys" tab
3. Enter your OpenRouter API key in the appropriate field
4. Click "Save"

#### 3. API Endpoint

```bash
curl -X POST http://localhost:8000/api/keys/openrouter \
  -H "Content-Type: application/json" \
  -d '{"key": "your_openrouter_api_key"}'
```

### Verifying the OpenRouter API Key

To check if an OpenRouter API key is set and valid:

```bash
curl http://localhost:8000/api/keys/openrouter/status
```

This will return information about the current active key, including whether it's valid.

### Changing the OpenRouter API Key

To change the active OpenRouter API key, use the same methods as setting it. The new key will replace the previous one.

## External API Keys

External API keys allow third-party applications to access the AI Profiles API securely, without requiring user login credentials.

### Creating External API Keys

#### Web Interface

1. Navigate to the Settings page
2. Select the "API Keys" tab
3. Click "Create New API Key"
4. Enter a description for the key (e.g., "Mobile App Access")
5. Select the permissions for this key:
   - `read:profiles` - View profiles
   - `write:profiles` - Create/update profiles
   - `read:documents` - View documents
   - `write:documents` - Upload documents
   - `query:profiles` - Query profiles with AI
6. Click "Create API Key"
7. Copy the generated key (it will only be shown once)

#### API Endpoint

```bash
curl -X POST http://localhost:8000/api/keys \
  -H "Content-Type: application/json" \
  -d '{
    "description": "Mobile App Access",
    "permissions": ["read:profiles", "query:profiles"]
  }'
```

### Listing External API Keys

To view all existing API keys:

#### Web Interface

1. Navigate to the Settings page
2. Select the "API Keys" tab
3. View the list of all active API keys

#### API Endpoint

```bash
curl http://localhost:8000/api/keys
```

Response:
```json
{
  "keys": [
    {
      "id": "a1b2c3d4",
      "description": "Mobile App Access",
      "created_at": "2023-04-01T12:00:00Z",
      "last_used": "2023-04-02T14:30:00Z",
      "permissions": ["read:profiles", "query:profiles"]
    },
    ...
  ]
}
```

### Using External API Keys

To use an external API key to access the API:

```bash
curl http://localhost:8000/api/external/profiles \
  -H "X-API-Key: your_external_api_key"
```

All API endpoints accessible through external API keys use the `/api/external/` prefix.

### Verifying External API Keys

To verify if an external API key is valid:

```bash
curl http://localhost:8000/api/keys/verify \
  -H "X-API-Key: your_external_api_key"
```

This will return information about the key if it's valid, or an error if it's not.

### Revoking External API Keys

If an API key is compromised or no longer needed, it should be revoked immediately.

#### Web Interface

1. Navigate to the Settings page
2. Select the "API Keys" tab
3. Find the key you want to revoke
4. Click the "Revoke" button
5. Confirm the action

#### API Endpoint

```bash
curl -X DELETE http://localhost:8000/api/keys/{key_id}
```

## Querying Profiles with API Keys

There are two methods to query profiles using API keys:

### Method 1: Querying a Known Profile ID

If you already know the profile ID you want to query:

```bash
curl -X POST http://localhost:8000/api/external/profiles/{profile_id}/query \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your_external_api_key" \
  -d '{
    "query": "What is the main topic of my documents?",
    "context": "I'm trying to understand the content"
  }'
```

### Method 2: Two-Step Process (Recommended)

For more flexibility, use a two-step process:

1. First, verify the API key to get associated profile information:

```bash
curl http://localhost:8000/api/external/verify \
  -H "X-API-Key: your_external_api_key"
```

Response:
```json
{
  "valid": true,
  "key_info": {
    "id": "a1b2c3d4",
    "description": "Mobile App Access",
    "permissions": ["read:profiles", "query:profiles"]
  },
  "profile_id": "b4c5d6e7"
}
```

2. Then, use the profile ID to query the profile:

```bash
curl -X POST http://localhost:8000/api/external/profiles/b4c5d6e7/query \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your_external_api_key" \
  -d '{
    "query": "What is the main topic of my documents?",
    "context": "I'm trying to understand the content"
  }'
```

## API Key Security Best Practices

### OpenRouter API Keys

1. **Keep private**: Never commit API keys to public repositories
2. **Rotate regularly**: Change keys periodically, especially if you suspect they may be compromised
3. **Use environment variables**: Store keys in environment variables rather than hard-coding them
4. **Monitor usage**: Regularly check your OpenRouter dashboard for unusual activity

### External API Keys

1. **Limit permissions**: Only grant the minimum necessary permissions for each key
2. **Use descriptive names**: Make it easy to identify what each key is used for
3. **Rotate regularly**: Create new keys and revoke old ones periodically
4. **Revoke immediately**: If a key is compromised, revoke it right away
5. **Monitor usage**: Check the last used timestamp to identify potentially inactive or compromised keys

## API Key Rate Limiting

To prevent abuse, API requests are rate-limited:

- **OpenRouter limits**: Based on your OpenRouter plan
- **External API key limits**:
  - 10 requests per minute
  - 1,000 requests per day

When a rate limit is exceeded, the API will return a 429 Too Many Requests response.

## Troubleshooting

### "No API key provided" Error

If you see this error when querying a profile:

1. Verify an OpenRouter API key has been set:
   ```bash
   curl http://localhost:8000/api/keys/openrouter/status
   ```
   
2. If no active key is found, set one using any of the methods described above.

### "Invalid API key" Error

If your OpenRouter API key is rejected:

1. Verify the key is correct and hasn't expired
2. Try creating a new key in the OpenRouter dashboard
3. Set the new key in the AI Profiles system

### "Unauthorized" Error with External API Keys

If you receive a 401 Unauthorized error when using an external API key:

1. Verify the key exists in the system:
   ```bash
   curl http://localhost:8000/api/keys
   ```
   
2. Check that you're using the correct endpoint (should start with `/api/external/`)
3. Verify the key has the necessary permissions for the operation you're attempting
4. Ensure you're passing the key correctly in the header:
   ```
   X-API-Key: your_external_api_key
   ```

### "Forbidden" Error with External API Keys

If you receive a 403 Forbidden error when using an external API key:

1. The key exists but doesn't have the required permissions for this operation
2. Create a new key with the appropriate permissions or use a different key 