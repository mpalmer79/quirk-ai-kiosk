import React from 'react';
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import ModelBudgetSelector from '../components/ModelBudgetSelector';

// Mock the api module - only getInventory needed now
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
        expect(consoleErrorSpy).toHaveBeenCalledWith('Error loading inventory counts:', expect.any(Error));
      });

      consoleErrorSpy.mockRestore();
    });
  });
});

describe('ModelBudgetSelector - Trade-In Model Dropdown (Local Database)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Setup inventory so we can navigate to trade-in step
    api.getInventory.mockResolvedValue([
      { model: 'Equinox', price: 30000 },
      { model: 'Equinox', price: 32000 },
      { model: 'Tahoe', price: 55000 },
    ]);
  });

  // Helper function to navigate to trade-in step
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

    const selects = screen.getAllByRole('combobox');
    const modelSelect = selects[2];

    // Model dropdown should be disabled initially
    expect(modelSelect).toBeDisabled();
  });

  test('model dropdown enables after make is selected', async () => {
    await navigateToTradeInStep();

    // Click "Yes, I have a trade-in"
    await act(async () => {
      fireEvent.click(screen.getByText('Yes, I have a trade-in'));
    });

    await waitFor(() => {
      expect(screen.getByText('Tell us about your trade-in vehicle')).toBeInTheDocument();
    });

    const selects = screen.getAllByRole('combobox');
    const makeSelect = selects[1];
    const modelSelect = selects[2];

    // Select Make - models should load instantly from local database
    await act(async () => {
      fireEvent.change(makeSelect, { target: { value: 'Toyota' } });
    });

    // Model dropdown should now be enabled
    await waitFor(() => {
      expect(modelSelect).not.toBeDisabled();
    });
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

    const selects = screen.getAllByRole('combobox');
    const makeSelect = selects[1];

    // Select Toyota
    await act(async () => {
      fireEvent.change(makeSelect, { target: { value: 'Toyota' } });
    });

    // Check dropdown has Toyota models from local database
    await waitFor(() => {
      expect(screen.getByRole('option', { name: 'Camry' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Corolla' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'RAV4' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Highlander' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Tacoma' })).toBeInTheDocument();
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

    const selects = screen.getAllByRole('combobox');
    const makeSelect = selects[1];
    const modelSelect = selects[2];

    // Select Toyota
    await act(async () => {
      fireEvent.change(makeSelect, { target: { value: 'Toyota' } });
    });

    // Select a model
    await act(async () => {
      fireEvent.change(modelSelect, { target: { value: 'Camry' } });
    });

    expect(modelSelect.value).toBe('Camry');

    // Now change make to Honda
    await act(async () => {
      fireEvent.change(makeSelect, { target: { value: 'Honda' } });
    });

    // Model should reset to empty
    await waitFor(() => {
      expect(modelSelect.value).toBe('');
    });

    // Should now show Honda models
    await waitFor(() => {
      expect(screen.getByRole('option', { name: 'Civic' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Accord' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'CR-V' })).toBeInTheDocument();
    });
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

    const selects = screen.getAllByRole('combobox');
    const makeSelect = selects[1];

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
