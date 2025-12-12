import { API_BASE_URL, API_ENDPOINTS } from './config';

// Get token from localStorage
const getToken = (): string | null => {
  return localStorage.getItem('token');
};

// API Error class
export class APIError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'APIError';
  }
}

// Base fetch wrapper with auth
async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  // Handle non-JSON responses
  const contentType = response.headers.get('content-type');
  const isJson = contentType?.includes('application/json');

  if (!response.ok) {
    const errorData = isJson ? await response.json() : { message: response.statusText };
    throw new APIError(response.status, errorData.message || errorData.error || 'An error occurred');
  }

  // Handle empty responses (204 No Content)
  if (response.status === 204) {
    return {} as T;
  }

  if (!isJson) {
    return {} as T;
  }

  // Parse response
  const data = await response.json();
  
  // Backend returns { success: true, data: [...] }
  // Unwrap and return just the data
  if (data && typeof data === 'object' && 'data' in data) {
    return data.data as T;
  }
  
  return data as T;
}

// Auth API
export const authAPI = {
  login: async (username: string, password: string) => {
    return apiFetch<{
      token: string;
      user: {
        userId: number;  // Changed from id to userId
        username: string;
        role: string;
        fullName: string;  // Changed from full_name to fullName
        email?: string;
      };
    }>(API_ENDPOINTS.LOGIN, {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
  },

  logout: async () => {
    return apiFetch(API_ENDPOINTS.LOGOUT, {
      method: 'POST',
    });
  },
};

// Admin API
export const adminAPI = {
  registerTenant: async (tenantData: {
    username: string;
    password: string;
    full_name: string;
    email: string;
    contact_number: string;
    room_id: number;
  }) => {
    return apiFetch<{ message: string; tenant: any }>(API_ENDPOINTS.ADMIN_REGISTER_TENANT, {
      method: 'POST',
      body: JSON.stringify(tenantData),
    });
  },

  getTenants: async () => {
    return apiFetch<any[]>(API_ENDPOINTS.ADMIN_GET_TENANTS);
  },

  updateTenant: async (tenantId: number, updates: any) => {
    return apiFetch(
      API_ENDPOINTS.ADMIN_UPDATE_TENANT.replace(':id', tenantId.toString()),
      {
        method: 'PUT',
        body: JSON.stringify(updates),
      }
    );
  },

  deleteTenant: async (tenantId: number) => {
    return apiFetch(
      API_ENDPOINTS.ADMIN_DELETE_TENANT.replace(':id', tenantId.toString()),
      {
        method: 'DELETE',
      }
    );
  },

  approveVisitor: async (visitorId: number) => {
    return apiFetch(
      API_ENDPOINTS.ADMIN_APPROVE_VISITOR.replace(':id', visitorId.toString()),
      {
        method: 'PUT',
      }
    );
  },

  rejectVisitor: async (visitorId: number, reason?: string) => {
    return apiFetch(
      API_ENDPOINTS.ADMIN_REJECT_VISITOR.replace(':id', visitorId.toString()),
      {
        method: 'PUT',
        body: JSON.stringify({ reason }),
      }
    );
  },

  getRooms: async () => {
    return apiFetch<any[]>(API_ENDPOINTS.GET_ROOMS);
  },
};

// Tenant API
export const tenantAPI = {
  getProfile: async () => {
    return apiFetch<any>(API_ENDPOINTS.TENANT_PROFILE);
  },

  registerVisitor: async (visitorData: {
    full_name: string;
    contact_number: string;
    purpose: string;
    expected_date: string;
    expected_time: string;
  }) => {
    return apiFetch<{ message: string; visitor: any }>(API_ENDPOINTS.TENANT_REGISTER_VISITOR, {
      method: 'POST',
      body: JSON.stringify(visitorData),
    });
  },

  getVisitors: async () => {
    return apiFetch<any[]>(API_ENDPOINTS.TENANT_GET_VISITORS);
  },

  updateVisitor: async (visitorId: number, updates: any) => {
    return apiFetch(
      API_ENDPOINTS.TENANT_UPDATE_VISITOR.replace(':id', visitorId.toString()),
      {
        method: 'PUT',
        body: JSON.stringify(updates),
      }
    );
  },

  deleteVisitor: async (visitorId: number) => {
    return apiFetch(
      API_ENDPOINTS.TENANT_DELETE_VISITOR.replace(':id', visitorId.toString()),
      {
        method: 'DELETE',
      }
    );
  },
};

// Visitor API
export const visitorAPI = {
  getAllVisitors: async () => {
    return apiFetch<any[]>(API_ENDPOINTS.GET_ALL_VISITORS);
  },

  getVisitor: async (visitorId: number) => {
    return apiFetch<any>(API_ENDPOINTS.GET_VISITOR.replace(':id', visitorId.toString()));
  },
};

// Visitor Log API
export const visitorLogAPI = {
  getVisitorLogs: async () => {
    return apiFetch<any[]>(API_ENDPOINTS.GET_VISITOR_LOGS);
  },

  checkinVisitor: async (visitorId: number, processedBy: number) => {
    return apiFetch<{ message: string; log: any }>(API_ENDPOINTS.CHECKIN_VISITOR, {
      method: 'POST',
      body: JSON.stringify({ visitor_id: visitorId, processed_by: processedBy }),
    });
  },

  checkoutVisitor: async (logId: number) => {
    return apiFetch(API_ENDPOINTS.CHECKOUT_VISITOR, {
      method: 'POST',
      body: JSON.stringify({ log_id: logId }),
    });
  },
};