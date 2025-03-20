# Profile Management

This guide explains how to create, configure, and manage AI Profiles within the system.

## What is an AI Profile?

An AI Profile is a virtual representation of an entity with specific knowledge and characteristics. Profiles can be used to:

- Create AI representations of individuals, companies, or products
- Build knowledge bases that can answer questions about specific topics
- Provide consistent responses based on documents and configuration

Each profile consists of:
- **Profile information** (name, description, etc.)
- **Documents** (uploaded files that provide knowledge)
- **Configuration** (model settings, prompt templates)

## Creating a Profile

### Via Web Interface

1. Navigate to the "Profiles" page
2. Click the "Create Profile" button
3. Fill out the required fields:
   - **Name**: A unique name for the profile
   - **Description**: A detailed description of what the profile represents
   - **Model**: The AI model to use for responses (default: OpenRouter's recommended model)
   - **Temperature**: Controls randomness (0.0-2.0, lower is more deterministic)
   - **System Prompt**: Instructions that define how the AI behaves

4. Click "Create Profile"

### Via API

Profiles can also be created programmatically:

```
POST /api/profiles
Content-Type: application/json

{
  "name": "Company Knowledge Base",
  "description": "This profile answers questions about our company policies and procedures.",
  "model": "openai/gpt-4-turbo",
  "temperature": 0.7,
  "system_prompt": "You are a helpful assistant representing Example Corp. You provide accurate information about company policies and procedures based on the documents provided to you."
}
```

Example using Python:

```python
import requests

def create_profile(name, description, model="openai/gpt-4-turbo", temperature=0.7, system_prompt=""):
    url = "http://localhost:8000/api/profiles"
    
    data = {
        "name": name,
        "description": description,
        "model": model,
        "temperature": temperature,
        "system_prompt": system_prompt
    }
    
    response = requests.post(url, json=data)
    
    return response.json()
```

## Viewing Profiles

The Profiles page displays a list of all profiles with basic information:
- Profile name
- Creation date
- Status (active/archived)
- Model in use
- Document count

Click on any profile to view its details and interact with it.

## Profile Details

The profile details page is divided into tabs:

### Overview Tab

Shows basic profile information:
- Name
- Description
- Creation date
- Last update date
- Model
- Temperature setting
- System prompt

### Documents Tab

Lists all documents associated with the profile:
- Document title
- Upload date
- Processing status
- File type
- Size

From this tab, you can upload new documents or delete existing ones.

### Uploads Tab

Provides a drag-and-drop interface for uploading documents to the profile.

### Chat Tab

Allows you to interact with the profile:
- Type a message or question
- View the AI response
- See the conversation history

## Editing a Profile

To edit a profile:

1. Navigate to the profile details page
2. Click the "Edit" button
3. Update the fields as needed
4. Click "Save Changes"

You can edit any field except:
- Creation date
- Document list (managed separately)

## Updating Profile Configuration

Profile configuration can be updated to fine-tune how the AI responds:

### Model Selection

Choose from available models:
- OpenAI models (GPT-4, GPT-3.5)
- Anthropic models (Claude)
- Open-source models (available through OpenRouter)

Each model has different capabilities and pricing.

### Temperature Setting

Controls randomness in responses:
- **0.0-0.3**: Very deterministic, consistent answers
- **0.4-0.7**: Balanced creativity and consistency (recommended)
- **0.8-1.0**: More creative, varied responses
- **1.0+**: High creativity, less predictable

### System Prompt

The system prompt is critical for guiding how the AI responds. Best practices:

1. **Be specific about role**: "You are an AI assistant representing [company name]"
2. **Define access to knowledge**: "Answer based on the documents provided to you"
3. **Set tone**: "Respond in a professional, friendly manner"
4. **Specify constraints**: "Only answer questions related to our products"
5. **Handle uncertainty**: "If you don't know, say so rather than guessing"

Example system prompt:
```
You are an AI assistant for Acme Corporation's HR department. You help employees find information about company policies and benefits based on the HR documents provided to you. You should:
- Answer questions accurately based only on the provided documents
- Respond in a friendly, helpful tone
- If asked about something not in the documents, politely explain you don't have that information
- Never share sensitive employee information
- Format complex information in clear, easy-to-read bullet points or tables when appropriate
```

## Querying Profiles

Profiles can be queried in several ways:

### Web Interface

Use the chat interface in the "Chat" tab to ask questions and get responses.

### API

Query a profile programmatically:

```
POST /api/profiles/{profile_id}/query
Content-Type: application/json

{
  "query": "What are the company's vacation policies?",
  "context": "I'm a new employee trying to plan my time off."
}
```

Example using Python:

```python
import requests

def query_profile(profile_id, query, context=""):
    url = f"http://localhost:8000/api/profiles/{profile_id}/query"
    
    data = {
        "query": query,
        "context": context
    }
    
    response = requests.post(url, json=data)
    
    return response.json()
```

### External API with API Key

You can also query profiles externally using API keys:

```
POST /api/external/query
Content-Type: application/json
X-API-Key: your_api_key

{
  "query": "What are the company's vacation policies?",
  "context": "I'm a new employee trying to plan my time off."
}
```

## Managing Multiple Profiles

For organizations managing many profiles:

### Organizing Profiles

- Use consistent naming conventions
- Include creation date or version in profile names when appropriate
- Create separate profiles for distinct knowledge domains

### Profile Status Management

Profiles can be:
- **Active**: Available for queries
- **Archived**: Preserved but not actively used

To archive a profile:
1. Navigate to the profile
2. Click "Archive Profile" in the options menu
3. Confirm the action

Archived profiles can be restored later if needed.

## Collaborative Profile Management

Multiple users can work with the same profiles:

### Roles and Permissions

- **Admins**: Full access to create, edit, and delete profiles
- **Editors**: Can update profile content and upload documents
- **Viewers**: Can only query profiles and view information

### Sharing Profiles

Profiles can be shared with other users or teams:
1. Navigate to the profile
2. Click "Share" in the options menu
3. Enter the email addresses of users to share with
4. Select permission level (admin, editor, viewer)
5. Click "Share Profile"

## Best Practices

### Profile Creation

- Use clear, descriptive names
- Write detailed descriptions
- Start with a lower temperature (0.4-0.7) for more predictable responses
- Be specific in your system prompt

### Document Management

- Ensure documents are well-organized before uploading
- Use descriptive document titles
- Monitor processing status to ensure completion
- Remove outdated documents

### Profile Optimization

- Test profiles with expected questions
- Refine the system prompt based on response quality
- Adjust temperature as needed
- Update documents when information changes

## Troubleshooting

### Profile Not Responding

If a profile doesn't respond to queries:
1. Check that the profile status is active
2. Verify the API key is valid (for external queries)
3. Ensure documents have been successfully processed
4. Try adjusting the temperature or system prompt

### Poor Quality Responses

If responses are not meeting expectations:
1. Verify document content is relevant and accurate
2. Refine the system prompt to be more specific
3. Adjust the temperature setting
4. Consider using a more capable model

### Missing Information in Responses

If the profile is not including information from documents:
1. Check that documents are marked as "completed" in the Documents tab
2. Verify that document IDs are properly linked to the profile
3. Try the document synchronization endpoint to update profile associations
4. Review the document content to ensure it contains the expected information 