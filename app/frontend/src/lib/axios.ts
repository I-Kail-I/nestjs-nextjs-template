import axios from 'axios';

/**
 * Shared Axios instance for all API requests from the frontend.
 *
 * @remarks
 * - Requests are sent to `NEXT_PUBLIC_API_PREFIX`, falling back to `/api`.
 * - Cookies are sent cross-origin via `withCredentials`, so the API must allow
 *   credentials from the frontend origin.
 * - Requests time out after 5 seconds.
 */
export const axiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_PREFIX ?? '/api',
  headers: {
    Accept: 'application/json',
  },
  withCredentials: true,
  timeout: 5000,
});
