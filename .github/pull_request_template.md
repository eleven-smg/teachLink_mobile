## Summary
<!-- Describe your changes in detail here -->

## Type of Change
- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Chore / Refactor (no functional changes)

## Testing Done
- [ ] Unit Tests
- [ ] Integration Tests
- [ ] Manual Verification (e.g., iOS/Android UI checks)

## Security Considerations
- [ ] Does this store user data securely (e.g., avoiding plain AsyncStorage for sensitive data)?
- [ ] Is token handling secure (no token exposure in logs or UI)?
- [ ] Are all user inputs validated?
- [ ] Is deep link handling safe from malicious payloads?

## Performance Considerations
- [ ] Are React hooks (`useCallback`, `useMemo`) used appropriately to prevent unnecessary renders?
- [ ] Is `FlatList` optimized (e.g., using `getItemLayout`, `keyExtractor`)?
- [ ] Are asynchronous patterns handled correctly (e.g., `useEffect` cleanup to avoid memory leaks)?
- [ ] Have bundle size impacts been considered?

## Checklist
- [ ] I have read the [CONTRIBUTING](CONTRIBUTING.md) guide.
- [ ] My code follows the style guidelines of this project.
- [ ] I have updated the documentation accordingly.
- [ ] Are there architectural changes? If so, is there an Architectural Decision Record (ADR)?
