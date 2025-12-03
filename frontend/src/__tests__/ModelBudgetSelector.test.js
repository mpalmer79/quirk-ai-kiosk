import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import ModelBudgetSelector from '../components/ModelBudgetSelector';

// Mock the api module
jest.mock('../components/api', () => ({
  getInventory: jest.fn(),
}));

import api from '../components/api';

const mockNavigateTo = jest.fn();
const mockUpdateCustomerData = jest.fn();

const renderModelBudgetSelector = (props = {}) => {
  return render(
    <ModelBudgetSelector
      navigateTo={mockNavigateTo}
      updateCustomerData={mockUpdateCustomerData}
      customerData={{}}
      {...props}
    />
  );
};

describe('ModelBudgetSelector - Dynamic Inventory Filtering', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Models with Zero Inventory', () => {
    test('does not show Camaro when inventory has no Camaros', async () => {
      // Mock inventory with NO Camaro
      api.getInventory.mockResolvedValue([
        { model: 'Corvette', price: 70000 },
        { model: 'Corvette', price: 85000 },
        { model: 'Tahoe', price: 55000 },
        { model: 'Silverado 1500', price: 45000 },
      ]);

      renderModelBudgetSelector();

      await waitFor(() => {
        expect(screen.getByText('Trucks')).toBeInTheDocument();
      });

      // Camaro should NOT appear anywhere
      expect(screen.queryByText('Camaro')).not.toBeInTheDocument();
    });

    test('does not show Malibu when inventory has no Malibus', async () => {
      api.getInventory.mockResolvedValue([
        { model: 'Equinox', price: 30000 },
        { model: 'Tahoe', price: 55000 },
      ]);

      renderModelBudgetSelector();

      await waitFor(() => {
        expect(screen.getByText('SUVs & Crossovers')).toBeInTheDocument();
      });

      expect(screen.queryByText('Malibu')).not.toBeInTheDocument();
    });

    test('hides entire Sedans category when no sedans in inventory', async () => {
      api.getInventory.mockResolvedValue([
        { model: 'Silverado 1500', price: 45000 },
        { model: 'Tahoe', price: 55000 },
      ]);

      renderModelBudgetSelector();

      await waitFor(() => {
        expect(screen.getByText('Trucks')).toBeInTheDocument();
      });

      // Sedans category should not appear
      expect(screen.queryByText('Sedans')).not.toBeInTheDocument();
    });

    test('hides Sports Cars category when no sports cars in inventory', async () => {
      api.getInventory.mockResolvedValue([
        { model: 'Silverado 1500', price: 45000 },
        { model: 'Equinox', price: 30000 },
      ]);

      renderModelBudgetSelector();

      await waitFor(() => {
        expect(screen.getByText('Trucks')).toBeInTheDocument();
      });

      expect(screen.queryByText('Sports Cars')).not.toBeInTheDocument();
    });
  });

  describe('Models with Inventory', () => {
    test('shows Corvette when inventory has Corvettes', async () => {
      api.getInventory.mockResolvedValue([
        { model: 'Corvette', price: 70000 },
        { model: 'Corvette', price: 85000 },
        { model: 'Corvette', price: 90000 },
        { model: 'Corvette', price: 120000 },
      ]);

      renderModelBudgetSelector();

      await waitFor(() => {
        expect(screen.getByText('Sports Cars')).toBeInTheDocument();
      });

      // Sports Cars should show 1 model (just Corvette, not Camaro)
      expect(screen.getByText('1 models')).toBeInTheDocument();
    });

    test('shows correct model count for category', async () => {
      api.getInventory.mockResolvedValue([
        { model: 'Tahoe', price: 55000 },
        { model: 'Suburban', price: 65000 },
        { model: 'Equinox', price: 30000 },
        { model: 'Traverse', price: 40000 },
        { model: 'Trax', price: 22000 },
      ]);

      renderModelBudgetSelector();

      await waitFor(() => {
        expect(screen.getByText('SUVs & Crossovers')).toBeInTheDocument();
      });

      // Should show 5 SUV models available
      expect(screen.getByText('5 models')).toBeInTheDocument();
    });

    test('shows trucks when Silverado variants exist', async () => {
      api.getInventory.mockResolvedValue([
        { model: 'Silverado 1500', price: 45000 },
        { model: 'Silverado 2500HD', price: 55000 },
        { model: 'Colorado', price: 35000 },
      ]);

      renderModelBudgetSelector();

      await waitFor(() => {
        expect(screen.getByText('Trucks')).toBeInTheDocument();
      });

      expect(screen.getByText('3 models')).toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    test('shows loading state while fetching inventory', () => {
      // Never resolve the promise
      api.getInventory.mockImplementation(() => new Promise(() => {}));

      renderModelBudgetSelector();

      expect(screen.getByText('Loading available models...')).toBeInTheDocument();
    });

    test('shows categories after loading completes', async () => {
      api.getInventory.mockResolvedValue([
        { model: 'Tahoe', price: 55000 },
      ]);

      renderModelBudgetSelector();

      // Initially loading
      expect(screen.getByText('Loading available models...')).toBeInTheDocument();

      // After load
      await waitFor(() => {
        expect(screen.getByText('SUVs & Crossovers')).toBeInTheDocument();
      });

      expect(screen.queryByText('Loading available models...')).not.toBeInTheDocument();
    });
  });

  describe('Inventory Count Display', () => {
    test('displays correct vehicle count per model in stock', async () => {
      api.getInventory.mockResolvedValue([
        { model: 'Corvette', price: 70000 },
        { model: 'Corvette', price: 85000 },
        { model: 'Corvette', price: 90000 },
        { model: 'Corvette', price: 120000 },
      ]);

      renderModelBudgetSelector();

      await waitFor(() => {
        expect(screen.getByText('Sports Cars')).toBeInTheDocument();
      });

      // Click on Sports Cars to see model selection
      const sportsButton = screen.getByText('Sports Cars').closest('button');
      sportsButton.click();

      await waitFor(() => {
        expect(screen.getByText('Corvette')).toBeInTheDocument();
      });

      // Should show "4 in stock" for Corvette
      expect(screen.getByText('4 in stock')).toBeInTheDocument();
    });
  });

  describe('Real Inventory Scenario', () => {
    test('matches actual PBS inventory structure', async () => {
      // Simulate real PBS inventory data
      api.getInventory.mockResolvedValue([
        { model: 'SILVERADO 1500', price: 45000 },
        { model: 'SILVERADO 1500', price: 48000 },
        { model: 'SILVERADO 2500HD', price: 55000 },
        { model: 'SILVERADO 3500HD CC', price: 60000 },
        { model: 'COLORADO', price: 35000 },
        { model: 'TAHOE', price: 55000 },
        { model: 'SUBURBAN', price: 65000 },
        { model: 'TRAVERSE', price: 40000 },
        { model: 'EQUINOX', price: 30000 },
        { model: 'TRAILBLAZER', price: 28000 },
        { model: 'TRAX', price: 22000 },
        { model: 'CORVETTE', price: 70000 },
        { model: 'CORVETTE', price: 85000 },
        { model: 'SILVERADO EV', price: 75000 },
        { model: 'EQUINOX EV', price: 45000 },
      ]);

      renderModelBudgetSelector();

      await waitFor(() => {
        expect(screen.getByText('Trucks')).toBeInTheDocument();
      });

      // Should show all expected categories
      expect(screen.getByText('Trucks')).toBeInTheDocument();
      expect(screen.getByText('SUVs & Crossovers')).toBeInTheDocument();
      expect(screen.getByText('Sports Cars')).toBeInTheDocument();
      expect(screen.getByText('Electric')).toBeInTheDocument();

      // Should NOT show Sedans (no Malibu)
      expect(screen.queryByText('Sedans')).not.toBeInTheDocument();

      // Should NOT show Camaro anywhere (not in inventory)
      expect(screen.queryByText('Camaro')).not.toBeInTheDocument();
    });
  });

  describe('API Error Handling', () => {
    test('handles API error gracefully', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      api.getInventory.mockRejectedValue(new Error('Network error'));

      renderModelBudgetSelector();

      await waitFor(() => {
        // Should still render, just with no categories
        expect(screen.queryByText('Loading available models...')).not.toBeInTheDocument();
      });

      expect(consoleErrorSpy).toHaveBeenCalledWith('Error loading inventory counts:', expect.any(Error));
      consoleErrorSpy.mockRestore();
    });
  });
});

describe('ModelBudgetSelector - Category Selection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    api.getInventory.mockResolvedValue([
      { model: 'Silverado 1500', price: 45000 },
      { model: 'Tahoe', price: 55000 },
      { model: 'Corvette', price: 70000 },
    ]);
  });

  test('displays category selection on initial render', async () => {
    renderModelBudgetSelector();

    await waitFor(() => {
      expect(screen.getByText('What type of vehicle are you looking for?')).toBeInTheDocument();
    });
  });

  test('displays select a category subtitle', async () => {
    renderModelBudgetSelector();

    await waitFor(() => {
      expect(screen.getByText('Select a category to get started')).toBeInTheDocument();
    });
  });
});
