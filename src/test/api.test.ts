import { describe, it, expect, vi, beforeEach } from 'vitest';
import { apiGet, apiPost, apiPut, apiDelete } from '../lib/api';
import * as authStorage from '../lib/auth-storage';

// We must mock fetch because mocking a function in the same module it is imported from
// isn't straightforward without complex setup, so we mock the fetch layer itself.
const mockFetch = vi.fn();
global.fetch = mockFetch;

vi.mock('../lib/auth-storage', () => ({
  getToken: vi.fn(),
  clearToken: vi.fn(),
}));

describe('API Wrappers (apiGet, apiPost, apiPut, apiDelete)', () => {
  beforeEach(() => {
    mockFetch.mockReset();
    vi.mocked(authStorage.getToken).mockReturnValue('mock-token');
  });

  describe('apiGet', () => {
    it('should return data on successful GET request', async () => {
      const mockData = { id: 1, name: 'Test' };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockData,
      });

      const result = await apiGet('/test-endpoint');

      expect(result).toEqual(mockData);
      expect(mockFetch).toHaveBeenCalledWith('/api/test-endpoint', expect.objectContaining({
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer mock-token'
        }
      }));
    });

    it('should throw error on failed GET request', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: async () => ({ error: 'Resource not found' }),
      });

      await expect(apiGet('/test-endpoint')).rejects.toThrow('Resource not found');
    });

    it('should correctly pass additional RequestInit options', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({}),
      });

      await apiGet('/test-endpoint', { headers: { 'X-Custom-Header': 'CustomValue' } });

      expect(mockFetch).toHaveBeenCalledWith('/api/test-endpoint', expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          'X-Custom-Header': 'CustomValue'
        })
      }));
    });
  });

  describe('apiPost', () => {
    it('should return data and serialize body on successful POST request', async () => {
      const requestData = { name: 'New Item' };
      const responseData = { id: 1, name: 'New Item' };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => responseData,
      });

      const result = await apiPost('/test-endpoint', requestData);

      expect(result).toEqual(responseData);
      expect(mockFetch).toHaveBeenCalledWith('/api/test-endpoint', expect.objectContaining({
        method: 'POST',
        body: JSON.stringify(requestData)
      }));
    });

    it('should throw error on failed POST request', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ error: 'Bad request' }),
      });

      await expect(apiPost('/test-endpoint', {})).rejects.toThrow('Bad request');
    });
  });

  describe('apiPut', () => {
    it('should return data and serialize body on successful PUT request', async () => {
      const requestData = { name: 'Updated Item' };
      const responseData = { id: 1, name: 'Updated Item' };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => responseData,
      });

      const result = await apiPut('/test-endpoint', requestData);

      expect(result).toEqual(responseData);
      expect(mockFetch).toHaveBeenCalledWith('/api/test-endpoint', expect.objectContaining({
        method: 'PUT',
        body: JSON.stringify(requestData)
      }));
    });

    it('should throw error on failed PUT request', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ error: 'Server error' }),
      });

      await expect(apiPut('/test-endpoint', {})).rejects.toThrow('Server error');
    });
  });

  describe('apiDelete', () => {
    it('should return data on successful DELETE request', async () => {
      const responseData = { success: true };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => responseData,
      });

      const result = await apiDelete('/test-endpoint');

      expect(result).toEqual(responseData);
      expect(mockFetch).toHaveBeenCalledWith('/api/test-endpoint', expect.objectContaining({
        method: 'DELETE'
      }));
    });

    it('should throw error on failed DELETE request', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
        json: async () => ({ error: 'Forbidden' }),
      });

      await expect(apiDelete('/test-endpoint')).rejects.toThrow('Forbidden');
    });
  });
});
