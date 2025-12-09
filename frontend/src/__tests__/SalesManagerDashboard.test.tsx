import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import SalesManagerDashboard from '../components/SalesManagerDashboard';

// Mock the api module - match actual functions used by component
jest.mock('../components/api', () => ({
  getActiveSessions: jest.fn(),
  getTrafficSession: jest.fn(),
}));

import api from '../components/api';

const mockSessions = [
  {
    sessionId: '1',
    customerName: 'John Smith',
    phone: '555-1234',
    startTime: new Date().toISOString(),
    lastActivity: new Date().toISOString(),
    currentStep: 'vehicleDetail',
    vehicleInterest: {
      model: 'Silverado 1500',
      cab: 'Crew Cab',
      colors: ['Red', 'Black'],
    },
    budget: {
      min: 400,
      max: 600,
      downPaymentPercent: 10,
    },
    tradeIn: {
      hasTrade: true,
      vehicle: {
        year: '2020',
        make: 'Honda',
        model: 'Accord',
        mileage: 45000,
      },
      hasPayoff: true,
      payoffAmount: 15000,
      monthlyPayment: 450,
      financedWith: 'Honda Financial',
    },
    selectedVehicle: {
      stockNumber: 'M12345',
      year: 2025,
      make: 'Chevrolet',
      model: 'Silverado 1500',
      trim: 'LT',
      price: 52000,
    },
  },
  {
    sessionId: '2',
    customerName: 'Jane Doe',
    phone: '555-5678',
    startTime: new Date().toISOString(),
    lastActivity: new Date().toISOString(),
    currentStep: 'aiAssistant',
    vehicleInterest: {
      model: 'Equinox',
      cab: null,
      colors: [],
    },
    budget: {
      min: null,
      max: null,
      downPaymentPercent: null,
    },
    tradeIn: {
      hasTrade: false,
      vehicle: null,
      hasPayoff: null,
      payoffAmount: null,
      monthlyPayment: null,
      financedWith: null,
    },
    selectedVehicle: null,
  },
];

const mockSessionDetail = {
  sessionId: '1',
  customerName: 'John Smith',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  chatHistory: [
    { role: 'user', content: 'Hello', timestamp: new Date().toISOString() },
    { role: 'assistant', content: 'Hi! How can I help?', timestamp: new Date().toISOString() },
  ],
};

const renderDashboard = async () => {
  let result;
  await act(async () => {
    result = render(<SalesManagerDashboard />);
  });
  // Wait for initial load to complete
  await waitFor(() => {
    expect(api.getActiveSessions).toHaveBeenCalled();
  });
  return result;
};

describe('SalesManagerDashboard Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    api.getActiveSessions.mockResolvedValue({ sessions: mockSessions });
    api.getTrafficSession.mockResolvedValue(mockSessionDetail);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Initial Render', () => {
    test('displays dashboard title', async () => {
      await renderDashboard();
      
      await waitFor(() => {
        // Title has emoji, search for partial text
        expect(screen.getByText(/Sales Manager Dashboard/)).toBeInTheDocument();
      });
    });

    test('displays active sessions header', async () => {
      await renderDashboard();
      
      await waitFor(() => {
        // Header is uppercase and includes count
        expect(screen.getByText(/ACTIVE KIOSK SESSIONS/)).toBeInTheDocument();
      });
    });

    test('fetches sessions on mount', async () => {
      await renderDashboard();
      
      await waitFor(() => {
        expect(api.getActiveSessions).toHaveBeenCalledWith(60);
      });
    });

    test('displays loading state initially', async () => {
      api.getActiveSessions.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({ sessions: mockSessions }), 1000))
      );

      await act(async () => {
        render(<SalesManagerDashboard />);
      });

      expect(screen.getByText(/Loading active sessions/i)).toBeInTheDocument();
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

    test('displays session count', async () => {
      await renderDashboard();
      
      await waitFor(() => {
        expect(screen.getByText(/ACTIVE KIOSK SESSIONS \(2\)/)).toBeInTheDocument();
      });
    });
  });

  describe('Session Selection', () => {
    test('clicking session fetches details', async () => {
      await renderDashboard();

      await waitFor(() => {
        expect(screen.getByText('John Smith')).toBeInTheDocument();
      });

      await act(async () => {
        fireEvent.click(screen.getByText('John Smith'));
      });

      await waitFor(() => {
        expect(api.getTrafficSession).toHaveBeenCalledWith('1');
      });
    });

    test('clicking session shows 4-square worksheet', async () => {
      await renderDashboard();

      await waitFor(() => {
        expect(screen.getByText('John Smith')).toBeInTheDocument();
      });

      await act(async () => {
        fireEvent.click(screen.getByText('John Smith'));
      });

      await waitFor(() => {
        expect(screen.getByText(/Digital Quote Worksheet/)).toBeInTheDocument();
      });
    });
  });

  describe('Four Square Worksheet', () => {
    test('displays trade-in section', async () => {
      await renderDashboard();

      await waitFor(() => {
        expect(screen.getByText('John Smith')).toBeInTheDocument();
      });

      await act(async () => {
        fireEvent.click(screen.getByText('John Smith'));
      });

      await waitFor(() => {
        expect(screen.getByText('TRADE-IN')).toBeInTheDocument();
      });
    });

    test('displays price section', async () => {
      await renderDashboard();

      await waitFor(() => {
        expect(screen.getByText('John Smith')).toBeInTheDocument();
      });

      await act(async () => {
        fireEvent.click(screen.getByText('John Smith'));
      });

      await waitFor(() => {
        expect(screen.getByText('PRICE')).toBeInTheDocument();
      });
    });
  });

  describe('Auto Refresh', () => {
    test('refreshes sessions periodically', async () => {
      await renderDashboard();

      expect(api.getActiveSessions).toHaveBeenCalledTimes(1);

      // Advance timers to trigger refresh (component uses 5000ms)
      await act(async () => {
        jest.advanceTimersByTime(5000);
      });

      await waitFor(() => {
        expect(api.getActiveSessions).toHaveBeenCalledTimes(2);
      });
    });

    test('auto-refresh checkbox is checked by default', async () => {
      await renderDashboard();

      await waitFor(() => {
        const checkbox = screen.getByRole('checkbox');
        expect(checkbox).toBeChecked();
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
        expect(screen.getByText(/Sales Manager Dashboard/)).toBeInTheDocument();
      });
    });
  });

  describe('Last Update Display', () => {
    test('displays last update time', async () => {
      await renderDashboard();
      
      await waitFor(() => {
        expect(screen.getByText(/Last update:/i)).toBeInTheDocument();
      });
    });
  });

  describe('Refresh Button', () => {
    test('displays refresh button', async () => {
      await renderDashboard();
      
      await waitFor(() => {
        expect(screen.getByText(/Refresh Now/i)).toBeInTheDocument();
      });
    });

    test('clicking refresh fetches sessions', async () => {
      await renderDashboard();

      await waitFor(() => {
        expect(screen.getByText(/Refresh Now/i)).toBeInTheDocument();
      });

      await act(async () => {
        fireEvent.click(screen.getByText(/Refresh Now/i));
      });

      await waitFor(() => {
        expect(api.getActiveSessions).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('HOME Button', () => {
    test('displays HOME button', async () => {
      await renderDashboard();
      
      await waitFor(() => {
        expect(screen.getByText('HOME')).toBeInTheDocument();
      });
    });

    test('clicking HOME clears selected session', async () => {
      await renderDashboard();

      // First select a session
      await waitFor(() => {
        expect(screen.getByText('John Smith')).toBeInTheDocument();
      });

      await act(async () => {
        fireEvent.click(screen.getByText('John Smith'));
      });

      await waitFor(() => {
        expect(screen.getByText(/Digital Quote Worksheet/)).toBeInTheDocument();
      });

      // Click HOME
      await act(async () => {
        fireEvent.click(screen.getByText('HOME'));
      });

      await waitFor(() => {
        expect(screen.getByText(/Select a session/)).toBeInTheDocument();
      });
    });
  });
});
