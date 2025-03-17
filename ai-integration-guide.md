# AI Integration & Automation Suite

## Overview
This repository contains a comprehensive suite of AI and automation tools designed to enhance educational management systems. The system provides modular AI capabilities that can be integrated with both PFE-Gestion-Scolaire and IAAI Academy projects.

## Architecture Overview
The AI integration architecture follows a microservices approach with three main services that can be used independently or together:

```
┌─────────────────────────────────────────────────────────────────┐
│                   AI & Automation Platform                       │
└────────┬─────────────────────┬─────────────────────┬────────────┘
         │                     │                     │
         ▼                     ▼                     ▼
┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│  AI Chatbots     │  │    AI Agents     │  │   Automations    │
│  Profiles        │  │                  │  │                  │
└──────────────────┘  └──────────────────┘  └──────────────────┘
         │                     │                     │
         ▼                     ▼                     ▼
┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│ Profile Management│  │ Agent Execution  │  │ Workflow Engine  │
│ Refinement        │  │ Tools Access     │  │ Task Scheduling  │
│ API Generation    │  │ Task Management  │  │ System Integration│
└──────────────────┘  └──────────────────┘  └──────────────────┘
```

## Main Services

### 1. AI Chatbots Profiles
This service allows you to create, refine, and manage custom chatbots for your applications:

- **Profile Creation**: Design specialized chatbots for different educational needs
- **Data Refinement**: Train chatbots with your institution's specific data
- **API Key Management**: Generate and manage API keys for integration with other projects
- **Current Status**: Partially developed with Python UI, planned migration to React

### 2. AI Agents
This service provides autonomous AI agents that can perform real tasks:

- **Computer Interaction**: Agents can use computer systems to perform tasks
- **Tool Integration**: Access and use various tools and software
- **Task Automation**: Perform complex sequences of operations
- **Self-Monitoring**: Track progress and report on task completion

### 3. Automations
This service enables the creation of automated workflows without coding:

- **Workflow Designer**: Create automation flows with a visual interface
- **Trigger Management**: Set up conditions to trigger automations
- **System Integration**: Connect with other systems and services
- **Scheduling**: Run automations on specific schedules

## Technical Stack

### Backend
- **Framework**: FastAPI (Python)
- **AI Models**: OpenRouter API integration
- **Database**: Vector databases for semantic data
- **Processing**: Document analysis and NLP processing
- **Windows PowerShell**: Current environment for command execution

### Frontend
- **Current**: Streamlit (Python) for some services
- **Planned**: React for unified interface
- **Design**: Modern, responsive UI components
- **Interaction**: Real-time communication with backend services

## Getting Started

### Prerequisites
- Windows environment
- PowerShell for command execution
- Python 3.8+
- Node.js for React frontends

### Installation

1. Clone the repository:
```powershell
git clone https://github.com/your-username/ai-and-automation.git
cd ai-and-automation
```

2. Set up service environments:

For AI Chatbots Profiles:
```powershell
cd chat-bots-profiles
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

For AI Agents:
```powershell
cd ai-agents
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

For Automations:
```powershell
cd automations
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

3. Configure service settings:
- Copy `.env.example` to `.env` in each service directory
- Update settings with your API keys and service configurations

## Service Details

### AI Chatbots Profiles
Create specialized chatbots that can be integrated into your applications:

```python
# Example: Creating a new chatbot profile
from chatbot_profiles import ChatbotManager

# Initialize manager
manager = ChatbotManager()

# Create a new profile
profile = manager.create_profile(
    name="Course Assistant",
    description="Helps students with course-related questions",
    base_model="gpt-4",
    temperature=0.7
)

# Add training data
manager.add_training_data(profile.id, "path/to/course_materials.json")

# Generate API key for integration
api_key = manager.generate_api_key(profile.id)
print(f"Use this API key to access your chatbot: {api_key}")
```

### AI Agents
Deploy AI agents that can perform real-world tasks:

```python
# Example: Creating an agent to organize educational resources
from ai_agents import AgentFramework

# Initialize agent framework
framework = AgentFramework()

# Create a resource organization agent
agent = framework.create_agent(
    name="ResourceOrganizer",
    description="Organizes educational resources by subject and level",
    tools=["file_system", "categorization", "metadata_editor"]
)

# Define task parameters
task_params = {
    "source_directory": "raw_resources/",
    "output_directory": "organized_resources/",
    "categorization_schema": "subject_grade_level"
}

# Execute the task
task_id = agent.execute_task("organize_resources", task_params)

# Monitor progress
status = agent.get_task_status(task_id)
```

### Automations
Create workflow automations for repetitive tasks:

```python
# Example: Setting up an automated grading notification workflow
from automation_framework import Workflow

# Initialize workflow
workflow = Workflow("GradeNotifications")

# Add workflow steps
workflow.add_trigger("new_grade_added")
workflow.add_action("fetch_student_info")
workflow.add_action("generate_notification")
workflow.add_action("send_email")
workflow.add_condition("if_grade_below_threshold", threshold=60)
workflow.add_action("schedule_intervention", condition_branch="true")

# Save and activate workflow
workflow.save()
workflow.activate()
```

## Integration with Other Projects

### PFE-Gestion-Scolaire Integration
The AI services can enhance the school management system:

```javascript
// Example: React component using AI chatbot API
import React, { useState, useEffect } from 'react';
import axios from 'axios';

function AIChatAssistant() {
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState('');
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const result = await axios.post('/api/ai-chat', {
        message: query,
        profile_id: 'course_assistant'
      });
      setResponse(result.data.response);
      } catch (error) {
      console.error('Error fetching AI response:', error);
      }
    };
  
  return (
    <div className="chat-assistant">
      <h3>AI Course Assistant</h3>
      <form onSubmit={handleSubmit}>
        <input 
          type="text" 
          value={query} 
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ask about your course..."
        />
        <button type="submit">Send</button>
      </form>
      {response && (
        <div className="response">
          <p>{response}</p>
          </div>
      )}
    </div>
  );
}
```

### IAAI Academy Integration
The AI services are core to the IAAI platform functionality:

```typescript
// Example: AI agent integration in IAAI TypeScript code
import { AIAgent } from '@ai-and-automation/agents';

// Initialize the AI agent service
const documentProcessor = new AIAgent({
  agentId: 'document-processor',
  apiKey: process.env.AI_AGENT_API_KEY
});

// Use in an academic service
async function processStudentSubmission(submissionId: string): Promise<void> {
  // Fetch submission details
  const submission = await getSubmission(submissionId);
  
  // Process with AI agent
  const result = await documentProcessor.executeTask('analyze_submission', {
    documentUrl: submission.fileUrl,
    studentId: submission.studentId,
    courseId: submission.courseId
  });
  
  // Update database with analysis results
  await updateSubmissionAnalysis(submissionId, result);
}
```

## Deployment

Each service can be deployed independently using Docker containers:

```powershell
# Build and run AI Chatbots Profiles service
cd chat-bots-profiles
docker build -t ai-chatbots-profiles .
docker run -d -p 8000:8000 ai-chatbots-profiles

# Build and run AI Agents service
cd ../ai-agents
docker build -t ai-agents .
docker run -d -p 8001:8001 ai-agents

# Build and run Automations service
cd ../automations
docker build -t automations .
docker run -d -p 8002:8002 automations
```

## Development Roadmap

1. **Current Phase**: Service foundation and initial implementation
   - Complete core functionality for each service
   - Establish stable APIs for integration

2. **Short-term Goals**: 
   - Migrate AI Chatbots Profiles from Python UI to React
   - Enhance AI Agents with more tools and capabilities
   - Expand automation templates for educational workflows

3. **Long-term Vision**:
   - Unified dashboard for all services
   - Advanced analytics across services
   - Expanded integration options for third-party systems

## Contributing
Please read CONTRIBUTING.md for details on our code of conduct and the process for submitting pull requests.

## License
This project is licensed under the MIT License - see the LICENSE.md file for details. 