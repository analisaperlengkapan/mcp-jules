
import axios, { AxiosInstance, AxiosError } from 'axios';
import {
  Session,
  CreateSessionRequest,
  ListSessionsResponse,
  ListSourcesResponse,
  Source,
  ListActivitiesResponse,
  Activity,
  CreateSessionResponse,
  SendMessageRequest,
  SessionState
} from './types.js';

const BASE_URL = 'https://jules.googleapis.com/v1alpha';

export class JulesClient {
  private client: AxiosInstance;
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.client = axios.create({
      baseURL: BASE_URL,
      headers: {
        'x-goog-api-key': this.apiKey,
        'Content-Type': 'application/json',
      },
    });
  }

  private async request<T>(method: 'GET' | 'POST' | 'DELETE', path: string, data?: any, params?: any): Promise<T> {
    try {
      const response = await this.client.request<T>({
        method,
        url: path,
        data,
        params,
      });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError<any>;
        console.error(`API Error [${method} ${path}]:`, axiosError.response?.data || axiosError.message);
        throw new Error(`Jules API Error: ${JSON.stringify(axiosError.response?.data || axiosError.message)}`);
      }
      throw error;
    }
  }

  async createSession(request: CreateSessionRequest): Promise<CreateSessionResponse> {
    return this.request<CreateSessionResponse>('POST', '/sessions', request);
  }

  async listSessions(pageSize: number = 20, pageToken?: string): Promise<ListSessionsResponse> {
    return this.request<ListSessionsResponse>('GET', '/sessions', undefined, { pageSize, pageToken });
  }

  async getSession(sessionId: string): Promise<Session> {
     // Handle short IDs or full resource names
     const resourceName = sessionId.startsWith('sessions/') ? sessionId : `sessions/${sessionId}`;
     // Note: "Get Session" isn't explicitly detailed as a simple GET /sessions/{id} in the chunks I saw,
     // but standard Google API patterns usually support GET resource_name.
     // Re-verifying the docs chunks: "Sessions / Get a Session ... Path Parameters ... /sessions/{session}"
     // Yes, it exists.
     return this.request<Session>('GET', `/${resourceName}`);
  }

  async listActivities(sessionId: string, pageSize: number = 50, pageToken?: string): Promise<ListActivitiesResponse> {
    const resourceName = sessionId.startsWith('sessions/') ? sessionId : `sessions/${sessionId}`;
    return this.request<ListActivitiesResponse>('GET', `/${resourceName}/activities`, undefined, { pageSize, pageToken });
  }

  async getActivity(sessionId: string, activityId: string): Promise<Activity> {
    const sessionRes = sessionId.startsWith('sessions/') ? sessionId : `sessions/${sessionId}`;
    // Activity ID might be short "act1" or full "sessions/.../activities/act1"
    // If full, use as is. If short, append.
    const resourceName = activityId.startsWith('sessions/') ? activityId : `${sessionRes}/activities/${activityId}`;
    return this.request<Activity>('GET', `/${resourceName}`);
  }

  async sendMessage(sessionId: string, message: string): Promise<void> {
    const resourceName = sessionId.startsWith('sessions/') ? sessionId : `sessions/${sessionId}`;
    const body: SendMessageRequest = { prompt: message };
    await this.request('POST', `/${resourceName}:sendMessage`, body);
  }

  async approvePlan(sessionId: string): Promise<void> {
    const resourceName = sessionId.startsWith('sessions/') ? sessionId : `sessions/${sessionId}`;
    await this.request('POST', `/${resourceName}:approvePlan`, {});
  }

  async deleteSession(sessionId: string): Promise<void> {
    const resourceName = sessionId.startsWith('sessions/') ? sessionId : `sessions/${sessionId}`;
    await this.request('DELETE', `/${resourceName}`);
  }

  async listSources(pageSize: number = 20, pageToken?: string, filter?: string): Promise<ListSourcesResponse> {
    return this.request<ListSourcesResponse>('GET', '/sources', undefined, { pageSize, pageToken, filter });
  }

  async getSource(sourceId: string): Promise<Source> {
    const resourceName = sourceId.startsWith('sources/') ? sourceId : `sources/${sourceId}`;
    return this.request<Source>('GET', `/${resourceName}`);
  }
}
