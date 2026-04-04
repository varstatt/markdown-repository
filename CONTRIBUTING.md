# Contributing

Thanks for your interest in contributing to markdown-repository.

## Getting started

```bash
git clone https://github.com/varstatt/markdown-repository.git
cd markdown-repository
npm install
```

## Development

```bash
npm test           # run tests
npm run test:watch # run tests in watch mode
npm run lint       # check formatting and lint rules
npm run format     # auto-fix formatting
npm run build      # compile TypeScript
```

## Making changes

1. Fork the repository and create a branch from `main`
2. Write tests for any new functionality
3. Make sure all tests pass: `npm test`
4. Make sure code is formatted: `npm run format`
5. Open a pull request

## Code style

This project uses [Biome](https://biomejs.dev/) for formatting and linting. Run `npm run format` before committing.

## Tests

Tests use Jest with ts-jest. Test files live next to source files as `*.test.ts`. Mock fixtures are in `*.mock.ts`.

All new features and bug fixes should include tests.

## Releases

Releases are automated via GitHub Actions. When a new GitHub release is created, the package is automatically published to npm.

## Issues

Found a bug or have a feature request? [Open an issue](https://github.com/varstatt/markdown-repository/issues).
