import axios from 'axios';

export const http = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 12000,
});

export function errorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.message || 'Could not reach the cafe. Check the server and try again.';
  }
  return error instanceof Error ? error.message : 'Something went wrong. Please try again.';
}
