import { api } from './api';
import type { Turtle, PaginatedData, ApiResponse } from '../types';
import { API_BASE_URL } from '../constants/theme';

export const turtleService = {
  getAll: async (params?: {
    page?: number;
    limit?: number;
    species?: string;
    gender?: string;
    search?: string;
    sortBy?: string;
  }): Promise<PaginatedData<Turtle>> => {
    const res = await api.get<ApiResponse<PaginatedData<Turtle>>>('/turtles', { params });
    return res.data.data!;
  },

  getById: async (id: string): Promise<Turtle> => {
    const res = await api.get<ApiResponse<Turtle>>(`/turtles/${id}`);
    return res.data.data!;
  },

  create: async (formData: FormData): Promise<Turtle> => {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', `${API_BASE_URL}/turtles`);
      
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const data = JSON.parse(xhr.responseText);
            resolve(data.data);
          } catch (e) {
            reject(new Error('Invalid response format'));
          }
        } else {
          let errorMsg = `Server Error ${xhr.status}`;
          try {
            const errorData = JSON.parse(xhr.responseText);
            errorMsg = errorData.error || errorData.message || errorMsg;
          } catch (e) {}
          reject(new Error(errorMsg));
        }
      };
      
      xhr.onerror = () => reject(new Error('Network request failed (Check your internet connection)'));
      xhr.ontimeout = () => reject(new Error('Request timed out'));
      
      xhr.send(formData);
    });
  },

  update: async (id: string, data: Partial<Turtle>): Promise<Turtle> => {
    const res = await api.put<ApiResponse<Turtle>>(`/turtles/${id}`, data);
    return res.data.data!;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/turtles/${id}`);
  },

  getSightings: async (id: string, page = 1, limit = 20) => {
    const res = await api.get(`/turtles/${id}/sightings`, { params: { page, limit } });
    return res.data.data;
  },
};
