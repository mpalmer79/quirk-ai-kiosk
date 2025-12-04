/**
 * Quirk AI Kiosk - API Service Layer
 * Handles all communication between frontend components and FastAPI backend
 */

import type { Vehicle, InventoryResponse } from '../types';

// Base API URL - configure based on environment
const API_BASE_URL: string = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

// ============================================
// TYPE DEFINITIONS
// ============================================

interface RequestOptions extends RequestInit {
  headers?: Record<string, string>;
}

interface InventoryFilters {
  model?: string;
  minPrice?: number;
  maxPrice?: number;
  bodyType?: string;
  drivetrain?: string;
  cabType?: string;
  condition?: string;
  sortBy?: string;
  limit?: number;
}

interface TradeInVehicleData {
  vin?: string;
  year: number;
  make: string;
  model: string;
  trim?: string;
  mileage: number;
  condition: 'excellent' | 'good' | 'fair' | 'poor';
}

interface TradeInEstimate {
  estimatedValue: number;
  range: { low: number; high: number };
  adjustments: Record<string, number>;
}

interface LeaseParams {
  vehiclePrice: number;
  downPayment: number;
  tradeInValue?: number;
  term: number;
  moneyFactor: number;
  residualPercent: number;
}

interface FinanceParams {
  vehiclePrice: number;
  downPayment: number;
  tradeInValue?: number;
  term: number;
  apr: number;
}

interface PaymentResult {
  monthlyPayment: number;
  totalCost: number;
  downPayment: number;
  term: number;
}

interface LeadData {
  customerName: string;
  phone: string;
  email?: string;
  vehicleInterest?: Vehicle;
  tradeIn?: TradeInVehicleData;
  paymentPreference?: PaymentResult;
  notes?: string;
}

interface TestDriveData {
  customerName: string;
  phone: string;
  email?: string;
  vehicleStockNumber: string;
  preferredDate?: string;
  preferredTime?: string;
}

interface AnalyticsData {
  event: string;
  data: Record<string, unknown>;
  timestamp: string;
  sessionId: string;
}

interface TrafficSessionData {
  sessionId?: string;
  customerName?: string | null;
  phone?: string;
  path?: string | null;
  vehicleRequested?: boolean;
  actions?: string[];
  vehicle?: Partial<Vehicle>;
  tradeIn?: Partial<TradeInVehicleData & { estimatedValue?: number }>;
  payment?: {
    type?: string;
    monthly?: number;
    term?: number;
    downPayment?: number;
  };
}

interface TrafficLogEntry {
  id: number;
  sessionId: string;
  timestamp: string;
  customerName?: string;
  vehicleViewed?: string;
  actions: string[];
}

interface TrafficStats {
  totalSessions: number;
  todaySessions: number;
  averageSessionLength: number;
  topVehiclesViewed: Array<{ stockNumber: string; views: number }>;
}

interface AIChatRequest {
  message: string;
  inventoryContext: string;
  conversationHistory: Array<{ role: string; content: string }>;
  customerName?: string;
}

interface AIChatResponse {
  message: string;
  suggestedVehicles?: string[];
}

// ============================================
// HELPER FUNCTIONS
// ============================================

// Helper function for API requests
const apiRequest = async <T = unknown>(endpoint: string, options: RequestOptions = {}): Promise<T> => {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const defaultHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  const config: RequestInit = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, config);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `API Error: ${response.status}`);
    }
    
    return await response.json() as T;
  } catch (error) {
    console.error(`API Request Failed: ${endpoint}`, error);
    throw error;
  }
};

/**
 * Get or create session ID
 */
const getSessionId = (): string => {
  let sessionId = sessionStorage.getItem('kiosk_session_id');
  if (!sessionId) {
    sessionId = `K${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
    sessionStorage.setItem('kiosk_session_id', sessionId);
  }
  return sessionId;
};

// ============================================
// INVENTORY ENDPOINTS
// ============================================

/**
 * Get all inventory with optional filters
 */
export const getInventory = async (filters: InventoryFilters = {}): Promise<InventoryResponse | Vehicle[]> => {
  const params = new URLSearchParams();
  
  if (filters.model) params.append('model', filters.model);
  if (filters.minPrice) params.append('min_price', String(filters.minPrice));
  if (filters.maxPrice) params.append('max_price', String(filters.maxPrice));
  if (filters.bodyType) params.append('body_type', filters.bodyType);
  if (filters.drivetrain) params.append('drivetrain', filters.drivetrain);
  if (filters.cabType) params.append('cab_type', filters.cabType);
  if (filters.condition) params.append('condition', filters.condition);
  if (filters.sortBy) params.append('sort_by', filters.sortBy);
  if (filters.limit) params.append('limit', String(filters.limit));
  
  const queryString = params.toString();
  const endpoint = `/inventory${queryString ? `?${queryString}` : ''}`;
  
  return apiRequest<InventoryResponse | Vehicle[]>(endpoint);
};

/**
 * Get vehicle by stock number
 */
export const getVehicleByStock = async (stockNumber: string): Promise<Vehicle> => {
  return apiRequest<Vehicle>(`/inventory/stock/${stockNumber}`);
};

/**
 * Get vehicle by VIN
 */
export const getVehicleByVin = async (vin: string): Promise<Vehicle> => {
  return apiRequest<Vehicle>(`/inventory/vin/${vin}`);
};

/**
 * Search inventory with quiz-based preferences
 */
export const searchByPreferences = async (preferences: Record<string, unknown>): Promise<Vehicle[]> => {
  return apiRequest<Vehicle[]>('/inventory/search', {
    method: 'POST',
    body: JSON.stringify(preferences),
  });
};

/**
 * Get inventory statistics
 */
export const getInventoryStats = async (): Promise<Record<string, unknown>> => {
  return apiRequest<Record<string, unknown>>('/inventory/stats');
};

// ============================================
// TRADE-IN ENDPOINTS
// ============================================

/**
 * Get trade-in estimate
 */
export const getTradeInEstimate = async (vehicleData: TradeInVehicleData): Promise<TradeInEstimate> => {
  return apiRequest<TradeInEstimate>('/trade-in/estimate', {
    method: 'POST',
    body: JSON.stringify(vehicleData),
  });
};

/**
 * Decode VIN for trade-in
 */
export const decodeTradeInVin = async (vin: string): Promise<Partial<TradeInVehicleData>> => {
  return apiRequest<Partial<TradeInVehicleData>>(`/trade-in/decode/${vin}`);
};

/**
 * Request in-person appraisal
 */
export const requestAppraisal = async (tradeInData: TradeInVehicleData & { customerPhone: string }): Promise<{ success: boolean; appointmentId?: string }> => {
  return apiRequest<{ success: boolean; appointmentId?: string }>('/trade-in/appraisal', {
    method: 'POST',
    body: JSON.stringify(tradeInData),
  });
};

// ============================================
// PAYMENT CALCULATION ENDPOINTS
// ============================================

/**
 * Calculate lease payment
 */
export const calculateLease = async (params: LeaseParams): Promise<PaymentResult> => {
  return apiRequest<PaymentResult>('/payments/lease', {
    method: 'POST',
    body: JSON.stringify(params),
  });
};

/**
 * Calculate finance payment
 */
export const calculateFinance = async (params: FinanceParams): Promise<PaymentResult> => {
  return apiRequest<PaymentResult>('/payments/finance', {
    method: 'POST',
    body: JSON.stringify(params),
  });
};

/**
 * Get current rebates and incentives for a vehicle
 */
export const getRebates = async (vehicleId: string): Promise<Array<{ name: string; amount: number }>> => {
  return apiRequest<Array<{ name: string; amount: number }>>(`/payments/rebates/${vehicleId}`);
};

// ============================================
// LEAD / HANDOFF ENDPOINTS
// ============================================

/**
 * Submit customer lead and notify sales team
 */
export const submitLead = async (leadData: LeadData): Promise<{ success: boolean; leadId?: string }> => {
  return apiRequest<{ success: boolean; leadId?: string }>('/leads/handoff', {
    method: 'POST',
    body: JSON.stringify(leadData),
  });
};

/**
 * Schedule test drive
 */
export const scheduleTestDrive = async (appointmentData: TestDriveData): Promise<{ success: boolean; appointmentId?: string }> => {
  return apiRequest<{ success: boolean; appointmentId?: string }>('/leads/test-drive', {
    method: 'POST',
    body: JSON.stringify(appointmentData),
  });
};

/**
 * Send deal summary to customer
 */
export const sendDealSummary = async (phone: string, dealData: Record<string, unknown>): Promise<{ success: boolean }> => {
  return apiRequest<{ success: boolean }>('/leads/send-summary', {
    method: 'POST',
    body: JSON.stringify({ phone, dealData }),
  });
};

// ============================================
// VEHICLE DATA ENDPOINTS
// ============================================

/**
 * Get available makes
 */
export const getMakes = async (): Promise<string[]> => {
  return apiRequest<string[]>('/vehicles/makes');
};

/**
 * Get models for a make
 */
export const getModels = async (make: string): Promise<string[]> => {
  return apiRequest<string[]>(`/vehicles/models/${make}`);
};

/**
 * Get trims for a model
 */
export const getTrims = async (make: string, model: string, year: number): Promise<string[]> => {
  return apiRequest<string[]>(`/vehicles/trims?make=${make}&model=${model}&year=${year}`);
};

// ============================================
// KIOSK UTILITIES
// ============================================

/**
 * Log kiosk analytics event
 */
export const logAnalytics = async (event: string, data: Record<string, unknown> = {}): Promise<void> => {
  try {
    await apiRequest<void>('/kiosk/analytics', {
      method: 'POST',
      body: JSON.stringify({
        event,
        data,
        timestamp: new Date().toISOString(),
        sessionId: getSessionId(),
      } as AnalyticsData),
    });
  } catch (error) {
    // Don't throw on analytics failures
    console.warn('Analytics logging failed:', error);
  }
};

/**
 * Export session ID getter for components
 */
export const getKioskSessionId = getSessionId;

/**
 * Health check
 */
export const healthCheck = async (): Promise<{ status: string }> => {
  return apiRequest<{ status: string }>('/health');
};

// ============================================
// TRAFFIC LOG ENDPOINTS
// ============================================

/**
 * Log or update a kiosk session
 */
export const logTrafficSession = async (sessionData: TrafficSessionData): Promise<void> => {
  try {
    await apiRequest<void>('/traffic/session', {
      method: 'POST',
      body: JSON.stringify({
        sessionId: getSessionId(),
        ...sessionData,
      }),
    });
  } catch (error) {
    // Don't throw on traffic log failures
    console.warn('Traffic logging failed:', error);
  }
};

/**
 * Get traffic log entries (admin)
 */
export const getTrafficLog = async (limit: number = 50, offset: number = 0): Promise<TrafficLogEntry[]> => {
  return apiRequest<TrafficLogEntry[]>(`/traffic/log?limit=${limit}&offset=${offset}`);
};

/**
 * Get traffic statistics (admin)
 */
export const getTrafficStats = async (): Promise<TrafficStats> => {
  return apiRequest<TrafficStats>('/traffic/stats');
};

/**
 * Get single session details (admin)
 */
export const getTrafficSession = async (sessionId: string): Promise<TrafficLogEntry> => {
  return apiRequest<TrafficLogEntry>(`/traffic/log/${sessionId}`);
};

// ============================================
// AI ASSISTANT ENDPOINTS
// ============================================

/**
 * Chat with AI assistant for vehicle recommendations
 */
export const chatWithAI = async (request: AIChatRequest): Promise<AIChatResponse> => {
  return apiRequest<AIChatResponse>('/ai/chat', {
    method: 'POST',
    body: JSON.stringify(request),
  });
};

// ============================================
// EXPORT DEFAULT API OBJECT
// ============================================

const api = {
  // Inventory
  getInventory,
  getVehicleByStock,
  getVehicleByVin,
  searchByPreferences,
  getInventoryStats,
  
  // Trade-In
  getTradeInEstimate,
  decodeTradeInVin,
  requestAppraisal,
  
  // Payments
  calculateLease,
  calculateFinance,
  getRebates,
  
  // Leads
  submitLead,
  scheduleTestDrive,
  sendDealSummary,
  
  // Vehicle Data
  getMakes,
  getModels,
  getTrims,
  
  // Utilities
  logAnalytics,
  healthCheck,
  getKioskSessionId,
  
  // Traffic Log
  logTrafficSession,
  getTrafficLog,
  getTrafficStats,
  getTrafficSession,
  
  // AI Assistant
  chatWithAI,
};

export default api;
