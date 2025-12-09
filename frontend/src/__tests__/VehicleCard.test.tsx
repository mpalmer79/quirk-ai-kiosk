import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import VehicleCard from '../components/VehicleCard';
import type { Vehicle } from '../types';

// Mock the vehicleHelpers module
jest.mock('../utils/vehicleHelpers', () => ({
  getVehicleImageUrl: jest.fn(),
}));

import { getVehicleImageUrl } from '../utils/vehicleHelpers';

const mockOnClick = jest.fn();

const createMockVehicle = (overrides: Partial<Vehicle> = {}): Vehicle => ({
  id: '1',
  stockNumber: 'M12345',
  year: 2025,
  make: 'Chevrolet',
  model: 'Silverado 1500',
  trim: 'LT Crew Cab',
  exteriorColor: 'Summit White',
  interiorColor: 'Jet Black',
  price: 52000,
  msrp: 54000,
  mileage: 0,
  engine: '5.3L V8',
  transmission: 'Automatic',
  drivetrain: '4WD',
  fuelType: 'Gasoline',
  bodyStyle: 'Truck',
  status: 'In Stock',
  features: ['Trailering Package', 'Heated Seats'],
  ...overrides,
});

const renderVehicleCard = (vehicle: Vehicle = createMockVehicle(), onClick = mockOnClick) => {
  return render(<VehicleCard vehicle={vehicle} onClick={onClick} />);
};

describe('VehicleCard Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getVehicleImageUrl as jest.Mock).mockReturnValue(null);
  });

  describe('Basic Rendering', () => {
    test('renders vehicle year, make, and model', () => {
      renderVehicleCard();

      expect(screen.getByText(/2025 Chevrolet Silverado 1500/i)).toBeInTheDocument();
    });

    test('renders exterior color', () => {
      renderVehicleCard();

      expect(screen.getByText('Summit White')).toBeInTheDocument();
    });

    test('renders drivetrain', () => {
      renderVehicleCard();

      expect(screen.getByText('4WD')).toBeInTheDocument();
    });

    test('renders engine', () => {
      renderVehicleCard();

      expect(screen.getByText('5.3L V8')).toBeInTheDocument();
    });

    test('renders price formatted correctly', () => {
      renderVehicleCard();

      expect(screen.getByText('$52,000')).toBeInTheDocument();
    });

    test('renders status badge', () => {
      renderVehicleCard();

      expect(screen.getByText('In Stock')).toBeInTheDocument();
    });
  });

  describe('Image Display', () => {
    test('shows gradient fallback when no image URL', () => {
      (getVehicleImageUrl as jest.Mock).mockReturnValue(null);
      renderVehicleCard();

      // Should show model name in fallback design
      const modelTexts = screen.getAllByText(/Silverado 1500/i);
      expect(modelTexts.length).toBeGreaterThan(0);
    });

    test('shows real image when URL is available', () => {
      (getVehicleImageUrl as jest.Mock).mockReturnValue('/images/vehicles/silverado-white.jpg');
      renderVehicleCard();

      const img = screen.getByRole('img');
      expect(img).toHaveAttribute('src', '/images/vehicles/silverado-white.jpg');
    });

    test('shows image alt text with vehicle info', () => {
      (getVehicleImageUrl as jest.Mock).mockReturnValue('/images/vehicles/silverado-white.jpg');
      renderVehicleCard();

      const img = screen.getByRole('img');
      expect(img).toHaveAttribute('alt', expect.stringContaining('Silverado'));
    });

    test('falls back to gradient on image load error', async () => {
      (getVehicleImageUrl as jest.Mock).mockReturnValue('/images/vehicles/nonexistent.jpg');
      renderVehicleCard();

      const img = screen.getByRole('img');
      fireEvent.error(img);

      // After error, should show fallback with Chevy logo/icon
      await waitFor(() => {
        // The gradient fallback should now be showing
        expect(screen.queryByRole('img')).not.toBeInTheDocument();
      });
    });

    test('displays image overlay with model and year for real images', () => {
      (getVehicleImageUrl as jest.Mock).mockReturnValue('/images/vehicles/silverado-white.jpg');
      renderVehicleCard();

      // Overlay should show model
      expect(screen.getByText('Silverado 1500')).toBeInTheDocument();
    });
  });

  describe('Gradient Fallback Design', () => {
    beforeEach(() => {
      (getVehicleImageUrl as jest.Mock).mockReturnValue(null);
    });

    test('shows Chevrolet bowtie logo in fallback', () => {
      renderVehicleCard();

      // Check for SVG with bowtie path
      const svgs = document.querySelectorAll('svg');
      expect(svgs.length).toBeGreaterThan(0);
    });

    test('shows vehicle icon for trucks', () => {
      renderVehicleCard(createMockVehicle({ bodyStyle: 'Truck' }));

      // Should have truck icon SVG
      const svgs = document.querySelectorAll('svg');
      expect(svgs.length).toBeGreaterThan(0);
    });

    test('shows vehicle icon for SUVs', () => {
      renderVehicleCard(createMockVehicle({ 
        model: 'Tahoe',
        bodyStyle: 'SUV' 
      }));

      const svgs = document.querySelectorAll('svg');
      expect(svgs.length).toBeGreaterThan(0);
    });

    test('shows model name text in fallback', () => {
      renderVehicleCard();

      const modelTexts = screen.getAllByText('Silverado 1500');
      expect(modelTexts.length).toBeGreaterThan(0);
    });

    test('shows year and trim in fallback', () => {
      renderVehicleCard();

      expect(screen.getByText(/2025/i)).toBeInTheDocument();
      expect(screen.getByText(/LT Crew Cab/i)).toBeInTheDocument();
    });
  });

  describe('Click Handling', () => {
    test('calls onClick when card is clicked', () => {
      renderVehicleCard();

      const card = screen.getByText(/2025 Chevrolet Silverado 1500/i).closest('div');
      if (card) {
        fireEvent.click(card);
      }

      expect(mockOnClick).toHaveBeenCalled();
    });

    test('passes vehicle object to onClick', () => {
      const vehicle = createMockVehicle();
      renderVehicleCard(vehicle);

      const card = screen.getByText(/2025 Chevrolet Silverado 1500/i).closest('div');
      if (card) {
        fireEvent.click(card);
      }

      expect(mockOnClick).toHaveBeenCalledWith(vehicle);
    });

    test('card has pointer cursor', () => {
      renderVehicleCard();

      const card = screen.getByText(/2025 Chevrolet Silverado 1500/i)
        .closest('div[style*="cursor"]');
      expect(card).toHaveStyle({ cursor: 'pointer' });
    });
  });

  describe('Hover Effects', () => {
    test('transforms on mouse enter', () => {
      renderVehicleCard();

      const card = document.querySelector('div[style*="cursor: pointer"]');
      expect(card).toBeTruthy();

      if (card) {
        fireEvent.mouseEnter(card);
        expect(card).toHaveStyle({ transform: 'translateY(-4px)' });
      }
    });

    test('resets on mouse leave', () => {
      renderVehicleCard();

      const card = document.querySelector('div[style*="cursor: pointer"]');
      expect(card).toBeTruthy();

      if (card) {
        fireEvent.mouseEnter(card);
        fireEvent.mouseLeave(card);
        expect(card).toHaveStyle({ transform: 'translateY(0)' });
      }
    });
  });

  describe('Price Formatting', () => {
    test('formats price with commas', () => {
      renderVehicleCard(createMockVehicle({ price: 52000 }));

      expect(screen.getByText('$52,000')).toBeInTheDocument();
    });

    test('formats large prices correctly', () => {
      renderVehicleCard(createMockVehicle({ price: 125999 }));

      expect(screen.getByText('$125,999')).toBeInTheDocument();
    });

    test('handles zero price', () => {
      renderVehicleCard(createMockVehicle({ price: 0 }));

      expect(screen.getByText('$0')).toBeInTheDocument();
    });

    test('uses salePrice if price not available', () => {
      renderVehicleCard(createMockVehicle({ 
        price: undefined, 
        salePrice: 48000 
      }));

      expect(screen.getByText('$48,000')).toBeInTheDocument();
    });
  });

  describe('Status Badge', () => {
    test('shows green badge for In Stock', () => {
      renderVehicleCard(createMockVehicle({ status: 'In Stock' }));

      const badge = screen.getByText('In Stock');
      expect(badge).toHaveStyle({ background: '#e8f5e9' });
    });

    test('shows orange badge for In Transit', () => {
      renderVehicleCard(createMockVehicle({ status: 'In Transit' }));

      const badge = screen.getByText('In Transit');
      expect(badge).toHaveStyle({ background: '#fff3e0' });
    });

    test('defaults to In Stock if status not provided', () => {
      renderVehicleCard(createMockVehicle({ status: undefined }));

      expect(screen.getByText('In Stock')).toBeInTheDocument();
    });
  });

  describe('Different Vehicle Types', () => {
    test('renders correctly for Corvette', () => {
      const vehicle = createMockVehicle({
        model: 'Corvette',
        bodyStyle: 'Coupe',
        exteriorColor: 'Torch Red',
        price: 85000,
      });

      (getVehicleImageUrl as jest.Mock).mockReturnValue(null);
      renderVehicleCard(vehicle);

      expect(screen.getByText(/Corvette/i)).toBeInTheDocument();
      expect(screen.getByText('Torch Red')).toBeInTheDocument();
      expect(screen.getByText('$85,000')).toBeInTheDocument();
    });

    test('renders correctly for Equinox', () => {
      const vehicle = createMockVehicle({
        model: 'Equinox',
        bodyStyle: 'SUV',
        exteriorColor: 'Mosaic Black',
        drivetrain: 'AWD',
      });

      renderVehicleCard(vehicle);

      expect(screen.getByText(/Equinox/i)).toBeInTheDocument();
      expect(screen.getByText('Mosaic Black')).toBeInTheDocument();
      expect(screen.getByText('AWD')).toBeInTheDocument();
    });

    test('renders correctly for Bolt EV', () => {
      const vehicle = createMockVehicle({
        model: 'Bolt EV',
        bodyStyle: 'Hatchback',
        exteriorColor: 'Kinetic Blue',
        engine: 'Electric Motor',
        drivetrain: 'FWD',
      });

      renderVehicleCard(vehicle);

      expect(screen.getByText(/Bolt EV/i)).toBeInTheDocument();
      expect(screen.getByText('Electric Motor')).toBeInTheDocument();
    });
  });

  describe('Field Fallbacks', () => {
    test('shows N/A for missing exterior color', () => {
      renderVehicleCard(createMockVehicle({ exteriorColor: undefined }));

      expect(screen.getByText('N/A')).toBeInTheDocument();
    });

    test('shows N/A for missing drivetrain', () => {
      renderVehicleCard(createMockVehicle({ drivetrain: undefined }));

      const naTexts = screen.getAllByText('N/A');
      expect(naTexts.length).toBeGreaterThan(0);
    });

    test('shows N/A for missing engine', () => {
      renderVehicleCard(createMockVehicle({ engine: undefined }));

      const naTexts = screen.getAllByText('N/A');
      expect(naTexts.length).toBeGreaterThan(0);
    });

    test('handles snake_case field names', () => {
      const vehicle = {
        ...createMockVehicle(),
        exterior_color: 'Summit White',
        exteriorColor: undefined,
      };

      renderVehicleCard(vehicle as Vehicle);

      expect(screen.getByText('Summit White')).toBeInTheDocument();
    });
  });

  describe('Card Layout', () => {
    test('has correct border radius', () => {
      renderVehicleCard();

      const card = document.querySelector('div[style*="borderRadius"]');
      expect(card).toHaveStyle({ borderRadius: '12px' });
    });

    test('has box shadow', () => {
      renderVehicleCard();

      const card = document.querySelector('div[style*="boxShadow"]');
      expect(card).toBeTruthy();
    });

    test('has max width constraint', () => {
      renderVehicleCard();

      const card = document.querySelector('div[style*="maxWidth"]');
      expect(card).toHaveStyle({ maxWidth: '320px' });
    });
  });

  describe('Accessibility', () => {
    test('card is clickable with keyboard', () => {
      renderVehicleCard();

      // Card should be a clickable element
      const card = document.querySelector('div[style*="cursor: pointer"]');
      expect(card).toBeTruthy();
    });

    test('image has alt text', () => {
      (getVehicleImageUrl as jest.Mock).mockReturnValue('/images/test.jpg');
      renderVehicleCard();

      const img = screen.getByRole('img');
      expect(img).toHaveAttribute('alt');
      expect(img.getAttribute('alt')).not.toBe('');
    });
  });
});

describe('VehicleCard Gradient Logic', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getVehicleImageUrl as jest.Mock).mockReturnValue(null);
  });

  test('applies correct gradient for Corvette', () => {
    renderVehicleCard(createMockVehicle({ model: 'Corvette' }));

    // Corvette should have racing red gradient
    const imageContainer = document.querySelector('div[style*="linear-gradient"]');
    expect(imageContainer?.getAttribute('style')).toContain('#c41e3a');
  });

  test('applies correct gradient for Silverado', () => {
    renderVehicleCard(createMockVehicle({ model: 'Silverado 1500' }));

    // Silverado should have truck steel gradient
    const imageContainer = document.querySelector('div[style*="linear-gradient"]');
    expect(imageContainer?.getAttribute('style')).toContain('#2c3e50');
  });

  test('applies correct gradient for Tahoe', () => {
    renderVehicleCard(createMockVehicle({ model: 'Tahoe' }));

    // Tahoe should have SUV charcoal gradient
    const imageContainer = document.querySelector('div[style*="linear-gradient"]');
    expect(imageContainer?.getAttribute('style')).toContain('#34495e');
  });

  test('applies correct gradient for Bolt EV', () => {
    renderVehicleCard(createMockVehicle({ model: 'Bolt EV' }));

    // Bolt should have EV green gradient
    const imageContainer = document.querySelector('div[style*="linear-gradient"]');
    expect(imageContainer?.getAttribute('style')).toContain('#00b894');
  });

  test('applies correct gradient for Equinox', () => {
    renderVehicleCard(createMockVehicle({ model: 'Equinox' }));

    // Equinox should have crossover blue gradient
    const imageContainer = document.querySelector('div[style*="linear-gradient"]');
    expect(imageContainer?.getAttribute('style')).toContain('#1e3a5f');
  });

  test('applies correct gradient for Express Van', () => {
    renderVehicleCard(createMockVehicle({ model: 'Express', bodyStyle: 'Van' }));

    // Express should have commercial gray gradient
    const imageContainer = document.querySelector('div[style*="linear-gradient"]');
    expect(imageContainer?.getAttribute('style')).toContain('#636e72');
  });
});

describe('VehicleCard with Real Images', () => {
  test('displays image with correct object-fit', () => {
    (getVehicleImageUrl as jest.Mock).mockReturnValue('/images/vehicles/test.jpg');
    renderVehicleCard();

    const img = screen.getByRole('img');
    expect(img).toHaveStyle({ objectFit: 'cover' });
  });

  test('image container has fixed height', () => {
    (getVehicleImageUrl as jest.Mock).mockReturnValue('/images/vehicles/test.jpg');
    renderVehicleCard();

    const img = screen.getByRole('img');
    expect(img).toHaveStyle({ height: '180px' });
  });
});
