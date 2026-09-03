# Contributing to @nesvel/nestjs-mail

Thank you for considering contributing to the Nesvel mail package!

## Development Setup

1. **Install dependencies** (from monorepo root):

   ```bash
   bun install
   ```

2. **Build the package**:

   ```bash
   bun build --filter=@nesvel/nestjs-mail
   ```

3. **Watch mode for development**:

   ```bash
   bun build:watch --filter=@nesvel/nestjs-mail
   ```

## Testing

- Run tests: `bun test --filter=@nesvel/nestjs-mail`
- Run tests in watch mode: `bun test:watch --filter=@nesvel/nestjs-mail`
- Run tests with coverage: `bun test:cov --filter=@nesvel/nestjs-mail`

## Code Quality

- **Linting**: `bun lint --filter=@nesvel/nestjs-mail`
- **Format**: `bun format --filter=@nesvel/nestjs-mail`
- **Type check**: `bun typecheck --filter=@nesvel/nestjs-mail`

## Guidelines

- **Add tests** for all new features and bug fixes
- **Follow Conventional Commits** format for commit messages
- **Add docblocks** to all public methods and classes
- **Keep APIs stable** - document breaking changes in CHANGELOG
- **Update documentation** when adding new features
- **Test with multiple mail transports** (SMTP, SendGrid, etc.)

## Commit Message Format

Use conventional commits: `<type>(<scope>): <subject>`

**Examples**:

- `feat(mail): add support for attachments`
- `fix(adapters): fix React adapter rendering`
- `docs(readme): update configuration examples`

## Pull Request Process

1. Create a feature branch from `main`
2. Make your changes with clear commit messages
3. Add/update tests as needed
4. Ensure all tests pass
5. Update documentation if needed
6. Submit PR with clear description of changes
