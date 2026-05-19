# Contributing to IsDB-BISEW Connect

Thank you for considering contributing to the IsDB-BISEW Connect platform.

## Code of Conduct

By participating, you agree to maintain a respectful and inclusive environment.

## How to Contribute

### Reporting Bugs

- Search existing issues first
- Include steps to reproduce, expected behavior, and actual behavior
- Include screenshots if applicable
- Note your environment (PHP version, browser, etc.)

### Suggesting Features

- Describe the feature and its use case
- Explain how it benefits the community
- Provide examples if possible

### Pull Requests

1. **Fork** the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Make your changes following the coding standards
4. Write or update tests as needed
5. Run `php artisan test` to ensure all tests pass
6. Commit and push to your fork
7. Open a Pull Request with a clear description

## Development Setup

```bash
git clone git@github.com:ringkubd/messaging_system.git
cd messaging_system
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate --seed
npm install
npm run dev
php artisan serve
```

## Coding Standards

- **PHP**: Follow PSR-12 coding standards and Laravel conventions
- **JavaScript/React**: Follow existing patterns in the codebase
- **CSS**: Use CSS custom properties defined in `resources/css/app.css`
- **Database**: Use migrations with `Blueprint` fluent API
- **Routes**: Define all API routes in `routes/api.php` under appropriate middleware groups
- **Controllers**: Keep thin controllers — move business logic to Services
- **Models**: Define relationships, scopes, and accessors as needed
- **No comments in code**: Write self-documenting code with clear variable/function names

## Testing

```bash
# Run all tests
php artisan test

# Run specific test suite
php artisan test --filter=AuthApiTest

# Run with coverage
php artisan test --coverage
```

All new features should include tests covering:
- Successful operations
- Validation errors
- Authorization checks
- Edge cases

## Git Convention

- Use descriptive commit messages
- Reference issue numbers when applicable
- Keep commits focused on single changes
- Rebase before merging

## Questions?

Open an issue or contact the maintainers.
