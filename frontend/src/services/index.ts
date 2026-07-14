import { api } from './api';
import { API_BASE_URL } from '../constants/theme';
import type { Sighting, IdentifyResult, PaginatedData, ApiResponse, DashboardStats, PendingVerification } from '../types';

// ── Dashboard ─────────────────────────────────────────────────────────────────
export const dashboardService = {
  getStats: async (): Promise<DashboardStats> => {
    const res = await api.get<ApiResponse<DashboardStats>>('/dashboard/stats');
    return res.data.data!;
  },
  getSpeciesBreakdown: async () => {
    const res = await api.get('/dashboard/species-breakdown');
    return res.data.data;
  },
  getSightingTrend: async () => {
    const res = await api.get('/dashboard/sighting-trend');
    return res.data.data;
  },
  getReturnRate: async () => {
    const res = await api.get('/dashboard/return-rate');
    return res.data.data;
  },
};

// ── Sightings ─────────────────────────────────────────────────────────────────
export const sightingService = {
  getAll: async (page = 1, limit = 20): Promise<PaginatedData<Sighting>> => {
    const res = await api.get<ApiResponse<PaginatedData<Sighting>>>('/sightings', { params: { page, limit } });
    return res.data.data!;
  },

  getRecent: async (limit = 10): Promise<Sighting[]> => {
    const res = await api.get<ApiResponse<Sighting[]>>('/sightings/recent', { params: { limit } });
    return res.data.data!;
  },

  identify: async (imageUri: string, meta?: {
    location?: string;
    latitude?: number;
    longitude?: number;
    sightingDate?: string;
    notes?: string;
    image_side?: 'AUTO' | 'LEFT' | 'RIGHT';
  }): Promise<IdentifyResult> => {
    const formData = new FormData();
    formData.append('image', {
      uri: imageUri,
      name: 'turtle_image.jpg',
      type: 'image/jpeg',
    } as unknown as Blob);

    if (meta?.location)    formData.append('location',    meta.location);
    if (meta?.latitude  != null) formData.append('latitude',  String(meta.latitude));
    if (meta?.longitude != null) formData.append('longitude', String(meta.longitude));
    if (meta?.sightingDate)  formData.append('sightingDate', meta.sightingDate);
    if (meta?.notes)       formData.append('notes',       meta.notes);
    if (meta?.image_side)  formData.append('image_side',  meta.image_side);

    return new Promise((resolve, reject) => {
      console.log(`[FrontendAPI] POST /sightings/identify initiated via XHR. Image: ${imageUri}`);
      
      const xhr = new XMLHttpRequest();
      xhr.open('POST', `${API_BASE_URL}/sightings/identify`);
      xhr.timeout = 120000; // 120 second timeout for Render free tier cold start

      
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const data = JSON.parse(xhr.responseText);
            console.log(`[FrontendAPI] POST /sightings/identify success. Type: ${data.data?.type}`);
            resolve(data.data);
          } catch (e) {
            reject(new Error('Invalid response format'));
          }
        } else {
          let errorMsg = `Server Error ${xhr.status}. The ML Cloud Service might be waking up or unavailable.`;

          try {
            const errorData = JSON.parse(xhr.responseText);
            errorMsg = errorData.error || errorData.message || errorMsg;
          } catch (e) {}
          reject(new Error(errorMsg));
        }
      };
      
      xhr.onerror = () => reject(new Error('Network upload failed. Check your internet connection.'));
      xhr.ontimeout = () => reject(new Error('Request timed out! The ML Cloud Server is either asleep or overwhelmed. Please try again.'));

      
      xhr.send(formData);
    });
  },

  createManual: async (data: {
    turtleId: string;
    imageUrl: string;
    location?: string;
    latitude?: number;
    longitude?: number;
    sightingDate?: string;
    notes?: string;
    confidenceScore?: number;
  }) => {
    console.log(`[FrontendAPI] POST /sightings (manual) for Turtle ID: ${data.turtleId}`);
    const res = await api.post('/sightings', data);
    console.log(`[FrontendAPI] POST /sightings (manual) success. Sighting ID: ${res.data.data?._id}`);
    return res.data.data;
  }
};

// ── Turtles ───────────────────────────────────────────────────────────────────
export const turtleService = {
  create: async (data: {
    species: string;
    gender?: string;
    birthLocation?: string;
    birthDate?: string;
    firstSightingDate: string;
    notes?: string;
    imageUrl: string; // The temp imageUrl from identify
  }) => {
    console.log(`[FrontendAPI] POST /turtles initiated for Species: ${data.species}`);
    const res = await api.post('/turtles', data);
    console.log(`[FrontendAPI] POST /turtles success. Turtle ID: ${res.data.data?.turtleId}`);
    return res.data.data;
  }
};

// ── Pending ───────────────────────────────────────────────────────────────────
export const pendingService = {
  getAll: async (status?: string, page = 1, limit = 20): Promise<PaginatedData<PendingVerification>> => {
    const res = await api.get<ApiResponse<PaginatedData<PendingVerification>>>('/pending', {
      params: { status, page, limit },
    });
    return res.data.data!;
  },

  getById: async (id: string): Promise<PendingVerification> => {
    const res = await api.get<ApiResponse<PendingVerification>>(`/pending/${id}`);
    return res.data.data!;
  },

  approve: async (id: string, data: {
    turtleId?: string;
    species?: string;
    gender?: string;
    birthLocation?: string;
    notes?: string;
  }) => {
    const res = await api.post(`/pending/${id}/approve`, data);
    return res.data.data;
  },

  reject: async (id: string) => {
    const res = await api.post(`/pending/${id}/reject`);
    return res.data.data;
  },
};
