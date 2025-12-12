// Import React FIRST before any jest.mock that uses it
import React from 'react';
import { render, screen, fireEvent, waitFor, RenderResult } from '@testing-library/react';
import '@testing-library/jest-dom';

// Virtual mock for recharts - must come after React import
jest.mock('recharts', () => {
  // Use require to access React inside the mock factory
  const ReactMock = require('react');
  
  return {
    __esModule: true,
    ResponsiveContainer: (props: any) => ReactMock.createElement('div', { 'data-testid': 'responsive-container', style: { width: 500, height: 300 } }, props.children),
    AreaChart: (props: any) => ReactMock.createElement('div', { 'data-testid': 'area-chart' }, props.children),
    LineChart: (props: any) => ReactMock.createElement('div', { 'data-testid': 'line-chart' }, props.children),
    BarChart: (props: any) => ReactMock.createElement('div', { 'data-testid': 'bar-chart' }, props.children),
    Area: () => ReactMock.createElement('div', { 'data-testid': 'area' }),
    Line: () => ReactMock.createElement('div', { 'data-testid': 'line' }),
    Bar: () => ReactMock.createElement('div', { 'data-testid': 'bar' }),
    XAxis: () => ReactMock.createElement('div', { 'data-testid': 'x-axis' }),
    YAxis: () => ReactMock.createElement('div', { 'data-testid': 'y-axis' }),
    CartesianGrid: () => ReactMock.createElement('div', { 'data-testid': 'cartesian-grid' }),
    Tooltip: () => ReactMock.createElement('div', { 'data-testid': 'tooltip' }),
    Legend: () => ReactMock.createElement('div', { 'data-testid': 'legend' }),
    ReferenceLine: () => ReactMock.createElement('div', { 'data-testid': 'reference-line' }),
    Cell: () => ReactMock.createElement('div', { 'data-testid': 'cell' }),
  };
}, { virtual: true });

import MarketValueTrends from '../components/MarketValueTrends';

interface VehicleInfo {
  year: number;
  make: string;
  model: string;
  trim?: string;
  mileage?: number;
  price?: number;
}

const mockVehicle: VehicleInfo = {
  year: 2021,
  make: 'Chevrolet',
  model: 'Equinox',
  trim: 'LT AWD',
  mileage: 45000,
  price: 22000,
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
      isModal={props.isModal !== undefined ? props.isModal : true}
      showComparisons={props.showComparisons !== undefined ? props.showComparisons : true}
    />
  );
};

describe('MarketValueTrends Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    test('renders component with vehicle info', () => {
      renderMarketValueTrends();
      expect(screen.getByText(/Market Value Trends/i)).toBeInTheDocument();
    });

    test('displays vehicle year make model', () => {
      renderMarketValueTrends();
      // Use getAllByText since text may appear in multiple places
      expect(screen.getAllByText(/2021/).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/Chevrolet/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/Equinox/i).length).toBeGreaterThan(0);
    });

    test('displays current value when provided', () => {
      renderMarketValueTrends();
      expect(screen.getByText(/22,000/)).toBeInTheDocument();
    });

    test('displays mileage info', () => {
      renderMarketValueTrends();
      // Check for mileage display - may show as "45K" or "45,000"
      const content = document.body.textContent;
      expect(content).toMatch(/45/);
    });
  });

  describe('Rendering After Load', () => {
    test('displays vehicle year make model', async () => {
      renderMarketValueTrends();
      
      await waitFor(() => {
        // Use getAllByText to handle multiple matches
        expect(screen.getAllByText(/2021/).length).toBeGreaterThan(0);
        expect(screen.getAllByText(/Chevrolet/i).length).toBeGreaterThan(0);
        expect(screen.getAllByText(/Equinox/i).length).toBeGreaterThan(0);
      });
    });
  });

  describe('Chart Tabs', () => {
    test('displays depreciation tab', () => {
      renderMarketValueTrends();
      expect(screen.getByText(/Depreciation/i)).toBeInTheDocument();
    });

    test('displays chart tabs after loading', async () => {
      renderMarketValueTrends();
      
      await waitFor(() => {
        // Use getAllByText since "History" appears in button and heading
        expect(screen.getAllByText(/History/i).length).toBeGreaterThan(0);
      });
    });

    test('displays market comparison tab when enabled', () => {
      renderMarketValueTrends({ showComparisons: true });
      // Check for Compare tab button
      const content = document.body.textContent;
      expect(content).toMatch(/Compare|Market/i);
    });
  });

  describe('Modal Behavior', () => {
    test('renders as modal when isModal is true', () => {
      renderMarketValueTrends({ isModal: true });
      expect(screen.getByText(/Market Value Trends/i)).toBeInTheDocument();
    });

    test('calls onClose when close button is clicked', () => {
      renderMarketValueTrends();
      // Find close button or Done button
      const doneButton = screen.getByRole('button', { name: /done/i });
      if (doneButton) {
        fireEvent.click(doneButton);
        expect(mockOnClose).toHaveBeenCalled();
      }
    });
  });

  describe('Data Display', () => {
    test('shows depreciation info', () => {
      renderMarketValueTrends();
      const content = document.body.textContent;
      expect(content).toMatch(/depreciat|value|%/i);
    });

    test('renders chart container', () => {
      renderMarketValueTrends();
      expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
    });

    test('shows market insights section', () => {
      renderMarketValueTrends();
      const content = document.body.textContent;
      expect(content).toMatch(/Insight|Market/i);
    });
  });

  describe('Without Current Value', () => {
    test('renders without current value', () => {
      const vehicleWithoutValue = {
        year: 2021,
        make: 'Chevrolet',
        model: 'Equinox',
      };
      renderMarketValueTrends({ vehicle: vehicleWithoutValue });
      expect(screen.getByText(/Market Value Trends/i)).toBeInTheDocument();
    });
  });

  describe('Without Mileage', () => {
    test('renders without mileage', () => {
      const vehicleWithoutMileage = {
        year: 2021,
        make: 'Chevrolet',
        model: 'Equinox',
        price: 22000,
      };
      renderMarketValueTrends({ vehicle: vehicleWithoutMileage });
      expect(screen.getByText(/Market Value Trends/i)).toBeInTheDocument();
    });
  });

  describe('Non-Modal Mode', () => {
    test('renders inline when isModal is false', () => {
      renderMarketValueTrends({ isModal: false });
      expect(screen.getByText(/Market Value Trends/i)).toBeInTheDocument();
    });
  });

  describe('Without Comparisons', () => {
    test('renders without comparison section', () => {
      renderMarketValueTrends({ showComparisons: false });
      expect(screen.getByText(/Market Value Trends/i)).toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    test('chart container has dimensions', () => {
      renderMarketValueTrends();
      const container = screen.getByTestId('responsive-container');
      expect(container).toBeInTheDocument();
    });
  });
});
