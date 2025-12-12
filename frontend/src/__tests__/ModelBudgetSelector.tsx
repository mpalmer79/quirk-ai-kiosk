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
      api.getInventory.mockImplementation(() => new Promise(() => {}));

      renderModelBudgetSelector();

      expect(screen.getByText('Loading available models...')).toBeInTheDocument();
    });

    test('shows categories after loading completes', async () => {
      api.getInventory.mockResolvedValue([
        { model: 'Tahoe', price: 55000 },
      ]);

      renderModelBudgetSelector();

      expect(screen.getByText('Loading available models...')).toBeInTheDocument();

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

      const sportsButton = screen.getByText('Sports Cars').closest('button');
      await act(async () => {
        fireEvent.click(sportsButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Corvette')).toBeInTheDocument();
      });

      expect(screen.getByText('4 in stock')).toBeInTheDocument();
    });
  });

  describe('Real Inventory Scenario', () => {
    test('matches actual PBS inventory structure', async () => {
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

      expect(screen.getByText('SUVs & Crossovers')).toBeInTheDocument();
      expect(screen.getByText('Sports Cars')).toBeInTheDocument();
      expect(screen.getByText('Electric')).toBeInTheDocument();
    });
  });

  describe('Category Selection', () => {
    test('clicking category shows model selection', async () => {
      api.getInventory.mockResolvedValue([
        { model: 'Silverado 1500', price: 45000 },
        { model: 'Silverado 2500HD', price: 55000 },
        { model: 'Colorado', price: 35000 },
      ]);

      renderModelBudgetSelector();

      await waitFor(() => {
        expect(screen.getByText('Trucks')).toBeInTheDocument();
      });

      const trucksButton = screen.getByText('Trucks').closest('button');
      await act(async () => {
        fireEvent.click(trucksButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Silverado 1500')).toBeInTheDocument();
        expect(screen.getByText('Silverado 2500HD')).toBeInTheDocument();
        expect(screen.getByText('Colorado')).toBeInTheDocument();
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

      const trucksButton = screen.getByText('Trucks').closest('button');
      await act(async () => {
        fireEvent.click(trucksButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Silverado 1500')).toBeInTheDocument();
      });

      const backButton = screen.getByText('← Back');
      await act(async () => {
        fireEvent.click(backButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Trucks')).toBeInTheDocument();
      });
    });
  });
});

describe('ModelBudgetSelector - Trade-In Vehicle Selection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    api.getInventory.mockResolvedValue([
      { model: 'Silverado 1500', price: 45000 },
    ]);
    api.getModels.mockResolvedValue([]);
    logTrafficSession.mockResolvedValue(undefined);
  });

  const navigateToTradeInStep = async () => {
    renderModelBudgetSelector();

    await waitFor(() => {
      expect(screen.getByText('Trucks')).toBeInTheDocument();
    });

    const trucksButton = screen.getByText('Trucks').closest('button');
    await act(async () => {
      fireEvent.click(trucksButton);
    });

    await waitFor(() => {
      expect(screen.getByText('Silverado 1500')).toBeInTheDocument();
    });

    const modelButton = screen.getByText('Silverado 1500').closest('button');
    await act(async () => {
      fireEvent.click(modelButton);
    });

    await waitFor(() => {
      expect(screen.getByText('Trade-In Vehicle', { exact: false })).toBeInTheDocument();
    });
  };

  test('displays trade-in vehicle form when "Yes, I have a trade-in" is clicked', async () => {
    await navigateToTradeInStep();

    await act(async () => {
      fireEvent.click(screen.getByText('Yes, I have a trade-in'));
    });

    await waitFor(() => {
      expect(screen.getByText('Tell us about your trade-in vehicle')).toBeInTheDocument();
    });
  });

  test('model dropdown is disabled until make is selected', async () => {
    await navigateToTradeInStep();

    await act(async () => {
      fireEvent.click(screen.getByText('Yes, I have a trade-in'));
    });

    await waitFor(() => {
      expect(screen.getByText('Tell us about your trade-in vehicle')).toBeInTheDocument();
    });

    const selects = screen.getAllByRole('combobox');
    const modelSelect = selects[2];

    expect(modelSelect).toBeDisabled();
  });

  test('model dropdown enables after year and make are selected', async () => {
    api.getModels.mockResolvedValue(['Camry', 'Corolla', 'RAV4']);
    
    await navigateToTradeInStep();

    await act(async () => {
      fireEvent.click(screen.getByText('Yes, I have a trade-in'));
    });

    await waitFor(() => {
      expect(screen.getByText('Tell us about your trade-in vehicle')).toBeInTheDocument();
    });

    const selects = screen.getAllByRole('combobox');
    const yearSelect = selects[0];
    const makeSelect = selects[1];
    const modelSelect = selects[2];

    await act(async () => {
      fireEvent.change(yearSelect, { target: { value: '2022' } });
    });

    await act(async () => {
      fireEvent.change(makeSelect, { target: { value: 'Toyota' } });
    });

    await waitFor(() => {
      expect(modelSelect).not.toBeDisabled();
    });
  });

  test('populates model dropdown with models from local database', async () => {
    api.getModels.mockResolvedValue(['Camry', 'Corolla', 'RAV4', 'Highlander', 'Tacoma']);
    
    await navigateToTradeInStep();

    await act(async () => {
      fireEvent.click(screen.getByText('Yes, I have a trade-in'));
    });

    await waitFor(() => {
      expect(screen.getByText('Tell us about your trade-in vehicle')).toBeInTheDocument();
    });

    const selects = screen.getAllByRole('combobox');
    const yearSelect = selects[0];
    const makeSelect = selects[1];

    await act(async () => {
      fireEvent.change(yearSelect, { target: { value: '2022' } });
    });

    await act(async () => {
      fireEvent.change(makeSelect, { target: { value: 'Toyota' } });
    });

    await waitFor(() => {
      expect(screen.getByRole('option', { name: 'Camry' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Corolla' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'RAV4' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Highlander' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Tacoma' })).toBeInTheDocument();
    });
  });

  test('resets model selection when make changes', async () => {
    api.getModels
      .mockResolvedValueOnce(['Camry', 'Corolla', 'RAV4'])
      .mockResolvedValueOnce(['Civic', 'Accord', 'CR-V']);
    
    await navigateToTradeInStep();

    await act(async () => {
      fireEvent.click(screen.getByText('Yes, I have a trade-in'));
    });

    await waitFor(() => {
      expect(screen.getByText('Tell us about your trade-in vehicle')).toBeInTheDocument();
    });

    const selects = screen.getAllByRole('combobox');
    const yearSelect = selects[0];
    const makeSelect = selects[1];
    const modelSelect = selects[2];

    await act(async () => {
      fireEvent.change(yearSelect, { target: { value: '2022' } });
    });

    await act(async () => {
      fireEvent.change(makeSelect, { target: { value: 'Toyota' } });
    });

    await waitFor(() => {
      expect(modelSelect).not.toBeDisabled();
    });

    await act(async () => {
      fireEvent.change(modelSelect, { target: { value: 'Camry' } });
    });

    expect(modelSelect.value).toBe('Camry');

    await act(async () => {
      fireEvent.change(makeSelect, { target: { value: 'Honda' } });
    });

    await waitFor(() => {
      expect(modelSelect.value).toBe('');
    });

    await waitFor(() => {
      expect(screen.getByRole('option', { name: 'Civic' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Accord' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'CR-V' })).toBeInTheDocument();
    });
  });

  test('shows different models for different makes', async () => {
    api.getModels
      .mockResolvedValueOnce(['F-150', 'Mustang', 'Explorer', 'Escape'])
      .mockResolvedValueOnce(['Silverado 1500', 'Equinox', 'Tahoe', 'Malibu']);
    
    await navigateToTradeInStep();

    await act(async () => {
      fireEvent.click(screen.getByText('Yes, I have a trade-in'));
    });

    await waitFor(() => {
      expect(screen.getByText('Tell us about your trade-in vehicle')).toBeInTheDocument();
    });

    const selects = screen.getAllByRole('combobox');
    const yearSelect = selects[0];
    const makeSelect = selects[1];

    await act(async () => {
      fireEvent.change(yearSelect, { target: { value: '2022' } });
    });

    await act(async () => {
      fireEvent.change(makeSelect, { target: { value: 'Ford' } });
    });

    await waitFor(() => {
      expect(screen.getByRole('option', { name: 'F-150' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Mustang' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Explorer' })).toBeInTheDocument();
    });

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

    await act(async () => {
      fireEvent.click(screen.getByText('Yes, I have a trade-in'));
    });

    await waitFor(() => {
      expect(screen.getByText('Tell us about your trade-in vehicle')).toBeInTheDocument();
    });

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
