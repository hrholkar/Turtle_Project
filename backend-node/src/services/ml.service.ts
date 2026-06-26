import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import { env } from '../config/env';
import type {
  IMLIdentifyResponse,
  IMLRegisterRequest,
  IMLPredictResponse,
  IMLPredictMatchedResponse,
  IMLPredictNewTurtleResponse,
  ImageSide,
} from '../types';

const mlClient = axios.create({
  baseURL: env.ML_SERVICE_URL,
  timeout: 60_000,   // 60 s — embedding extraction can take time on CPU
});

export class MLService {
  // ── v2 — Primary identification endpoint ─────────────────────────────────

  /**
   * Identify a turtle using the v2 pipeline:
   *   image → side detection → species prediction → filtered FAISS → top-3
   *
   * @param imagePath  Absolute path to the uploaded image file.
   * @param imageSide  "AUTO" | "LEFT" | "RIGHT"  (default "AUTO")
   */
  static async predict(
    imagePath: string,
    imageSide: ImageSide = 'AUTO',
  ): Promise<IMLPredictResponse> {
    const form = new FormData();
    form.append('image', fs.createReadStream(imagePath));
    form.append('image_side', imageSide);

    const response = await mlClient.post<IMLPredictResponse>('/predict', form, {
      headers: form.getHeaders(),
    });

    return response.data;
  }

  /**
   * Register a new turtle into the live FAISS index without retraining.
   */
  static async registerNewTurtle(params: {
    imagePath: string;
    identity:  string;
    species:   string;
    imageSide?: ImageSide;
    location?: string;
    year?:     number;
  }): Promise<{ success: boolean; identity: string; faiss_idx: number; side: string }> {
    const form = new FormData();
    form.append('image',      fs.createReadStream(params.imagePath));
    form.append('identity',   params.identity);
    form.append('species',    params.species);
    form.append('image_side', params.imageSide ?? 'AUTO');
    if (params.location) form.append('location', params.location);
    if (params.year)     form.append('year',     params.year.toString());

    const response = await mlClient.post('/register_new_turtle', form, {
      headers: form.getHeaders(),
    });
    return response.data;
  }

  // ── v2 helpers ─────────────────────────────────────────────────────────────

  /**
   * Adapts v2 /predict response to the v1 IMLIdentifyResponse shape
   * so that existing SightingService code continues to work without changes.
   */
  static adaptToV1Response(v2: IMLPredictResponse): IMLIdentifyResponse {
    if (v2.matched) {
      const m = v2 as IMLPredictMatchedResponse;
      const matches = m.top_matches.map((t, i) => ({
        turtleId: t.identity,
        score:    parseFloat((t.similarity / 100).toFixed(4)),   // back to 0-1
        rank:     i + 1,
      }));
      const topScore = matches[0]?.score ?? 0;
      return {
        matches,
        topScore,
        isNewTurtle:      false,
        matchStrength:    topScore >= 0.85 ? 'strong' : 'probable',
        processingTimeMs: 0,
        embeddingVector:  undefined,
      };
    }

    // new turtle
    const nm = v2 as IMLPredictNewTurtleResponse;
    return {
      matches:          [],
      topScore:         0,
      isNewTurtle:      true,
      matchStrength:    'new',
      processingTimeMs: 0,
      embeddingVector:  undefined,
    };
  }

  // ── v1 legacy — kept for backward compat ──────────────────────────────────

  /**
   * @deprecated Use MLService.predict() instead.
   */
  static async identify(imagePath: string, topK = 5): Promise<IMLIdentifyResponse> {
    const form = new FormData();
    form.append('file',  fs.createReadStream(imagePath));
    form.append('top_k', topK.toString());

    const response = await mlClient.post<IMLIdentifyResponse>('/ml/identify', form, {
      headers: form.getHeaders(),
    });
    return response.data;
  }

  static async register(params: IMLRegisterRequest): Promise<{ success: boolean }> {
    const form = new FormData();
    form.append('turtle_id', params.turtleId);
    if (params.imagePath)      form.append('file',             fs.createReadStream(params.imagePath));
    if (params.embeddingVector) form.append('embedding_vector', JSON.stringify(params.embeddingVector));

    const response = await mlClient.post('/ml/register', form, {
      headers: form.getHeaders(),
    });
    return response.data;
  }

  static async removeEmbedding(turtleId: string): Promise<{ success: boolean }> {
    const response = await mlClient.delete(`/ml/embeddings/${turtleId}`);
    return response.data;
  }

  static async healthCheck(): Promise<boolean> {
    try {
      await mlClient.get('/ml/health', { timeout: 5_000 });
      return true;
    } catch {
      return false;
    }
  }

  /** @deprecated */
  static async predictReturn(_turtleId: string) {
    return { predictedReturnYear: null, confidence: null, status: 'not_implemented' };
  }
}
