/**
 * Quirk AI Kiosk - API Service Layer
 * Handles all communication between frontend components and FastAPI backend
 */

// Base API URL - configure based on environment
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

// Helper function for API requests
const apiRequest = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const defaultHeaders = {
    'Content-Type': 'application/json',
  };

  const config = {
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
    
    return await response.json();
  } catch (error) {
    console.error(`API Request Failed: ${endpoint}`, error);
    throw error;
  }
};

// ============================================
// INVENTORY ENDPOINTS
// ============================================

/**
 * Get all inventory with optional filters
 */
export const getInventory = async (filters = {}) => {
  const params = new URLSearchParams();
  
  if (filters.model) params.append('model', filters.model);
  if (filters.minPrice) params.append('min_price', filters.minPrice);
  if (filters.maxPrice) params.append('max_price', filters.maxPrice);
  if (filters.bodyType) params.append('body_type', filters.bodyType);
  if (filters.drivetrain) params.append('drivetrain', filters.drivetrain);
  if (filters.cabType) params.append('cab_type', filters.cabType);
  if (filters.condition) params.append('condition', filters.condition);
  if (filters.sortBy) params.append('sort_by', filters.sortBy);
  if (filters.limit) params.append('limit', filters.limit);
  
  const queryString = params.toString();
  const endpoint = `/inventory${queryString ? `?${queryString}` : ''}`;
  
  return apiRequest(endpoint);
};

/**
 * Get vehicle by stock number
 */
export const getVehicleByStock = async (stockNumber) => {
  return apiRequest(`/inventory/stock/${stockNumber}`);
};

/**
 * Get vehicle by VIN
 */
export const getVehicleByVin = async (vin) => {
  return apiRequest(`/inventory/vin/${vin}`);
};

/**
 * Search inventory with quiz-based preferences
 */
export const searchByPreferences = async (preferences) => {
  return apiRequest('/inventory/search', {
    method: 'POST',
    body: JSON.stringify(preferences),
  });
};

/**
 * Get inventory statistics
 */
export const getInventoryStats = async () => {
  return apiRequest('/inventory/stats');
};

// ============================================
// TRADE-IN ENDPOINTS
// ============================================

/**
 * Get trade-in estimate
 */
export const getTradeInEstimate = async (vehicleData) => {
  return apiRequest('/trade-in/estimate', {
    method: 'POST',
    body: JSON.stringify(vehicleData),
  });
};

/**
 * Decode VIN for trade-in
 */
export const decodeTradeInVin = async (vin) => {
  return apiRequest(`/trade-in/decode/${vin}`);
};

/**
 * Request in-person appraisal
 */
export const requestAppraisal = async (tradeInData) => {
  return apiRequest('/trade-in/appraisal', {
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
export const calculateLease = async (params) => {
  return apiRequest('/payments/lease', {
    method: 'POST',
    body: JSON.stringify(params),
  });
};

/**
 * Calculate finance payment
 */
export const calculateFinance = async (params) => {
  return apiRequest('/payments/finance', {
    method: 'POST',
    body: JSON.stringify(params),
  });
};

/**
 * Get current rebates and incentives for a vehicle
 */
export const getRebates = async (vehicleId) => {
  return apiRequest(`/payments/rebates/${vehicleId}`);
};

// ============================================
// LEAD / HANDOFF ENDPOINTS
// ============================================

/**
 * Submit customer lead and notify sales team
 */
export const submitLead = async (leadData) => {
  return apiRequest('/leads/handoff', {
    method: 'POST',
    body: JSON.stringify(leadData),
  });
};

/**
 * Schedule test drive
 */
export const scheduleTestDrive = async (appointmentData) => {
  return apiRequest('/leads/test-drive', {
    method: 'POST',
    body: JSON.stringify(appointmentData),
  });
};

/**
 * Send deal summary to customer
 */
export const sendDealSummary = async (phone, dealData) => {
  return apiRequest('/leads/send-summary', {
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
export const getMakes = async () => {
  return apiRequest('/vehicles/makes');
};

/**
 * Get models for a make
 */
export const getModels = async (make) => {
  return apiRequest(`/vehicles/models/${make}`);
};

/**
 * Get trims for a model
 */
export const getTrims = async (make, model, year) => {
  return apiRequest(`/vehicles/trims?make=${make}&model=${model}&year=${year}`);
};

// ============================================
// KIOSK UTILITIES
// ============================================

/**
 * Log kiosk analytics event
 */
export const logAnalytics = async (event, data = {}) => {
  try {
    return apiRequest('/kiosk/analytics', {
      method: 'POST',
      body: JSON.stringify({
        event,
        data,
        timestamp: new Date().toISOString(),
        sessionId: getSessionId(),
      }),
    });
  } catch (error) {
    // Don't throw on analytics failures
    console.warn('Analytics logging failed:', error);
  }
};

/**
 * Get or create session ID
 */
const getSessionId = () => {
  let sessionId = sessionStorage.getItem('kiosk_session_id');
  if (!sessionId) {
    sessionId = `K${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
    sessionStorage.setItem('kiosk_session_id', sessionId);
  }
  return sessionId;
};

/**
 * Export session ID getter for components
 */
export const getKioskSessionId = getSessionId;

/**
 * Health check
 */
export const healthCheck = async () => {
  return apiRequest('/health');
};

// ============================================
// TRAFFIC LOG ENDPOINTS
// ============================================

/**
 * Log or update a kiosk session
 */
export const logTrafficSession = async (sessionData) => {
  try {
    return apiRequest('/v1/traffic/session', {
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
export const getTrafficLog = async (limit = 50, offset = 0) => {
  return apiRequest(`/v1/traffic/log?limit=${limit}&offset=${offset}`);
};

/**
 * Get traffic statistics (admin)
 */
export const getTrafficStats = async () => {
  return apiRequest('/v1/traffic/stats');
};

/**
 * Get single session details (admin)
 */
export const getTrafficSession = async (sessionId) => {
  return apiRequest(`/v1/traffic/log/${sessionId}`);
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
};

export default api;
