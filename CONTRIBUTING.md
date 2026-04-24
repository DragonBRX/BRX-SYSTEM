# Contributing to BRX System

Thank you for your interest in contributing to BRX System. This document provides guidelines and instructions for contributing.

## Development Setup

1. Fork the repository
2. Clone your fork
3. Install dependencies with `npm ci`
4. Set up your local MySQL instance
5. Copy `.env` and configure credentials
6. Run `npm run db:push` to initialize the database
7. Start the dev server with `npm run dev`

## Code Style

- TypeScript strict mode enabled
- Prettier for formatting
- ESLint for linting
- Follow existing file naming conventions

## Commit Messages

Use clear, descriptive commit messages:
- `feat:` for new features
- `fix:` for bug fixes
- `docs:` for documentation updates
- `refactor:` for code restructuring
- `test:` for test additions

## Pull Request Process

1. Create a feature branch from `main`
2. Make your changes with clear commit messages
3. Ensure `npm run check` passes without errors
4. Ensure `npm run build` completes successfully
5. Update documentation if needed
6. Submit PR with detailed description

## Testing

- Write tests for new features
- Ensure existing tests pass
- Target good coverage for critical paths

## Questions?

Open an issue for discussion before major changes.
