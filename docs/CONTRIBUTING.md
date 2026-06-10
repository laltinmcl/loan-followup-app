# Contributing

## How to Contribute

We welcome contributions! Follow these guidelines to ensure smooth collaboration.

### 1. Setup

```bash
# Fork the repository
# Clone your fork
git clone https://github.com/your-username/loan-followup-app.git
cd loan-followup-app

# Add upstream remote
git remote add upstream https://github.com/original/loan-followup-app.git

# Follow DEVELOPMENT.md to set up your environment
```

### 2. Branch Naming

```
feature/field-visit-gps-tracking
fix/offline-sync-conflict
docs/update-api-reference
refactor/stage-engine
```

### 3. Development Workflow

```bash
# Create a feature branch
git checkout -b feature/your-feature-name

# Make changes and commit (see conventions)
git commit -m "feat: add field visit GPS tracking"

# Keep your branch updated
git fetch upstream
git rebase upstream/main

# Push and create PR
git push origin feature/your-feature-name
```

### 4. Commit Conventions

Use conventional commits:

```
feat:     New feature for the user, not a new feature for build script
fix:      Bug fix for the user
docs:     Changes to documentation
style:    Formatting, missing semicolons, etc. (no code change)
refactor: Refactoring production code (e.g., renaming a variable)
test:     Adding missing tests, refactoring tests
chore:    Updating build tasks, package manager configs, etc.
```

### 5. Pull Request Process

1. Ensure your code passes all checks:
   ```bash
   cd backend && npm run lint && npm test
   cd frontend && npm run lint && npm test
   ```
2. Update the CHANGELOG.md with your changes
3. Update documentation if adding/modifying features
4. Create a PR with a clear title and description
5. Link any related issues
6. Wait for review — address any feedback

### 6. Code Review Checklist

- [ ] Follows TypeScript strict mode
- [ ] No console.log in production code
- [ ] Error handling for API calls
- [ ] Loading states for async operations
- [ ] Responsive design for mobile
- [ ] Offline handling where applicable
- [ ] Tests added/updated
- [ ] Documentation updated
- [ ] No hardcoded secrets or URLs

### 7. Adding New Features

For significant features, first create a discussion or issue:

1. Open an issue describing the feature
2. Wait for feedback from maintainers
3. Once approved, follow the workflow above

### 8. Reporting Bugs

Open an issue with:
- **Description**: What happened vs what should happen
- **Steps to reproduce**: Detailed steps
- **Environment**: Browser, OS, screen size, online/offline
- **Screenshots**: If applicable
- **Additional context**: Any other relevant info
