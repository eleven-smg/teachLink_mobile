# Contributing to TeachLink Mobile

Thank you for contributing to TeachLink Mobile!

## Pull Request Guidelines

Before submitting a Pull Request, please ensure that your changes pass all local lint and type checks. 

### Fast-Fail Syntax Gate
We have a dedicated **Syntax Gate** workflow (`.github/workflows/syntax.yml`) that runs on every pull request `opened` or `synchronize` event.
- This gate checks TypeScript compiler errors (`tsc --noEmit`) and code style rules (`eslint --max-warnings=0`).
- It is optimized to complete in **under 90 seconds** using a warm cache.
- The syntax check is a **required check** for branch protection. Pull requests cannot be merged if it fails.
- To avoid CI failures, you should run linting and type checking locally before pushing.

### Local Quality Checks
You can run the checks locally:
```bash
# Run ESLint linting
npm run lint

# Run Prettier format check
npm run format:check

# Run TypeScript type check
npx tsc --noEmit
```
