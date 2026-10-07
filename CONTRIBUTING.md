# Contributing to Tovo TV-OS

Thank you for your interest in contributing to Tovo TV-OS! This document provides guidelines and instructions for contributing to the project.

## Code of Conduct

Please be respectful and constructive in all interactions. We're committed to providing a welcoming and harassment-free environment for all contributors.

## Getting Started

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/your-username/Tovo-TV-OS.git
   cd Tovo-TV-OS
   ```

3. **Add upstream remote**:
   ```bash
   git remote add upstream https://github.com/original-owner/Tovo-TV-OS.git
   ```

4. **Create a new branch** for your feature or fix:
   ```bash
   git checkout -b feature/my-amazing-feature
   # or
   git checkout -b fix/bug-description
   ```

## Development Workflow

### Prerequisites
- Node.js 20.x or later
- pnpm 9.x or later
- PostgreSQL 14+ (for full development)

### Setup

1. **Install dependencies**:
   ```bash
   pnpm install
   ```

2. **Set up environment**:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Initialize database** (if needed):
   ```bash
   pnpm --filter @workspace/db run push
   ```

### Running the Project

**Terminal 1 - API Server**:
```bash
pnpm --filter @workspace/api-server run dev
# Runs on http://localhost:5000
```

**Terminal 2 - Frontend**:
```bash
pnpm --filter @workspace/tovo-tv-os run dev
# Runs on http://localhost:5173
```

### Code Quality

Before committing, ensure:

1. **Type safety**:
   ```bash
   pnpm run typecheck
   ```

2. **Formatting**:
   ```bash
   pnpm exec prettier --write .
   ```

3. **Build**:
   ```bash
   pnpm run build
   ```

## Commit Guidelines

Follow conventional commits format:

```
type(scope): description

[optional body]

[optional footer]
```

### Types
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Code style (formatting, semicolons, etc.)
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `test`: Adding or updating tests
- `chore`: Build process, dependencies, etc.
- `ci`: CI/CD configuration

### Examples
```
feat(api): add user authentication endpoint
fix(frontend): resolve memory leak in streaming iframe
docs(readme): update installation instructions
refactor(routes): simplify route handlers
```

## Pull Request Process

1. **Before creating a PR**:
   - Ensure your branch is up to date with main: `git fetch upstream && git rebase upstream/main`
   - Run typecheck: `pnpm run typecheck`
   - Format code: `pnpm exec prettier --write .`

2. **Create a descriptive PR**:
   - Use a clear title that follows commit conventions
   - Include description of changes
   - Reference related issues with `Closes #issue-number`
   - Include screenshots for UI changes

3. **PR Template**:
   ```markdown
   ## Description
   Brief description of changes

   ## Related Issues
   Closes #123

   ## Changes
   - Change 1
   - Change 2

   ## Testing
   How was this tested?

   ## Screenshots
   [if applicable]

   ## Checklist
   - [ ] Tests pass
   - [ ] No type errors
   - [ ] Code formatted with Prettier
   - [ ] Documentation updated
   ```

4. **Review process**:
   - Address feedback from reviewers
   - Keep commits organized and logically grouped
   - Re-request review after making changes

## Project Structure

When adding features, maintain the existing structure:

```
artifacts/
├── api-server/src/
│   ├── routes/        # API route handlers
│   ├── lib/           # Utility functions
│   └── index.ts       # Server entry point
└── tovo-tv-os/src/
    ├── components/    # React components
    ├── pages/         # Page components
    ├── lib/           # Utilities
    └── App.tsx        # Main app component

lib/
├── api-spec/          # OpenAPI spec
├── api-zod/           # Zod schemas
└── db/                # Database schemas
```

## Naming Conventions

- **Files**: kebab-case (e.g., `user-service.ts`)
- **Components**: PascalCase (e.g., `UserCard.tsx`)
- **Variables/Functions**: camelCase (e.g., `getUserData()`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `MAX_RETRIES`)
- **Interfaces**: PascalCase with `I` prefix (e.g., `IUser`)

## Documentation

- Update README.md for user-facing changes
- Add JSDoc comments for public functions
- Update relevant documentation files
- Include inline comments for complex logic

## Testing

While not all tests are automated, ensure:

1. **Manual testing**: Test your changes locally
2. **Type safety**: Run `pnpm run typecheck`
3. **Build verification**: Run `pnpm run build`

Future: Add automated tests as the project grows.

## Performance Considerations

- Avoid unnecessary re-renders in React components
- Use proper data structures for API responses
- Consider caching strategies
- Profile performance-critical sections

## Database Changes

When modifying the database schema:

1. Update `lib/db/src/schema/index.ts`
2. Regenerate Zod schemas: `pnpm --filter @workspace/api-spec run codegen`
3. Test schema changes locally
4. Document schema migration in commit message

## Reporting Bugs

When reporting bugs:

1. **Use the issue template**
2. **Include**:
   - Clear description
   - Steps to reproduce
   - Expected vs actual behavior
   - Environment (OS, Node version, etc.)
   - Screenshots/logs

3. **Good bug report example**:
   ```
   Title: API returns 500 when streaming route has special characters
   
   Steps to reproduce:
   1. Enter movie ID with special characters (e.g., "272#test")
   2. Click Execute Route
   3. Observe error
   
   Expected: Proper validation error
   Actual: 500 Internal Server Error
   
   Environment: Node 20.1.0, pnpm 9.0.0
   ```

## Feature Requests

When requesting features:

1. **Provide context**: Why is this needed?
2. **Describe solution**: How should it work?
3. **Consider alternatives**: Are there other approaches?
4. **Add examples**: Show usage if possible

## Style Guide

### TypeScript
- Use strict mode
- Avoid `any` types
- Use `unknown` when necessary
- Prefer interfaces over types
- Use async/await over promises

### React
- Use functional components with hooks
- Keep components small and focused
- Use meaningful component names
- Avoid prop drilling (consider context)
- Memoize expensive computations

### CSS
- Use Tailwind classes
- Avoid inline styles
- Keep specificity low
- Document complex selectors

## Getting Help

- **Questions**: Use GitHub Discussions
- **Issues**: Use GitHub Issues with templates
- **Real-time chat**: Check project's chat channels
- **Email**: For security issues, email the maintainers

## License

By contributing to Tovo TV-OS, you agree that your contributions will be licensed under the MIT License.

## Recognition

Contributors will be recognized in:
- CHANGELOG.md
- GitHub contributors page
- Project documentation

## Maintainers

- **Lead**: [Maintainer Name] (@username)
- **Active Contributors**: [List contributors]

---

Thank you for contributing to make Tovo TV-OS better! 🚀
