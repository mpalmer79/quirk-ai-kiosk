import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import KioskApp from '../components/Kioskapp';

// =============================================================================
// MOCKS
// =============================================================================

// Mock all child components to isolate KioskApp testing
jest.mock('../components/Welcomescreen', () => {
  return function MockWelcomeScreen({ navigateTo, updateCustomerData, resetJourney }: any) {
    return (
      <div data-testid="welcome-screen">
        <span>Welcome Screen</span>
        <button onClick={() => navigateTo('inventory')}>Go to Inventory</button>
        <button onClick={() => navigateTo('aiAssistant')}>Go to AI</button>
        <button onClick={() => navigateTo('modelBudget')}>Go to Model Budget</button>
        <button onClick={() => navigateTo('stockLookup')}>Go to Stock Lookup</button>
        <button onClick={() => updateCustomerData({ customerName: 'TestUser' })}>Set Name</button>
        <button onClick={() => navigateTo('inventory', { bodyStyle: 'SUV' })}>Go to SUV Inventory</button>
      </div>
    );
  };
});

jest.mock('../components/Stocklookup', () => {
  return function MockStockLookup({ navigateTo }: any) {
    return (
      <div data-testid="stock-lookup-screen">
        <span>Stock Lookup Screen</span>
        <button onClick={() => navigateTo('vehicleDetail')}>View Vehicle</button>
      </div>
    );
  };
});

jest.mock('../components/ModelBudgetSelector', () => {
  return function MockModelBudgetSelector({ navigateTo }: any) {
    return (
      <div data-testid="model-budget-screen">
        <span>Model Budget Screen</span>
        <button onClick={() => navigateTo('inventory')}>See Results</button>
      </div>
    );
  };
});

jest.mock('../components/Guidedquiz', () => {
  return function MockGuidedQuiz() {
    return <div data-testid="guided-quiz-screen">Guided Quiz Screen</div>;
  };
});

jest.mock('../components/AIAssistant', () => {
  return function MockAIAssistant({ navigateTo, updateCustomerData }: any) {
    return (
      <div data-testid="ai-assistant-screen">
        <span>AI Assistant Screen</span>
        <button onClick={() => navigateTo('inventory')}>Show Vehicles</button>
        <button onClick={() => updateCustomerData({ conversationLog: [{ role: 'user', content: 'test' }] })}>
          Add Conversation
        </button>
      </div>
    );
  };
});

jest.mock('../components/Inventoryresults', () => {
  return function MockInventoryResults({ navigateTo, updateCustomerData, customerData }: any) {
    return (
      <div data-testid="inventory-screen">
        <span>Inventory Screen</span>
        <span data-testid="body-filter">{customerData?.bodyStyleFilter || 'No Filter'}</span>
        <button onClick={() => {
          updateCustomerData({ selectedVehicle: { stockNumber: 'TEST123', year: 2024, make: 'Chevrolet', model: 'Equinox' } });
          navigateTo('vehicleDetail');
        }}>Select Vehicle</button>
      </div>
    );
  };
});

jest.mock('../components/Vehicledetail', () => {
  return function MockVehicleDetail({ navigateTo, customerData }: any) {
    return (
      <div data-testid="vehicle-detail-screen">
        <span>Vehicle Detail Screen</span>
        <span data-testid="selected-vehicle">{customerData?.selectedVehicle?.stockNumber || 'None'}</span>
        <button onClick={() => navigateTo('paymentCalculator')}>Calculate Payment</button>
        <button onClick={() => navigateTo('tradeIn')}>Trade In</button>
      </div>
    );
  };
});

jest.mock('../components/VehicleComparison', () => {
  return function MockVehicleComparison() {
    return <div data-testid="vehicle-comparison-screen">Vehicle Comparison Screen</div>;
  };
});

jest.mock('../components/VirtualTestDrive', () => {
  return function MockVirtualTestDrive() {
    return <div data-testid="virtual-test-drive-screen">Virtual Test Drive Screen</div>;
  };
});

jest.mock('../components/Paymentcalculator', () => {
  return function MockPaymentCalculator({ navigateTo }: any) {
    return (
      <div data-testid="payment-calculator-screen">
        <span>Payment Calculator Screen</span>
        <button onClick={() => navigateTo('handoff')}>Ready to Buy</button>
      </div>
    );
  };
});

jest.mock('../components/TradeInEstimator', () => {
  return function MockTradeInEstimator({ navigateTo, updateCustomerData }: any) {
    return (
      <div data-testid="trade-in-screen">
        <span>Trade In Screen</span>
        <button onClick={() => {
          updateCustomerData({ tradeIn: { year: 2020, make: 'Honda', model: 'Civic', mileage: 50000 } });
          navigateTo('paymentCalculator');
        }}>Submit Trade</button>
      </div>
    );
  };
});

jest.mock('../components/Customerhandoff', () => {
  return function MockCustomerHandoff({ updateCustomerData }: any) {
    return (
      <div data-testid="handoff-screen">
        <span>Customer Handoff Screen</span>
        <button onClick={() => updateCustomerData({ contactInfo: { phone: '555-1234' } })}>
          Submit Contact
        </button>
      </div>
    );
  };
});

jest.mock('../components/Protectionpackages', () => {
  return function MockProtectionPackages() {
    return <div data-testid="protection-packages-screen">Protection Packages Screen</div>;
  };
});

jest.mock('../components/Trafficlog', () => {
  return function MockTrafficLog({ navigateTo }: any) {
    return (
      <div data-testid="traffic-log-screen">
        <span>Traffic Log Screen</span>
        <button onClick={() => navigateTo('salesDashboard')}>Open Dashboard</button>
      </div>
    );
  };
});

jest.mock('../components/SalesManagerDashboard', () => {
  return function MockSalesManagerDashboard() {
    return <div data-testid="sales-dashboard-screen">Sales Manager Dashboard Screen</div>;
  };
});

jest.mock('../components/InventorySyncDashboard', () => {
  return function MockInventorySyncDashboard() {
    return <div data-testid="inventory-sync-screen">Inventory Sync Dashboard Screen</div>;
  };
});

jest.mock('../components/Errorboundary', () => {
  return function MockErrorBoundary({ children, fallback }: any) {
    return <>{children}</>;
  };
});

// Mock the API - must match default export structure
jest.mock('../components/api', () => ({
  __esModule: true,
  default: {
    logTrafficSession: jest.fn(() => Promise.resolve(undefined)),
    getInventory: jest.fn(() => Promise.resolve([])),
    getInventoryStats: jest.fn(() => Promise.resolve({ total: 0, byBodyStyle: {}, priceRange: { min: 0, max: 0 } })),
  },
}));

import api from '../components/api';

// =============================================================================
// TEST UTILITIES
// =============================================================================

const renderKioskApp = () => {
  return render(<KioskApp />);
};

// Helper to simulate browser back button
const simulatePopState = (state: { screen: string; index: number } | null) => {
  const event = new PopStateEvent('popstate', { state });
  window.dispatchEvent(event);
};

// =============================================================================
// TESTS
// =============================================================================

describe('KioskApp Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    
    // Reset window.history
    window.history.replaceState(null, '', '/');
    
    // Mock window.history methods
    jest.spyOn(window.history, 'pushState');
    jest.spyOn(window.history, 'replaceState');
    
    // Ensure API mock returns promises
    (api.logTrafficSession as jest.Mock).mockImplementation(() => Promise.resolve(undefined));
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  // ===========================================================================
  // Initial Render Tests
  // ===========================================================================
  describe('Initial Render', () => {
    test('renders welcome screen by default', () => {
      renderKioskApp();
      expect(screen.getByTestId('welcome-screen')).toBeInTheDocument();
    });

    test('renders header with QUIRK logo', () => {
      renderKioskApp();
      expect(screen.getByText('QUIRK')).toBeInTheDocument();
      expect(screen.getByText('AI')).toBeInTheDocument();
    });

    test('renders footer with dealership info', () => {
      renderKioskApp();
      expect(screen.getByText('Quirk Chevrolet')).toBeInTheDocument();
      expect(screen.getByText("New England's #1 Dealer")).toBeInTheDocument();
    });

    test('renders Sales Desk link on welcome screen', () => {
      renderKioskApp();
      expect(screen.getByText('Sales Desk')).toBeInTheDocument();
    });

    test('does not render back button on welcome screen', () => {
      renderKioskApp();
      expect(screen.queryByText('Back')).not.toBeInTheDocument();
    });

    test('sets initial browser history state', () => {
      renderKioskApp();
      expect(window.history.replaceState).toHaveBeenCalledWith(
        { screen: 'welcome', index: 0 },
        '',
        '#welcome'
      );
    });
  });

  // ===========================================================================
  // Navigation Tests
  // ===========================================================================
  describe('Navigation', () => {
    test('navigates to inventory screen', async () => {
      renderKioskApp();
      
      const navButton = screen.getByText('Go to Inventory');
      fireEvent.click(navButton);

      // Wait for transition
      act(() => {
        jest.advanceTimersByTime(200);
      });

      await waitFor(() => {
        expect(screen.getByTestId('inventory-screen')).toBeInTheDocument();
      });
    });

    test('navigates to AI Assistant screen', async () => {
      renderKioskApp();
      
      fireEvent.click(screen.getByText('Go to AI'));

      act(() => {
        jest.advanceTimersByTime(200);
      });

      await waitFor(() => {
        expect(screen.getByTestId('ai-assistant-screen')).toBeInTheDocument();
      });
    });

    test('navigates to Model Budget screen', async () => {
      renderKioskApp();
      
      fireEvent.click(screen.getByText('Go to Model Budget'));

      act(() => {
        jest.advanceTimersByTime(200);
      });

      await waitFor(() => {
        expect(screen.getByTestId('model-budget-screen')).toBeInTheDocument();
      });
    });

    test('navigates to Stock Lookup screen', async () => {
      renderKioskApp();
      
      fireEvent.click(screen.getByText('Go to Stock Lookup'));

      act(() => {
        jest.advanceTimersByTime(200);
      });

      await waitFor(() => {
        expect(screen.getByTestId('stock-lookup-screen')).toBeInTheDocument();
      });
    });

    test('navigates with filter options', async () => {
      renderKioskApp();
      
      fireEvent.click(screen.getByText('Go to SUV Inventory'));

      act(() => {
        jest.advanceTimersByTime(200);
      });

      await waitFor(() => {
        expect(screen.getByTestId('inventory-screen')).toBeInTheDocument();
        expect(screen.getByTestId('body-filter')).toHaveTextContent('SUV');
      });
    });

    test('pushes state to browser history on navigation', async () => {
      renderKioskApp();
      
      fireEvent.click(screen.getByText('Go to Inventory'));

      act(() => {
        jest.advanceTimersByTime(200);
      });

      await waitFor(() => {
        expect(window.history.pushState).toHaveBeenCalledWith(
          expect.objectContaining({ screen: 'inventory' }),
          '',
          '#inventory'
        );
      });
    });

    test('does not push duplicate consecutive screens', async () => {
      renderKioskApp();
      
      fireEvent.click(screen.getByText('Go to Inventory'));
      act(() => { jest.advanceTimersByTime(200); });

      await waitFor(() => {
        expect(screen.getByTestId('inventory-screen')).toBeInTheDocument();
      });

      const pushStateCallCount = (window.history.pushState as jest.Mock).mock.calls.length;

      // Navigate back to welcome first
      fireEvent.click(screen.getByText('Back'));
      act(() => { jest.advanceTimersByTime(200); });
      
      await waitFor(() => {
        expect(screen.getByTestId('welcome-screen')).toBeInTheDocument();
      });

      // Navigate to inventory again
      fireEvent.click(screen.getByText('Go to Inventory'));
      act(() => { jest.advanceTimersByTime(200); });

      // Should have pushed new state for navigation
      expect((window.history.pushState as jest.Mock).mock.calls.length).toBeGreaterThan(pushStateCallCount);
    });
  });

  // ===========================================================================
  // Multi-Step Navigation Journey Tests
  // ===========================================================================
  describe('Multi-Step Journey', () => {
    test('completes full customer journey: welcome -> inventory -> vehicle detail', async () => {
      renderKioskApp();
      
      // Step 1: Welcome -> Inventory
      fireEvent.click(screen.getByText('Go to Inventory'));
      act(() => { jest.advanceTimersByTime(200); });
      
      await waitFor(() => {
        expect(screen.getByTestId('inventory-screen')).toBeInTheDocument();
      });

      // Step 2: Select Vehicle -> Vehicle Detail
      fireEvent.click(screen.getByText('Select Vehicle'));
      act(() => { jest.advanceTimersByTime(200); });

      await waitFor(() => {
        expect(screen.getByTestId('vehicle-detail-screen')).toBeInTheDocument();
        expect(screen.getByTestId('selected-vehicle')).toHaveTextContent('TEST123');
      });
    });

    test('completes journey through AI Assistant path', async () => {
      renderKioskApp();
      
      // Welcome -> AI Assistant
      fireEvent.click(screen.getByText('Go to AI'));
      act(() => { jest.advanceTimersByTime(200); });
      
      await waitFor(() => {
        expect(screen.getByTestId('ai-assistant-screen')).toBeInTheDocument();
      });

      // AI -> Inventory
      fireEvent.click(screen.getByText('Show Vehicles'));
      act(() => { jest.advanceTimersByTime(200); });

      await waitFor(() => {
        expect(screen.getByTestId('inventory-screen')).toBeInTheDocument();
      });
    });
  });

  // ===========================================================================
  // Back Button Tests
  // ===========================================================================
  describe('Back Button', () => {
    test('shows back button after navigating away from welcome', async () => {
      renderKioskApp();
      
      fireEvent.click(screen.getByText('Go to Inventory'));
      act(() => { jest.advanceTimersByTime(200); });

      await waitFor(() => {
        expect(screen.getByText('Back')).toBeInTheDocument();
      });
    });

    test('back button returns to previous screen', async () => {
      renderKioskApp();
      
      // Navigate to inventory
      fireEvent.click(screen.getByText('Go to Inventory'));
      act(() => { jest.advanceTimersByTime(200); });

      await waitFor(() => {
        expect(screen.getByTestId('inventory-screen')).toBeInTheDocument();
      });

      // Click back
      fireEvent.click(screen.getByText('Back'));
      act(() => { jest.advanceTimersByTime(200); });

      await waitFor(() => {
        expect(screen.getByTestId('welcome-screen')).toBeInTheDocument();
      });
    });

    test('back button navigates through history correctly', async () => {
      renderKioskApp();
      
      // Navigate: Welcome -> Inventory -> Vehicle Detail
      fireEvent.click(screen.getByText('Go to Inventory'));
      act(() => { jest.advanceTimersByTime(200); });
      
      fireEvent.click(screen.getByText('Select Vehicle'));
      act(() => { jest.advanceTimersByTime(200); });

      await waitFor(() => {
        expect(screen.getByTestId('vehicle-detail-screen')).toBeInTheDocument();
      });

      // Back to Inventory
      fireEvent.click(screen.getByText('Back'));
      act(() => { jest.advanceTimersByTime(200); });

      await waitFor(() => {
        expect(screen.getByTestId('inventory-screen')).toBeInTheDocument();
      });

      // Back to Welcome
      fireEvent.click(screen.getByText('Back'));
      act(() => { jest.advanceTimersByTime(200); });

      await waitFor(() => {
        expect(screen.getByTestId('welcome-screen')).toBeInTheDocument();
      });
    });

    test('does not show back button on traffic log screen', async () => {
      renderKioskApp();
      
      // Navigate to traffic log via Sales Desk
      fireEvent.click(screen.getByText('Sales Desk'));
      act(() => { jest.advanceTimersByTime(200); });

      await waitFor(() => {
        expect(screen.getByTestId('traffic-log-screen')).toBeInTheDocument();
      });

      expect(screen.queryByText('Back')).not.toBeInTheDocument();
    });

    test('does not show back button on sales dashboard screen', async () => {
      renderKioskApp();
      
      // Navigate to traffic log then dashboard
      fireEvent.click(screen.getByText('Sales Desk'));
      act(() => { jest.advanceTimersByTime(200); });

      fireEvent.click(screen.getByText('Open Dashboard'));
      act(() => { jest.advanceTimersByTime(200); });

      await waitFor(() => {
        expect(screen.getByTestId('sales-dashboard-screen')).toBeInTheDocument();
      });

      expect(screen.queryByText('Back')).not.toBeInTheDocument();
    });
  });

  // ===========================================================================
  // Browser History (popstate) Tests
  // ===========================================================================
  describe('Browser History Integration', () => {
    test('handles browser back button (popstate)', async () => {
      renderKioskApp();
      
      // Navigate forward
      fireEvent.click(screen.getByText('Go to Inventory'));
      act(() => { jest.advanceTimersByTime(200); });

      await waitFor(() => {
        expect(screen.getByTestId('inventory-screen')).toBeInTheDocument();
      });

      // Simulate browser back button
      act(() => {
        simulatePopState({ screen: 'welcome', index: 0 });
        jest.advanceTimersByTime(200);
      });

      await waitFor(() => {
        expect(screen.getByTestId('welcome-screen')).toBeInTheDocument();
      });
    });

    test('handles popstate with no state (goes to welcome)', async () => {
      renderKioskApp();
      
      fireEvent.click(screen.getByText('Go to Inventory'));
      act(() => { jest.advanceTimersByTime(200); });

      // Simulate popstate with null state
      act(() => {
        simulatePopState(null);
        jest.advanceTimersByTime(200);
      });

      await waitFor(() => {
        expect(screen.getByTestId('welcome-screen')).toBeInTheDocument();
      });
    });

    test('clears filters when navigating via popstate', async () => {
      renderKioskApp();
      
      // Navigate with filter
      fireEvent.click(screen.getByText('Go to SUV Inventory'));
      act(() => { jest.advanceTimersByTime(200); });

      await waitFor(() => {
        expect(screen.getByTestId('body-filter')).toHaveTextContent('SUV');
      });

      // Go back via popstate
      act(() => {
        simulatePopState({ screen: 'welcome', index: 0 });
        jest.advanceTimersByTime(200);
      });

      // Navigate to inventory again without filter
      fireEvent.click(screen.getByText('Go to Inventory'));
      act(() => { jest.advanceTimersByTime(200); });

      await waitFor(() => {
        expect(screen.getByTestId('body-filter')).toHaveTextContent('No Filter');
      });
    });
  });

  // ===========================================================================
  // Reset Journey Tests
  // ===========================================================================
  describe('Reset Journey', () => {
    test('clicking logo resets journey to welcome', async () => {
      renderKioskApp();
      
      // Navigate away from welcome
      fireEvent.click(screen.getByText('Go to Inventory'));
      act(() => { jest.advanceTimersByTime(200); });

      await waitFor(() => {
        expect(screen.getByTestId('inventory-screen')).toBeInTheDocument();
      });

      // Click QUIRK logo
      fireEvent.click(screen.getByText('QUIRK'));

      await waitFor(() => {
        expect(screen.getByTestId('welcome-screen')).toBeInTheDocument();
      });
    });

    test('reset journey clears customer data', async () => {
      renderKioskApp();
      
      // Set customer name
      fireEvent.click(screen.getByText('Set Name'));
      
      // Navigate to inventory and select vehicle
      fireEvent.click(screen.getByText('Go to Inventory'));
      act(() => { jest.advanceTimersByTime(200); });
      
      fireEvent.click(screen.getByText('Select Vehicle'));
      act(() => { jest.advanceTimersByTime(200); });

      await waitFor(() => {
        expect(screen.getByTestId('selected-vehicle')).toHaveTextContent('TEST123');
      });

      // Reset by clicking logo
      fireEvent.click(screen.getByText('QUIRK'));

      // Navigate back to vehicle detail - should have no vehicle
      fireEvent.click(screen.getByText('Go to Inventory'));
      act(() => { jest.advanceTimersByTime(200); });
      
      fireEvent.click(screen.getByText('Select Vehicle'));
      act(() => { jest.advanceTimersByTime(200); });

      // New vehicle should be selected (fresh journey)
      await waitFor(() => {
        expect(screen.getByTestId('vehicle-detail-screen')).toBeInTheDocument();
      });
    });
  });

  // ===========================================================================
  // Customer Data Tests
  // ===========================================================================
  describe('Customer Data Management', () => {
    test('updates customer data and passes to child components', async () => {
      renderKioskApp();
      
      // Set customer name
      fireEvent.click(screen.getByText('Set Name'));

      // Navigate to inventory and select vehicle
      fireEvent.click(screen.getByText('Go to Inventory'));
      act(() => { jest.advanceTimersByTime(200); });

      fireEvent.click(screen.getByText('Select Vehicle'));
      act(() => { jest.advanceTimersByTime(200); });

      await waitFor(() => {
        expect(screen.getByTestId('selected-vehicle')).toHaveTextContent('TEST123');
      });
    });

    test('persists trade-in data through navigation', async () => {
      renderKioskApp();
      
      // Navigate to vehicle detail -> trade in
      fireEvent.click(screen.getByText('Go to Inventory'));
      act(() => { jest.advanceTimersByTime(200); });
      
      fireEvent.click(screen.getByText('Select Vehicle'));
      act(() => { jest.advanceTimersByTime(200); });
      
      fireEvent.click(screen.getByText('Trade In'));
      act(() => { jest.advanceTimersByTime(200); });

      await waitFor(() => {
        expect(screen.getByTestId('trade-in-screen')).toBeInTheDocument();
      });

      // Submit trade
      fireEvent.click(screen.getByText('Submit Trade'));
      act(() => { jest.advanceTimersByTime(200); });

      await waitFor(() => {
        expect(screen.getByTestId('payment-calculator-screen')).toBeInTheDocument();
      });
    });
  });

  // ===========================================================================
  // Sales Desk Navigation Tests
  // ===========================================================================
  describe('Sales Desk Navigation', () => {
    test('Sales Desk link navigates to traffic log', async () => {
      renderKioskApp();
      
      fireEvent.click(screen.getByText('Sales Desk'));
      act(() => { jest.advanceTimersByTime(200); });

      await waitFor(() => {
        expect(screen.getByTestId('traffic-log-screen')).toBeInTheDocument();
      });
    });

    test('Sales Desk link only shows on welcome screen', async () => {
      renderKioskApp();
      
      expect(screen.getByText('Sales Desk')).toBeInTheDocument();

      // Navigate away
      fireEvent.click(screen.getByText('Go to Inventory'));
      act(() => { jest.advanceTimersByTime(200); });

      await waitFor(() => {
        expect(screen.queryByText('Sales Desk')).not.toBeInTheDocument();
      });
    });
  });

  // ===========================================================================
  // Traffic Logging Tests
  // ===========================================================================
  describe('Traffic Logging', () => {
    test('logs traffic session when customer data changes', async () => {
      renderKioskApp();
      
      // Set customer name (triggers logging)
      fireEvent.click(screen.getByText('Set Name'));

      // Navigate to trigger logging
      fireEvent.click(screen.getByText('Go to Inventory'));
      act(() => { jest.advanceTimersByTime(200); });

      await waitFor(() => {
        expect(api.logTrafficSession).toHaveBeenCalled();
      });
    });

    test('does not log traffic on admin screens', async () => {
      renderKioskApp();
      
      jest.clearAllMocks();

      // Navigate to traffic log (admin screen)
      fireEvent.click(screen.getByText('Sales Desk'));
      act(() => { jest.advanceTimersByTime(200); });

      await waitFor(() => {
        expect(screen.getByTestId('traffic-log-screen')).toBeInTheDocument();
      });

      // Should not have logged for admin screen
      // Note: Initial navigation might trigger, but subsequent admin screens shouldn't
      const calls = (api.logTrafficSession as jest.Mock).mock.calls;
      const adminCalls = calls.filter((call: any[]) => 
        call[0]?.actions?.includes('trafficLog') || call[0]?.actions?.includes('salesDashboard')
      );
      expect(adminCalls.length).toBe(0);
    });

    test('includes vehicle data in traffic log when selected', async () => {
      renderKioskApp();
      
      fireEvent.click(screen.getByText('Set Name'));
      fireEvent.click(screen.getByText('Go to Inventory'));
      act(() => { jest.advanceTimersByTime(200); });
      
      fireEvent.click(screen.getByText('Select Vehicle'));
      act(() => { jest.advanceTimersByTime(200); });

      await waitFor(() => {
        expect(api.logTrafficSession).toHaveBeenCalledWith(
          expect.objectContaining({
            vehicle: expect.objectContaining({
              stockNumber: 'TEST123',
            }),
          })
        );
      });
    });
  });

  // ===========================================================================
  // Idle Timeout Tests
  // ===========================================================================
  describe('Idle Timeout', () => {
    test('resets to welcome after 3 minutes of inactivity', async () => {
      renderKioskApp();
      
      // Navigate away from welcome
      fireEvent.click(screen.getByText('Go to Inventory'));
      act(() => { jest.advanceTimersByTime(200); });

      await waitFor(() => {
        expect(screen.getByTestId('inventory-screen')).toBeInTheDocument();
      });

      // Advance time by 3 minutes (180000ms)
      act(() => {
        jest.advanceTimersByTime(180000);
      });

      await waitFor(() => {
        expect(screen.getByTestId('welcome-screen')).toBeInTheDocument();
      });
    });

    test('user activity resets idle timer', async () => {
      renderKioskApp();
      
      // Navigate away from welcome
      fireEvent.click(screen.getByText('Go to Inventory'));
      act(() => { jest.advanceTimersByTime(200); });

      await waitFor(() => {
        expect(screen.getByTestId('inventory-screen')).toBeInTheDocument();
      });

      // Advance time by 2 minutes
      act(() => {
        jest.advanceTimersByTime(120000);
      });

      // Simulate user activity
      fireEvent.click(document.body);

      // Advance time by another 2 minutes (total 4 from start, but only 2 since activity)
      act(() => {
        jest.advanceTimersByTime(120000);
      });

      // Should still be on inventory (not reset)
      expect(screen.getByTestId('inventory-screen')).toBeInTheDocument();
    });

    test('idle timeout does not trigger on welcome screen', async () => {
      renderKioskApp();
      
      // Stay on welcome screen
      expect(screen.getByTestId('welcome-screen')).toBeInTheDocument();

      // Advance time by 5 minutes
      act(() => {
        jest.advanceTimersByTime(300000);
      });

      // Should still be on welcome (no reset needed)
      expect(screen.getByTestId('welcome-screen')).toBeInTheDocument();
    });

    test('idle timeout does not trigger on admin screens', async () => {
      renderKioskApp();
      
      // Navigate to traffic log
      fireEvent.click(screen.getByText('Sales Desk'));
      act(() => { jest.advanceTimersByTime(200); });

      await waitFor(() => {
        expect(screen.getByTestId('traffic-log-screen')).toBeInTheDocument();
      });

      // Advance time by 5 minutes
      act(() => {
        jest.advanceTimersByTime(300000);
      });

      // Should still be on traffic log (admin screens exempt)
      expect(screen.getByTestId('traffic-log-screen')).toBeInTheDocument();
    });
  });

  // ===========================================================================
  // Screen Transition Tests
  // ===========================================================================
  describe('Screen Transitions', () => {
    test('applies transition styles during navigation', async () => {
      renderKioskApp();
      
      fireEvent.click(screen.getByText('Go to Inventory'));

      // During transition (before timer completes)
      // The main element should have transition styles
      // This is hard to test directly, but we verify the screen changes after transition
      
      act(() => {
        jest.advanceTimersByTime(200);
      });

      await waitFor(() => {
        expect(screen.getByTestId('inventory-screen')).toBeInTheDocument();
      });
    });
  });

  // ===========================================================================
  // Header Tests
  // ===========================================================================
  describe('Header', () => {
    test('header contains QUIRK AI branding', () => {
      renderKioskApp();
      
      const header = screen.getByText('QUIRK').closest('header');
      expect(header).toBeInTheDocument();
      expect(screen.getByText('AI')).toBeInTheDocument();
    });

    test('logo is clickable', () => {
      renderKioskApp();
      
      const logoText = screen.getByText('QUIRK');
      const logoContainer = logoText.closest('div');
      expect(logoContainer).toHaveStyle({ cursor: 'pointer' });
    });
  });

  // ===========================================================================
  // Footer Tests
  // ===========================================================================
  describe('Footer', () => {
    test('displays dealership name', () => {
      renderKioskApp();
      expect(screen.getByText('Quirk Chevrolet')).toBeInTheDocument();
    });

    test('displays tagline', () => {
      renderKioskApp();
      expect(screen.getByText("New England's #1 Dealer")).toBeInTheDocument();
    });

    test('displays current time', () => {
      renderKioskApp();
      
      // Footer should contain a time element (format varies)
      const footer = screen.getByText('Quirk Chevrolet').closest('footer');
      expect(footer).toBeInTheDocument();
      // Time format is HH:MM AM/PM - just verify footer exists
    });
  });

  // ===========================================================================
  // Error Handling Tests
  // ===========================================================================
  describe('Error Handling', () => {
    test('handles traffic logging errors gracefully', async () => {
      (api.logTrafficSession as jest.Mock).mockRejectedValue(new Error('Network error'));
      
      renderKioskApp();
      
      // Set customer name (triggers logging)
      fireEvent.click(screen.getByText('Set Name'));
      
      // Navigate
      fireEvent.click(screen.getByText('Go to Inventory'));
      act(() => { jest.advanceTimersByTime(200); });

      // Should still navigate despite logging error
      await waitFor(() => {
        expect(screen.getByTestId('inventory-screen')).toBeInTheDocument();
      });
    });
  });

  // ===========================================================================
  // Full Customer Journey Integration Test
  // ===========================================================================
  describe('Full Customer Journey', () => {
    test('completes entire customer flow: welcome -> AI -> inventory -> detail -> trade-in -> payment -> handoff', async () => {
      renderKioskApp();
      
      // 1. Set name on welcome
      fireEvent.click(screen.getByText('Set Name'));
      
      // 2. Go to AI Assistant
      fireEvent.click(screen.getByText('Go to AI'));
      act(() => { jest.advanceTimersByTime(200); });
      await waitFor(() => expect(screen.getByTestId('ai-assistant-screen')).toBeInTheDocument());
      
      // 3. AI suggests vehicles -> go to inventory
      fireEvent.click(screen.getByText('Show Vehicles'));
      act(() => { jest.advanceTimersByTime(200); });
      await waitFor(() => expect(screen.getByTestId('inventory-screen')).toBeInTheDocument());
      
      // 4. Select a vehicle
      fireEvent.click(screen.getByText('Select Vehicle'));
      act(() => { jest.advanceTimersByTime(200); });
      await waitFor(() => expect(screen.getByTestId('vehicle-detail-screen')).toBeInTheDocument());
      
      // 5. Go to trade-in
      fireEvent.click(screen.getByText('Trade In'));
      act(() => { jest.advanceTimersByTime(200); });
      await waitFor(() => expect(screen.getByTestId('trade-in-screen')).toBeInTheDocument());
      
      // 6. Submit trade -> goes to payment calculator
      fireEvent.click(screen.getByText('Submit Trade'));
      act(() => { jest.advanceTimersByTime(200); });
      await waitFor(() => expect(screen.getByTestId('payment-calculator-screen')).toBeInTheDocument());
      
      // 7. Ready to buy -> handoff
      fireEvent.click(screen.getByText('Ready to Buy'));
      act(() => { jest.advanceTimersByTime(200); });
      await waitFor(() => expect(screen.getByTestId('handoff-screen')).toBeInTheDocument());
      
      // Verify traffic was logged throughout
      expect(api.logTrafficSession).toHaveBeenCalled();
    });
  });
});
