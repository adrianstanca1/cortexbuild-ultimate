# 🤝 Contributing to CortexBuild Ultimate

**Version:** 3.0.0  
**Platform Health:** 100/100  
**Last Updated:** 2026-04-01

---

## 🎯 Welcome!

Thank you for your interest in contributing to CortexBuild Ultimate! This guide will help you get started.

---

## 📋 Table of Contents

1. [Code of Conduct](#code-of-conduct)
2. [Getting Started](#getting-started)
3. [Development Setup](#development-setup)
4. [Making Changes](#making-changes)
5. [Pull Request Process](#pull-request-process)
6. [Coding Standards](#coding-standards)
7. [Testing Guidelines](#testing-guidelines)
8. [Documentation](#documentation)

---

## 📜 Code of Conduct

### Our Pledge

We pledge to make participation in our project a harassment-free experience for everyone.

### Expected Behavior

- Be respectful and inclusive
- Accept constructive criticism
- Focus on what's best for the community
- Show empathy towards others

### Unacceptable Behavior

- Harassment or discrimination
- Trolling or insulting comments
- Publishing others' private information
- Other unethical conduct

---

## 🚀 Getting Started

### Prerequisites

- Node.js 20+
- npm or yarn
- Git
- Docker (for local database)

### Fork and Clone

```bash
# 1. Fork the repository on GitHub
# 2. Clone your fork
git clone https://github.com/YOUR_USERNAME/cortexbuild-ultimate.git
cd cortexbuild-ultimate

# 3. Add upstream remote
git remote add upstream https://github.com/adrianstanca1/cortexbuild-ultimate.git

# 4. Create branch for your work
git checkout -b feature/your-feature-name
```

---

## 💻 Development Setup

### Install Dependencies

```bash
# Frontend
npm install

# Backend
cd server && npm install && cd ..
```

### Environment Setup

```bash
# Copy environment template
cp .env.example .env.local

# Edit with your settings
nano .env.local
```

### Start Development Environment

```bash
# Start backend
pm2 start server/index.js --name cortexbuild-api

# Start frontend (in new terminal)
npm run dev
```

### Verify Setup

```bash
# Run tests
npm test

# Build check
npm run build

# Lint check
npx eslint .
```

---

## ✏️ Making Changes

### Branch Naming Convention

```
feature/add-new-module
fix/resolve-login-issue
docs/update-api-documentation
perf/optimize-database-queries
test/add-unit-tests
```

### Commit Message Format

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
type(scope): description

[optional body]

[optional footer]
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Formatting
- `refactor`: Code restructuring
- `perf`: Performance improvement
- `test`: Tests
- `chore`: Maintenance

**Examples:**
```
feat(modules): add project calendar module
fix(auth): resolve session timeout issue
docs(api): update endpoint documentation
perf(database): optimize slow queries
test(components): add unit tests for NotificationCenter
```

### Making Your Changes

```bash
# 1. Make your changes
# 2. Stage changes
git add src/components/modules/Calendar.tsx

# 3. Commit with message
git commit -m "feat(calendar): add project calendar module

- Month/Week/Day views
- Event management
- Color-coded event types

Closes #123"

# 4. Push to your fork
git push origin feature/add-calendar-module
```

---

## 🔄 Pull Request Process

### Before Submitting

- [ ] Code follows style guidelines
- [ ] Tests added/updated
- [ ] Documentation updated
- [ ] No ESLint errors
- [ ] Build passes
- [ ] All tests pass

### Creating PR

1. **Go to your fork on GitHub**
2. **Click "New Pull Request"**
3. **Choose base branch:** `main`
4. **Fill out PR template:**
   ```markdown
   ## Description
   Brief description of changes

   ## Type of Change
   - [ ] Bug fix
   - [ ] New feature
   - [ ] Breaking change
   - [ ] Documentation update

   ## Testing
   - [ ] Tests pass locally
   - [ ] New tests added
   - [ ] Manual testing completed

   ## Checklist
   - [ ] Code follows guidelines
   - [ ] Documentation updated
   - [ ] No breaking changes
   ```

### Review Process

1. **Automated Checks:**
   - Build verification
   - Test suite
   - Lighthouse CI
   - ESLint

2. **Code Review:**
   - Maintainer reviews code
   - Feedback provided
   - Changes requested if needed

3. **Approval:**
   - All checks pass
   - Maintainer approves
   - PR merged

### After Merge

- Delete your feature branch
- Pull latest from main
- Celebrate! 🎉

---

## 📏 Coding Standards

### TypeScript

```typescript
// ✅ Good: Proper typing
interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

function getUser(id: string): Promise<User> {
  // Implementation
}

// ❌ Bad: Using any
function getUser(id: any): any {
  // Implementation
}
```

### React Components

```typescript
// ✅ Good: Typed props, JSDoc
/**
 * User profile card component
 * @param props - Component props
 * @param props.user - User data
 * @returns JSX element
 */
interface ProfileCardProps {
  user: User;
  onEdit?: () => void;
}

export function ProfileCard({ user, onEdit }: ProfileCardProps) {
  return (
    <div className="card">
      {/* Component content */}
    </div>
  );
}
```

### CSS/Tailwind

```typescript
// ✅ Good: Consistent Tailwind usage
<div className="flex items-center gap-4 p-4 bg-base-100 rounded-lg">
  {/* Content */}
</div>

// ❌ Bad: Inline styles (unless dynamic)
<div style={{ display: 'flex', padding: '16px' }}>
  {/* Content */}
</div>
```

### File Organization

```
src/
├── components/
│   ├── ui/           # Reusable UI components
│   ├── layout/       # Layout components
│   └── modules/      # Feature modules
├── hooks/            # Custom React hooks
├── lib/              # Utility libraries
├── services/         # API services
├── context/          # React context
├── test/             # Test files
└── types/            # TypeScript types
```

---

## 🧪 Testing Guidelines

### Test File Naming

```typescript
// Component tests
src/components/ui/Button.test.tsx

// Hook tests
src/hooks/useAuth.test.ts

// Utility tests
src/lib/validation.test.ts

// E2E tests
e2e/login.spec.ts
```

### Writing Tests

```typescript
// ✅ Good: Descriptive test names
describe('NotificationCenter', () => {
  describe('Rendering', () => {
    it('renders notification list', () => {
      // Test implementation
    });

    it('displays unread count', () => {
      // Test implementation
    });
  });

  describe('User Interactions', () => {
    it('marks notification as read when clicked', () => {
      // Test implementation
    });
  });
});

// ❌ Bad: Vague test names
it('works correctly', () => {
  // Test implementation
});
```

### Test Coverage

**Minimum Requirements:**
- Components: 80% line coverage
- Utilities: 90% line coverage
- Critical paths: 100% coverage

**Run Tests:**
```bash
# All tests
npm test

# With coverage
npm run test:coverage

# Watch mode
npm run test:watch

# Specific file
npm test -- src/lib/validation.test.ts
```

---

## 📚 Documentation

### Code Comments

```typescript
/**
 * Validates notification data against schema
 * @param data - Raw notification data
 * @returns Validated notification object
 * @throws {ZodError} If validation fails
 */
export function validateNotification(data: unknown): Notification {
  return NotificationSchema.parse(data);
}
```

### README Updates

When adding new features:

1. **Update main README.md**
2. **Add to docs/NEW_FEATURES_GUIDE.md**
3. **Update CHANGELOG.md**
4. **Add JSDoc to code**

### Documentation Standards

- Clear and concise
- Include examples
- Explain "why" not just "what"
- Keep up to date

---

## 🐛 Reporting Bugs

### Bug Report Template

```markdown
## Description
Clear description of the bug

## Reproduction Steps
1. Go to '...'
2. Click on '...'
3. See error

## Expected Behavior
What should happen

## Screenshots
If applicable

## Environment
- OS: [e.g., macOS]
- Browser: [e.g., Chrome 120]
- Version: [e.g., 3.0.0]

## Additional Context
Any other details
```

### Where to Report

- GitHub Issues: [Create Issue](https://github.com/adrianstanca1/cortexbuild-ultimate/issues)
- Security issues: Email security@cortexbuild.com

---

## 💡 Feature Requests

### Feature Request Template

```markdown
## Problem Statement
What problem does this solve?

## Proposed Solution
How should it work?

## Alternatives Considered
Other approaches

## Additional Context
Mockups, examples, etc.
```

---

## 📞 Getting Help

- **Documentation:** [docs/](./docs/)
- **Existing Issues:** [GitHub Issues](https://github.com/adrianstanca1/cortexbuild-ultimate/issues)
- **Discussions:** [GitHub Discussions](https://github.com/adrianstanca1/cortexbuild-ultimate/discussions)

---

## 🎯 Areas Needing Contribution

### High Priority

- [ ] Unit tests for new components
- [ ] Accessibility improvements
- [ ] Performance optimizations
- [ ] Mobile responsiveness

### Medium Priority

- [ ] Storybook stories
- [ ] Video tutorials
- [ ] Translation support
- [ ] Plugin system

### Low Priority

- [ ] Theme customization
- [ ] Advanced animations
- [ ] Social features
- [ ] Mobile app

---

## 🏆 Recognition

Contributors will be recognized in:

- README.md contributors section
- Release notes
- Annual contributor report

---

## 📜 License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

*Thank you for contributing to CortexBuild Ultimate!* 🎉

*Last Updated: 2026-04-01*
