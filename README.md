# AI Profiles Management Dashboard

A single-page application for creating, managing, and querying AI profiles with secure authentication and data processing.

## Current Progress (Updated)

The project has made significant progress on the frontend implementation:

### Completed Features

1. **Dark Theme Implementation**
   - Applied dark theme styling across all components for better user experience in low-light conditions
   - Updated color scheme with proper contrast ratios for accessibility compliance (WCAG 2.1)
   - Consistent styling across all UI elements with Tailwind CSS

2. **Core Components Development**
   - **Layout Components**
     - Navbar with responsive design and mobile menu
     - Footer with links and copyright information
     - Main layout structure for consistent page organization
   
   - **Dashboard Components**
     - ProfileGrid for displaying user profiles in card format
     - ProfileCard with detailed profile information
     - ProfileStats showing usage statistics with visual representations
   
   - **Profile Management**
     - CreateProfileForm for setting up new AI profiles
     - API key generation functionality with secure storage
   
   - **Document Management**
     - DocumentList component for viewing all uploaded documents with sorting and filtering
     - DocumentDetails component for examining individual document information
     - Integration with the main application navigation
   
   - **Query Interface**
     - QueryInterface for submitting questions to AI profiles
     - QueryHistory for tracking and revisiting previous interactions
     - QueryResults for displaying formatted AI responses
   
   - **Upload Components**
     - FileUploader with drag-and-drop functionality and multi-file support
     - UploadProgress tracking with visual indicators
     - ProcessingStatus visualization for document ingestion pipeline
     
   - **Settings Management**
     - OpenRouter API key management with secure client-side storage
     - User interface preferences section
     - Account management placeholders for future authentication implementation

3. **UI/UX Improvements**
   - Toast notifications for user feedback
   - Loading states across components with skeleton loaders
   - Responsive design for mobile, tablet, and desktop
   - Interactive elements with hover and active states for better user feedback
   - Accessible UI elements with proper ARIA attributes

## Tech Stack (Current & Planned)

### Frontend
- **Core Framework**: React 18.2+ with TypeScript 5.0+
- **Styling**: TailwindCSS 3.3+ for utility-first styling
- **Routing**: React Router 6.10+ for declarative routing
- **State Management**: React Context API for simple state, Zustand 4.3+ (planned) for complex state
- **Form Handling**: React Hook Form 7.45+ for efficient form management
- **Date Handling**: date-fns 2.30+ for date formatting and manipulation
- **HTTP Client**: Axios 1.4+ for API requests with interceptors
- **Validation**: Zod 3.21+ for runtime type validation
- **UI Components**: Custom components built with Tailwind, Headless UI for accessibility
- **Testing**: Jest and React Testing Library for component testing (planned)

### Backend (Planned)
- **Core Framework**: FastAPI 0.103+ (Python 3.11+) for high-performance API development
- **ASGI Server**: Uvicorn 0.23+ with Gunicorn for production deployment
- **Authentication**: 
  - Supabase Auth for user management
  - JWT with Python-JOSE for token handling
  - Passlib for password hashing
- **Database**: 
  - PostgreSQL 15+ as the primary database
  - SQLAlchemy 2.0+ for ORM and query building
  - Alembic for database migrations
  - Psycopg 3.1+ as the PostgreSQL driver
- **Document Processing**:
  - PyPDF2 3.0+ for PDF text extraction
  - python-docx 0.8+ for DOCX processing
  - pandas 2.1+ for CSV/Excel handling
  - Celery 5.3+ for asynchronous task processing
  - Redis 4.6+ for task queue and result storage
- **AI Integration**:
  - OpenRouter Python SDK for model access
  - LangChain 0.0.27+ for RAG pipeline construction
  - FAISS 1.7+ or Qdrant for vector storage and similarity search
  - LlamaIndex 0.8+ for document indexing and retrieval
- **Security**:
  - python-multipart for secure file uploads
  - Pydantic 2.4+ for data validation
  - TensorFlow Text for content moderation
- **File Storage**:
  - MinIO for self-hosted object storage
  - boto3 for S3-compatible storage interaction
- **Monitoring**:
  - Prometheus for metrics collection
  - Grafana for visualization
  - OpenTelemetry for distributed tracing

### Data Storage
- **Primary Database**: PostgreSQL 15+ via Supabase
- **Authentication**: Supabase Auth with Row-Level Security
- **Vector Storage**: Pinecone or Qdrant for embeddings
- **Object Storage**: Supabase Storage for file management

### AI Integration
- **Model Access**: OpenRouter API for unified model access
- **Supported Models**:
  - Anthropic Claude 3 Opus/Sonnet/Haiku
  - OpenAI GPT-4o/GPT-4 Turbo
  - Mistral Large
  - Google Gemini Pro
  - Meta Llama 3
- **Features**:
  - Unified API for all models
  - Fallback mechanisms for reliability
  - Cost optimization through model routing

## Features In Progress

- Backend API integration for real data fetching
- User authentication implementation with Supabase
- Document content preview functionality
- Real-time processing status updates
- RAG (Retrieval Augmented Generation) pipeline for document-based queries

## Next Steps (Detailed Plan)

### 1. Backend Development (Priority: High)
- [ ] **Set up FastAPI Project Structure**
  - Create core directory structure following the project outline
  - Configure CORS and middleware for secure cross-origin requests
  - Set up dependency injection system for testable components
  - Implement structured logging with JSON formatting

- [ ] **Database Models and Migrations**
  - Define SQLAlchemy models with type annotations for:
    - User profiles (username, email, settings)
    - AI profiles (name, description, parameters, embeddings config)
    - Documents (metadata, processing status, permissions)
    - Processing jobs (status, logs, metrics)
    - Query history (prompts, responses, timestamps, metrics)
  - Create Alembic migrations for schema versioning
  - Implement database connection pooling for optimal performance

- [ ] **Authentication System**
  - Integrate Supabase authentication with social login options
  - Implement JWT token validation with proper expiration and refresh
  - Set up user registration, login, and password reset endpoints
  - Configure Row-Level Security policies in PostgreSQL
  - Implement role-based access control for resources

- [ ] **Profile Management API**
  - Endpoints for creating, reading, updating and deleting profiles
  - Validation for profile data with Pydantic schemas
  - Support for attaching documents to profiles
  - Configurable AI parameters (temperature, max tokens, etc.)
  - Profile sharing and collaboration features

- [ ] **Document Processing Pipeline**
  - File upload endpoint with validation and virus scanning
  - Support for PDF, DOCX, TXT, CSV, XLSX formats
  - Asynchronous processing queue with Celery
  - Chunking strategies for optimal RAG performance
  - Metadata extraction from documents
  - Text cleaning and normalization
  - Embedding generation with configurable models
  - Content indexing for searchability
  - Progress reporting via WebSockets

- [ ] **AI Integration**
  - OpenRouter API integration with automatic fallback
  - Context window optimization for large documents
  - Prompt engineering for different models
  - Response streaming for real-time feedback
  - Caching mechanism for frequent queries
  - Cost tracking and usage limits

- [ ] **API Key Management**
  - Secure generation of API keys with proper entropy
  - Storage with proper encryption at rest
  - Validation middleware for API requests
  - Usage tracking and rate limiting
  - Key rotation and revocation functionality
  - Expiration policies and automatic renewal options

### 2. Frontend Enhancements (Priority: Medium)

- [ ] **Authentication Integration**
  - Login and registration forms with social login options
  - Protected routes with React Router
  - Token management and refresh logic
  - User profile management dashboard
  - Password reset and email verification flows

- [ ] **Real Data Integration**
  - Replace mock data with API calls
  - Implement proper error handling with retry logic
  - Add loading states during API calls
  - Optimize data fetching with React Query
  - Implement optimistic updates for better UX

- [ ] **Document Viewer Improvements**
  - PDF preview functionality with PDF.js
  - Text content display with syntax highlighting
  - Pagination for large documents
  - Search within document content
  - Annotation capability for key passages

- [ ] **Advanced Query Features**
  - Query builder interface with templates
  - Saved queries management
  - Export functionality for query results in multiple formats
  - Visualizations for numerical data with charts
  - Collaborative querying with shared sessions

- [ ] **User Settings and Preferences**
  - Theme toggle (light/dark mode) with system preference detection
  - Notification preferences for different events
  - Default view settings and personalization
  - Account management and subscription options
  - Usage statistics and quotas visualization

### 3. Testing and Quality Assurance (Priority: Medium)

- [ ] **Unit Testing**
  - Backend tests with pytest and pytest-asyncio
  - Frontend tests with Jest and React Testing Library
  - API endpoint tests with proper mocking
  - Database tests with transactions
  - Authentication flow testing

- [ ] **Integration Testing**
  - End-to-end flows with Cypress or Playwright
  - API integration tests with realistic scenarios
  - Cross-browser compatibility testing
  - Mobile device testing
  - Performance benchmarking

- [ ] **Performance Optimization**
  - Frontend bundle size analysis and reduction
  - API response time optimization
  - Database query optimization with proper indexing
  - Caching implementation at multiple levels
  - CDN integration for static assets
  - Lazy loading for non-critical components

### 4. Deployment and DevOps (Priority: Low)

- [ ] **CI/CD Pipeline**
  - GitHub Actions for automated testing
  - Automated build and deployment process
  - Environment-specific configurations
  - Artifact versioning and rollback capability
  - Release notes generation

- [ ] **Infrastructure Setup**
  - Docker containerization with multi-stage builds
  - Docker Compose for local development
  - Kubernetes orchestration for production
  - Terraform for infrastructure as code
  - Database backup and recovery procedures
  - Monitoring and logging setup with ELK stack or Grafana

- [ ] **Security Hardening**
  - Security audit and vulnerability scanning
  - Rate limiting implementation
  - DDOS protection
  - Regular security updates process
  - OWASP top 10 compliance audit
  - Data encryption at rest and in transit

### 5. Documentation (Priority: Medium)

- [ ] **API Documentation**
  - OpenAPI schema with Swagger UI and ReDoc
  - Endpoint usage examples with code snippets
  - Authentication documentation with flows
  - Rate limiting and quota information
  - Postman/Insomnia collection for testing

- [ ] **User Documentation**
  - Interactive guides for all features
  - Video tutorials for complex workflows
  - FAQ section with searchable content
  - Troubleshooting guides for common issues
  - Feature discovery through tooltips

- [ ] **Developer Documentation**
  - Codebase structure explanation
  - Setup instructions for new developers
  - Contribution guidelines with PR templates
  - Architectural decision records
  - Design system documentation

## Getting Started

### Prerequisites
- Node.js (v18+)
- Python (v3.11+)
- Docker and Docker Compose (optional, for containerized setup)
- Supabase account (for authentication and database)
- OpenRouter API access (for AI model access)

### Installation

#### Frontend Setup

1. Clone the repository
   ```bash
   git clone https://github.com/yourusername/ai-profiles-creation.git
   cd ai-profiles-creation
   ```

2. Install frontend dependencies
   ```bash
   cd frontend
   npm install
   ```

3. Create a `.env.local` file in the frontend directory
   ```
   REACT_APP_SUPABASE_URL=your_supabase_url
   REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
   REACT_APP_API_URL=http://localhost:8000/api
   ```

4. Start the development server
   ```bash
   npm start
   ```

#### Backend Setup (When Implemented)

1. Install Python dependencies
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

2. Create a `.env` file in the backend directory
   ```
   DATABASE_URL=postgresql://postgres:password@localhost:5432/ai_profiles
   SUPABASE_URL=your_supabase_url
   SUPABASE_SERVICE_KEY=your_supabase_service_key
   OPENROUTER_API_KEY=your_openrouter_api_key
   JWT_SECRET=your_secure_jwt_secret
   ```

3. Run database migrations
   ```bash
   alembic upgrade head
   ```

4. Start the development server
   ```bash
   uvicorn app.main:app --reload
   ```

#### Docker Setup (Alternative)

1. Build and start all services
   ```bash
   docker-compose up -d
   ```

2. Access the application at http://localhost:3000

## Project Structure

```
ai-profiles-creation/
├── frontend/                  # React application
│   ├── public/                # Static files
│   ├── src/                   # Source code
│   │   ├── components/        # React components
│   │   │   ├── Auth/          # Authentication components
│   │   │   ├── Common/        # Shared UI components
│   │   │   ├── Dashboard/     # Dashboard components
│   │   │   ├── Documents/     # Document management components
│   │   │   ├── Keys/          # API key management
│   │   │   ├── Layout/        # Layout components
│   │   │   ├── Profile/       # Profile management
│   │   │   ├── Query/         # Query interface components
│   │   │   ├── Settings/      # Settings management components
│   │   │   └── Upload/        # File upload components
│   │   ├── context/           # React context providers
│   │   ├── hooks/             # Custom React hooks
│   │   ├── pages/             # Application pages
│   │   ├── services/          # API services
│   │   ├── types/             # TypeScript interfaces and types
│   │   ├── utils/             # Utility functions
│   │   └── App.tsx            # Main application component
│   ├── .env.local             # Environment variables (not in repo)
│   └── package.json           # Frontend dependencies
├── backend/                   # FastAPI application (planned)
│   ├── alembic/               # Database migrations
│   ├── app/                   # Application code
│   │   ├── api/               # API endpoints
│   │   │   ├── auth/          # Authentication routes
│   │   │   ├── documents/     # Document management routes
│   │   │   ├── profiles/      # Profile management routes
│   │   │   └── queries/       # Query handling routes
│   │   ├── core/              # Core functionality
│   │   │   ├── config.py      # Application configuration
│   │   │   ├── security.py    # Authentication and security
│   │   │   └── logging.py     # Logging configuration
│   │   ├── db/                # Database models and operations
│   │   ├── models/            # Pydantic models for validation
│   │   ├── services/          # Business logic
│   │   │   ├── ai/            # AI integration services
│   │   │   ├── documents/     # Document processing services
│   │   │   └── storage/       # Storage services
│   │   ├── tasks/             # Celery tasks
│   │   ├── utils/             # Utility functions
│   │   └── main.py            # Application entry point
│   ├── tests/                 # Unit and integration tests
│   ├── .env                   # Environment variables (not in repo)
│   └── requirements.txt       # Backend dependencies
├── docker/                    # Docker configuration files
├── docker-compose.yml         # Docker Compose configuration
├── .github/                   # GitHub Actions workflows
├── docs/                      # Documentation
└── README.md                  # Project documentation
```

## Contributing

Contributions are welcome! Please check the [issues](https://github.com/yourusername/ai-profiles-creation/issues) page for open tasks or create a new issue to discuss your ideas.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT

## Resources and References

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [React Documentation](https://reactjs.org/docs/getting-started.html)
- [Supabase Documentation](https://supabase.io/docs)
- [OpenRouter Documentation](https://openrouter.ai/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [LangChain Documentation](https://python.langchain.com/docs/get_started/introduction)

## Contact

Project Link: [https://github.com/yourusername/ai-profiles-creation](https://github.com/yourusername/ai-profiles-creation) 