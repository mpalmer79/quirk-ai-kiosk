import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import InventoryResults from '../components/Inventoryresults';

// Mock the api module
jest.mock('../components/api', () => ({
  getInventory: jest.fn(),
}));

import api from '../components/api';

// Mock window.open
const mockWindowOpen = jest.fn();
window.open = mockWindowOpen;

const mockNavigateTo = jest.fn();
const mockUpdateCustomerData = jest.fn();

const mockVehicles = [
  {
    id: '1',
    stockNumber: 'A1234',
    year: 2025,
    model: 'Silverado 1500',
    trim: 'LT Crew Cab',
    exteriorColor: 'Summit White',
    price: 47495,
    status: 'In Stock',
    matchScore: 95,
    features: ['Trailering Package', 'Heated Seats', 'Apple CarPlay'],
    vin: '1GCUDDED5RZ123456',
  },
  {
    id: '2',
    stockNumber: 'B5678',
    year: 2025,
    model: 'Silverado 1500',
    trim: 'RST Crew Cab',
    exteriorColor: 'Black',
    price: 52995,
    status: 'In Stock',
    matchScore: 88,
    features: ['Sport Package', 'Sunroof'],
    vin: '1GCUDDED5RZ789012',
  },
  {
    id: '3',
    stockNumber: 'C9012',
    year: 2025,
    model: 'Tahoe',
    trim: 'Z71',
    exteriorColor: 'Red',
    price: 62995,
    status: 'In Transit',
    matchScore: 75,
    features: [],
    vin: '1GNSKCKD5RR123456',
  },
];

const defaultCustomerData = {};

const renderInventoryResults = (props = {}) => {
  return render(
    <InventoryResults
      navigateTo={mockNavigateTo}
      updateCustomerData={mockUpdateCustomerData}
      customerData={{ ...defaultCustomerData, ...props.customerData }}
      {...props}
    />
  );
};

describe('InventoryResults Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    api.getInventory.mockResolvedValue(mockVehicles);
  });

  describe('Loading State', () => {
    test('displays loading text while fetching', async () => {
      // Delay resolution to catch loading state
      api.getInventory.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve(mockVehicles), 100))
      );
      
      renderInventoryResults();
      
      // Component should show loading immediately (loading defaults to true)
      expect(screen.getByText('Loading inventory...')).toBeInTheDocument();
      
      // Wait for load to complete - use getAllByText since there are 2 Silverados
      await waitFor(() => {
        expect(screen.getAllByText('2025 Silverado 1500').length).toBeGreaterThan(0);
      });
    });
  });

  describe('Error State', () => {
    // Mock console.error only for error tests - component legitimately logs errors
    let consoleErrorSpy;
    
    beforeEach(() => {
      consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    });
    
    afterEach(() => {
      consoleErrorSpy.mockRestore();
    });

    test('displays error message when API fails', async () => {
      api.getInventory.mockRejectedValue(new Error('Network error'));
      renderInventoryResults();

      await waitFor(() => {
        expect(screen.getByText('Unable to load inventory. Please try again.')).toBeInTheDocument();
      });
      
      expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to fetch vehicles:', expect.any(Error));
    });

    test('displays retry button on error', async () => {
      api.getInventory.mockRejectedValue(new Error('Network error'));
      renderInventoryResults();

      await waitFor(() => {
        expect(screen.getByText('Try Again')).toBeInTheDocument();
      });
    });

    test('displays error icon on error', async () => {
      api.getInventory.mockRejectedValue(new Error('Network error'));
      renderInventoryResults();

      await waitFor(() => {
        expect(screen.getByText('⚠️')).toBeInTheDocument();
      });
    });
  });

  describe('Successful Data Load', () => {
    test('displays vehicles after loading', async () => {
      renderInventoryResults();

      await waitFor(() => {
        expect(screen.getAllByText('2025 Silverado 1500').length).toBeGreaterThan(0);
      });
    });

    test('displays vehicle count', async () => {
      renderInventoryResults();

      await waitFor(() => {
        expect(screen.getByText(/\(3\)/)).toBeInTheDocument();
      });
    });

    test('displays stock numbers', async () => {
      renderInventoryResults();

      await waitFor(() => {
        expect(screen.getByText('STK# A1234')).toBeInTheDocument();
        expect(screen.getByText('STK# B5678')).toBeInTheDocument();
      });
    });

    test('displays vehicle trims', async () => {
      renderInventoryResults();

      await waitFor(() => {
        expect(screen.getByText('LT Crew Cab')).toBeInTheDocument();
        expect(screen.getByText('RST Crew Cab')).toBeInTheDocument();
      });
    });

    test('displays vehicle prices', async () => {
      renderInventoryResults();

      await waitFor(() => {
        expect(screen.getByText('$47,495')).toBeInTheDocument();
        expect(screen.getByText('$52,995')).toBeInTheDocument();
      });
    });

    test('displays exterior colors', async () => {
      renderInventoryResults();

      await waitFor(() => {
        expect(screen.getByText('Summit White')).toBeInTheDocument();
        expect(screen.getByText('Black')).toBeInTheDocument();
      });
    });

    test('displays vehicle status', async () => {
      renderInventoryResults();

      await waitFor(() => {
        const inStockElements = screen.getAllByText('In Stock');
        expect(inStockElements.length).toBeGreaterThan(0);
      });
    });

    test('displays estimated monthly payment', async () => {
      renderInventoryResults();

      await waitFor(() => {
        expect(screen.getByText('$660/mo')).toBeInTheDocument();
      });
    });
  });

  describe('Page Title', () => {
    test('displays "All Inventory" for browse path', async () => {
      renderInventoryResults({
        customerData: { path: 'browse' },
      });

      await waitFor(() => {
        expect(screen.getByText(/All Inventory/)).toBeInTheDocument();
      });
    });

    test('displays "Recommended For You" when quiz answers exist', async () => {
      renderInventoryResults({
        customerData: { quizAnswers: { primaryUse: 'commute' } },
      });

      await waitFor(() => {
        expect(screen.getByText(/Recommended For You/)).toBeInTheDocument();
      });
    });

    test('displays model-specific title when model selected', async () => {
      renderInventoryResults({
        customerData: { selectedModel: 'Silverado 1500' },
      });

      await waitFor(() => {
        expect(screen.getByText(/Silverado 1500 Inventory/)).toBeInTheDocument();
      });
    });
  });

  describe('Match Score Display', () => {
    test('displays match scores when quiz answers exist', async () => {
      renderInventoryResults({
        customerData: { quizAnswers: { primaryUse: 'commute' } },
      });

      await waitFor(() => {
        expect(screen.getByText('95%')).toBeInTheDocument();
      });
    });

    test('displays match label with score', async () => {
      renderInventoryResults({
        customerData: { quizAnswers: { primaryUse: 'commute' } },
      });

      await waitFor(() => {
        const matchLabels = screen.getAllByText('Match');
        expect(matchLabels.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Features Display', () => {
    test('displays vehicle features as tags', async () => {
      renderInventoryResults();

      await waitFor(() => {
        expect(screen.getByText('Trailering Package')).toBeInTheDocument();
        expect(screen.getByText('Heated Seats')).toBeInTheDocument();
      });
    });

    test('displays up to 3 features per vehicle', async () => {
      renderInventoryResults();

      await waitFor(() => {
        expect(screen.getByText('Trailering Package')).toBeInTheDocument();
        expect(screen.getByText('Heated Seats')).toBeInTheDocument();
        expect(screen.getByText('Apple CarPlay')).toBeInTheDocument();
      });
    });
  });

  describe('Sorting', () => {
    test('displays sort dropdown with default value', async () => {
      renderInventoryResults();

      await waitFor(() => {
        const select = screen.getByRole('combobox');
        expect(select).toBeInTheDocument();
        expect(select.value).toBe('recommended');
      });
    });

    test('displays all sort options', async () => {
      renderInventoryResults();

      await waitFor(() => {
        expect(screen.getByText('Best Match')).toBeInTheDocument();
        expect(screen.getByText('Price: Low to High')).toBeInTheDocument();
        expect(screen.getByText('Price: High to Low')).toBeInTheDocument();
        expect(screen.getByText('Newest First')).toBeInTheDocument();
      });
    });

    test('changing sort updates selection without refetching', async () => {
      renderInventoryResults();

      await waitFor(() => {
        expect(screen.getByRole('combobox')).toBeInTheDocument();
      });

      const initialCallCount = api.getInventory.mock.calls.length;
      
      const select = screen.getByRole('combobox');
      fireEvent.change(select, { target: { value: 'priceLow' } });

      expect(select.value).toBe('priceLow');
      // Verify no additional API call was made (client-side sort)
      expect(api.getInventory.mock.calls.length).toBe(initialCallCount);
    });
  });

  describe('Vehicle Card Interactions', () => {
    test('View Details button opens dealer website', async () => {
      renderInventoryResults();

      await waitFor(() => {
        expect(screen.getAllByText('View Details')[0]).toBeInTheDocument();
      });

      fireEvent.click(screen.getAllByText('View Details')[0]);

      expect(mockWindowOpen).toHaveBeenCalledWith(
        expect.stringContaining('quirkchevynh.com'),
        '_blank',
        'noopener,noreferrer'
      );
    });

    test('clicking vehicle card opens dealer website', async () => {
      renderInventoryResults();

      await waitFor(() => {
        expect(screen.getByText('LT Crew Cab')).toBeInTheDocument();
      });

      // Click the card (parent of trim text)
      const trim = screen.getByText('LT Crew Cab');
      const card = trim.closest('div[style*="cursor"]');
      fireEvent.click(card);

      expect(mockWindowOpen).toHaveBeenCalled();
    });
  });

  describe('Model Filtering', () => {
    test('filters vehicles by selected model', async () => {
      renderInventoryResults({
        customerData: { selectedModel: 'Silverado 1500' },
      });

      await waitFor(() => {
        expect(screen.getAllByText(/Silverado 1500/).length).toBeGreaterThan(0);
      });

      expect(screen.queryByText('2025 Tahoe')).not.toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    test('displays no results message when no vehicles match', async () => {
      api.getInventory.mockResolvedValue([]);
      renderInventoryResults();

      await waitFor(() => {
        expect(screen.getByText('No vehicles match your criteria')).toBeInTheDocument();
      });
    });

    test('displays search icon and suggestion in empty state', async () => {
      api.getInventory.mockResolvedValue([]);
      renderInventoryResults();

      await waitFor(() => {
        expect(screen.getByText('🔍')).toBeInTheDocument();
        expect(screen.getByText('Try adjusting your filters or preferences')).toBeInTheDocument();
      });
    });
  });

  describe('Navigation', () => {
    test('Start Over button navigates to welcome', async () => {
      renderInventoryResults();

      await waitFor(() => {
        expect(screen.getByText('Start Over')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Start Over'));
      expect(mockNavigateTo).toHaveBeenCalledWith('welcome');
    });
  });
});

describe('InventoryResults URL Generation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    api.getInventory.mockResolvedValue(mockVehicles);
  });

  test('generates dealer URL with correct format', async () => {
    renderInventoryResults();

    await waitFor(() => {
      expect(screen.getAllByText('View Details')[0]).toBeInTheDocument();
    });

    fireEvent.click(screen.getAllByText('View Details')[0]);

    expect(mockWindowOpen).toHaveBeenCalledWith(
      expect.stringMatching(/https:\/\/www\.quirkchevynh\.com\/inventory\/.+\//),
      '_blank',
      'noopener,noreferrer'
    );
  });

 test('URL includes make and model', async () => {
    renderInventoryResults();

    await waitFor(() => {
      expect(screen.getAllByText('View Details')[0]).toBeInTheDocument();
    });

    fireEvent.click(screen.getAllByText('View Details')[0]);

    const call = mockWindowOpen.mock.calls[0][0];
    expect(call).toContain('chevrolet');
    expect(call).toContain('silverado');
  });

    fireEvent.click(screen.getAllByText('View Details')[0]);

    const call = mockWindowOpen.mock.calls[0][0];
    expect(call).toContain('2025');
    expect(call).toContain('chevrolet');
  });
});

describe('InventoryResults API Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('calls API once on mount', async () => {
    api.getInventory.mockResolvedValue(mockVehicles);
    renderInventoryResults();

    await waitFor(() => {
      expect(screen.getAllByText('2025 Silverado 1500').length).toBeGreaterThan(0);
    });

    expect(api.getInventory).toHaveBeenCalledTimes(1);
  });

  test('passes model filter to API', async () => {
    api.getInventory.mockResolvedValue(mockVehicles);
    renderInventoryResults({
      customerData: { selectedModel: 'Silverado 1500' },
    });

    await waitFor(() => {
      expect(api.getInventory).toHaveBeenCalledWith(
        expect.objectContaining({ model: 'Silverado 1500' })
      );
    });
  });

  test('passes cab type filter to API', async () => {
    api.getInventory.mockResolvedValue(mockVehicles);
    renderInventoryResults({
      customerData: { selectedCab: 'Crew Cab' },
    });

    await waitFor(() => {
      expect(api.getInventory).toHaveBeenCalledWith(
        expect.objectContaining({ cabType: 'Crew Cab' })
      );
    });
  });

  test('handles API response with vehicles property', async () => {
    api.getInventory.mockResolvedValue({ vehicles: mockVehicles });
    renderInventoryResults();

    await waitFor(() => {
      expect(screen.getAllByText('2025 Silverado 1500').length).toBeGreaterThan(0);
    });
  });
});

describe('InventoryResults Accessibility', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    api.getInventory.mockResolvedValue(mockVehicles);
  });

  test('interactive elements are proper buttons', async () => {
    renderInventoryResults();

    await waitFor(() => {
      expect(screen.getByText('Start Over').tagName).toBe('BUTTON');
      screen.getAllByText('View Details').forEach(btn => {
        expect(btn.tagName).toBe('BUTTON');
      });
    });
  });

  test('sort dropdown is accessible', async () => {
    renderInventoryResults();

    await waitFor(() => {
      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });
  });
});
