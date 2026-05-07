/**
 * Jules API Client Service
 * Handles all HTTP requests to the Jules REST API
 */

import axios, { AxiosInstance, AxiosError } from "axios";
import { JULES_API_BASE_URL, API_KEY_ENV_VAR } from "../constants.js";
import type { ApiError } from "../types.js";

export class JulesApiClient {
  private client: AxiosInstance;
  private apiKey: string;

  constructor() {
    const apiKey = process.env[API_KEY_ENV_VAR];
    if (!apiKey) {
      throw new Error(
        `Missing ${API_KEY_ENV_VAR} environment variable. ` +
          `Get your API key from https://jules.google.com/settings`
      );
    }
    this.apiKey = apiKey;

    this.client = axios.create({
      baseURL: JULES_API_BASE_URL,
      headers: {
        "x-goog-api-key": this.apiKey,
        "Content-Type": "application/json",
      },
      timeout: 30000,
    });
  }

  /**
   * Make a GET request to the Jules API
   */
  async get<T>(
    endpoint: string,
    params?: Record<string, string | number | undefined>
  ): Promise<T> {
    try {
      // Filter out undefined params
      const filteredParams = params
        ? Object.fromEntries(
            Object.entries(params).filter(([, v]) => v !== undefined)
          )
        : undefined;

      const response = await this.client.get<T>(endpoint, {
        params: filteredParams,
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Make a POST request to the Jules API
   */
  async post<T>(endpoint: string, data?: Record<string, unknown>): Promise<T> {
    try {
      const response = await this.client.post<T>(endpoint, data || {});
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Make a DELETE request to the Jules API
   */
  async delete<T>(endpoint: string): Promise<T> {
    try {
      const response = await this.client.delete<T>(endpoint);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Handle and format API errors
   */
  private handleError(error: unknown): Error {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<ApiError>;

      if (axiosError.response) {
        const status = axiosError.response.status;
        const data = axiosError.response.data;

        // Format error message based on status code
        let message: string;

        if (data?.error?.message) {
          message = data.error.message;
        } else {
          switch (status) {
            case 400:
              message = "Bad request - invalid parameters provided";
              break;
            case 401:
              message =
                "Unauthorized - invalid or missing API key. Get your key from https://jules.google.com/settings";
              break;
            case 403:
              message =
                "Forbidden - insufficient permissions to access this resource";
              break;
            case 404:
              message = "Not found - the requested resource doesn't exist";
              break;
            case 429:
              message =
                "Rate limited - too many requests. Please wait and try again";
              break;
            case 500:
              message = "Server error - Jules API is experiencing issues";
              break;
            default:
              message = `HTTP ${status}: ${axiosError.message}`;
          }
        }

        return new Error(`Jules API Error (${status}): ${message}`);
      }

      if (axiosError.code === "ECONNABORTED") {
        return new Error(
          "Request timeout - Jules API took too long to respond"
        );
      }

      if (axiosError.code === "ENOTFOUND") {
        return new Error("Network error - unable to reach Jules API");
      }

      return new Error(`Network error: ${axiosError.message}`);
    }

    if (error instanceof Error) {
      return error;
    }

    return new Error("An unexpected error occurred");
  }
}

// Singleton instance
let clientInstance: JulesApiClient | null = null;

export function getApiClient(): JulesApiClient {
  if (!clientInstance) {
    clientInstance = new JulesApiClient();
  }
  return clientInstance;
}

/**
 * Reset the client instance (useful for testing)
 */
export function resetApiClient(): void {
  clientInstance = null;
}
