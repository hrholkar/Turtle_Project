import axios from 'axios';
import { API_BASE_URL } from '../constants/theme';

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

// ── Response interceptor: unwrap data ────────────────────────────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.error ||
      error.response?.data?.message ||
      error.message ||
      'Network error';
    return Promise.reject(new Error(message));
  }
);
