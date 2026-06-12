import axios, { AxiosError } from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import { env } from '../config/env';
import type { IMLIdentifyResponse, IMLRegisterRequest } from '../types';

const mlClient = axios.create({
  baseURL: env.ML_SERVICE_URL,
  timeout: 30000,
});

export class MLService {
  /**
   * Send an image to the ML service for identification.
   * Returns matches against existing turtles in the FAISS index.
   */
  static async identify(imagePath: string, topK = 5): Promise<IMLIdentifyResponse> {
    const form = new FormData();
    form.append('file', fs.createReadStream(imagePath));
    form.append('top_k', topK.toString());

    const response = await mlClient.post<IMLIdentifyResponse>('/ml/identify', form, {
      headers: form.getHeaders(),
    });

    return response.data;
  }

  /**
   * Register a new turtle's embedding into the FAISS index.
   */
  static async register(params: IMLRegisterRequest): Promise<{ success: boolean }> {
    const form = new FormData();
    form.append('turtle_id', params.turtleId);

    if (params.imagePath) {
      form.append('file', fs.createReadStream(params.imagePath));
    }
    if (params.embeddingVector) {
      form.append('embedding_vector', JSON.stringify(params.embeddingVector));
    }

    const response = await mlClient.post('/ml/register', form, {
      headers: form.getHeaders(),
    });

    return response.data;
  }

  /**
   * Remove a turtle's embedding from the FAISS index.
   */
  static async removeEmbedding(turtleId: string): Promise<{ success: boolean }> {
    const response = await mlClient.delete(`/ml/embeddings/${turtleId}`);
    return response.data;
  }

  /**
   * Check ML service health.
   */
  static async healthCheck(): Promise<boolean> {
    try {
      await mlClient.get('/ml/health', { timeout: 5000 });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Phase 2 Stub: Predict when a turtle will return.
   */
  static async predictReturn(_turtleId: string): Promise<{
    predictedReturnYear: null;
    confidence: null;
    status: string;
  }> {
    return {
      predictedReturnYear: null,
      confidence: null,
      status: 'not_implemented',
    };
  }
}
