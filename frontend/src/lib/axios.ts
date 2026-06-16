import axios from 'axios';

export const AxiosInstance = axios.create({
  url: process.env.NEXT_PUBLIC_API_PREFIX,
  headers: {
    Accept: 'application/json',
  },
  withCredentials: true,
});
