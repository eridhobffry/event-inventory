/**
 * API Client for EventForge Inventory Backend
 * Handles all HTTP requests to the backend API with event context support
 */

// Dynamically determine API URL based on current host
const getApiBaseUrl = () => {
  if (typeof window !== "undefined") {
    const currentHost = window.location.hostname;
    return `http://${currentHost}:3001`;
  }
  return process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
};

const API_BASE_URL = getApiBaseUrl();

export interface ApiResponse<T = unknown> {
  data: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface Item {
  id: string;
  name: string;
  category: "FURNITURE" | "AV_EQUIPMENT" | "DECOR" | "SUPPLIES" | "OTHER";
  quantity: number;
  location: string;
  description?: string;
  eventId: string;
  lastAudit?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuditLog {
  id: string;
  itemId: string;
  eventId: string;
  actualQuantity: number;
  expectedQuantity: number;
  discrepancy: number;
  notes?: string;
  contextId?: string;
  timestamp: string;
  item?: Partial<Item>;
}

export interface ApiKey {
  id: string;
  name: string;
  key?: string; // Only present when creating
  lastUsed?: string;
  createdAt: string;
  expiresAt?: string;
  isActive: boolean;
}

// Simple axios-like API client
class SimpleApiClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  private async request(
    url: string,
    options: RequestInit = {},
    authToken?: string
  ) {
    // Get current event ID from localStorage
    const eventId =
      typeof window !== "undefined"
        ? localStorage.getItem("eventforge-current-event-id")
        : null;

    const response = await fetch(this.baseURL + url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(eventId && { "x-event-id": eventId }),
        ...(authToken && { Authorization: `Bearer ${authToken}` }),
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ message: "Request failed" }));
      throw { response: { data: error } };
    }

    return { data: await response.json() };
  }

  async get(url: string, options: { headers?: Record<string, string> } = {}) {
    return this.request(url, { method: "GET", headers: options.headers });
  }

  async post(
    url: string,
    data?: unknown,
    options: { headers?: Record<string, string> } = {}
  ) {
    return this.request(url, {
      method: "POST",
      body: JSON.stringify(data),
      headers: options.headers,
    });
  }

  async put(
    url: string,
    data?: unknown,
    options: { headers?: Record<string, string> } = {}
  ) {
    return this.request(url, {
      method: "PUT",
      body: JSON.stringify(data),
      headers: options.headers,
    });
  }

  async delete(
    url: string,
    options: { headers?: Record<string, string> } = {}
  ) {
    return this.request(url, { method: "DELETE", headers: options.headers });
  }

  async patch(
    url: string,
    data?: unknown,
    options: { headers?: Record<string, string> } = {}
  ) {
    return this.request(url, {
      method: "PATCH",
      body: JSON.stringify(data),
      headers: options.headers,
    });
  }
}

export const apiClient = new SimpleApiClient(API_BASE_URL + "/api/v1");

// Legacy class-based API client (for backwards compatibility)
class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    // Get current event ID from localStorage and add to headers
    const eventId =
      typeof window !== "undefined"
        ? localStorage.getItem("eventforge-current-event-id")
        : null;

    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(eventId && { "x-event-id": eventId }),
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ message: "Request failed" }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // Items API
  async getItems(params?: {
    page?: number;
    limit?: number;
    category?: string;
    location?: string;
    q?: string;
    eventId?: string;
  }): Promise<PaginatedResponse<Item>> {
    // Filter out undefined/null values to prevent sending "undefined" as a string
    const filteredParams = Object.entries(params || {}).reduce((acc, [key, value]) => {
      if (value !== undefined && value !== null) {
        acc[key] = String(value);
      }
      return acc;
    }, {} as Record<string, string>);
    
    const query = new URLSearchParams(filteredParams).toString();
    return this.request<PaginatedResponse<Item>>(`/api/v1/items?${query}`);
  }

  async getItem(id: string): Promise<Item> {
    return this.request<Item>(`/api/v1/items/${id}`);
  }

  async createItem(
    data: Omit<Item, "id" | "createdAt" | "updatedAt">,
    token: string
  ): Promise<Item> {
    return this.request<Item>(`/api/v1/items`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(data),
    });
  }

  async updateItem(
    id: string,
    data: Partial<Omit<Item, "id" | "createdAt" | "updatedAt" | "eventId">>,
    token: string
  ): Promise<Item> {
    return this.request<Item>(`/api/v1/items/${id}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(data),
    });
  }

  async deleteItem(id: string, token: string): Promise<{ message: string }> {
    return this.request(`/api/v1/items/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
  }

  // Audit API
  async getAudits(params?: {
    page?: number;
    limit?: number;
    itemId?: string;
    eventId?: string;
    contextId?: string;
  }): Promise<PaginatedResponse<AuditLog>> {
    // Filter out undefined/null values to prevent sending "undefined" as a string
    const filteredParams = Object.entries(params || {}).reduce((acc, [key, value]) => {
      if (value !== undefined && value !== null) {
        acc[key] = String(value);
      }
      return acc;
    }, {} as Record<string, string>);
    
    const query = new URLSearchParams(filteredParams).toString();
    return this.request<PaginatedResponse<AuditLog>>(`/api/v1/audits?${query}`);
  }

  async createAudit(
    data: {
      itemId: string;
      eventId: string;
      actualQuantity: number;
      expectedQuantity: number;
      notes?: string;
      contextId?: string;
    },
    token: string
  ): Promise<AuditLog> {
    return this.request<AuditLog>(`/api/v1/audits`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(data),
    });
  }

  async getAuditStats(eventId?: string): Promise<{
    totalAudits: number;
    auditsLast30Days: number;
    itemsWithDiscrepancies: number;
    averageDiscrepancy: number;
    recentAudits: AuditLog[];
  }> {
    const query = eventId ? `?eventId=${eventId}` : "";
    return this.request(`/api/v1/audits/stats${query}`);
  }

  // API Keys
  async getApiKeys(token: string): Promise<{ data: ApiKey[] }> {
    return this.request<{ data: ApiKey[] }>(`/api/v1/api-keys`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  }

  async createApiKey(
    data: { name: string; expiresInDays?: number },
    token: string
  ): Promise<ApiKey> {
    return this.request<ApiKey>(`/api/v1/api-keys`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(data),
    });
  }

  async deleteApiKey(id: string, token: string): Promise<{ message: string }> {
    return this.request(`/api/v1/api-keys/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
  }

  // Health check
  async healthCheck(): Promise<{
    status: string;
    timestamp: string;
    version: string;
  }> {
    return this.request(`/api/v1/health`);
  }
}

export const api = new ApiClient(API_BASE_URL);
