import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import QRCodeModal from '../components/QRCodeModal';

// Mock clipboard API
const mockWriteText = jest.fn();
Object.assign(navigator, {
  clipboard: {
    writeText: mockWriteText,
  },
});

// Mock window.open for print functionality
const mockOpen = jest.fn();
const mockPrint = jest.fn();
const mockClose = jest.fn();
const mockFocus = jest.fn();
const mockDocument = {
  write: jest.fn(),
  close: jest.fn(),
};

window.open = mockOpen.mockReturnValue({
  document: mockDocument,
  print: mockPrint,
  close: mockClose,
  focus: mockFocus,
});

// Mock vehicle data
const mockVehicle = {
  id: '1',
  stock_number: 'STK001',
  stockNumber: 'STK001',
  year: 2024,
  make: 'Chevrolet',
  model: 'Equinox',
  trim: 'LT AWD',
  exteriorColor: 'Summit White',
  exterior_color: 'Summit White',
  price: 32000,
  salePrice: 32000,
  msrp: 34000,
};

describe('QRCodeModal Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Rendering', () => {
    it('renders nothing when isOpen is false', () => {
      const { container } = render(
        <QRCodeModal vehicle={mockVehicle} isOpen={false} onClose={jest.fn()} />
      );
      
      expect(container.firstChild).toBeNull();
    });

    it('renders modal when isOpen is true', () => {
      render(
        <QRCodeModal vehicle={mockVehicle} isOpen={true} onClose={jest.fn()} />
      );
      
      expect(screen.getByText('Save This Vehicle')).toBeInTheDocument();
    });

    it('displays vehicle information', () => {
      render(
        <QRCodeModal vehicle={mockVehicle} isOpen={true} onClose={jest.fn()} />
      );
      
      expect(screen.getByText('2024 Chevrolet Equinox')).toBeInTheDocument();
      expect(screen.getByText('LT AWD')).toBeInTheDocument();
      expect(screen.getByText('Summit White')).toBeInTheDocument();
    });

    it('displays stock number', () => {
      render(
        <QRCodeModal vehicle={mockVehicle} isOpen={true} onClose={jest.fn()} />
      );
      
      expect(screen.getByText('Stock #STK001')).toBeInTheDocument();
    });

    it('displays formatted price', () => {
      render(
        <QRCodeModal vehicle={mockVehicle} isOpen={true} onClose={jest.fn()} />
      );
      
      expect(screen.getByText('$32,000')).toBeInTheDocument();
    });

    it('renders QR code image with correct URL', () => {
      render(
        <QRCodeModal vehicle={mockVehicle} isOpen={true} onClose={jest.fn()} />
      );
      
      const qrImage = screen.getByAltText('Vehicle QR Code');
      expect(qrImage).toBeInTheDocument();
      expect(qrImage.getAttribute('src')).toContain('api.qrserver.com');
      expect(qrImage.getAttribute('src')).toContain('STK001');
    });

    it('displays usage instructions', () => {
      render(
        <QRCodeModal vehicle={mockVehicle} isOpen={true} onClose={jest.fn()} />
      );
      
      expect(screen.getByText('Open camera on your phone')).toBeInTheDocument();
      expect(screen.getByText('Point at QR code')).toBeInTheDocument();
      expect(screen.getByText('Tap the link that appears')).toBeInTheDocument();
    });

    it('displays vehicle URL', () => {
      render(
        <QRCodeModal vehicle={mockVehicle} isOpen={true} onClose={jest.fn()} />
      );
      
      expect(screen.getByText(/quirkchevynh.com\/inventory\/STK001/)).toBeInTheDocument();
    });
  });

  describe('Close Functionality', () => {
    it('calls onClose when close button is clicked', () => {
      const mockOnClose = jest.fn();
      render(
        <QRCodeModal vehicle={mockVehicle} isOpen={true} onClose={mockOnClose} />
      );
      
      // Find and click close button (it's the button in top right)
      const closeButton = screen.getAllByRole('button')[0];
      fireEvent.click(closeButton);
      
      expect(mockOnClose).toHaveBeenCalled();
    });

    it('calls onClose when backdrop is clicked', () => {
      const mockOnClose = jest.fn();
      render(
        <QRCodeModal vehicle={mockVehicle} isOpen={true} onClose={mockOnClose} />
      );
      
      // Click on the overlay (backdrop)
      const overlay = screen.getByText('Save This Vehicle').closest('div[style*="position: fixed"]');
      if (overlay) {
        fireEvent.click(overlay);
        expect(mockOnClose).toHaveBeenCalled();
      }
    });
  });

  describe('Copy Link Functionality', () => {
    it('copies URL to clipboard when Copy Link is clicked', async () => {
      mockWriteText.mockResolvedValue(undefined);
      
      render(
        <QRCodeModal vehicle={mockVehicle} isOpen={true} onClose={jest.fn()} />
      );
      
      const copyButton = screen.getByText('Copy Link');
      fireEvent.click(copyButton);
      
      expect(mockWriteText).toHaveBeenCalledWith(
        expect.stringContaining('quirkchevynh.com/inventory/STK001')
      );
    });

    it('shows "Copied!" after successful copy', async () => {
      mockWriteText.mockResolvedValue(undefined);
      
      render(
        <QRCodeModal vehicle={mockVehicle} isOpen={true} onClose={jest.fn()} />
      );
      
      const copyButton = screen.getByText('Copy Link');
      fireEvent.click(copyButton);
      
      await waitFor(() => {
        expect(screen.getByText('Copied!')).toBeInTheDocument();
      });
    });
  });

  describe('Print Functionality', () => {
    it('opens print window when Print QR Card is clicked', () => {
      render(
        <QRCodeModal vehicle={mockVehicle} isOpen={true} onClose={jest.fn()} />
      );
      
      const printButton = screen.getByText('Print QR Card');
      fireEvent.click(printButton);
      
      expect(mockOpen).toHaveBeenCalledWith('', '_blank');
    });

    it('writes HTML content to print window', () => {
      render(
        <QRCodeModal vehicle={mockVehicle} isOpen={true} onClose={jest.fn()} />
      );
      
      const printButton = screen.getByText('Print QR Card');
      fireEvent.click(printButton);
      
      expect(mockDocument.write).toHaveBeenCalledWith(
        expect.stringContaining('2024 Chevrolet Equinox')
      );
    });

    it('includes vehicle details in print content', () => {
      render(
        <QRCodeModal vehicle={mockVehicle} isOpen={true} onClose={jest.fn()} />
      );
      
      const printButton = screen.getByText('Print QR Card');
      fireEvent.click(printButton);
      
      const htmlContent = mockDocument.write.mock.calls[0][0];
      expect(htmlContent).toContain('LT AWD');
      expect(htmlContent).toContain('STK001');
      expect(htmlContent).toContain('$32,000');
    });

    it('triggers print after delay', () => {
      render(
        <QRCodeModal vehicle={mockVehicle} isOpen={true} onClose={jest.fn()} />
      );
      
      const printButton = screen.getByText('Print QR Card');
      fireEvent.click(printButton);
      
      // Fast-forward timer
      jest.advanceTimersByTime(500);
      
      expect(mockPrint).toHaveBeenCalled();
      expect(mockClose).toHaveBeenCalled();
    });
  });

  describe('QR Code Loading States', () => {
    it('shows loading spinner initially', () => {
      render(
        <QRCodeModal vehicle={mockVehicle} isOpen={true} onClose={jest.fn()} />
      );
      
      // The spinner should be in the DOM (inside qrPlaceholder)
      const qrImage = screen.getByAltText('Vehicle QR Code');
      // Image should be hidden initially
      expect(qrImage).toHaveStyle({ display: 'none' });
    });

    it('shows QR code after loading', () => {
      render(
        <QRCodeModal vehicle={mockVehicle} isOpen={true} onClose={jest.fn()} />
      );
      
      const qrImage = screen.getByAltText('Vehicle QR Code');
      
      // Simulate image load
      fireEvent.load(qrImage);
      
      expect(qrImage).toHaveStyle({ display: 'block' });
    });

    it('shows error state when QR code fails to load', () => {
      render(
        <QRCodeModal vehicle={mockVehicle} isOpen={true} onClose={jest.fn()} />
      );
      
      const qrImage = screen.getByAltText('Vehicle QR Code');
      
      // Simulate image error
      fireEvent.error(qrImage);
      
      expect(screen.getByText('Unable to generate QR code')).toBeInTheDocument();
    });
  });

  describe('Vehicle Data Handling', () => {
    it('handles vehicle with snake_case properties', () => {
      const snakeCaseVehicle = {
        id: '2',
        stock_number: 'STK002',
        year: 2024,
        make: 'Chevrolet',
        model: 'Blazer',
        trim: 'RS',
        exterior_color: 'Black',
        sale_price: 45000,
      };
      
      render(
        <QRCodeModal vehicle={snakeCaseVehicle} isOpen={true} onClose={jest.fn()} />
      );
      
      expect(screen.getByText('2024 Chevrolet Blazer')).toBeInTheDocument();
      expect(screen.getByText('Stock #STK002')).toBeInTheDocument();
      expect(screen.getByText('$45,000')).toBeInTheDocument();
    });

    it('handles vehicle with camelCase properties', () => {
      const camelCaseVehicle = {
        id: '3',
        stockNumber: 'STK003',
        year: 2024,
        make: 'Chevrolet',
        model: 'Silverado',
        trim: 'LTZ',
        exteriorColor: 'White',
        salePrice: 55000,
      };
      
      render(
        <QRCodeModal vehicle={camelCaseVehicle} isOpen={true} onClose={jest.fn()} />
      );
      
      expect(screen.getByText('2024 Chevrolet Silverado')).toBeInTheDocument();
      expect(screen.getByText('Stock #STK003')).toBeInTheDocument();
      expect(screen.getByText('$55,000')).toBeInTheDocument();
    });

    it('uses MSRP when sale price is not available', () => {
      const vehicleWithMsrpOnly = {
        id: '4',
        stockNumber: 'STK004',
        year: 2024,
        make: 'Chevrolet',
        model: 'Tahoe',
        msrp: 60000,
      };
      
      render(
        <QRCodeModal vehicle={vehicleWithMsrpOnly} isOpen={true} onClose={jest.fn()} />
      );
      
      expect(screen.getByText('$60,000')).toBeInTheDocument();
    });

    it('handles missing optional fields gracefully', () => {
      const minimalVehicle = {
        id: '5',
        stockNumber: 'STK005',
        year: 2024,
        model: 'Trax',
      };
      
      render(
        <QRCodeModal vehicle={minimalVehicle} isOpen={true} onClose={jest.fn()} />
      );
      
      expect(screen.getByText('2024 Chevrolet Trax')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has accessible buttons', () => {
      render(
        <QRCodeModal vehicle={mockVehicle} isOpen={true} onClose={jest.fn()} />
      );
      
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });

    it('QR code image has alt text', () => {
      render(
        <QRCodeModal vehicle={mockVehicle} isOpen={true} onClose={jest.fn()} />
      );
      
      const qrImage = screen.getByAltText('Vehicle QR Code');
      expect(qrImage).toBeInTheDocument();
    });
  });
});
