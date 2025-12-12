import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock recharts to avoid SVG rendering issues in tests
jest.mock('recharts', () => {
  const React = require('react');
  return {
    ResponsiveContainer: ({ children }: any) => React.createElement('div', { 'data-testid': 'chart-container' }, children),
    AreaChart: ({ children }: any) => React.createElement('div', { 'data-testid': 'area-chart' }, children),
    Area: () => null,
    XAxis: () => null,
    YAxis: () => null,
    CartesianGrid: () => null,
    Tooltip: () => null,
  };
});

import MarketValueTrends from '../components/MarketValueTrends';

const mockVehicle = {
  year: 2021,
  make: 'Chevrolet',
  model: 'Equinox',
  trim: 'LT AWD',
  mileage: 45000,
  price: 22000,
};

const mockOnClose = jest.fn();

describe('MarketValueTrends Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    test('renders component with title', () => {
      render(
        <MarketValueTrends
          vehicle={mockVehicle}
          onClose={mockOnClose}
          isModal={true}
        />
      );
      expect(screen.getByText(/Market Value Trends/i)).toBeInTheDocument();
    });

    test('displays vehicle info', () => {
      render(
        <MarketValueTrends
          vehicle={mockVehicle}
          onClose={mockOnClose}
          isModal={true}
        />
      );
      // Vehicle year should appear somewhere
      expect(screen.getAllByText(/2021/i).length).toBeGreaterThan(0);
    });

    test('displays current value', () => {
      render(
        <MarketValueTrends
          vehicle={mockVehicle}
          onClose={mockOnClose}
          isModal={true}
        />
      );
      const valueElements = screen.getAllByText(/22,000/);
      expect(valueElements.length).toBeGreaterThan(0);
    });
  });

  describe('Tabs', () => {
    test('displays depreciation tab', () => {
      render(
        <MarketValueTrends
          vehicle={mockVehicle}
          onClose={mockOnClose}
          isModal={true}
        />
      );
      const depreciationElements = screen.getAllByText(/Depreciation/i);
      expect(depreciationElements.length).toBeGreaterThan(0);
    });
  });

  describe('Modal Behavior', () => {
    test('renders Done button', () => {
      render(
        <MarketValueTrends
          vehicle={mockVehicle}
          onClose={mockOnClose}
          isModal={true}
        />
      );
      expect(screen.getByRole('button', { name: /done/i })).toBeInTheDocument();
    });

    test('calls onClose when Done clicked', () => {
      render(
        <MarketValueTrends
          vehicle={mockVehicle}
          onClose={mockOnClose}
          isModal={true}
        />
      );
      fireEvent.click(screen.getByRole('button', { name: /done/i }));
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  describe('Chart Container', () => {
    test('renders chart container', () => {
      render(
        <MarketValueTrends
          vehicle={mockVehicle}
          onClose={mockOnClose}
          isModal={true}
        />
      );
      const chartContainers = screen.getAllByTestId('chart-container');
      expect(chartContainers.length).toBeGreaterThan(0);
    });
  });

  describe('Without Optional Props', () => {
    test('renders without mileage', () => {
      const vehicleWithoutMileage = {
        year: 2021,
        make: 'Chevrolet',
        model: 'Equinox',
        price: 22000,
      };
      render(
        <MarketValueTrends
          vehicle={vehicleWithoutMileage}
          onClose={mockOnClose}
          isModal={true}
        />
      );
      expect(screen.getByText(/Market Value Trends/i)).toBeInTheDocument();
    });

    test('renders without price (uses default)', () => {
      const vehicleWithoutPrice = {
        year: 2021,
        make: 'Chevrolet',
        model: 'Equinox',
      };
      render(
        <MarketValueTrends
          vehicle={vehicleWithoutPrice}
          onClose={mockOnClose}
          isModal={true}
        />
      );
      expect(screen.getByText(/Market Value Trends/i)).toBeInTheDocument();
    });
  });

  describe('Non-Modal Mode', () => {
    test('renders inline when isModal is false', () => {
      render(
        <MarketValueTrends
          vehicle={mockVehicle}
          onClose={mockOnClose}
          isModal={false}
        />
      );
      expect(screen.getByText(/Market Value Trends/i)).toBeInTheDocument();
    });
  });
});
