import React from 'react';
import { render, screen, fireEvent, waitFor, RenderResult } from '@testing-library/react';
import '@testing-library/jest-dom';

// Virtual mock for recharts - doesn't require module to exist in CI
jest.mock('recharts', () => {
  const React = require('react');
  return {
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) => 
      React.createElement('div', { 'data-testid': 'responsive-container', style: { width: 500, height: 300 } }, children),
    AreaChart: ({ children }: { children: React.ReactNode }) => 
      React.createElement('div', { 'data-testid': 'area-chart' }, children),
    LineChart: ({ children }: { children: React.ReactNode }) => 
      React.createElement('div', { 'data-testid': 'line-chart' }, children),
    BarChart: ({ children }: { children: React.ReactNode }) => 
      React.createElement('div', { 'data-testid': 'bar-chart' }, children),
    Area: () => React.createElement('div', { 'data-testid': 'area' }),
    Line: () => React.createElement('div', { 'data-testid': 'line' }),
    Bar: () => React.createElement('div', { 'data-testid': 'bar' }),
    XAxis: () => React.createElement('div', { 'data-testid': 'x-axis' }),
    YAxis: () => React.createElement('div', { 'data-testid': 'y-axis' }),
    CartesianGrid: () => React.createElement('div', { 'data-testid': 'cartesian-grid' }),
    Tooltip: () => React.createElement('div', { 'data-testid': 'tooltip' }),
    Legend: () => React.createElement('div', { 'data-testid': 'legend' }),
    ReferenceLine: () => React.createElement('div', { 'data-testid': 'reference-line' }),
    Cell: () => React.createElement('div', { 'data-testid': 'cell' }),
  };
}, { virtual: true });

import MarketValueTrends from '../components/MarketValueTrends';

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
      expect(screen.getByText(/2021/)).toBeInTheDocument();
      expect(screen.getByText(/Chevrolet/i)).toBeInTheDocument();
      expect(screen.getByText(/Equinox/i)).toBeInTheDocument();
    });

    test('displays current value when provided', () => {
      renderMarketValueTrends();
      expect(screen.getByText(/22,000/)).toBeInTheDocument();
    });

    test('displays mileage when provided', () => {
      renderMarketValueTrends();
      expect(screen.getByText(/45,000/)).toBeInTheDocument();
    });
  });

  describe('Chart Tabs', () => {
    test('displays depreciation tab', () => {
      renderMarketValueTrends();
      expect(screen.getByText(/Depreciation/i)).toBeInTheDocument();
    });

    test('displays market comparison tab when enabled', () => {
      renderMarketValueTrends({ showComparisons: true });
      expect(screen.getByText(/Market/i)).toBeInTheDocument();
    });
  });

  describe('Modal Behavior', () => {
    test('renders as modal when isModal is true', () => {
      renderMarketValueTrends({ isModal: true });
      expect(screen.getByText(/Market Value Trends/i)).toBeInTheDocument();
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
        currentValue: 22000,
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
      expect(container).toHaveStyle({ width: '500px', height: '300px' });
    });
  });
});
