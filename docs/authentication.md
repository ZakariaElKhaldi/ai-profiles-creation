# Authentication & API Keys

This guide explains how to authenticate with the AI Profiles system and use API keys for external applications.

## API Key Overview

API keys provide a way for external applications to access AI Profiles without using the web interface. Each API key is associated with a specific profile and can be used to query that profile programmatically.

API keys follow the format `pk_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX` and should be kept secure.

## Managing API Keys

### Creating an API Key

1. Navigate to the profile you want to create an API key for
2. Select the "Keys" tab
3. Click "Generate New Key"
4. Provide a name and optional description for the key
5. Copy the generated key immediately - it will only be displayed once!

### Listing API Keys

You can view all API keys associated with a profile in the "Keys" tab of the profile view.

### Deleting API Keys

To revoke access for an API key:
1. Navigate to the "Keys" tab of the profile
2. Find the key you want to delete
3. Click the "Delete" button
4. Confirm the deletion

## Using API Keys

There are two ways to use API keys for querying profiles:

### Method 1: Two-Step Process (Recommended)

Due to a current routing limitation, we recommend using a two-step process for querying profiles with API keys:

#### Step 1: Verify the API key to get the profile ID

```
POST /api/profiles/verify-key
Content-Type: application/json

{
  "api_key": "pk_QzSFMikdNCqAH2lS-fl9-dDmFz-eV2ri5nM6tZkNWks"
}
```

Response:
```json
{
  "profile_id": "f7a57868-b383-4dd4-b8eb-fc01bf1f42c6"
}
```

#### Step 2: Query the profile directly using the retrieved profile ID

```
POST /api/profiles/{profile_id}/query
Content-Type: application/json

{
  "query": "What is the main topic of the document?",
  "context": "Optional additional context"
}
```

Response:
```json
{
  "response": "The main topic appears to be...",
  "profile_id": "f7a57868-b383-4dd4-b8eb-fc01bf1f42c6",
  "model": "gpt-3.5-turbo"
}
```

### Method 2: Direct External Query (Not Currently Working)

> ⚠️ **Note**: Due to a routing issue, this method currently doesn't work reliably. We're working to fix this in a future update. Please use Method 1 for now.

The API technically supports a direct external query endpoint, but it currently has routing issues:

```
POST /api/profiles/external/query
Content-Type: application/json
api-key: pk_QzSFMikdNCqAH2lS-fl9-dDmFz-eV2ri5nM6tZkNWks

{
  "query": "What is the main topic of the document?",
  "context": "Optional additional context"
}
```

## Example Code

### Python

```python
import requests

def query_profile_with_api_key(api_key, query_text, context=None):
    """
    Query an AI profile using the two-step API key verification method
    
    Args:
        api_key (str): Your API key
        query_text (str): The query to send to the profile
        context (str, optional): Additional context for the query
        
    Returns:
        dict: The response from the AI profile
    """
    base_url = "http://localhost:8000/api"  # Change to your server URL
    
    # Step 1: Verify API key to get profile ID
    verify_response = requests.post(
        f"{base_url}/profiles/verify-key",
        json={"api_key": api_key}
    )
    
    if verify_response.status_code != 200:
        raise Exception(f"API key verification failed: {verify_response.text}")
    
    # Extract profile ID
    profile_id = verify_response.json()["profile_id"]
    
    # Step 2: Query the profile
    body = {"query": query_text}
    if context:
        body["context"] = context
        
    response = requests.post(
        f"{base_url}/profiles/{profile_id}/query",
        json=body
    )
    
    if response.status_code != 200:
        raise Exception(f"Query failed: {response.text}")
    
    return response.json()

# Usage example
if __name__ == "__main__":
    api_key = "pk_QzSFMikdNCqAH2lS-fl9-dDmFz-eV2ri5nM6tZkNWks"
    query = "What is the main topic of the document?"
    
    try:
        result = query_profile_with_api_key(api_key, query)
        print(f"Response: {result['response']}")
    except Exception as e:
        print(f"Error: {str(e)}")
```

### JavaScript

```javascript
async function queryProfileWithApiKey(apiKey, queryText, context = null) {
  const baseUrl = "http://localhost:8000/api"; // Change to your server URL
  
  try {
    // Step 1: Verify API key to get profile ID
    const verifyResponse = await fetch(`${baseUrl}/profiles/verify-key`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ api_key: apiKey })
    });
    
    if (!verifyResponse.ok) {
      throw new Error(`API key verification failed: ${await verifyResponse.text()}`);
    }
    
    const { profile_id } = await verifyResponse.json();
    
    // Step 2: Query the profile
    const body = { query: queryText };
    if (context) {
      body.context = context;
    }
    
    const queryResponse = await fetch(`${baseUrl}/profiles/${profile_id}/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });
    
    if (!queryResponse.ok) {
      throw new Error(`Query failed: ${await queryResponse.text()}`);
    }
    
    return await queryResponse.json();
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
}

// Usage example
const apiKey = "pk_QzSFMikdNCqAH2lS-fl9-dDmFz-eV2ri5nM6tZkNWks";
const query = "What is the main topic of the document?";

queryProfileWithApiKey(apiKey, query)
  .then(result => {
    console.log(`Response: ${result.response}`);
  })
  .catch(error => {
    console.error(`Error: ${error.message}`);
  });
```

## Security Best Practices

1. **Keep API keys secret** - Never expose your API keys in client-side code or public repositories.
2. **Use specific keys** - Create separate API keys for different applications or use cases.
3. **Limit permissions** - Give keys only the access they need.
4. **Rotate keys periodically** - Generate new keys and retire old ones on a regular schedule.
5. **Monitor usage** - Check the usage statistics of your keys to detect unusual patterns.

## Rate Limiting

API keys are subject to rate limiting to prevent abuse. If you exceed the rate limit, you'll receive a 429 Too Many Requests response. The current limits are:

- 10 requests per minute
- 1000 requests per day

## Troubleshooting

### Invalid API Key

If you receive a 401 Unauthorized response with the message "Invalid API key", double-check that:
- You're using the correct API key
- The API key hasn't been deleted
- You're passing the API key in the correct format

### Profile Not Found

If you receive a 404 Not Found response with the message "Profile not found", the profile associated with your API key may have been deleted. Generate a new API key for an existing profile. 