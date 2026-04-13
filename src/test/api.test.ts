import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { apiRequest, apiGet, apiPost, apiPut, apiDelete } from '../lib/api';
import * as authStorage from '../lib/auth-storage';

// Mock the auth storage to prevent localStorage issues in tests
vi.mock('../lib/auth-storage', () => ({
  getToken: vi.fn(() => 'mock-token'),
  clearToken: vi.fn(),
}));

describe('API utility error handling', () => {
  const mockEndpoint = '/test-endpoint';

  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Restore fetch after each test to prevent test pollution
    vi.restoreAllMocks();
  });

  describe('apiRequest', () => {
    it('should handle standard Error thrown by fetch', async () => {
      const errorMessage = 'Failed to fetch due to network issues';
      vi.spyOn(global, 'fetch').mockRejectedValue(new Error(errorMessage));

      const result = await apiRequest(mockEndpoint);

      expect(result).toEqual({
        ok: false,
        status: 0,
        error: {
          error: `Network error: ${errorMessage}`,
        },
      });
      expect(global.fetch).toHaveBeenCalledWith(`/api${mockEndpoint}`, expect.any(Object));
    });

    it('should handle non-Error thrown by fetch (Unknown error)', async () => {
      vi.spyOn(global, 'fetch').mockRejectedValue('Some weird string error');

      const result = await apiRequest(mockEndpoint);

      expect(result).toEqual({
        ok: false,
        status: 0,
        error: {
          error: 'Network error: Unknown error',
        },
      });
      expect(global.fetch).toHaveBeenCalledWith(`/api${mockEndpoint}`, expect.any(Object));
    });

    it('should handle non-Error object thrown by fetch (Unknown error)', async () => {
      vi.spyOn(global, 'fetch').mockRejectedValue({ some: 'object' });

      const result = await apiRequest(mockEndpoint);

      expect(result).toEqual({
        ok: false,
        status: 0,
        error: {
          error: 'Network error: Unknown error',
        },
      });
      expect(global.fetch).toHaveBeenCalledWith(`/api${mockEndpoint}`, expect.any(Object));
    });
  });

  describe('Wrapper functions error handling (apiGet, apiPost, etc.)', () => {
    it('apiGet should throw an error when fetch fails', async () => {
      const errorMessage = 'Network issue';
      vi.spyOn(global, 'fetch').mockRejectedValue(new Error(errorMessage));

      await expect(apiGet(mockEndpoint)).rejects.toThrow(`Network error: ${errorMessage}`);
    });

    it('apiPost should throw an error when fetch fails', async () => {
      const errorMessage = 'Network issue';
      vi.spyOn(global, 'fetch').mockRejectedValue(new Error(errorMessage));

      await expect(apiPost(mockEndpoint, { data: 123 })).rejects.toThrow(`Network error: ${errorMessage}`);
    });

    it('apiPut should throw an error when fetch fails', async () => {
      const errorMessage = 'Network issue';
      vi.spyOn(global, 'fetch').mockRejectedValue(new Error(errorMessage));

      await expect(apiPut(mockEndpoint, { data: 123 })).rejects.toThrow(`Network error: ${errorMessage}`);
    });

    it('apiDelete should throw an error when fetch fails', async () => {
      const errorMessage = 'Network issue';
      vi.spyOn(global, 'fetch').mockRejectedValue(new Error(errorMessage));

      await expect(apiDelete(mockEndpoint)).rejects.toThrow(`Network error: ${errorMessage}`);
    });
  });
});
