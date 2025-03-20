# API Reference

This document provides a comprehensive reference for all API endpoints available in the AI Profiles system.

## Base URL

All API endpoints are prefixed with: `/api`

## Authentication

Most endpoints do not require authentication. External API access requires an API key passed in the header.

## Profiles Endpoints

### List Profiles

```
GET /profiles
```

Query parameters:
- `user_id` (optional): Filter profiles by user ID
- `status` (optional): Filter profiles by status (draft, active, archived)
- `skip` (optional): Number of records to skip (default: 0)
- `limit` (optional): Number of records to return (default: 100)

Response:
```json
{
  "total": 10,
  "profiles": [
    {
      "id": "a2fbbd28-dbec-4cfb-8fba-382fd124d290",
      "name": "My Profile",
      "description": "A description",
      "system_prompt": "You are a helpful assistant",
      "model": "gpt-3.5-turbo",
      "temperature": 0.7,
      "max_tokens": 4000,
      "status": "active",
      "created_at": "2023-01-01T00:00:00Z",
      "updated_at": "2023-01-02T00:00:00Z",
      "document_ids": ["doc1-id", "doc2-id"],
      "query_count": 5
    }
    // more profiles...
  ]
}
```

### Get Profile

```
GET /profiles/{profile_id}
```

Path parameters:
- `profile_id`: ID of the profile to retrieve

Response: A single profile object

### Create Profile

```
POST /profiles
```

Request body:
```json
{
  "name": "My New Profile",
  "description": "A helpful assistant",
  "system_prompt": "You are an AI assistant that...",
  "model": "gpt-3.5-turbo",
  "temperature": 0.7,
  "max_tokens": 4000
}
```

Response: The created profile object

### Update Profile

```
PUT /profiles/{profile_id}
```

Path parameters:
- `profile_id`: ID of the profile to update

Request body: Profile fields to update (all fields optional)

Response: The updated profile object

### Delete Profile

```
DELETE /profiles/{profile_id}
```

Path parameters:
- `profile_id`: ID of the profile to delete

Response: Success message

### Query Profile

```
POST /profiles/{profile_id}/query
```

Path parameters:
- `profile_id`: ID of the profile to query

Request body:
```json
{
  "query": "What is the main topic of the document?",
  "context": "Optional additional context"
}
```

Response:
```json
{
  "response": "The main topic of the document is...",
  "profile_id": "a2fbbd28-dbec-4cfb-8fba-382fd124d290",
  "model": "gpt-3.5-turbo"
}
```

## External API Access

### Verify API Key

```
POST /profiles/verify-key
```

Request body:
```json
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

### External Query (Direct Method)

> ⚠️ **Note**: Due to current routing constraints, this endpoint currently doesn't work as expected. Use the two-step verification process described below instead.

```
POST /profiles/external/query
```

Headers:
- `Content-Type`: application/json
- `api-key`: Your API key

Request body:
```json
{
  "query": "What is the main topic of the document?",
  "context": "Optional additional context"
}
```

### External Query (Two-Step Method)

For external applications, we recommend using a two-step process for querying profiles:

**Step 1**: Verify your API key to get the profile ID
```
POST /profiles/verify-key
```

**Step 2**: Query the profile directly using the retrieved profile ID
```
POST /profiles/{profile_id}/query
```

Example Python code:
```python
import requests

def query_with_api_key(api_key, query_text):
    base_url = "http://localhost:8000/api"
    
    # Step 1: Verify API key to get profile ID
    verify_response = requests.post(
        f"{base_url}/profiles/verify-key",
        json={"api_key": api_key}
    )
    
    # Extract profile ID
    profile_id = verify_response.json()["profile_id"]
    
    # Step 2: Query the profile
    response = requests.post(
        f"{base_url}/profiles/{profile_id}/query",
        json={"query": query_text}
    )
    
    return response.json()
```

## API Keys Endpoints

### List API Keys

```
GET /profiles/{profile_id}/keys
```

Response: List of API keys for the profile

### Create API Key

```
POST /profiles/{profile_id}/keys
```

Request body:
```json
{
  "name": "My API Key",
  "description": "For external application"
}
```

Response: The created API key object

### Delete API Key

```
DELETE /profiles/{profile_id}/keys/{key_id}
```

Response: Success message

## Documents Endpoints

### List Documents

```
GET /documents?profile_id={profile_id}
```

Response: List of documents

### Upload Document

```
POST /documents
```

FormData parameters:
- `file`: The document file
- `profile_id`: ID of the profile to associate with
- `title`: Document title
- `document_type`: Type of document (pdf, docx, txt, csv, xlsx)

Response: Upload confirmation with document ID

### Delete Document

```
DELETE /documents/{document_id}
```

Response: Success message 