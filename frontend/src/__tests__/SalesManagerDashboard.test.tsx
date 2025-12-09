import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import SalesManagerDashboard from '../components/SalesManagerDashboard';

// Mock the api module
jest.mock('../components/api', () => ({
  getActiveSessions: jest.fn(),
  getSessionDetails: jest.fn(),
  getDealDetails: jest.fn(),
  saveFourSquare: jest.fn(),
}));

import api from '../components/api';

const mockSessions = [
  {
    id: '1',
    customerName: 'John Smith',
    status: 'active',
    currentPage: 'vehicleDetail',
    selectedVehicle: {
      year: 2025,
      make: 'Chevrolet',
      model: 'Silverado 1500',
      stockNumber: 'M12345',
      salePrice: 52000,
    },
    startTime: new Date().toISOString(),
    lastActivity: new Date().toISOString(),
  },
  {
    id: '2',
    customerName: 'Jane Doe',
    status: 'active',
    currentPage: 'paymentCalculator',
    selectedVehicle: {
      year: 2025,
      make: 'Chevrolet',
      model: 'Equinox',
      stockNumber: 'M12346',
      salePrice: 35000,
    },
    startTime: new Date().toISOString(),
    lastActivity: new Date().toISOString(),
  },
];

const renderDashboard = async () => {
  let result;
  await act(async () => {
    result = render(<SalesManagerDashboard />);
  });
  return result;
};

describe('SalesManagerDashboard Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    api.getActiveSessions.mockResolvedValue({ sessions: mockSessions });
    api.getSessionDetails.mockResolvedValue(mockSessions[0]);
    api.getDealDetails.mockResolvedValue({});
    api.saveFourSquare.mockResolvedValue({ success: true });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Initial Render', () => {
    test('displays dashboard title', async () => {
      await renderDashboard();
      
      await waitFor(() => {
        expect(screen.getByText(/Sales Manager Dashboard/i)).toBeInTheDocument();
      });
    });

    test('displays active sessions header', async () => {
      await renderDashboard();
      
      await waitFor(() => {
        expect(screen.getByText(/Active Kiosk Sessions/i)).toBeInTheDocument();
      });
    });

    test('fetches sessions on mount', async () => {
      await renderDashboard();
      
      await waitFor(() => {
        expect(api.getActiveSessions).toHaveBeenCalled();
      });
    });

    test('displays loading state initially', async () => {
      api.getActiveSessions.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({ sessions: mockSessions }), 1000))
      );

      await renderDashboard();

      expect(screen.getByText(/Loading/i)).toBeInTheDocument();
    });
  });

  describe('Session List', () => {
    test('displays customer names', async () => {
      await renderDashboard();
      
      await waitFor(() => {
        expect(screen.getByText('John Smith')).toBeInTheDocument();
        expect(screen.getByText('Jane Doe')).toBeInTheDocument();
      });
    });

    test('displays vehicle info for sessions', async () => {
      await renderDashboard();
      
      await waitFor(() => {
        expect(screen.getByText(/Silverado 1500/i)).toBeInTheDocument();
        expect(screen.getByText(/Equinox/i)).toBeInTheDocument();
      });
    });

    test('displays session count', async () => {
      await renderDashboard();
      
      await waitFor(() => {
        expect(screen.getByText(/2/)).toBeInTheDocument();
      });
    });
  });

  describe('Session Selection', () => {
    test('clicking session shows details', async () => {
      await renderDashboard();

      await waitFor(() => {
        expect(screen.getByText('John Smith')).toBeInTheDocument();
      });

      await act(async () => {
        fireEvent.click(screen.getByText('John Smith'));
      });

      await waitFor(() => {
        expect(api.getSessionDetails).toHaveBeenCalled();
      });
    });
  });

  describe('Four Square Worksheet', () => {
    test('displays 4-Square button or tab', async () => {
      await renderDashboard();
      
      await waitFor(() => {
        const fourSquareElement = screen.queryByText(/4-Square/i) || screen.queryByText(/Four Square/i);
        expect(fourSquareElement).toBeInTheDocument();
      });
    });
  });

  describe('Auto Refresh', () => {
    test('refreshes sessions periodically', async () => {
      await renderDashboard();

      await waitFor(() => {
        expect(api.getActiveSessions).toHaveBeenCalledTimes(1);
      });

      // Advance timers to trigger refresh
      await act(async () => {
        jest.advanceTimersByTime(60000);
      });

      await waitFor(() => {
        expect(api.getActiveSessions).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('Empty State', () => {
    test('displays message when no sessions', async () => {
      api.getActiveSessions.mockResolvedValue({ sessions: [] });

      await renderDashboard();

      await waitFor(() => {
        expect(screen.getByText(/No active sessions/i)).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    let consoleErrorSpy;

    beforeEach(() => {
      consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
      consoleErrorSpy.mockRestore();
    });

    test('handles API error gracefully', async () => {
      api.getActiveSessions.mockRejectedValue(new Error('API Error'));

      await renderDashboard();

      // Should not crash - dashboard should still render
      await waitFor(() => {
        expect(screen.getByText(/Sales Manager Dashboard/i)).toBeInTheDocument();
      });
    });
  });

  describe('Last Update Display', () => {
    test('displays last update time', async () => {
      await renderDashboard();
      
      await waitFor(() => {
        expect(screen.getByText(/Last updated/i)).toBeInTheDocument();
      });
    });
  });

  describe('Refresh Button', () => {
    test('displays refresh button', async () => {
      await renderDashboard();
      
      await waitFor(() => {
        expect(screen.getByText(/Refresh/i)).toBeInTheDocument();
      });
    });

    test('clicking refresh fetches sessions', async () => {
      await renderDashboard();

      await waitFor(() => {
        expect(screen.getByText(/Refresh/i)).toBeInTheDocument();
      });

      await act(async () => {
        fireEvent.click(screen.getByText(/Refresh/i));
      });

      await waitFor(() => {
        expect(api.getActiveSessions).toHaveBeenCalledTimes(2);
      });
    });
  });
});
