import { z } from 'zod';

/**
 * Base API configuration
 */
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

/**
 * HTTP request methods
 */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

/**
 * Options for API requests
 */
export interface RequestOptions {
  method?: HttpMethod;
  headers?: HeadersInit;
  body?: unknown;
  cache?: RequestCache;
  credentials?: RequestCredentials;
}

/**
 * API response type
 */
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  statusCode: number;
}

/**
 * Generic API request function
 */
export async function apiRequest<T>(
  endpoint: string, 
  options: RequestOptions = {}
): Promise<ApiResponse<T>> {
  const { method = 'GET', headers = {}, body, ...restOptions } = options;
  
  try {
    const requestHeaders: HeadersInit = {
      'Content-Type': 'application/json',
      ...headers,
    };

    // Create the request options object
    const requestOptions: RequestInit = {
      method,
      headers: requestHeaders,
      ...restOptions,
    };
    
    // Add body conditionally
    if (body !== undefined) {
      requestOptions.body = JSON.stringify(body);
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, requestOptions);
    const statusCode = response.status;
    
    // Handle non-JSON responses
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const responseData = await response.json();
      
      if (response.ok) {
        return { data: responseData, statusCode };
      } else {
        return { 
          error: responseData.message || 'An error occurred', 
          statusCode 
        };
      }
    } else {
      // Handle non-JSON responses (like text)
      if (response.ok) {
        const textData = await response.text();
        return { data: textData as unknown as T, statusCode };
      } else {
        return { 
          error: `Request failed with status ${statusCode}`, 
          statusCode 
        };
      }
    }
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'Network error',
      statusCode: 500
    };
  }
}

/**
 * Convenience methods for common HTTP verbs
 */
export const api = {
  get: <T>(endpoint: string, options?: Omit<RequestOptions, 'method' | 'body'>) => 
    apiRequest<T>(endpoint, { ...options, method: 'GET' }),
    
  post: <T>(endpoint: string, data?: unknown, options?: Omit<RequestOptions, 'method'>) => 
    apiRequest<T>(endpoint, { ...options, method: 'POST', body: data }),
    
  put: <T>(endpoint: string, data?: unknown, options?: Omit<RequestOptions, 'method'>) => 
    apiRequest<T>(endpoint, { ...options, method: 'PUT', body: data }),
    
  patch: <T>(endpoint: string, data?: unknown, options?: Omit<RequestOptions, 'method'>) => 
    apiRequest<T>(endpoint, { ...options, method: 'PATCH', body: data }),
    
  delete: <T>(endpoint: string, options?: Omit<RequestOptions, 'method'>) => 
    apiRequest<T>(endpoint, { ...options, method: 'DELETE' }),
};

/**
 * Example of creating a typed API client with Zod schema validation
 */
export function createApiClient<Schema extends z.ZodType>(
  endpoint: string, 
  schema: Schema
) {
  type ResponseType = z.infer<Schema>;
  
  return {
    getAll: async (options?: Omit<RequestOptions, 'method'>) => {
      const response = await api.get<ResponseType>(endpoint, options);
      if (response.data) {
        try {
          schema.parse(response.data);
        } catch (error) {
          console.error('API response validation failed:', error);
        }
      }
      return response;
    },
    
    getById: async (id: string | number, options?: Omit<RequestOptions, 'method'>) => {
      return api.get<ResponseType>(`${endpoint}/${id}`, options);
    },
    
    create: async (data: z.input<Schema>, options?: Omit<RequestOptions, 'method'>) => {
      return api.post<ResponseType>(endpoint, data, options);
    },
    
    update: async (id: string | number, data: z.input<Schema>, options?: Omit<RequestOptions, 'method'>) => {
      return api.put<ResponseType>(`${endpoint}/${id}`, data, options);
    },
    
    remove: async (id: string | number, options?: Omit<RequestOptions, 'method'>) => {
      return api.delete<ResponseType>(`${endpoint}/${id}`, options);
    }
  };
}

// -----------------------------------------------------
// USAGE GUIDE
// -----------------------------------------------------

/*
HOW TO USE THIS API UTILITY:

1. Basic GET Request:
   
   import { api } from '@/utils/api';
   
   // Fetch data from an endpoint
   const fetchData = async () => {
     const response = await api.get('/endpoint');
     
    if (response.data) {
       // Success - use the data
       console.log(response.data);
       return response.data;
     } else {
       // Handle error
       console.error(response.error);
       return null;
     }
   };

2. POST Request:
   
   import { api } from '@/utils/api';
   
   // Send data to an endpoint
   const createItem = async (data) => {
     const response = await api.post('/endpoint', data);
     return response;
   };

3. Using with TypeScript:
   
   import { api } from '@/utils/api';
   
   interface User {
     id: number;
     name: string;
     email: string;
   }
   
   // Fetch with type safety
   const getUsers = async () => {
     const response = await api.get<User[]>('/users');
     return response.data; // This will be typed as User[] | undefined
   };

4. Using Zod Validation:
   
   import { z } from 'zod';
   import { createApiClient } from '@/utils/api';
   
   // Define a schema
   const UserSchema = z.object({
     id: z.number(),
     name: z.string(),
     email: z.string().email()
   });
   
   // Create API client
   const usersApi = createApiClient('/users', UserSchema);
   
   // Use the client
   const user = await usersApi.getById(1);
*/
