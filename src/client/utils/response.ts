// Response handling utilities

export interface ApiResponse<T = any> {
  message: string;
  data?: T;
}

/**
 * Extracts data from API response
 * Handles both new format {message: "ok", data: any} and old format (direct data)
 */
export function extractData<T>(response: ApiResponse<T> | T): T {
  if (response && typeof response === 'object' && 'message' in response && 'data' in response) {
    return (response as ApiResponse<T>).data as T;
  }
  return response as T;
}

/**
 * Checks if response indicates an error
 */
export function isErrorResponse(response: ApiResponse): boolean {
  return response.message !== 'ok' && response.message !== undefined;
}

