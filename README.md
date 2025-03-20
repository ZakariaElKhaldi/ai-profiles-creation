# AI Profiles

AI Profiles is a complete solution for creating and managing AI-powered profiles that can respond to queries based on uploaded documents and customized configurations.

## Overview

AI Profiles allows you to:

- Create AI representations of individuals, companies, products, or knowledge domains
- Upload various document types (PDF, DOCX, TXT, etc.) to provide knowledge to your profiles
- Query profiles through a web interface or API to get AI-generated responses
- Configure AI behavior through system prompts and model settings
- Enable external application access via API keys

## Features

- **Profile Management**: Create, edit, and organize AI profiles
- **Document Processing**: Upload, process, and extract text from various document formats
- **Interactive Querying**: Chat with your profiles in a conversational interface
- **API Access**: Full API for programmatic access and integration
- **External Access**: Secure API keys for third-party application integration
- **Customizable AI Behavior**: Configure system prompts and model parameters

## Quick Start

### Using Docker (Recommended)

1. Clone the repository:
   ```bash
   git clone https://github.com/your-org/ai-profiles.git
   cd ai-profiles
   ```

2. Create a `.env` file:
   ```
   # Database
   DATABASE_URL=postgresql://postgres:postgres@db:5432/ai_profiles
   
   # API Keys
   OPENROUTER_API_KEY=your_openrouter_api_key
   
   # Storage paths
   UPLOAD_DIR=./data/uploads
   PROCESSED_DIR=./data/processed
   ```

3. Start the application:
   ```bash
   docker-compose up
   ```

4. Access the application at http://localhost:3000

### Manual Installation

For detailed installation instructions, see the [Installation Guide](docs/installation.md).

## Documentation

For detailed documentation, see the [Documentation](docs/README.md) directory, which includes:

- [Installation Guide](docs/installation.md)
- [Profile Management](docs/profile-management.md)
- [Document Processing](docs/document-processing.md)
- [API Reference](docs/api-reference.md)
- [API Keys Management](docs/api-keys.md)
- [Troubleshooting](docs/troubleshooting.md)

## Architecture

AI Profiles consists of two main components:

1. **Backend (FastAPI)**
   - API endpoints
   - Document processing pipeline
   - Database interactions
   - OpenRouter API integration

2. **Frontend (React)**
   - User interface
   - Profile management
   - Document upload and viewing
   - Chat interface

## Requirements

- Python 3.9+
- Node.js 16+
- PostgreSQL 13+
- OpenRouter API key

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Support

If you encounter any issues or have questions, please check the [Troubleshooting Guide](docs/troubleshooting.md) or open an issue on GitHub.
