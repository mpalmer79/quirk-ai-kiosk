import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import SalesManagerDashboard from '../components/SalesManagerDashboard';

// Mock the api module
jest.mock('../components/api', () => ({
  getActiveSessions: jest.fn(),
  getTrafficSession: jest.fn(),
}));

import api from '../components/api';

// Mock timer functions
jest.useFakeTimers();

const mockSessions = [
  {
    sessionId: 'K12345ABC',
    customerName: 'John Doe',
    phone: '555-123-4567',
    startTime: new Date(Date.now() - 600000).toISOString(), // 10 mins ago
    lastActivity: new Date(Date.now() - 60000).toISOString(), // 1 min ago
    currentStep: 'modelBudget',
    vehicleInterest: {
      model: 'Silverado 1500',
      cab: 'Crew Cab',
      colors: ['White', 'Black'],
    },
    budget: {
      min: 40000,
      max: 60000,
      downPaymentPercent: 10,
    },
    tradeIn: {
      hasTrade: true,
      vehicle: {
        year: '2018',
        make: 'Ford',
        model: 'F-150',
        mileage: 75000,
      },
      hasPayoff: true,
      payoffAmount: 15000,
      monthlyPayment: 450,
      financedWith: 'Ford Credit',
    },
    selectedVehicle: {
      stockNumber: 'M54321',
      year: 2025,
      make: 'Chevrolet',
      model: 'Silverado 1500',
      trim: 'LT',
      price: 52000,
    },
  },
  {
    sessionId: 'K67890XYZ',
    customerName: null,
    phone: null,
    startTime: new Date(Date.now() - 300000).toISOString(), // 5 mins ago
    lastActivity: new Date(Date.now() - 120000).toISOString(), // 2 mins ago
    currentStep: 'aiChat',
    vehicleInterest: {
      model: null,
      cab: null,
      colors: [],
    },
    budget: {
      min: null,
      max: null,
      downPaymentPercent: null,
    },
    tradeIn: {
      hasTrade: null,
      vehicle: null,
      hasPayoff: null,
      payoffAmount: null,
      monthlyPayment: null,
      financedWith: null,
    },
    selectedVehicle: null,
    chatHistory: [
      { role: 'user', content: 'I need a truck for towing', timestamp: new Date().toISOString() },
      { role: 'assistant', content: 'Great! Let me help you find the perfect truck.', timestamp: new Date().toISOString() },
    ],
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
  vehicleInterest: {
    model: 'Silverado 1500',
    cab: 'Crew Cab',
    colors: ['White', 'Black'],
  },
  budget: {
    min: 40000,
    max: 60000,
    downPaymentPercent: 10,
  },
  tradeIn: {
    hasTrade: true,
    vehicle: {
      year: '2018',
      make: 'Ford',
      model: 'F-150',
      mileage: 75000,
    },
    hasPayoff: true,
    payoffAmount: 15000,
    monthlyPayment: 450,
    financedWith: 'Ford Credit',
  },
  vehicle: {
    stockNumber: 'M54321',
    year: 2025,
    make: 'Chevrolet',
    model: 'Silverado 1500',
    trim: 'LT',
    msrp: 54000,
    salePrice: 52000,
  },
  chatHistory: [],
  actions: ['viewed_silverado', 'set_budget'],
};

const renderDashboard = () => {
  return render(<SalesManagerDashboard />);
};

describe('SalesManagerDashboard Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (api.getActiveSessions as jest.Mock).mockResolvedValue({
      sessions: mockSessions,
      count: 2,
      timeout_minutes: 60,
      server_time: new Date().toISOString(),
      timezone: 'America/New_York',
    });
    (api.getTrafficSession as jest.Mock).mockResolvedValue(mockSessionDetail);
  });

  afterEach(() => {
    jest.clearAllTimers();
  });

  describe('Initial Render', () => {
    test('displays dashboard title', async () => {
      renderDashboard();

      expect(screen.getByText(/Sales Manager Dashboard/i)).toBeInTheDocument();
    });

    test('displays last update time', async () => {
      renderDashboard();

      await waitFor(() => {
        expect(screen.getByText(/Last update:/i)).toBeInTheDocument();
      });
    });

    test('displays auto-refresh checkbox', async () => {
      renderDashboard();

      expect(screen.getByText(/Auto-refresh/i)).toBeInTheDocument();
    });

    test('displays refresh button', async () => {
      renderDashboard();

      expect(screen.getByText(/Refresh Now/i)).toBeInTheDocument();
    });

    test('displays HOME button', async () => {
      renderDashboard();

      expect(screen.getByText('HOME')).toBeInTheDocument();
    });

    test('loads active sessions on mount', async () => {
      renderDashboard();

      await waitFor(() => {
        expect(api.getActiveSessions).toHaveBeenCalledWith(60);
      });
    });
  });

  describe('Sessions List', () => {
    test('displays session count', async () => {
      renderDashboard();

      await waitFor(() => {
        expect(screen.getByText(/ACTIVE KIOSK SESSIONS \(2\)/i)).toBeInTheDocument();
      });
    });

    test('displays customer name for session with name', async () => {
      renderDashboard();

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });
    });

    test('displays Anonymous for session without name', async () => {
      renderDashboard();

      await waitFor(() => {
        expect(screen.getByText('Anonymous')).toBeInTheDocument();
      });
    });

    test('displays session step label', async () => {
      renderDashboard();

      await waitFor(() => {
        expect(screen.getByText(/Model & Budget Flow/i)).toBeInTheDocument();
      });
    });

    test('displays time since last activity', async () => {
      renderDashboard();

      await waitFor(() => {
        expect(screen.getByText(/min/i)).toBeInTheDocument();
      });
    });

    test('clicking session selects it', async () => {
      renderDashboard();

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
      (api.getActiveSessions as jest.Mock).mockResolvedValue({
        sessions: [],
        count: 0,
        timeout_minutes: 60,
        server_time: new Date().toISOString(),
        timezone: 'America/New_York',
      });

      renderDashboard();

      await waitFor(() => {
        expect(screen.getByText(/No active sessions/i)).toBeInTheDocument();
      });
    });

    test('displays helper text in empty state', async () => {
      (api.getActiveSessions as jest.Mock).mockResolvedValue({
        sessions: [],
        count: 0,
        timeout_minutes: 60,
        server_time: new Date().toISOString(),
        timezone: 'America/New_York',
      });

      renderDashboard();

      await waitFor(() => {
        expect(screen.getByText(/Sessions will appear/i)).toBeInTheDocument();
      });
    });
  });

  describe('Selection Prompt', () => {
    test('displays select prompt when no session selected', async () => {
      renderDashboard();

      await waitFor(() => {
        expect(screen.getByText(/Select a session to view/i)).toBeInTheDocument();
      });
    });

    test('displays pointing emoji in prompt', async () => {
      renderDashboard();

      await waitFor(() => {
        expect(screen.getByText('👈')).toBeInTheDocument();
      });
    });
  });

  describe('4-Square Worksheet', () => {
    const selectSession = async () => {
      renderDashboard();

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('John Doe'));

      await waitFor(() => {
        expect(api.getTrafficSession).toHaveBeenCalled();
      });
    };

    test('displays customer name in header', async () => {
      await selectSession();

      await waitFor(() => {
        const headers = screen.getAllByText('John Doe');
        expect(headers.length).toBeGreaterThan(0);
      });
    });

    test('displays customer phone', async () => {
      await selectSession();

      await waitFor(() => {
        expect(screen.getByText('555-123-4567')).toBeInTheDocument();
      });
    });

    test('displays vehicle interest section', async () => {
      await selectSession();

      await waitFor(() => {
        expect(screen.getByText(/VEHICLE INTEREST/i)).toBeInTheDocument();
      });
    });

    test('displays selected vehicle info', async () => {
      await selectSession();

      await waitFor(() => {
        expect(screen.getByText(/M54321/i)).toBeInTheDocument();
      });
    });

    test('displays trade-in section', async () => {
      await selectSession();

      await waitFor(() => {
        expect(screen.getByText(/TRADE-IN/i)).toBeInTheDocument();
      });
    });

    test('displays trade-in vehicle info', async () => {
      await selectSession();

      await waitFor(() => {
        expect(screen.getByText(/2018 Ford F-150/i)).toBeInTheDocument();
      });
    });

    test('displays payoff amount', async () => {
      await selectSession();

      await waitFor(() => {
        expect(screen.getByText(/\$15,000/i)).toBeInTheDocument();
      });
    });

    test('displays budget section', async () => {
      await selectSession();

      await waitFor(() => {
        expect(screen.getByText(/BUDGET/i)).toBeInTheDocument();
      });
    });

    test('displays budget range', async () => {
      await selectSession();

      await waitFor(() => {
        expect(screen.getByText(/\$40,000.*\$60,000/i)).toBeInTheDocument();
      });
    });

    test('displays down payment section', async () => {
      await selectSession();

      await waitFor(() => {
        expect(screen.getByText(/DOWN PAYMENT/i)).toBeInTheDocument();
      });
    });
  });

  describe('Chat Transcript', () => {
    test('displays View Chat button for AI chat sessions', async () => {
      renderDashboard();

      await waitFor(() => {
        expect(screen.getByText('Anonymous')).toBeInTheDocument();
      });

      // Select the AI chat session
      fireEvent.click(screen.getByText('Anonymous'));

      await waitFor(() => {
        expect(screen.getByText(/View Chat/i)).toBeInTheDocument();
      });
    });

    test('clicking View Chat shows transcript', async () => {
      (api.getTrafficSession as jest.Mock).mockResolvedValue({
        ...mockSessionDetail,
        sessionId: 'K67890XYZ',
        customerName: null,
        currentStep: 'aiChat',
        chatHistory: [
          { role: 'user', content: 'I need a truck for towing', timestamp: new Date().toISOString() },
          { role: 'assistant', content: 'Great! Let me help you find the perfect truck.', timestamp: new Date().toISOString() },
        ],
      });

      renderDashboard();

      await waitFor(() => {
        expect(screen.getByText('Anonymous')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Anonymous'));

      await waitFor(() => {
        expect(screen.getByText(/View Chat/i)).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText(/View Chat/i));

      await waitFor(() => {
        expect(screen.getByText(/Customer Chat with Quirk AI/i)).toBeInTheDocument();
      });
    });

    test('displays chat message count', async () => {
      (api.getTrafficSession as jest.Mock).mockResolvedValue({
        ...mockSessionDetail,
        sessionId: 'K67890XYZ',
        customerName: null,
        currentStep: 'aiChat',
        chatHistory: [
          { role: 'user', content: 'I need a truck', timestamp: new Date().toISOString() },
          { role: 'assistant', content: 'Let me help!', timestamp: new Date().toISOString() },
        ],
      });

      renderDashboard();

      await waitFor(() => {
        expect(screen.getByText('Anonymous')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Anonymous'));

      await waitFor(() => {
        expect(screen.getByText(/View Chat/i)).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText(/View Chat/i));

      await waitFor(() => {
        expect(screen.getByText(/2 messages/i)).toBeInTheDocument();
      });
    });

    test('displays no chat message when history empty', async () => {
      (api.getTrafficSession as jest.Mock).mockResolvedValue({
        ...mockSessionDetail,
        chatHistory: [],
      });

      renderDashboard();

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('John Doe'));

      await waitFor(() => {
        // Session detail loads, but no chat visible since it's not an AI chat session
        expect(api.getTrafficSession).toHaveBeenCalled();
      });
    });
  });

  describe('Auto-Refresh', () => {
    test('auto-refresh is enabled by default', async () => {
      renderDashboard();

      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toBeChecked();
    });

    test('toggling auto-refresh off stops polling', async () => {
      renderDashboard();

      const checkbox = screen.getByRole('checkbox');
      fireEvent.click(checkbox);

      expect(checkbox).not.toBeChecked();
    });

    test('refresh button triggers manual refresh', async () => {
      renderDashboard();

      await waitFor(() => {
        expect(api.getActiveSessions).toHaveBeenCalledTimes(1);
      });

      fireEvent.click(screen.getByText(/Refresh Now/i));

      await waitFor(() => {
        expect(api.getActiveSessions).toHaveBeenCalledTimes(2);
      });
    });

    test('auto-refresh polls every 5 seconds', async () => {
      renderDashboard();

      await waitFor(() => {
        expect(api.getActiveSessions).toHaveBeenCalledTimes(1);
      });

      // Advance timer by 5 seconds
      act(() => {
        jest.advanceTimersByTime(5000);
      });

      await waitFor(() => {
        expect(api.getActiveSessions).toHaveBeenCalledTimes(2);
      });

      // Advance another 5 seconds
      act(() => {
        jest.advanceTimersByTime(5000);
      });

      await waitFor(() => {
        expect(api.getActiveSessions).toHaveBeenCalledTimes(3);
      });
    });
  });

  describe('HOME Button', () => {
    test('clicking HOME deselects session', async () => {
      renderDashboard();

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      // Select a session
      fireEvent.click(screen.getByText('John Doe'));

      await waitFor(() => {
        expect(api.getTrafficSession).toHaveBeenCalled();
      });

      // Click HOME
      fireEvent.click(screen.getByText('HOME'));

      // Should show selection prompt again
      await waitFor(() => {
        expect(screen.getByText(/Select a session to view/i)).toBeInTheDocument();
      });
    });
  });

  describe('Step Labels', () => {
    test('maps modelBudget to Model & Budget Flow', async () => {
      renderDashboard();

      await waitFor(() => {
        expect(screen.getByText(/Model & Budget Flow/i)).toBeInTheDocument();
      });
    });

    test('maps aiChat to AI Assistant Chat', async () => {
      renderDashboard();

      await waitFor(() => {
        expect(screen.getByText(/AI Assistant Chat/i)).toBeInTheDocument();
      });
    });

    test('maps handoff to Ready for Handoff', async () => {
      (api.getActiveSessions as jest.Mock).mockResolvedValue({
        sessions: [{
          ...mockSessions[0],
          currentStep: 'handoff',
        }],
        count: 1,
        timeout_minutes: 60,
        server_time: new Date().toISOString(),
        timezone: 'America/New_York',
      });

      renderDashboard();

      await waitFor(() => {
        expect(screen.getByText(/Ready for Handoff/i)).toBeInTheDocument();
      });
    });
  });

  describe('Time Formatting', () => {
    test('shows Just now for recent activity', async () => {
      const recentSession = {
        ...mockSessions[0],
        lastActivity: new Date().toISOString(),
      };

      (api.getActiveSessions as jest.Mock).mockResolvedValue({
        sessions: [recentSession],
        count: 1,
        timeout_minutes: 60,
        server_time: new Date().toISOString(),
        timezone: 'America/New_York',
      });

      renderDashboard();

      await waitFor(() => {
        expect(screen.getByText(/Just now/i)).toBeInTheDocument();
      });
    });

    test('shows minutes for activity under an hour', async () => {
      renderDashboard();

      await waitFor(() => {
        // Should show "1 min ago" or similar
        expect(screen.getByText(/min/i)).toBeInTheDocument();
      });
    });
  });

  describe('Currency Formatting', () => {
    test('formats payoff amount with dollar sign and commas', async () => {
      renderDashboard();

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('John Doe'));

      await waitFor(() => {
        expect(screen.getByText(/\$15,000/)).toBeInTheDocument();
      });
    });

    test('shows dash for null values', async () => {
      renderDashboard();

      await waitFor(() => {
        expect(screen.getByText('Anonymous')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Anonymous'));

      await waitFor(() => {
        // Should show dashes for missing values
        const dashes = screen.getAllByText('—');
        expect(dashes.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Error Handling', () => {
    test('handles API error gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      (api.getActiveSessions as jest.Mock).mockRejectedValue(new Error('Network error'));

      renderDashboard();

      // Should not crash - dashboard should still render
      await waitFor(() => {
        expect(screen.getByText(/Sales Manager Dashboard/i)).toBeInTheDocument();
      });

      consoleSpy.mockRestore();
    });

    test('handles session detail API error gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      (api.getTrafficSession as jest.Mock).mockRejectedValue(new Error('Network error'));

      renderDashboard();

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('John Doe'));

      // Should not crash
      await waitFor(() => {
        expect(screen.getByText(/Sales Manager Dashboard/i)).toBeInTheDocument();
      });

      consoleSpy.mockRestore();
    });
  });

  describe('Session Card Selection State', () => {
    test('selected session card has active styling', async () => {
      renderDashboard();

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      const sessionCard = screen.getByText('John Doe').closest('button');
      fireEvent.click(sessionCard!);

      await waitFor(() => {
        expect(sessionCard).toHaveStyle({ borderColor: '#1B7340' });
      });
    });
  });

  describe('Accessibility', () => {
    test('refresh button is focusable', async () => {
      renderDashboard();

      const refreshButton = screen.getByText(/Refresh Now/i);
      expect(refreshButton.tagName).toBe('BUTTON');
    });

    test('checkbox is accessible', async () => {
      renderDashboard();

      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toBeInTheDocument();
    });

    test('session cards are buttons', async () => {
      renderDashboard();

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      const sessionCard = screen.getByText('John Doe').closest('button');
      expect(sessionCard?.tagName).toBe('BUTTON');
    });
  });
});

describe('SalesManagerDashboard Live Updates', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (api.getActiveSessions as jest.Mock).mockResolvedValue({
      sessions: mockSessions,
      count: 2,
      timeout_minutes: 60,
      server_time: new Date().toISOString(),
      timezone: 'America/New_York',
    });
    (api.getTrafficSession as jest.Mock).mockResolvedValue(mockSessionDetail);
  });

  afterEach(() => {
    jest.clearAllTimers();
  });

  test('updates selected session data on refresh', async () => {
    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('John Doe'));

    await waitFor(() => {
      expect(api.getTrafficSession).toHaveBeenCalledTimes(1);
    });

    // Update the mock to return different data
    const updatedDetail = {
      ...mockSessionDetail,
      budget: { min: 50000, max: 70000, downPaymentPercent: 15 },
    };
    (api.getTrafficSession as jest.Mock).mockResolvedValue(updatedDetail);

    // Trigger auto-refresh
    act(() => {
      jest.advanceTimersByTime(5000);
    });

    await waitFor(() => {
      // Session detail should be refetched
      expect(api.getTrafficSession).toHaveBeenCalledTimes(2);
    });
  });
});
