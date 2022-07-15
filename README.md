# NPM package template

Template I use to create new NPM packages.

## What's included?

- TypeScript support
- Unit-tests with coverage report (Mocha, Chai, Instanbul/NYC)
- Linter with semistandard config and TypeScript support (ESLint)
- CI pipeline to run tests and linter on push/pull-request
- CI pipeline to publish package to NPM on new GitHub release

## Available scripts

1. `build` compiles project from TypeScript to pure JavaScript
1. `test` runs unit-tests
1. `test-watch` runs unit-tests in watch mode
1. `test-coverage` runs unit-tests with coverage report
1. `lint` checks code-style of source files
1. `lint-fix` checks code-style and automatically fixes some issues

## References

- [MIT licence](./LICENSE)
- [How to contribute](./CONTRIBUTING.md)