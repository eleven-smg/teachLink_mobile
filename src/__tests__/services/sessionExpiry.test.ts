import { checkSessionValidity } from '../../services/secureStorage';

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
  WHEN_UNLOCKED_THIS_DEVICE_ONLY: 'WHEN_UNLOCKED_THIS_DEVICE_ONLY',
}));

jest.mock('../../utils/logger', () => ({
  default: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

jest.mock('../../config', () => ({
  getEnv: jest.fn(() => 'https://api.test.example.com'),
}));

import * as SecureStore from 'expo-secure-store';

const mockGetItem = SecureStore.getItemAsync as jest.Mock;

const NOW = 1_700_000_000_000;

beforeEach(() => {
  jest.useFakeTimers({ now: NOW });
  mockGetItem.mockReset();
});

afterEach(() => {
  jest.useRealTimers();
});

describe('checkSessionValidity', () => {
  it('returns invalid when no sessionExpiresAt is stored', async () => {
    // access token present, session expires at absent
    mockGetItem.mockResolvedValue(null);

    const result = await checkSessionValidity();

    expect(result.valid).toBe(false);
    expect(result.expiringSoon).toBe(false);
    expect(result.msUntilExpiry).toBe(0);
  });

  it('returns invalid when session is already expired', async () => {
    const expiredAt = NOW - 60_000; // expired 1 minute ago
    mockGetItem.mockResolvedValue(String(expiredAt));

    const result = await checkSessionValidity();

    expect(result.valid).toBe(false);
    expect(result.expiringSoon).toBe(false);
    expect(result.msUntilExpiry).toBeLessThan(0);
  });

  it('returns valid + expiringSoon when session expires within 5 minutes', async () => {
    const expiresAt = NOW + 3 * 60 * 1_000; // 3 minutes from now
    mockGetItem.mockResolvedValue(String(expiresAt));

    const result = await checkSessionValidity();

    expect(result.valid).toBe(true);
    expect(result.expiringSoon).toBe(true);
    expect(result.msUntilExpiry).toBeCloseTo(3 * 60 * 1_000, -2);
  });

  it('returns valid + not expiringSoon when session has > 5 minutes remaining', async () => {
    const expiresAt = NOW + 30 * 60 * 1_000; // 30 minutes from now
    mockGetItem.mockResolvedValue(String(expiresAt));

    const result = await checkSessionValidity();

    expect(result.valid).toBe(true);
    expect(result.expiringSoon).toBe(false);
  });

  it('treats a session expiring in exactly 5 minutes as expiringSoon', async () => {
    const expiresAt = NOW + 5 * 60 * 1_000 - 1; // 1 ms inside the window
    mockGetItem.mockResolvedValue(String(expiresAt));

    const result = await checkSessionValidity();

    expect(result.expiringSoon).toBe(true);
  });

  it('treats a session expiring in exactly 5 minutes + 1 ms as not expiringSoon', async () => {
    const expiresAt = NOW + 5 * 60 * 1_000 + 1; // 1 ms outside the window
    mockGetItem.mockResolvedValue(String(expiresAt));

    const result = await checkSessionValidity();

    expect(result.expiringSoon).toBe(false);
  });
});
