import React from 'react';
import { render, screen, waitFor, act, RenderResult } from '@testing-library/react';
import '@testing-library/jest-dom';

// Virtual mock for recharts - doesn't require module to exist in CI
jest.mock('recharts', () => {
  const React = require('react');
  return {
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) => 
      React.createElement('div', { 'data-testid': 'responsive-container' }, children),
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
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe('Loading State', () => {
    test('shows loading initially', () => {
      renderMarketValueTrends();
      expect(screen.getByText(/Loading market data/i)).toBeInTheDocument();
    });
  });

  describe('Rendering After Load', () => {
    test('renders component with vehicle info after loading', async () => {
      renderMarketValueTrends();
      
      // Fast-forward past loading timeout
      act(() => {
        jest.advanceTimersByTime(600);
      });
      
      await waitFor(() => {
        expect(screen.getByText('Market Value Trends')).toBeInTheDocument();
      });
    });

    test('displays vehicle year make model', async () => {
      renderMarketValueTrends();
      
      act(() => {
        jest.advanceTimersByTime(600);
      });
      
      await waitFor(() => {
        expect(screen.getByText(/2021/)).toBeInTheDocument();
        expect(screen.getByText(/Chevrolet/)).toBeInTheDocument();
        expect(screen.getByText(/Equinox/)).toBeInTheDocument();
      });
    });

    test('displays current value', async () => {
      renderMarketValueTrends();
      
      act(() => {
        jest.advanceTimersByTime(600);
      });
      
      await waitFor(() => {
        expect(screen.getByText(/22,000/)).toBeInTheDocument();
      });
    });
  });

  describe('Chart Tabs', () => {
    test('displays chart tabs after loading', async () => {
      renderMarketValueTrends();
      
      act(() => {
        jest.advanceTimersByTime(600);
      });
      
      await waitFor(() => {
        expect(screen.getByText(/History/i)).toBeInTheDocument();
      });
    });
  });

  describe('Without Optional Props', () => {
    test('renders without current value', async () => {
      const vehicleWithoutValue = {
        year: 2021,
        make: 'Chevrolet',
        model: 'Equinox',
      };
      renderMarketValueTrends({ vehicle: vehicleWithoutValue });
      
      act(() => {
        jest.advanceTimersByTime(600);
      });
      
      await waitFor(() => {
        expect(screen.getByText('Market Value Trends')).toBeInTheDocument();
      });
    });

    test('renders without mileage', async () => {
      const vehicleWithoutMileage = {
        year: 2021,
        make: 'Chevrolet',
        model: 'Equinox',
        currentValue: 22000,
      };
      renderMarketValueTrends({ vehicle: vehicleWithoutMileage });
      
      act(() => {
        jest.advanceTimersByTime(600);
      });
      
      await waitFor(() => {
        expect(screen.getByText('Market Value Trends')).toBeInTheDocument();
      });
    });

    test('renders inline when isModal is false', async () => {
      renderMarketValueTrends({ isModal: false });
      
      act(() => {
        jest.advanceTimersByTime(600);
      });
      
      await waitFor(() => {
        expect(screen.getByText('Market Value Trends')).toBeInTheDocument();
      });
    });

    test('renders without comparison section', async () => {
      renderMarketValueTrends({ showComparisons: false });
      
      act(() => {
        jest.advanceTimersByTime(600);
      });
      
      await waitFor(() => {
        expect(screen.getByText('Market Value Trends')).toBeInTheDocument();
      });
    });
  });
});
