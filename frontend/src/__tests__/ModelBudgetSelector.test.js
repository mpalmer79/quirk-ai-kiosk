import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import ModelBudgetSelector from '../components/ModelBudgetSelector';

// Mock the api module
jest.mock('../components/api', () => ({
  getInventory: jest.fn(),
  getModels: jest.fn(),
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
    api.getModels.mockResolvedValue([]);
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
    api.getModels.mockResolvedValue([]);
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

describe('ModelBudgetSelector - Trade-In Model Dropdown', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    api.getModels.mockResolvedValue([]);
    api.getInventory.mockResolvedValue([
      { model: 'Corvette', price: 70000 },
      { model: 'Corvette', price: 85000 },
    ]);
  });

  // Helper to navigate to trade-in step (Step 6)
  const navigateToTradeInStep = async () => {
    renderModelBudgetSelector();

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.getByText('Sports Cars')).toBeInTheDocument();
    });

    // Step 1: Select Sports Cars category
    const sportsButton = screen.getByText('Sports Cars').closest('button');
    sportsButton.click();

    // Step 2: Select Corvette model
    await waitFor(() => {
      expect(screen.getByText('Corvette')).toBeInTheDocument();
    });
    const corvetteButton = screen.getByText('Corvette').closest('button');
    corvetteButton.click();

    // Step 4: Color selection - click Continue
    await waitFor(() => {
      expect(screen.getByText('Continue to Budget')).toBeInTheDocument();
    });
    screen.getByText('Continue to Budget').click();

    // Step 5: Budget selection - click Continue
    await waitFor(() => {
      expect(screen.getByText('Continue')).toBeInTheDocument();
    });
    screen.getByText('Continue').click();

    // Step 6: Trade-In step
    await waitFor(() => {
      expect(screen.getByText('Yes, I have a trade-in')).toBeInTheDocument();
    });
  };

  test('shows trade-in vehicle form when "Yes, I have a trade-in" is clicked', async () => {
    await navigateToTradeInStep();

    // Click "Yes, I have a trade-in"
    screen.getByText('Yes, I have a trade-in').click();

    await waitFor(() => {
      expect(screen.getByText('Tell us about your trade-in vehicle')).toBeInTheDocument();
    });

    // Should show Year, Make, Model, Mileage fields
    expect(screen.getByText('Year')).toBeInTheDocument();
    expect(screen.getByText('Make')).toBeInTheDocument();
    expect(screen.getByText('Model')).toBeInTheDocument();
    expect(screen.getByText('Mileage')).toBeInTheDocument();
  });

  test('model dropdown is disabled until year and make are selected', async () => {
    await navigateToTradeInStep();

    // Click "Yes, I have a trade-in"
    screen.getByText('Yes, I have a trade-in').click();

    await waitFor(() => {
      expect(screen.getByText('Tell us about your trade-in vehicle')).toBeInTheDocument();
    });

    // Find the Model dropdown (third select element)
    const selects = screen.getAllByRole('combobox');
    const modelSelect = selects[2]; // Year=0, Make=1, Model=2

    // Model dropdown should be disabled initially
    expect(modelSelect).toBeDisabled();
  });

  test('model dropdown enables and shows "Select Model" after year and make are selected', async () => {
    api.getModels.mockResolvedValue(['Malibu', 'Equinox', 'Silverado 1500', 'Tahoe']);

    await navigateToTradeInStep();

    // Click "Yes, I have a trade-in"
    screen.getByText('Yes, I have a trade-in').click();

    await waitFor(() => {
      expect(screen.getByText('Tell us about your trade-in vehicle')).toBeInTheDocument();
    });

    const selects = screen.getAllByRole('combobox');
    const yearSelect = selects[0];
    const makeSelect = selects[1];
    const modelSelect = selects[2];

    // Select Year
    yearSelect.click();
    await waitFor(() => {
      expect(screen.getByText('2024')).toBeInTheDocument();
    });
    screen.getByText('2024').click();

    // Select Make
    makeSelect.click();
    await waitFor(() => {
      expect(screen.getByText('Chevrolet')).toBeInTheDocument();
    });
    screen.getByText('Chevrolet').click();

    // Model dropdown should now be enabled
    await waitFor(() => {
      expect(modelSelect).not.toBeDisabled();
    });
  });

  test('calls api.getModels with selected make when year and make are set', async () => {
    api.getModels.mockResolvedValue(['Malibu', 'Equinox', 'Silverado 1500']);

    await navigateToTradeInStep();

    // Click "Yes, I have a trade-in"
    screen.getByText('Yes, I have a trade-in').click();

    await waitFor(() => {
      expect(screen.getByText('Tell us about your trade-in vehicle')).toBeInTheDocument();
    });

    const selects = screen.getAllByRole('combobox');
    const yearSelect = selects[0];
    const makeSelect = selects[1];

    // Select Year first
    yearSelect.click();
    screen.getByText('2023').click();

    // Select Make - this should trigger getModels call
    makeSelect.click();
    screen.getByText('Toyota').click();

    await waitFor(() => {
      expect(api.getModels).toHaveBeenCalledWith('Toyota');
    });
  });

  test('populates model dropdown with models from API', async () => {
    api.getModels.mockResolvedValue(['Camry', 'Corolla', 'RAV4', 'Highlander', 'Tacoma']);

    await navigateToTradeInStep();

    // Click "Yes, I have a trade-in"
    screen.getByText('Yes, I have a trade-in').click();

    await waitFor(() => {
      expect(screen.getByText('Tell us about your trade-in vehicle')).toBeInTheDocument();
    });

    const selects = screen.getAllByRole('combobox');
    const yearSelect = selects[0];
    const makeSelect = selects[1];
    const modelSelect = selects[2];

    // Select Year
    yearSelect.click();
    screen.getByText('2022').click();

    // Select Make
    makeSelect.click();
    screen.getByText('Toyota').click();

    // Wait for models to load and check dropdown options
    await waitFor(() => {
      expect(modelSelect).not.toBeDisabled();
    });

    // Click model dropdown to see options
    modelSelect.click();

    await waitFor(() => {
      expect(screen.getByText('Camry')).toBeInTheDocument();
      expect(screen.getByText('Corolla')).toBeInTheDocument();
      expect(screen.getByText('RAV4')).toBeInTheDocument();
      expect(screen.getByText('Highlander')).toBeInTheDocument();
      expect(screen.getByText('Tacoma')).toBeInTheDocument();
    });
  });

  test('resets model selection when make changes', async () => {
    api.getModels
      .mockResolvedValueOnce(['Camry', 'Corolla', 'RAV4'])
      .mockResolvedValueOnce(['Civic', 'Accord', 'CR-V']);

    await navigateToTradeInStep();

    // Click "Yes, I have a trade-in"
    screen.getByText('Yes, I have a trade-in').click();

    await waitFor(() => {
      expect(screen.getByText('Tell us about your trade-in vehicle')).toBeInTheDocument();
    });

    const selects = screen.getAllByRole('combobox');
    const yearSelect = selects[0];
    const makeSelect = selects[1];
    const modelSelect = selects[2];

    // Select Year and Make (Toyota)
    yearSelect.click();
    screen.getByText('2023').click();
    makeSelect.click();
    screen.getByText('Toyota').click();

    await waitFor(() => {
      expect(modelSelect).not.toBeDisabled();
    });

    // Select a model
    modelSelect.click();
    await waitFor(() => {
      expect(screen.getByText('Camry')).toBeInTheDocument();
    });
    screen.getByText('Camry').click();

    // Now change make to Honda
    makeSelect.click();
    screen.getByText('Honda').click();

    // Model should reset and new models should load
    await waitFor(() => {
      expect(api.getModels).toHaveBeenCalledWith('Honda');
    });

    // Should show Honda models now
    modelSelect.click();
    await waitFor(() => {
      expect(screen.getByText('Civic')).toBeInTheDocument();
      expect(screen.getByText('Accord')).toBeInTheDocument();
    });

    // Toyota models should no longer be visible
    expect(screen.queryByText('Camry')).not.toBeInTheDocument();
  });

  test('handles api.getModels error gracefully', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    api.getModels.mockRejectedValue(new Error('Network error'));

    await navigateToTradeInStep();

    // Click "Yes, I have a trade-in"
    screen.getByText('Yes, I have a trade-in').click();

    await waitFor(() => {
      expect(screen.getByText('Tell us about your trade-in vehicle')).toBeInTheDocument();
    });

    const selects = screen.getAllByRole('combobox');
    const yearSelect = selects[0];
    const makeSelect = selects[1];
    const modelSelect = selects[2];

    // Select Year and Make
    yearSelect.click();
    screen.getByText('2023').click();
    makeSelect.click();
    screen.getByText('Ford').click();

    // Should handle error gracefully
    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error fetching trade models:', expect.any(Error));
    });

    // Model dropdown should still be functional (just empty)
    expect(modelSelect).not.toBeDisabled();

    consoleErrorSpy.mockRestore();
  });

  test('shows "Loading..." in model dropdown while fetching models', async () => {
    // Create a promise that we control
    let resolveModels;
    api.getModels.mockImplementation(() => new Promise((resolve) => {
      resolveModels = resolve;
    }));

    await navigateToTradeInStep();

    // Click "Yes, I have a trade-in"
    screen.getByText('Yes, I have a trade-in').click();

    await waitFor(() => {
      expect(screen.getByText('Tell us about your trade-in vehicle')).toBeInTheDocument();
    });

    const selects = screen.getAllByRole('combobox');
    const yearSelect = selects[0];
    const makeSelect = selects[1];

    // Select Year and Make to trigger loading
    yearSelect.click();
    screen.getByText('2023').click();
    makeSelect.click();
    screen.getByText('Chevrolet').click();

    // Should show Loading... while waiting
    await waitFor(() => {
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    // Resolve the promise
    resolveModels(['Malibu', 'Equinox']);

    // Should now show Select Model
    await waitFor(() => {
      expect(screen.getByText('Select Model')).toBeInTheDocument();
    });
  });

  test('fetches different models for different makes', async () => {
    api.getModels
      .mockResolvedValueOnce(['F-150', 'Mustang', 'Explorer', 'Escape'])
      .mockResolvedValueOnce(['Silverado 1500', 'Equinox', 'Tahoe', 'Malibu']);

    await navigateToTradeInStep();

    // Click "Yes, I have a trade-in"
    screen.getByText('Yes, I have a trade-in').click();

    await waitFor(() => {
      expect(screen.getByText('Tell us about your trade-in vehicle')).toBeInTheDocument();
    });

    const selects = screen.getAllByRole('combobox');
    const yearSelect = selects[0];
    const makeSelect = selects[1];
    const modelSelect = selects[2];

    // First: Select Ford
    yearSelect.click();
    screen.getByText('2023').click();
    makeSelect.click();
    screen.getByText('Ford').click();

    await waitFor(() => {
      expect(api.getModels).toHaveBeenCalledWith('Ford');
    });

    modelSelect.click();
    await waitFor(() => {
      expect(screen.getByText('F-150')).toBeInTheDocument();
      expect(screen.getByText('Mustang')).toBeInTheDocument();
    });

    // Second: Change to Chevrolet
    makeSelect.click();
    screen.getByText('Chevrolet').click();

    await waitFor(() => {
      expect(api.getModels).toHaveBeenCalledWith('Chevrolet');
    });

    modelSelect.click();
    await waitFor(() => {
      expect(screen.getByText('Silverado 1500')).toBeInTheDocument();
      expect(screen.getByText('Equinox')).toBeInTheDocument();
    });
  });
});
