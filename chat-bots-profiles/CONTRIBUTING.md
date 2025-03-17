# Contributing to AI Chatbot Profiles

Thank you for considering contributing to AI Chatbot Profiles! This document outlines the process for contributing to the project and how to get started.

## Code of Conduct

By participating in this project, you agree to abide by our [Code of Conduct](CODE_OF_CONDUCT.md). Please read it before contributing.

## How Can I Contribute?

### Reporting Bugs

If you find a bug, please create an issue on our GitHub repository following these steps:

1. Check if the bug has already been reported
2. Use the bug report template
3. Include detailed steps to reproduce the issue
4. Describe the expected behavior and what actually happened
5. Include screenshots if applicable
6. Provide information about your environment (browser, OS, etc.)

### Suggesting Enhancements

We welcome suggestions for enhancements! To suggest a new feature:

1. Check if the enhancement has already been suggested
2. Use the feature request template
3. Clearly describe the feature and its benefits
4. Provide examples of how the feature would work

### Pull Requests

We actively welcome pull requests:

1. Fork the repository
2. Create a new branch for your feature/fix (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run tests to ensure nothing broke
5. Commit your changes (`git commit -m 'Add some amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

## Development Guidelines

### Setting Up Development Environment

1. Clone the repository
2. Install backend dependencies: `cd backend && pip install -r requirements.txt`
3. Install frontend dependencies: `cd frontend && npm install`
4. Copy `.env.example` to `.env` in both the root and frontend directories and configure
5. Start the development servers

### Coding Standards

#### Backend (Python)

- Follow PEP 8 style guide
- Use type hints when appropriate
- Write docstrings for functions and classes
- Organize imports alphabetically
- Use meaningful variable names

#### Frontend (TypeScript/React)

- Follow the project's ESLint configuration
- Use functional components and hooks
- Keep components small and focused
- Use descriptive names for components and functions
- Write unit tests for components

### Testing

- Write tests for new features and bug fixes
- Ensure all tests pass before submitting a PR
- For the backend, use pytest
- For the frontend, use Vitest or Jest

### Documentation

- Update documentation for any changes to APIs or features
- Document new features clearly
- Update README.md if needed

## Review Process

All contributions will be reviewed by maintainers:

1. Automated checks (linting, tests) must pass
2. At least one maintainer must approve the changes
3. Changes should address exactly one concern
4. Code should be maintainable and follow best practices
5. Documentation should be updated as needed

## Community

Join our community channels:

- [Discord](https://discord.gg/example)
- [Twitter](https://twitter.com/example)

---

Thank you for contributing to AI Chatbot Profiles! Your efforts help make this project better for everyone. 