/**
 * API Client for EventForge Inventory Backend
 * Handles all HTTP requests to the backend API with event context support
 */

// Get API URL from environment variable
const getApiBaseUrl = () => {
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

// Enums
export type Category = "FURNITURE" | "AV_EQUIPMENT" | "DECOR" | "SUPPLIES" | "FOOD_BEVERAGE" | "OTHER";
export type UnitOfMeasure = "EACH" | "PAIR" | "SET" | "METER" | "BOX" | "PACK" | "HOUR" | "KILOGRAM" | "GRAM" | "LITER" | "MILLILITER" | "SERVING";
export type ItemStatus = "AVAILABLE" | "RESERVED" | "OUT_OF_STOCK" | "MAINTENANCE" | "DAMAGED" | "RETIRED";
export type StorageType = "DRY" | "CHILL" | "FREEZE";
export type WasteReason = "SPOILAGE" | "OVERPRODUCTION" | "DAMAGE" | "CONTAMINATION" | "OTHER";

// === PHASE 2: Supplier Interface ===
export interface Supplier {
  id: string;
  name: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  leadTimeDays?: number;
  notes?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;

  // Optional relations
  items?: Item[];
  _count?: {
    items: number;
  };
}

// === PHASE 2: Item Batch Interface ===
export interface ItemBatch {
  id: string;
  itemId: string;
  lotNumber?: string;
  quantity: number;
  initialQuantity: number;

  // Dates for FIFO ordering
  manufacturedAt?: string;
  receivedAt: string;
  expirationDate?: string;

  // Status
  isOpen: boolean;
  notes?: string;

  createdAt: string;
  updatedAt: string;

  // Optional relations
  item?: Item;
  wasteLogs?: WasteLog[];
}

// === PHASE 2: Waste Log Interface ===
export interface WasteLog {
  id: string;
  itemId: string;
  batchId?: string;
  quantity: number;
  reason: WasteReason;
  notes?: string;
  costImpact?: number;
  createdBy?: string;
  timestamp: string;

  // Optional relations
  item?: Partial<Item>;
  batch?: ItemBatch;
}

// === PHASE 2: Waste Summary Interface ===
export interface WasteSummary {
  totalWaste: number;
  totalCostImpact: number;
  wasteByReason: {
    reason: WasteReason;
    quantity: number;
    costImpact: number;
    count: number;
  }[];
  topWastedItems: {
    itemId: string;
    itemName: string;
    itemSku: string;
    totalQuantity: number;
    totalCostImpact: number;
  }[];
}

export interface AutoCategorizeResponse {
  category: Category;
  confidence: number;
  reasoning: string;
}

export interface Item {
  id: string;
  name: string;
  sku: string;
  category: Category;
  quantity: number;
  unitOfMeasure: UnitOfMeasure;
  unitPrice?: number;
  status: ItemStatus;
  location: string;
  bin?: string;
  description?: string;
  eventId: string;
  lastAudit?: string;

  // === PHASE 2: Food & Beverage Fields ===
  // Perishable Management
  isPerishable: boolean;
  storageType?: StorageType;

  // Procurement
  parLevel?: number;
  reorderPoint?: number;
  supplierId?: string;

  // Compliance
  isAlcohol: boolean;
  abv?: number;
  allergens: string[];

  createdAt: string;
  updatedAt: string;

  // Optional relations
  supplier?: Supplier;
  batches?: ItemBatch[];
  wasteLogs?: WasteLog[];
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
      const errorBody = await response
        .json()
        .catch(() => ({ message: "Request failed" }));
      const error = new Error(
        errorBody.message || `HTTP ${response.status}`
      ) as Error & {
        status?: number;
        data?: unknown;
        retryAfter?: number | string;
      };
      error.status = response.status;
      error.data = errorBody;
      const retryAfterHeader = response.headers.get("retry-after");
      if (retryAfterHeader) {
        const retryNumber = Number(retryAfterHeader);
        error.retryAfter = Number.isNaN(retryNumber)
          ? retryAfterHeader
          : retryNumber;
      }
      throw error;
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

  async semanticSearch(params: {
    query: string;
    limit?: number;
    threshold?: number;
    eventId?: string;
  }): Promise<{ results: Item[]; query: string; count: number }> {
    return this.request<{ results: Item[]; query: string; count: number }>(
      `/api/v1/items/semantic-search`,
      {
        method: "POST",
        body: JSON.stringify(params),
      }
    );
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

  async autoCategorizeItem(data: {
    name: string;
    description?: string;
  }): Promise<AutoCategorizeResponse> {
    return this.request<AutoCategorizeResponse>(`/api/v1/items/auto-categorize`, {
      method: "POST",
      body: JSON.stringify(data),
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

  // === PHASE 2: Suppliers API ===
  async getSuppliers(params?: {
    page?: number;
    limit?: number;
    isActive?: boolean;
    q?: string;
  }): Promise<PaginatedResponse<Supplier>> {
    const filteredParams = Object.entries(params || {}).reduce((acc, [key, value]) => {
      if (value !== undefined && value !== null) {
        acc[key] = String(value);
      }
      return acc;
    }, {} as Record<string, string>);

    const query = new URLSearchParams(filteredParams).toString();
    return this.request<PaginatedResponse<Supplier>>(`/api/v1/suppliers?${query}`);
  }

  async getSupplier(id: string): Promise<Supplier> {
    return this.request<Supplier>(`/api/v1/suppliers/${id}`);
  }

  async createSupplier(
    data: Omit<Supplier, "id" | "createdAt" | "updatedAt">,
    token: string
  ): Promise<Supplier> {
    return this.request<Supplier>(`/api/v1/suppliers`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(data),
    });
  }

  async updateSupplier(
    id: string,
    data: Partial<Omit<Supplier, "id" | "createdAt" | "updatedAt">>,
    token: string
  ): Promise<Supplier> {
    return this.request<Supplier>(`/api/v1/suppliers/${id}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(data),
    });
  }

  async deleteSupplier(id: string, token: string): Promise<{ message: string }> {
    return this.request(`/api/v1/suppliers/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
  }

  // === PHASE 2: Batches API ===
  async createBatch(
    itemId: string,
    data: {
      eventId: string;
      quantity: number;
      lotNumber?: string;
      expirationDate?: string;
      receivedAt?: string;
      manufacturedAt?: string;
      notes?: string;
    },
    token: string
  ): Promise<ItemBatch> {
    return this.request<ItemBatch>(`/api/v1/items/${itemId}/batches`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(data),
    });
  }

  async consumeBatch(
    itemId: string,
    data: {
      eventId: string;
      quantity: number;
    },
    token: string
  ): Promise<{
    itemId: string;
    totalConsumed: number;
    batches: {
      id: string;
      consumed: number;
      remainingQuantity: number;
      isOpen: boolean;
      expirationDate?: string | null;
    }[];
  }> {
    return this.request<{
      itemId: string;
      totalConsumed: number;
      batches: {
        id: string;
        consumed: number;
        remainingQuantity: number;
        isOpen: boolean;
        expirationDate?: string | null;
      }[];
    }>(`/api/v1/items/${itemId}/consume`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(data),
    });
  }

  // === PHASE 2: Waste Logs API ===
  async createWasteLog(
    data: {
      itemId: string;
      eventId: string;
      batchId?: string;
      quantity: number;
      reason: WasteReason;
      notes?: string;
    },
    token: string
  ): Promise<WasteLog> {
    return this.request<WasteLog>(`/api/v1/waste`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(data),
    });
  }

  async getWasteLogs(params?: {
    page?: number;
    limit?: number;
    itemId?: string;
    eventId?: string;
    reason?: WasteReason;
    startDate?: string;
    endDate?: string;
  }): Promise<PaginatedResponse<WasteLog>> {
    const filteredParams = Object.entries(params || {}).reduce((acc, [key, value]) => {
      if (value !== undefined && value !== null) {
        acc[key] = String(value);
      }
      return acc;
    }, {} as Record<string, string>);

    const query = new URLSearchParams(filteredParams).toString();
    return this.request<PaginatedResponse<WasteLog>>(`/api/v1/waste?${query}`);
  }

  async getWasteSummary(params?: {
    eventId?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<WasteSummary> {
    const filteredParams = Object.entries(params || {}).reduce((acc, [key, value]) => {
      if (value !== undefined && value !== null) {
        acc[key] = String(value);
      }
      return acc;
    }, {} as Record<string, string>);

    const query = new URLSearchParams(filteredParams).toString();
    return this.request<WasteSummary>(`/api/v1/waste/summary?${query}`);
  }
}

export const api = new ApiClient(API_BASE_URL);
