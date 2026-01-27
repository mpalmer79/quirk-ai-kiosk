import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import DigitalWorksheet from '../components/DigitalWorksheet';

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock worksheet data
const mockWorksheetData = {
  success: true,
  worksheet: {
    id: 'ws-123',
    session_id: 'session-456',
    status: 'active',
    vehicle: {
      stock_number: 'M12345',
      year: 2025,
      make: 'Chevrolet',
      model: 'Silverado 1500',
      trim: 'LT',
      exterior_color: 'Summit White',
      vin: '1GCUDDED1MZ123456',
      msrp: 54000,
    },
    has_trade: false,
    selling_price: 52000,
    trade_equity: 0,
    down_payment: 5000,
    amount_financed: 47000,
    term_options: [
      {
        term_months: 48,
        apr: 5.99,
        monthly_payment: 1084,
        total_of_payments: 52032,
        total_interest: 5032,
        is_selected: false,
      },
      {
        term_months: 60,
        apr: 6.49,
        monthly_payment: 919,
        total_of_payments: 55140,
        total_interest: 8140,
        is_selected: false,
      },
      {
        term_months: 72,
        apr: 6.99,
        monthly_payment: 803,
        total_of_payments: 57816,
        total_interest: 10816,
        is_selected: true,
      },
    ],
    selected_term: 72,
    total_due_at_signing: 5599,
    monthly_payment: 803,
    doc_fee: 499,
    title_fee: 100,
  },
};

const mockWorksheetWithTrade = {
  ...mockWorksheetData,
  worksheet: {
    ...mockWorksheetData.worksheet,
    has_trade: true,
    trade_in: {
      year: 2020,
      make: 'Toyota',
      model: 'Camry',
      mileage: 45000,
      estimated_value: 18000,
      appraised_value: 17500,
      payoff_amount: 5000,
      equity: 12500,
      appraisal_status: 'estimated',
    },
    trade_equity: 12500,
  },
};

const defaultProps = {
  worksheetId: 'ws-123',
  sessionId: 'session-456',
  onReady: jest.fn(),
  onClose: jest.fn(),
  apiBaseUrl: 'http://localhost:8000',
};

describe('DigitalWorksheet Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockReset();
  });

  describe('Loading State', () => {
    test('displays loading state while fetching worksheet', async () => {
      mockFetch.mockImplementation(() => new Promise(() => {})); // Never resolves

      render(<DigitalWorksheet {...defaultProps} />);

      expect(screen.getByText(/Loading your worksheet/i)).toBeInTheDocument();
    });
  });

  describe('Error State', () => {
    test('displays error message when fetch fails', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      render(<DigitalWorksheet {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText(/Something went wrong/i)).toBeInTheDocument();
      });
    });

    test('displays error when API returns error response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
      });

      render(<DigitalWorksheet {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText(/Something went wrong/i)).toBeInTheDocument();
      });
    });

    test('displays Try Again button on error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      render(<DigitalWorksheet {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText(/Try Again/i)).toBeInTheDocument();
      });
    });

    test('retries fetch when Try Again is clicked', async () => {
      mockFetch
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockWorksheetData),
        });

      render(<DigitalWorksheet {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText(/Try Again/i)).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText(/Try Again/i));

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('Successful Worksheet Display', () => {
    beforeEach(() => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockWorksheetData),
      });
    });

    test('displays vehicle information', async () => {
      render(<DigitalWorksheet {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText(/2025 Chevrolet Silverado 1500/i)).toBeInTheDocument();
      });
    });

    test('displays vehicle trim', async () => {
      render(<DigitalWorksheet {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText(/LT/i)).toBeInTheDocument();
      });
    });

    test('displays stock number', async () => {
      render(<DigitalWorksheet {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText(/Stock #M12345/i)).toBeInTheDocument();
      });
    });

    test('displays selling price', async () => {
      render(<DigitalWorksheet {...defaultProps} />);

      await waitFor(() => {
        // Use getAllByText since price appears in multiple places (header and summary)
        const priceElements = screen.getAllByText(/\$52,000/);
        expect(priceElements.length).toBeGreaterThan(0);
      });
    });

    test('displays Digital Worksheet header', async () => {
      render(<DigitalWorksheet {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Digital Worksheet')).toBeInTheDocument();
      });
    });

    test('displays subtitle instruction text', async () => {
      render(<DigitalWorksheet {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText(/Adjust the numbers below/i)).toBeInTheDocument();
      });
    });
  });

  describe('Down Payment Controls', () => {
    beforeEach(() => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockWorksheetData),
      });
    });

    test('displays down payment section', async () => {
      render(<DigitalWorksheet {...defaultProps} />);

      await waitFor(() => {
        // Down Payment appears as both section header (h4) and in summary - use getAllByText
        const downPaymentElements = screen.getAllByText('Down Payment');
        expect(downPaymentElements.length).toBeGreaterThan(0);
      });
    });

    test('displays down payment input with initial value', async () => {
      render(<DigitalWorksheet {...defaultProps} />);

      await waitFor(() => {
        const input = screen.getByLabelText(/Down payment amount/i);
        expect(input).toHaveValue('5,000');
      });
    });

    test('displays down payment slider', async () => {
      render(<DigitalWorksheet {...defaultProps} />);

      await waitFor(() => {
        const slider = screen.getByLabelText(/Adjust down payment/i);
        expect(slider).toBeInTheDocument();
      });
    });

    test('updates down payment when input changes', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockWorksheetData),
        })
        .mockResolvedValue({
          ok: true,
          json: () => Promise.resolve({
            ...mockWorksheetData,
            worksheet: { ...mockWorksheetData.worksheet, down_payment: 10000 },
          }),
        });

      render(<DigitalWorksheet {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByLabelText(/Down payment amount/i)).toBeInTheDocument();
      });

      const input = screen.getByLabelText(/Down payment amount/i);
      fireEvent.change(input, { target: { value: '10000' } });

      await waitFor(() => {
        expect(input).toHaveValue('10,000');
      });
    });
  });

  describe('Term Selection', () => {
    beforeEach(() => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockWorksheetData),
      });
    });

    test('displays all term options', async () => {
      render(<DigitalWorksheet {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('48 mo')).toBeInTheDocument();
        expect(screen.getByText('60 mo')).toBeInTheDocument();
        expect(screen.getByText('72 mo')).toBeInTheDocument();
      });
    });

    test('displays APR for each term', async () => {
      render(<DigitalWorksheet {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('5.99% APR')).toBeInTheDocument();
        expect(screen.getByText('6.49% APR')).toBeInTheDocument();
        expect(screen.getByText('6.99% APR')).toBeInTheDocument();
      });
    });

    test('selects term when clicked', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockWorksheetData),
        })
        .mockResolvedValue({
          ok: true,
          json: () => Promise.resolve({
            ...mockWorksheetData,
            worksheet: { ...mockWorksheetData.worksheet, selected_term: 60 },
          }),
        });

      render(<DigitalWorksheet {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('60 mo')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('60 mo'));

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          'http://localhost:8000/worksheet/ws-123',
          expect.objectContaining({
            method: 'PATCH',
            body: expect.stringContaining('"selected_term":60'),
          })
        );
      });
    });
  });

  describe('Payment Summary', () => {
    beforeEach(() => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockWorksheetData),
      });
    });

    test('displays monthly payment', async () => {
      render(<DigitalWorksheet {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText(/Your Monthly Payment/i)).toBeInTheDocument();
      });
    });

    test('displays due at signing', async () => {
      render(<DigitalWorksheet {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText(/Due at Signing/i)).toBeInTheDocument();
      });
    });

    test('displays doc fee', async () => {
      render(<DigitalWorksheet {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Doc Fee')).toBeInTheDocument();
      });
    });

    test('displays title fee', async () => {
      render(<DigitalWorksheet {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Title Fee')).toBeInTheDocument();
      });
    });

    test('displays tax disclosure for NH', async () => {
      render(<DigitalWorksheet {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText(/New Hampshire has no sales tax/i)).toBeInTheDocument();
      });
    });
  });

  describe('Trade-In Display', () => {
    test('displays trade-in information when has_trade is true', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockWorksheetWithTrade),
      });

      render(<DigitalWorksheet {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText(/Your Trade-In/i)).toBeInTheDocument();
        expect(screen.getByText(/2020 Toyota Camry/i)).toBeInTheDocument();
      });
    });

    test('displays trade-in equity', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockWorksheetWithTrade),
      });

      render(<DigitalWorksheet {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText(/Estimated Equity/i)).toBeInTheDocument();
      });
    });

    test('displays appraisal pending note when not appraised', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockWorksheetWithTrade),
      });

      render(<DigitalWorksheet {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText(/Final trade value pending/i)).toBeInTheDocument();
      });
    });

    test('does not display trade-in section when has_trade is false', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockWorksheetData),
      });

      render(<DigitalWorksheet {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Digital Worksheet')).toBeInTheDocument();
      });

      expect(screen.queryByText(/Your Trade-In/i)).not.toBeInTheDocument();
    });
  });

  describe('Ready Action', () => {
    beforeEach(() => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockWorksheetData),
      });
    });

    test('displays Ready button', async () => {
      render(<DigitalWorksheet {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText(/I'm Ready - Get a Manager/i)).toBeInTheDocument();
      });
    });

    test('calls onReady when Ready button is clicked', async () => {
      const onReady = jest.fn();
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockWorksheetData),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true }),
        });

      render(<DigitalWorksheet {...defaultProps} onReady={onReady} />);

      await waitFor(() => {
        expect(screen.getByText(/I'm Ready - Get a Manager/i)).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText(/I'm Ready - Get a Manager/i));

      await waitFor(() => {
        expect(onReady).toHaveBeenCalledWith('ws-123');
      });
    });

    test('shows confirmation screen after marking ready', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockWorksheetData),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true }),
        });

      render(<DigitalWorksheet {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText(/I'm Ready - Get a Manager/i)).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText(/I'm Ready - Get a Manager/i));

      await waitFor(() => {
        expect(screen.getByText(/You're All Set!/i)).toBeInTheDocument();
      });
    });

    test('confirmation shows Continue Browsing button', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockWorksheetData),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true }),
        });

      render(<DigitalWorksheet {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText(/I'm Ready - Get a Manager/i)).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText(/I'm Ready - Get a Manager/i));

      await waitFor(() => {
        // Use getByRole to get specifically the button, not the text in the paragraph
        expect(screen.getByRole('button', { name: /Continue Browsing/i })).toBeInTheDocument();
      });
    });

    test('calls onClose when Continue Browsing is clicked', async () => {
      const onClose = jest.fn();
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockWorksheetData),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true }),
        });

      render(<DigitalWorksheet {...defaultProps} onClose={onClose} />);

      await waitFor(() => {
        expect(screen.getByText(/I'm Ready - Get a Manager/i)).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText(/I'm Ready - Get a Manager/i));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Continue Browsing/i })).toBeInTheDocument();
      });

      // Click the button specifically
      fireEvent.click(screen.getByRole('button', { name: /Continue Browsing/i }));

      expect(onClose).toHaveBeenCalled();
    });
  });

  describe('Close Button', () => {
    beforeEach(() => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockWorksheetData),
      });
    });

    test('displays close button when onClose prop provided', async () => {
      render(<DigitalWorksheet {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByLabelText(/Close/i)).toBeInTheDocument();
      });
    });

    test('calls onClose when close button is clicked', async () => {
      const onClose = jest.fn();
      render(<DigitalWorksheet {...defaultProps} onClose={onClose} />);

      await waitFor(() => {
        expect(screen.getByLabelText(/Close/i)).toBeInTheDocument();
      });

      fireEvent.click(screen.getByLabelText(/Close/i));

      expect(onClose).toHaveBeenCalled();
    });
  });

  describe('API Headers', () => {
    test('includes session ID header in fetch request', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockWorksheetData),
      });

      render(<DigitalWorksheet {...defaultProps} />);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          'http://localhost:8000/worksheet/ws-123',
          expect.objectContaining({
            headers: expect.objectContaining({
              'X-Session-ID': 'session-456',
            }),
          })
        );
      });
    });

    test('uses custom apiBaseUrl when provided', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockWorksheetData),
      });

      render(<DigitalWorksheet {...defaultProps} apiBaseUrl="https://custom-api.example.com" />);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          'https://custom-api.example.com/worksheet/ws-123',
          expect.anything()
        );
      });
    });
  });

  describe('Counter Offer Display', () => {
    test('displays counter offer banner when manager sends one', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          ...mockWorksheetData,
          worksheet: {
            ...mockWorksheetData.worksheet,
            counter_offer_sent: true,
            manager_notes: 'I can offer you a better rate!',
          },
        }),
      });

      render(<DigitalWorksheet {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText(/Message from Sales Manager/i)).toBeInTheDocument();
        expect(screen.getByText(/I can offer you a better rate/i)).toBeInTheDocument();
      });
    });

    test('does not display counter offer when none sent', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockWorksheetData),
      });

      render(<DigitalWorksheet {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Digital Worksheet')).toBeInTheDocument();
      });

      expect(screen.queryByText(/Message from Sales Manager/i)).not.toBeInTheDocument();
    });
  });

  describe('Manager Adjustment Display', () => {
    test('displays discount when manager adjustment is negative', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          ...mockWorksheetData,
          worksheet: {
            ...mockWorksheetData.worksheet,
            manager_adjustment: -2000,
          },
        }),
      });

      render(<DigitalWorksheet {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText(/Save \$2,000/i)).toBeInTheDocument();
      });
    });
  });
});
