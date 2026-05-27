# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [Unreleased]

### Removed

- **deps:** `expo-system-ui`, `react-native-dotenv`, `tailwind-merge`, `tslog` — not imported anywhere in source code
- **devDeps:** `@testing-library/jest-native`, `@types/babel__core`, `@types/babel__generator`, `@types/babel__template`, `@types/babel__traverse`, `@types/jest`, `@types/node`, `@types/react-native-dotenv`, `eslint-plugin-import`, `eslint-plugin-react`, `eslint-plugin-react-hooks`, `ts-jest`, `typescript` — unused or provided transitively by existing toolchain dependencies

See [docs/unused-packages.md](docs/unused-packages.md) for full analysis and rationale.
