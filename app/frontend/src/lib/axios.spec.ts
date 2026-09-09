import { describe, expect, it } from 'bun:test';
import { axiosInstance } from './axios';

describe('axiosInstance', () => {
  it('has 5s timeout', () => {
    expect(axiosInstance.defaults.timeout).toBe(5000);
  });

  it('sends credentials cross-origin', () => {
    expect(axiosInstance.defaults.withCredentials).toBe(true);
  });

  it('requests JSON by default', () => {
    expect(axiosInstance.defaults.headers.Accept).toBe('application/json');
  });

  it('has non-empty baseURL string', () => {
    expect(typeof axiosInstance.defaults.baseURL).toBe('string');
    expect(axiosInstance.defaults.baseURL?.length).toBeGreaterThan(0);
  });
});
