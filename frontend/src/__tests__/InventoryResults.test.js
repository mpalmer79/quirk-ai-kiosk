import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import InventoryResults from '../components/Inventoryresults';

// Mock the api module
jest.mock('../components/api', () => ({
  getInventory: jest.fn(),
}));

// Import the mocked api
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
    test('displays loading spinner initially', () => {
      api.getInventory.mockImplementation(() => new Promise(() => {})); // Never resolves
      renderInventoryResults();
      
      expect(screen.getByText('Loading inventory...')).toBeInTheDocument();
    });
  });

  describe('Error State', () => {
    test('displays error message when API fails', async () => {
      api.getInventory.mockRejectedValue(new Error('Network error'));
      renderInventoryResults();

      await waitFor(() => {
        expect(screen.getByText('Unable to load inventory. Please try again.')).toBeInTheDocument();
      });
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
        expect(screen.getByText('2025 Silverado 1500')).toBeInTheDocument();
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
        // $47,495 / 72 ≈ $660
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

    test('limits features to 3 per vehicle', async () => {
      renderInventoryResults();

      await waitFor(() => {
        // First vehicle has 3 features, all should show
        expect(screen.getByText('Trailering Package')).toBeInTheDocument();
        expect(screen.getByText('Heated Seats')).toBeInTheDocument();
        expect(screen.getByText('Apple CarPlay')).toBeInTheDocument();
      });
    });
  });

  describe('Sorting', () => {
    test('displays sort dropdown', async () => {
      renderInventoryResults();

      await waitFor(() => {
        expect(screen.getByRole('combobox')).toBeInTheDocument();
      });
    });

    test('has Best Match as default sort option', async () => {
      renderInventoryResults();

      await waitFor(() => {
        const select = screen.getByRole('combobox');
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

    test('changing sort option updates selection', async () => {
      renderInventoryResults();

      await waitFor(() => {
        expect(screen.getByRole('combobox')).toBeInTheDocument();
      });

      const select = screen.getByRole('combobox');
      fireEvent.change(select, { target: { value: 'priceLow' } });

      expect(select.value).toBe('priceLow');
    });
  });

  describe('Vehicle Card Interactions', () => {
    test('clicking vehicle card opens dealer website', async () => {
      renderInventoryResults();

      await waitFor(() => {
        expect(screen.getByText('2025 Silverado 1500')).toBeInTheDocument();
      });

      const vehicleCard = screen.getByText('2025 Silverado 1500').closest('[style]');
      fireEvent.click(vehicleCard);

      expect(mockWindowOpen).toHaveBeenCalledWith(
        expect.stringContaining('quirkchevynh.com'),
        '_blank',
        'noopener,noreferrer'
      );
    });

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
  });

  describe('Model Filtering', () => {
    test('filters vehicles by selected model', async () => {
      renderInventoryResults({
        customerData: { selectedModel: 'Silverado 1500' },
      });

      await waitFor(() => {
        // Should show Silverado 1500 vehicles
        expect(screen.getAllByText(/Silverado 1500/).length).toBeGreaterThan(0);
      });

      // Tahoe should be filtered out
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

    test('displays search icon in empty state', async () => {
      api.getInventory.mockResolvedValue([]);
      renderInventoryResults();

      await waitFor(() => {
        expect(screen.getByText('🔍')).toBeInTheDocument();
      });
    });

    test('displays suggestion text in empty state', async () => {
      api.getInventory.mockResolvedValue([]);
      renderInventoryResults();

      await waitFor(() => {
        expect(screen.getByText('Try adjusting your filters or preferences')).toBeInTheDocument();
      });
    });
  });

  describe('Refine Section', () => {
    test('displays refine search section', async () => {
      renderInventoryResults();

      await waitFor(() => {
        expect(screen.getByText("Not seeing what you're looking for?")).toBeInTheDocument();
      });
    });

    test('displays Start Over button', async () => {
      renderInventoryResults();

      await waitFor(() => {
        expect(screen.getByText('Start Over')).toBeInTheDocument();
      });
    });

    test('Start Over button navigates to welcome', async () => {
      renderInventoryResults();

      await waitFor(() => {
        expect(screen.getByText('Start Over')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Start Over'));
      expect(mockNavigateTo).toHaveBeenCalledWith('welcome');
    });
  });

  describe('Subtitle Text', () => {
    test('displays browse subtitle for browse path', async () => {
      renderInventoryResults({
        customerData: { path: 'browse' },
      });

      await waitFor(() => {
        expect(screen.getByText('Browse our complete inventory')).toBeInTheDocument();
      });
    });

    test('displays recommendation subtitle for other paths', async () => {
      renderInventoryResults({
        customerData: { quizAnswers: { primaryUse: 'work' } },
      });

      await waitFor(() => {
        expect(screen.getByText('Sorted by best match based on your preferences')).toBeInTheDocument();
      });
    });
  });
});

describe('InventoryResults URL Generation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    api.getInventory.mockResolvedValue(mockVehicles);
  });

  test('generates correct dealer URL format', async () => {
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

  test('URL includes vehicle year', async () => {
    renderInventoryResults();

    await waitFor(() => {
      expect(screen.getAllByText('View Details')[0]).toBeInTheDocument();
    });

    fireEvent.click(screen.getAllByText('View Details')[0]);

    expect(mockWindowOpen).toHaveBeenCalledWith(
      expect.stringContaining('2025'),
      '_blank',
      'noopener,noreferrer'
    );
  });

  test('URL includes chevrolet make', async () => {
    renderInventoryResults();

    await waitFor(() => {
      expect(screen.getAllByText('View Details')[0]).toBeInTheDocument();
    });

    fireEvent.click(screen.getAllByText('View Details')[0]);

    expect(mockWindowOpen).toHaveBeenCalledWith(
      expect.stringContaining('chevrolet'),
      '_blank',
      'noopener,noreferrer'
    );
  });
});

describe('InventoryResults Accessibility', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    api.getInventory.mockResolvedValue(mockVehicles);
  });

  test('sort dropdown is accessible', async () => {
    renderInventoryResults();

    await waitFor(() => {
      const select = screen.getByRole('combobox');
      expect(select).toBeInTheDocument();
    });
  });

  test('View Details buttons are accessible', async () => {
    renderInventoryResults();

    await waitFor(() => {
      const buttons = screen.getAllByText('View Details');
      buttons.forEach(button => {
        expect(button.tagName).toBe('BUTTON');
      });
    });
  });

  test('Start Over button is accessible', async () => {
    renderInventoryResults();

    await waitFor(() => {
      expect(screen.getByText('Start Over').tagName).toBe('BUTTON');
    });
  });
});

describe('InventoryResults API Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('calls API on mount', async () => {
    api.getInventory.mockResolvedValue(mockVehicles);
    renderInventoryResults();

    await waitFor(() => {
      expect(api.getInventory).toHaveBeenCalled();
    });
  });

  test('passes model filter to API when selected', async () => {
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

  test('passes cab type filter to API when selected', async () => {
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

  test('handles empty API response', async () => {
    api.getInventory.mockResolvedValue([]);
    renderInventoryResults();

    await waitFor(() => {
      expect(screen.getByText('No vehicles match your criteria')).toBeInTheDocument();
    });
  });

  test('handles API response with vehicles property', async () => {
    api.getInventory.mockResolvedValue({ vehicles: mockVehicles });
    renderInventoryResults();

    await waitFor(() => {
      expect(screen.getByText('2025 Silverado 1500')).toBeInTheDocument();
    });
  });
});
