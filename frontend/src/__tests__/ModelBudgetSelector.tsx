import React from 'react';
import { render, screen, waitFor, fireEvent, act, RenderResult } from '@testing-library/react';
import ModelBudgetSelector from '../components/ModelBudgetSelector';

// Mock the api module
jest.mock('../components/api', () => ({
  __esModule: true,
  default: {
    getInventory: jest.fn(),
    getModels: jest.fn(),
  },
  logTrafficSession: jest.fn().mockResolvedValue(undefined),
}));

import api from '../components/api';
import { logTrafficSession } from '../components/api';

const mockNavigateTo = jest.fn();
const mockUpdateCustomerData = jest.fn();

interface RenderProps {
  customerData?: Record<string, unknown>;
}

const renderModelBudgetSelector = (props: RenderProps = {}): RenderResult => {
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
    api.getModels.mockResolvedValue([]);
    logTrafficSession.mockResolvedValue(undefined);
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
        expect(screen.getByText('Sports Cars')).toBeInTheDocument();
      });

      // Click on Sports Cars to see model selection
      const sportsButton = screen.getByText('Sports Cars').closest('button');
      await act(async () => {
        fireEvent.click(sportsButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Corvette')).toBeInTheDocument();
      });

      // Camaro should NOT be shown because it has 0 inventory
      expect(screen.queryByText('Camaro')).not.toBeInTheDocument();
    });

    test('shows models that have inventory', async () => {
      api.getInventory.mockResolvedValue([
        { model: 'Equinox', price: 30000 },
        { model: 'Equinox', price: 32000 },
        { model: 'Tahoe', price: 55000 },
        { model: 'Blazer', price: 40000 },
      ]);

      renderModelBudgetSelector();

      await waitFor(() => {
        expect(screen.getByText('SUVs & Crossovers')).toBeInTheDocument();
      });

      // Click on SUVs category
      const suvButton = screen.getByText('SUVs & Crossovers').closest('button');
      await act(async () => {
        fireEvent.click(suvButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Equinox')).toBeInTheDocument();
        expect(screen.getByText('Tahoe')).toBeInTheDocument();
        expect(screen.getByText('Blazer')).toBeInTheDocument();
      });
    });
  });

  describe('Category Selection', () => {
    test('shows all categories with inventory', async () => {
      api.getInventory.mockResolvedValue([
        { model: 'Silverado 1500', price: 45000 },
        { model: 'Equinox', price: 30000 },
        { model: 'Corvette', price: 70000 },
        { model: 'Bolt EV', price: 35000 },
      ]);

      renderModelBudgetSelector();

      await waitFor(() => {
        expect(screen.getByText('Trucks')).toBeInTheDocument();
        expect(screen.getByText('SUVs & Crossovers')).toBeInTheDocument();
        expect(screen.getByText('Sports Cars')).toBeInTheDocument();
        expect(screen.getByText('Electric')).toBeInTheDocument();
      });
    });

    test('back button returns to category selection', async () => {
      api.getInventory.mockResolvedValue([
        { model: 'Silverado 1500', price: 45000 },
      ]);

      renderModelBudgetSelector();

      await waitFor(() => {
        expect(screen.getByText('Trucks')).toBeInTheDocument();
      });

      // Click on Trucks
      const trucksButton = screen.getByText('Trucks').closest('button');
      await act(async () => {
        fireEvent.click(trucksButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Silverado 1500')).toBeInTheDocument();
      });

      // Click back button using role selector (arrow is SVG, not text)
      const backButton = screen.getByRole('button', { name: /back/i });
      await act(async () => {
        fireEvent.click(backButton);
      });

      // Should be back at category selection
      await waitFor(() => {
        expect(screen.getByText('Trucks')).toBeInTheDocument();
      });
    });
  });

  describe('Loading State', () => {
    test('shows loading message initially', () => {
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
      await act(async () => {
        fireEvent.click(sportsButton);
      });

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
        { model: 'EQUINOX', price: 30000 },
        { model: 'TAHOE', price: 60000 },
        { model: 'TAHOE', price: 65000 },
        { model: 'TRAVERSE', price: 38000 },
        { model: 'CORVETTE', price: 70000 },
        { model: 'BOLT EV', price: 32000 },
        { model: 'BOLT EUV', price: 35000 },
      ]);

      renderModelBudgetSelector();

      // Wait for categories to load
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
        expect(consoleErrorSpy).toHaveBeenCalledWith('Error loading inventory counts:', expect.any(Error));
      });

      consoleErrorSpy.mockRestore();
    });
  });
});

describe('ModelBudgetSelector - Trade-In Model Dropdown (Local Database)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    api.getModels.mockResolvedValue([]);
    logTrafficSession.mockResolvedValue(undefined);
    // Setup inventory with Equinox (SUV) to avoid truck cab configuration step
    api.getInventory.mockResolvedValue([
      { model: 'Equinox', price: 30000 },
      { model: 'Equinox', price: 32000 },
      { model: 'Tahoe', price: 55000 },
    ]);
  });

  // Helper function to navigate to trade-in step using Equinox (no cab config step)
  const navigateToTradeInStep = async () => {
    renderModelBudgetSelector();

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.getByText('SUVs & Crossovers')).toBeInTheDocument();
    });

    // Step 1: Click SUVs category
    const categoryButton = screen.getByText('SUVs & Crossovers').closest('button');
    await act(async () => {
      fireEvent.click(categoryButton);
    });

    // Step 2: Click Equinox model
    await waitFor(() => {
      expect(screen.getByText('Equinox')).toBeInTheDocument();
    });
    const modelButton = screen.getByText('Equinox').closest('button');
    await act(async () => {
      fireEvent.click(modelButton);
    });

    // Step 3: Color selection - click continue
    await waitFor(() => {
      expect(screen.getByText('Color Preferences', { exact: false })).toBeInTheDocument();
    });
    const continueButton = screen.getByText('Continue to Budget');
    await act(async () => {
      fireEvent.click(continueButton);
    });

    // Step 4: Budget selection - click continue
    await waitFor(() => {
      expect(screen.getByText('Monthly Budget', { exact: false })).toBeInTheDocument();
    });
    const budgetContinueButton = screen.getByText('Continue');
    await act(async () => {
      fireEvent.click(budgetContinueButton);
    });

    // Step 5: Trade-in step
    await waitFor(() => {
      expect(screen.getByText('Trade-In Vehicle', { exact: false })).toBeInTheDocument();
    });
  };

  test('displays trade-in vehicle form when "Yes, I have a trade-in" is clicked', async () => {
    await navigateToTradeInStep();

    // Click "Yes, I have a trade-in"
    await act(async () => {
      fireEvent.click(screen.getByText('Yes, I have a trade-in'));
    });

    await waitFor(() => {
      expect(screen.getByText('Tell us about your trade-in vehicle')).toBeInTheDocument();
    });
  });

  test('model dropdown is disabled until make is selected', async () => {
    await navigateToTradeInStep();

    // Click "Yes, I have a trade-in"
    await act(async () => {
      fireEvent.click(screen.getByText('Yes, I have a trade-in'));
    });

    await waitFor(() => {
      expect(screen.getByText('Tell us about your trade-in vehicle')).toBeInTheDocument();
    });

    // Model dropdown should be disabled initially
    const modelSelect = screen.getByLabelText('Model');
    expect(modelSelect).toBeDisabled();
  });

  test('model dropdown enables after year and make are selected', async () => {
    await navigateToTradeInStep();

    // Click "Yes, I have a trade-in"
    await act(async () => {
      fireEvent.click(screen.getByText('Yes, I have a trade-in'));
    });

    await waitFor(() => {
      expect(screen.getByText('Tell us about your trade-in vehicle')).toBeInTheDocument();
    });

    // Select year
    const yearSelect = screen.getByLabelText('Year');
    await act(async () => {
      fireEvent.change(yearSelect, { target: { value: '2020' } });
    });

    // Select make
    const makeSelect = screen.getByLabelText('Make');
    await act(async () => {
      fireEvent.change(makeSelect, { target: { value: 'Toyota' } });
    });

    // Model dropdown should now be enabled
    const modelSelect = screen.getByLabelText('Model');
    expect(modelSelect).not.toBeDisabled();
  });

  test('populates model dropdown with models from local database', async () => {
    await navigateToTradeInStep();

    // Click "Yes, I have a trade-in"
    await act(async () => {
      fireEvent.click(screen.getByText('Yes, I have a trade-in'));
    });

    await waitFor(() => {
      expect(screen.getByText('Tell us about your trade-in vehicle')).toBeInTheDocument();
    });

    // Select year first
    const yearSelect = screen.getByLabelText('Year');
    await act(async () => {
      fireEvent.change(yearSelect, { target: { value: '2020' } });
    });

    // Select Toyota
    const makeSelect = screen.getByLabelText('Make');
    await act(async () => {
      fireEvent.change(makeSelect, { target: { value: 'Toyota' } });
    });

    // Check that Toyota models are available in dropdown
    await waitFor(() => {
      expect(screen.getByRole('option', { name: 'Camry' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Corolla' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'RAV4' })).toBeInTheDocument();
    });
  });

  test('resets model selection when make changes', async () => {
    await navigateToTradeInStep();

    // Click "Yes, I have a trade-in"
    await act(async () => {
      fireEvent.click(screen.getByText('Yes, I have a trade-in'));
    });

    await waitFor(() => {
      expect(screen.getByText('Tell us about your trade-in vehicle')).toBeInTheDocument();
    });

    // Select year
    const yearSelect = screen.getByLabelText('Year');
    await act(async () => {
      fireEvent.change(yearSelect, { target: { value: '2020' } });
    });

    // First: Select Toyota
    const makeSelect = screen.getByLabelText('Make');
    await act(async () => {
      fireEvent.change(makeSelect, { target: { value: 'Toyota' } });
    });

    // Select a Toyota model
    const modelSelect = screen.getByLabelText('Model');
    await act(async () => {
      fireEvent.change(modelSelect, { target: { value: 'Camry' } });
    });

    // Now change make to Honda
    await act(async () => {
      fireEvent.change(makeSelect, { target: { value: 'Honda' } });
    });

    // Model should be reset
    expect(modelSelect).toHaveValue('');
  });

  test('shows different models for different makes', async () => {
    await navigateToTradeInStep();

    // Click "Yes, I have a trade-in"
    await act(async () => {
      fireEvent.click(screen.getByText('Yes, I have a trade-in'));
    });

    await waitFor(() => {
      expect(screen.getByText('Tell us about your trade-in vehicle')).toBeInTheDocument();
    });

    const yearSelect = screen.getByLabelText('Year');
    await act(async () => {
      fireEvent.change(yearSelect, { target: { value: '2020' } });
    });

    const makeSelect = screen.getByLabelText('Make');

    // First: Select Ford
    await act(async () => {
      fireEvent.change(makeSelect, { target: { value: 'Ford' } });
    });

    await waitFor(() => {
      expect(screen.getByRole('option', { name: 'F-150' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Mustang' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Explorer' })).toBeInTheDocument();
    });

    // Second: Change to Chevrolet
    await act(async () => {
      fireEvent.change(makeSelect, { target: { value: 'Chevrolet' } });
    });

    await waitFor(() => {
      expect(screen.getByRole('option', { name: 'Silverado 1500' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Equinox' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Tahoe' })).toBeInTheDocument();
    });
  });

  test('includes comprehensive make list', async () => {
    await navigateToTradeInStep();

    // Click "Yes, I have a trade-in"
    await act(async () => {
      fireEvent.click(screen.getByText('Yes, I have a trade-in'));
    });

    await waitFor(() => {
      expect(screen.getByText('Tell us about your trade-in vehicle')).toBeInTheDocument();
    });

    // Check that major makes are available
    expect(screen.getByRole('option', { name: 'Toyota' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Honda' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Ford' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Chevrolet' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'BMW' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Mercedes-Benz' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Tesla' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Hyundai' })).toBeInTheDocument();
  });
});
