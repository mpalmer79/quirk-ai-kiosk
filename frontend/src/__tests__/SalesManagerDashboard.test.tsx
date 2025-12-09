import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import SalesManagerDashboard from '../components/SalesManagerDashboard';

// Mock the api module
jest.mock('../components/api', () => ({
  getActiveSessions: jest.fn(),
  getTrafficSession: jest.fn(),
}));

import api from '../components/api';

// Mock timers
jest.useFakeTimers();

const mockSessions = [
  {
    sessionId: 'K12345ABC',
    customerName: 'John Doe',
    phone: '555-123-4567',
    startTime: new Date(Date.now() - 600000).toISOString(),
    lastActivity: new Date(Date.now() - 60000).toISOString(),
    currentStep: 'modelBudget',
    vehicleInterest: { model: 'Silverado 1500', cab: 'Crew Cab', colors: ['White', 'Black'] },
    budget: { min: 40000, max: 60000, downPaymentPercent: 10 },
    tradeIn: {
      hasTrade: true,
      vehicle: { year: '2018', make: 'Ford', model: 'F-150', mileage: 75000 },
      hasPayoff: true,
      payoffAmount: 15000,
      monthlyPayment: 450,
      financedWith: 'Ford Credit',
    },
    selectedVehicle: { stockNumber: 'M54321', year: 2025, make: 'Chevrolet', model: 'Silverado 1500', trim: 'LT', price: 52000 },
  },
  {
    sessionId: 'K67890XYZ',
    customerName: null,
    phone: null,
    startTime: new Date(Date.now() - 300000).toISOString(),
    lastActivity: new Date(Date.now() - 120000).toISOString(),
    currentStep: 'aiChat',
    vehicleInterest: { model: null, cab: null, colors: [] },
    budget: { min: null, max: null, downPaymentPercent: null },
    tradeIn: { hasTrade: null, vehicle: null, hasPayoff: null, payoffAmount: null, monthlyPayment: null, financedWith: null },
    selectedVehicle: null,
  },
];

const mockSessionDetail = {
  sessionId: 'K12345ABC',
  customerName: 'John Doe',
  phone: '555-123-4567',
  path: 'modelBudget',
  currentStep: 'modelBudget',
  createdAt: new Date(Date.now() - 600000).toISOString(),
  updatedAt: new Date(Date.now() - 60000).toISOString(),
  vehicleInterest: { model: 'Silverado 1500', cab: 'Crew Cab', colors: ['White', 'Black'] },
  budget: { min: 40000, max: 60000, downPaymentPercent: 10 },
  tradeIn: {
    hasTrade: true,
    vehicle: { year: '2018', make: 'Ford', model: 'F-150', mileage: 75000 },
    hasPayoff: true,
    payoffAmount: 15000,
    monthlyPayment: 450,
    financedWith: 'Ford Credit',
  },
  vehicle: { stockNumber: 'M54321', year: 2025, make: 'Chevrolet', model: 'Silverado 1500', trim: 'LT', msrp: 54000, salePrice: 52000 },
  chatHistory: [],
  actions: ['viewed_silverado', 'set_budget'],
};

const mockActiveSessionsResponse = {
  sessions: mockSessions,
  count: 2,
  timeout_minutes: 60,
  server_time: new Date().toISOString(),
  timezone: 'America/New_York',
};

// Helper to wait for loading to complete
const waitForLoaded = async () => {
  await waitFor(() => {
    expect(screen.queryByText(/Loading active sessions/i)).not.toBeInTheDocument();
  });
};

describe('SalesManagerDashboard Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    api.getActiveSessions.mockResolvedValue(mockActiveSessionsResponse);
    api.getTrafficSession.mockResolvedValue(mockSessionDetail);
  });

  afterEach(() => {
    jest.clearAllTimers();
  });

  describe('Initial Render', () => {
    test('displays dashboard title', async () => {
      render(<SalesManagerDashboard />);
      expect(screen.getByText(/Sales Manager Dashboard/i)).toBeInTheDocument();
    });

    test('displays last update info', async () => {
      render(<SalesManagerDashboard />);
      await waitFor(() => {
        expect(screen.getByText(/Last update/i)).toBeInTheDocument();
      });
    });

    test('displays auto-refresh checkbox', async () => {
      render(<SalesManagerDashboard />);
      await waitForLoaded();
      expect(screen.getByText(/Auto-refresh/i)).toBeInTheDocument();
    });

    test('displays Refresh Now button', async () => {
      render(<SalesManagerDashboard />);
      await waitForLoaded();
      expect(screen.getByText(/Refresh Now/i)).toBeInTheDocument();
    });

    test('displays HOME button', async () => {
      render(<SalesManagerDashboard />);
      await waitForLoaded();
      expect(screen.getByText('HOME')).toBeInTheDocument();
    });

    test('loads sessions on mount', async () => {
      render(<SalesManagerDashboard />);
      await waitFor(() => {
        expect(api.getActiveSessions).toHaveBeenCalledWith(60);
      });
    });
  });

  describe('Sessions List', () => {
    test('displays session count', async () => {
      render(<SalesManagerDashboard />);
      await waitFor(() => {
        expect(screen.getByText(/ACTIVE KIOSK SESSIONS \(2\)/i)).toBeInTheDocument();
      });
    });

    test('displays customer name', async () => {
      render(<SalesManagerDashboard />);
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });
    });

    test('displays Anonymous for unnamed sessions', async () => {
      render(<SalesManagerDashboard />);
      await waitFor(() => {
        expect(screen.getByText('Anonymous')).toBeInTheDocument();
      });
    });

    test('displays session step label', async () => {
      render(<SalesManagerDashboard />);
      await waitFor(() => {
        expect(screen.getByText(/Model & Budget Flow/i)).toBeInTheDocument();
      });
    });

    test('clicking session loads details', async () => {
      render(<SalesManagerDashboard />);
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText('John Doe'));
      await waitFor(() => {
        expect(api.getTrafficSession).toHaveBeenCalledWith('K12345ABC');
      });
    });
  });

  describe('Empty State', () => {
    test('displays empty message when no sessions', async () => {
      api.getActiveSessions.mockResolvedValue({ ...mockActiveSessionsResponse, sessions: [], count: 0 });
      render(<SalesManagerDashboard />);
      await waitFor(() => {
        expect(screen.getByText(/No active sessions/i)).toBeInTheDocument();
      });
    });

    test('displays helper text in empty state', async () => {
      api.getActiveSessions.mockResolvedValue({ ...mockActiveSessionsResponse, sessions: [], count: 0 });
      render(<SalesManagerDashboard />);
      await waitFor(() => {
        expect(screen.getByText(/Sessions will appear/i)).toBeInTheDocument();
      });
    });
  });

  describe('Selection Prompt', () => {
    test('displays selection prompt when no session selected', async () => {
      render(<SalesManagerDashboard />);
      await waitFor(() => {
        expect(screen.getByText(/Select a session/i)).toBeInTheDocument();
      });
    });

    test('displays pointing emoji', async () => {
      render(<SalesManagerDashboard />);
      await waitFor(() => {
        expect(screen.getByText('👈')).toBeInTheDocument();
      });
    });
  });

  describe('Session Detail View', () => {
    test('displays customer info when session selected', async () => {
      render(<SalesManagerDashboard />);
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText('John Doe'));
      await waitFor(() => {
        expect(screen.getByText('555-123-4567')).toBeInTheDocument();
      });
    });

    test('displays trade-in section', async () => {
      render(<SalesManagerDashboard />);
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText('John Doe'));
      await waitFor(() => {
        expect(screen.getByText(/TRADE-IN/i)).toBeInTheDocument();
      });
    });

    test('displays budget section', async () => {
      render(<SalesManagerDashboard />);
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText('John Doe'));
      await waitFor(() => {
        expect(screen.getByText(/BUDGET/i)).toBeInTheDocument();
      });
    });
  });

  describe('Auto-Refresh', () => {
    test('auto-refresh checkbox is checked by default', async () => {
      render(<SalesManagerDashboard />);
      await waitForLoaded();
      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toBeChecked();
    });

    test('clicking checkbox toggles auto-refresh', async () => {
      render(<SalesManagerDashboard />);
      await waitForLoaded();
      const checkbox = screen.getByRole('checkbox');
      fireEvent.click(checkbox);
      expect(checkbox).not.toBeChecked();
    });

    test('Refresh Now triggers manual refresh', async () => {
      render(<SalesManagerDashboard />);
      await waitForLoaded();
      await waitFor(() => {
        expect(api.getActiveSessions).toHaveBeenCalledTimes(1);
      });
      fireEvent.click(screen.getByText(/Refresh Now/i));
      await waitFor(() => {
        expect(api.getActiveSessions).toHaveBeenCalledTimes(2);
      });
    });

    test('auto-refresh polls on interval', async () => {
      render(<SalesManagerDashboard />);
      await waitFor(() => {
        expect(api.getActiveSessions).toHaveBeenCalledTimes(1);
      });
      act(() => {
        jest.advanceTimersByTime(5000);
      });
      await waitFor(() => {
        expect(api.getActiveSessions).toHaveBeenCalledTimes(2);
      });
    });

    test('disabling auto-refresh stops polling', async () => {
      render(<SalesManagerDashboard />);
      await waitForLoaded();
      await waitFor(() => {
        expect(api.getActiveSessions).toHaveBeenCalledTimes(1);
      });
      const checkbox = screen.getByRole('checkbox');
      fireEvent.click(checkbox);
      act(() => {
        jest.advanceTimersByTime(10000);
      });
      expect(api.getActiveSessions).toHaveBeenCalledTimes(1);
    });
  });

  describe('HOME Button', () => {
    test('clicking HOME deselects session', async () => {
      render(<SalesManagerDashboard />);
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText('John Doe'));
      await waitFor(() => {
        expect(api.getTrafficSession).toHaveBeenCalled();
      });
      fireEvent.click(screen.getByText('HOME'));
      await waitFor(() => {
        expect(screen.getByText(/Select a session/i)).toBeInTheDocument();
      });
    });
  });

  describe('Step Labels', () => {
    test('maps aiChat to AI Assistant Chat', async () => {
      render(<SalesManagerDashboard />);
      await waitFor(() => {
        expect(screen.getByText(/AI Assistant Chat/i)).toBeInTheDocument();
      });
    });

    test('maps modelBudget to Model & Budget Flow', async () => {
      render(<SalesManagerDashboard />);
      await waitFor(() => {
        expect(screen.getByText(/Model & Budget Flow/i)).toBeInTheDocument();
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

    test('handles sessions API error gracefully', async () => {
      api.getActiveSessions.mockRejectedValue(new Error('Network error'));
      render(<SalesManagerDashboard />);
      await waitFor(() => {
        expect(screen.getByText(/Sales Manager Dashboard/i)).toBeInTheDocument();
      });
    });

    test('handles session detail API error gracefully', async () => {
      api.getTrafficSession.mockRejectedValue(new Error('Network error'));
      render(<SalesManagerDashboard />);
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText('John Doe'));
      await waitFor(() => {
        expect(screen.getByText(/Sales Manager Dashboard/i)).toBeInTheDocument();
      });
    });
  });

  describe('Currency Formatting', () => {
    test('formats payoff amount correctly', async () => {
      render(<SalesManagerDashboard />);
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText('John Doe'));
      await waitFor(() => {
        expect(screen.getByText(/\$15,000/)).toBeInTheDocument();
      });
    });

    test('displays dash for null values', async () => {
      render(<SalesManagerDashboard />);
      await waitFor(() => {
        expect(screen.getByText('Anonymous')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText('Anonymous'));
      await waitFor(() => {
        const dashes = screen.getAllByText('—');
        expect(dashes.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Accessibility', () => {
    test('Refresh Now is a button', async () => {
      render(<SalesManagerDashboard />);
      await waitForLoaded();
      const refreshButton = screen.getByText(/Refresh Now/i);
      expect(refreshButton.tagName).toBe('BUTTON');
    });

    test('checkbox is accessible', async () => {
      render(<SalesManagerDashboard />);
      await waitForLoaded();
      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toBeInTheDocument();
    });

    test('session cards are clickable', async () => {
      render(<SalesManagerDashboard />);
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });
      const sessionCard = screen.getByText('John Doe').closest('button');
      expect(sessionCard).toBeTruthy();
    });
  });
});

describe('SalesManagerDashboard Chat Transcript', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    api.getActiveSessions.mockResolvedValue(mockActiveSessionsResponse);
  });

  afterEach(() => {
    jest.clearAllTimers();
  });

  test('displays View Chat button for AI sessions', async () => {
    api.getTrafficSession.mockResolvedValue({
      ...mockSessionDetail,
      sessionId: 'K67890XYZ',
      customerName: null,
      currentStep: 'aiChat',
      chatHistory: [
        { role: 'user', content: 'I need a truck', timestamp: new Date().toISOString() },
        { role: 'assistant', content: 'Great choice!', timestamp: new Date().toISOString() },
      ],
    });
    render(<SalesManagerDashboard />);
    await waitFor(() => {
      expect(screen.getByText('Anonymous')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('Anonymous'));
    await waitFor(() => {
      expect(screen.getByText(/View Chat/i)).toBeInTheDocument();
    });
  });

  test('clicking View Chat shows transcript', async () => {
    api.getTrafficSession.mockResolvedValue({
      ...mockSessionDetail,
      sessionId: 'K67890XYZ',
      customerName: null,
      currentStep: 'aiChat',
      chatHistory: [
        { role: 'user', content: 'I need a truck', timestamp: new Date().toISOString() },
        { role: 'assistant', content: 'Great choice!', timestamp: new Date().toISOString() },
      ],
    });
    render(<SalesManagerDashboard />);
    await waitFor(() => {
      expect(screen.getByText('Anonymous')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('Anonymous'));
    await waitFor(() => {
      expect(screen.getByText(/View Chat/i)).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText(/View Chat/i));
    await waitFor(() => {
      expect(screen.getByText(/Customer Chat/i)).toBeInTheDocument();
    });
  });
});
