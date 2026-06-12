import { api } from './api';
import type { Turtle, PaginatedData, ApiResponse } from '../types';

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
    const res = await api.post<ApiResponse<Turtle>>('/turtles', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data.data!;
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
