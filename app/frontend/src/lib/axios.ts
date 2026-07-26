import axios from 'axios';

export const axiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_PREFIX ?? '/api',
  headers: {
    Accept: 'application/json',
  },
  withCredentials: true,
});
