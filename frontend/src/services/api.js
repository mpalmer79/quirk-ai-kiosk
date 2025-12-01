import axios from 'axios';
// Derive API URL based on current host (Codespaces or localhost)
const deriveApiUrlFromHost = () => {
  if (typeof window !== 'undefined') {
    const { protocol, hostname } = window.location;
    const portMatch = hostname.match(/-(\d+)(?=\.)/);
    if (portMatch) {
      const currentPort = portMatch[1];
      const apiHost = hostname.replace(`-${currentPort}`, '-8000');
      return `${protocol}//${apiHost}/api/v1`;
    }
  }
  // Fallback to localhost for non-browser environments
  return 'http://localhost:8000/api/v1';
};


const API_URL = process.env.REACT_APP_API_URL || deriveApiUrlFromHost();

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const kioskId = process.env.REACT_APP_KIOSK_ID || 'KIOSK-001';
    config.headers['X-Kiosk-ID'] = kioskId;
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.message);
    return Promise.reject(error);
  }
);

// Inventory endpoints
export const inventoryAPI = {
  getAll: (filters = {}) => api.get('/inventory', { params: filters }),
  getFeatured: () => api.get('/inventory/featured'),
  getById: (id) => api.get(`/inventory/${id}`),
  getByVin: (vin) => api.get(`/inventory/vin/${vin}`),
  getByStock: (stockNumber) => api.get(`/inventory/stock/${stockNumber}`),
  search: (query) => api.get('/inventory/search', { params: { q: query } }),
  getModels: () => api.get('/inventory/models'),
  getStats: () => api.get('/inventory/stats'),
};

// Recommendations endpoints
export const recommendationsAPI = {
  getForVehicle: (vehicleId, limit = 5) => 
    api.get(`/recommendations/${vehicleId}`, { params: { limit } }),
  getPersonalized: (sessionId, viewedVehicles) =>
    api.post('/recommendations/personalized', { sessionId, viewedVehicles }),
  getByPreferences: (preferences) =>
    api.post('/recommendations/preferences', preferences),
};

// Leads endpoints
export const leadsAPI = {
  submit: (lead) => api.post('/leads', lead),
  scheduleTestDrive: (data) => api.post('/leads/test-drive', data),
  requestInfo: (data) => api.post('/leads/info-request', data),
};

// Analytics endpoints
export const analyticsAPI = {
  startSession: (kioskId) => api.post('/analytics/session/start', { kioskId }),
  endSession: (sessionId) => api.post('/analytics/session/end', { sessionId }),
  trackView: (vehicleId, sessionId) => 
    api.post('/analytics/view', { vehicleId, sessionId }),
  trackInteraction: (eventType, eventData, sessionId) =>
    api.post('/analytics/interaction', { eventType, eventData, sessionId }),
};

export default api;
