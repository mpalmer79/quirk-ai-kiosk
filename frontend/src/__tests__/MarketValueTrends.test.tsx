import React from 'react';
import { render, screen, fireEvent, waitFor, RenderResult } from '@testing-library/react';
import '@testing-library/jest-dom';
import MarketValueTrends from '../components/MarketValueTrends';

// Mock Recharts to avoid canvas rendering issues in tests
jest.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="responsive-container" style={{ width: 500, height: 300 }}>
      {children}
    </div>
  ),
  AreaChart: ({ children }: { children: React.ReactNode }) => <div data-testid="area-chart">{children}</div>,
  LineChart: ({ children }: { children: React.ReactNode }) => <div data-testid="line-chart">{children}</div>,
  BarChart: ({ children }: { children: React.ReactNode }) => <div data-testid="bar-chart">{children}</div>,
  Area: () => <div data-testid="area" />,
  Line: () => <div data-testid="line" />,
  Bar: () => <div data-testid="bar" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  Legend: () => <div data-testid="legend" />,
  ReferenceLine: () => <div data-testid="reference-line" />,
  Cell: () => <div data-testid="cell" />,
}));

interface VehicleInfo {
  year: number;
  make: string;
  model: string;
  trim?: string;
  mileage?: number;
  currentValue?: number;
}

const mockVehicle: VehicleInfo = {
  year: 2021,
  make: 'Chevrolet',
  model: 'Equinox',
  trim: 'LT AWD',
  mileage: 45000,
  currentValue: 22000,
};

const mockOnClose = jest.fn();

interface RenderProps {
  vehicle?: VehicleInfo;
  onClose?: () => void;
  isModal?: boolean;
  showComparisons?: boolean;
}

const renderMarketValueTrends = (props: RenderProps = {}): RenderResult => {
  return render(
    <MarketValueTrends
      vehicle={props.vehicle || mockVehicle}
      onClose={props.onClose || mockOnClose}
      isModal={props.isModal ?? false}
      showComparisons={props.showComparisons ?? true}
    />
  );
};

describe('MarketValueTrends Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Loading State', () => {
    test('shows loading spinner initially', () => {
      renderMarketValueTrends();
      expect(screen.getByText('Loading market data...')).toBeInTheDocument();
    });

    test('hides loading after data loads', async () => {
      renderMarketValueTrends();
      
      // Fast-forward past the loading delay
      jest.advanceTimersByTime(600);
      
      await waitFor(() => {
        expect(screen.queryByText('Loading market data...')).not.toBeInTheDocument();
      });
    });
  });

  describe('Header', () => {
    test('renders component title', async () => {
      renderMarketValueTrends();
      jest.advanceTimersByTime(600);
      
      await waitFor(() => {
        expect(screen.getByText('Market Value Trends')).toBeInTheDocument();
      });
    });

    test('displays vehicle info in subtitle', async () => {
      renderMarketValueTrends();
      jest.advanceTimersByTime(600);
      
      await waitFor(() => {
        expect(screen.getByText(/2021 Chevrolet Equinox LT AWD/)).toBeInTheDocument();
      });
    });

    test('shows close button in modal mode', async () => {
      renderMarketValueTrends({ isModal: true });
      jest.advanceTimersByTime(600);
      
      await waitFor(() => {
        expect(screen.getByText('Done')).toBeInTheDocument();
      });
    });
  });

  describe('Value Summary', () => {
    test('displays current estimated value', async () => {
      renderMarketValueTrends();
      jest.advanceTimersByTime(600);
      
      await waitFor(() => {
        expect(screen.getByText('$22,000')).toBeInTheDocument();
      });
    });

    test('displays vehicle age', async () => {
      renderMarketValueTrends();
      jest.advanceTimersByTime(600);
      
      await waitFor(() => {
        expect(screen.getByText('Years Old')).toBeInTheDocument();
      });
    });

    test('displays mileage', async () => {
      renderMarketValueTrends();
      jest.advanceTimersByTime(600);
      
      await waitFor(() => {
        expect(screen.getByText('45K')).toBeInTheDocument();
        expect(screen.getByText('Miles')).toBeInTheDocument();
      });
    });

    test('displays retention percentage', async () => {
      renderMarketValueTrends();
      jest.advanceTimersByTime(600);
      
      await waitFor(() => {
        expect(screen.getByText('Retained')).toBeInTheDocument();
      });
    });
  });

  describe('Tab Navigation', () => {
    test('renders all tabs', async () => {
      renderMarketValueTrends();
      jest.advanceTimersByTime(600);
      
      await waitFor(() => {
        expect(screen.getByText('📈 Price History')).toBeInTheDocument();
        expect(screen.getByText('📉 Depreciation')).toBeInTheDocument();
        expect(screen.getByText('⚖️ Compare')).toBeInTheDocument();
      });
    });

    test('switches to depreciation tab', async () => {
      renderMarketValueTrends();
      jest.advanceTimersByTime(600);
      
      await waitFor(() => {
        expect(screen.getByText('📉 Depreciation')).toBeInTheDocument();
      });
      
      fireEvent.click(screen.getByText('📉 Depreciation'));
      
      expect(screen.getByText('Depreciation Curve')).toBeInTheDocument();
    });

    test('switches to compare tab', async () => {
      renderMarketValueTrends();
      jest.advanceTimersByTime(600);
      
      await waitFor(() => {
        expect(screen.getByText('⚖️ Compare')).toBeInTheDocument();
      });
      
      fireEvent.click(screen.getByText('⚖️ Compare'));
      
      expect(screen.getByText('Similar Vehicles')).toBeInTheDocument();
    });

    test('hides compare tab when showComparisons is false', async () => {
      renderMarketValueTrends({ showComparisons: false });
      jest.advanceTimersByTime(600);
      
      await waitFor(() => {
        expect(screen.getByText('📈 Price History')).toBeInTheDocument();
      });
      
      expect(screen.queryByText('⚖️ Compare')).not.toBeInTheDocument();
    });
  });

  describe('Price History Chart', () => {
    test('renders price history chart by default', async () => {
      renderMarketValueTrends();
      jest.advanceTimersByTime(600);
      
      await waitFor(() => {
        expect(screen.getByText('12-Month Price History')).toBeInTheDocument();
      });
    });

    test('renders responsive container', async () => {
      renderMarketValueTrends();
      jest.advanceTimersByTime(600);
      
      await waitFor(() => {
        expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
      });
    });
  });

  describe('Depreciation Chart', () => {
    test('renders MSRP in legend', async () => {
      renderMarketValueTrends();
      jest.advanceTimersByTime(600);
      
      await waitFor(() => {
        expect(screen.getByText('📉 Depreciation')).toBeInTheDocument();
      });
      
      fireEvent.click(screen.getByText('📉 Depreciation'));
      
      expect(screen.getByText(/MSRP:/)).toBeInTheDocument();
    });

    test('renders current value in legend', async () => {
      renderMarketValueTrends();
      jest.advanceTimersByTime(600);
      
      await waitFor(() => {
        expect(screen.getByText('📉 Depreciation')).toBeInTheDocument();
      });
      
      fireEvent.click(screen.getByText('📉 Depreciation'));
      
      expect(screen.getByText(/Current:/)).toBeInTheDocument();
    });
  });

  describe('Comparisons', () => {
    test('renders comparison vehicles', async () => {
      renderMarketValueTrends();
      jest.advanceTimersByTime(600);
      
      await waitFor(() => {
        expect(screen.getByText('⚖️ Compare')).toBeInTheDocument();
      });
      
      fireEvent.click(screen.getByText('⚖️ Compare'));
      
      // Should show competitor vehicles for Equinox
      await waitFor(() => {
        expect(screen.getByText('CR-V')).toBeInTheDocument();
      });
    });

    test('shows market comparison note', async () => {
      renderMarketValueTrends();
      jest.advanceTimersByTime(600);
      
      await waitFor(() => {
        expect(screen.getByText('⚖️ Compare')).toBeInTheDocument();
      });
      
      fireEvent.click(screen.getByText('⚖️ Compare'));
      
      expect(screen.getByText(/New England market/)).toBeInTheDocument();
    });
  });

  describe('Market Insights', () => {
    test('renders market insights section', async () => {
      renderMarketValueTrends();
      jest.advanceTimersByTime(600);
      
      await waitFor(() => {
        expect(screen.getByText('💡 Market Insights')).toBeInTheDocument();
      });
    });

    test('shows demand insight', async () => {
      renderMarketValueTrends();
      jest.advanceTimersByTime(600);
      
      await waitFor(() => {
        expect(screen.getByText('Strong Local Demand')).toBeInTheDocument();
      });
    });
  });

  describe('Modal Functionality', () => {
    test('calls onClose when Done button clicked', async () => {
      renderMarketValueTrends({ isModal: true });
      jest.advanceTimersByTime(600);
      
      await waitFor(() => {
        expect(screen.getByText('Done')).toBeInTheDocument();
      });
      
      fireEvent.click(screen.getByText('Done'));
      
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  describe('Different Vehicle Types', () => {
    test('handles Silverado comparisons', async () => {
      const silverado: VehicleInfo = {
        year: 2022,
        make: 'Chevrolet',
        model: 'Silverado',
        trim: 'LT',
        mileage: 30000,
        currentValue: 42000,
      };
      
      renderMarketValueTrends({ vehicle: silverado });
      jest.advanceTimersByTime(600);
      
      await waitFor(() => {
        expect(screen.getByText('⚖️ Compare')).toBeInTheDocument();
      });
      
      fireEvent.click(screen.getByText('⚖️ Compare'));
      
      // Should show truck competitors
      await waitFor(() => {
        expect(screen.getByText('F-150')).toBeInTheDocument();
      });
    });

    test('handles Tahoe comparisons', async () => {
      const tahoe: VehicleInfo = {
        year: 2020,
        make: 'Chevrolet',
        model: 'Tahoe',
        mileage: 60000,
        currentValue: 45000,
      };
      
      renderMarketValueTrends({ vehicle: tahoe });
      jest.advanceTimersByTime(600);
      
      await waitFor(() => {
        expect(screen.getByText('⚖️ Compare')).toBeInTheDocument();
      });
      
      fireEvent.click(screen.getByText('⚖️ Compare'));
      
      // Should show SUV competitors
      await waitFor(() => {
        expect(screen.getByText('Expedition')).toBeInTheDocument();
      });
    });
  });

  describe('Edge Cases', () => {
    test('handles vehicle without mileage', async () => {
      const noMileage: VehicleInfo = {
        year: 2023,
        make: 'Chevrolet',
        model: 'Equinox',
      };
      
      renderMarketValueTrends({ vehicle: noMileage });
      jest.advanceTimersByTime(600);
      
      await waitFor(() => {
        expect(screen.getByText('N/A')).toBeInTheDocument();
      });
    });

    test('handles vehicle without current value', async () => {
      const noValue: VehicleInfo = {
        year: 2022,
        make: 'Chevrolet',
        model: 'Blazer',
        mileage: 25000,
      };
      
      renderMarketValueTrends({ vehicle: noValue });
      jest.advanceTimersByTime(600);
      
      await waitFor(() => {
        // Should calculate estimated value
        expect(screen.getByText('Current Estimated Value')).toBeInTheDocument();
      });
    });

    test('handles unknown model', async () => {
      const unknownModel: VehicleInfo = {
        year: 2021,
        make: 'Chevrolet',
        model: 'FutureModel',
        mileage: 40000,
      };
      
      renderMarketValueTrends({ vehicle: unknownModel });
      jest.advanceTimersByTime(600);
      
      await waitFor(() => {
        expect(screen.getByText('Market Value Trends')).toBeInTheDocument();
      });
    });
  });

  describe('Low Mileage Premium', () => {
    test('shows low mileage insight for vehicles under 50K miles', async () => {
      const lowMileage: VehicleInfo = {
        year: 2022,
        make: 'Chevrolet',
        model: 'Equinox',
        mileage: 25000,
        currentValue: 28000,
      };
      
      renderMarketValueTrends({ vehicle: lowMileage });
      jest.advanceTimersByTime(600);
      
      await waitFor(() => {
        expect(screen.getByText('Low Mileage Premium')).toBeInTheDocument();
      });
    });
  });

  describe('High Mileage Warning', () => {
    test('shows high mileage insight for vehicles over 100K miles', async () => {
      const highMileage: VehicleInfo = {
        year: 2018,
        make: 'Chevrolet',
        model: 'Equinox',
        mileage: 120000,
        currentValue: 12000,
      };
      
      renderMarketValueTrends({ vehicle: highMileage });
      jest.advanceTimersByTime(600);
      
      await waitFor(() => {
        expect(screen.getByText('High Mileage Factor')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    test('tabs are clickable buttons', async () => {
      renderMarketValueTrends();
      jest.advanceTimersByTime(600);
      
      await waitFor(() => {
        const historyTab = screen.getByText('📈 Price History').closest('button');
        expect(historyTab?.tagName).toBe('BUTTON');
      });
    });

    test('done button is accessible', async () => {
      renderMarketValueTrends({ isModal: true });
      jest.advanceTimersByTime(600);
      
      await waitFor(() => {
        const doneButton = screen.getByText('Done');
        expect(doneButton.tagName).toBe('BUTTON');
      });
    });
  });
});

describe('MarketValueTrends Data Calculations', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('calculates correct age for vehicle', async () => {
    const currentYear = new Date().getFullYear();
    const vehicle: VehicleInfo = {
      year: currentYear - 3,
      make: 'Chevrolet',
      model: 'Equinox',
    };
    
    renderMarketValueTrends({ vehicle });
    jest.advanceTimersByTime(600);
    
    await waitFor(() => {
      expect(screen.getByText('3')).toBeInTheDocument();
    });
  });
});
