import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import TradeInEstimator from '../components/TradeInestimator';

// Mock the api module
jest.mock('../components/api', () => ({
  getMakes: jest.fn(),
  getModels: jest.fn(),
  decodeTradeInVin: jest.fn(),
  getTradeInEstimate: jest.fn(),
  requestAppraisal: jest.fn(),
}));

import api from '../components/api';

// Mock props
const mockNavigateTo = jest.fn();
const mockUpdateCustomerData = jest.fn();

const mockMakes = ['Acura', 'BMW', 'Chevrolet', 'Ford', 'Honda', 'Toyota'];
const mockModels = ['Accord', 'Civic', 'CR-V', 'Pilot'];

const mockEstimate = {
  estimatedValue: 25000,
  range: { low: 22000, high: 28000 },
  adjustments: { condition: 0, mileage: -500 },
};

const defaultProps = {
  navigateTo: mockNavigateTo,
  updateCustomerData: mockUpdateCustomerData,
  customerData: { customerName: 'John Doe' },
};

const renderTradeInEstimator = (props = {}) => {
  return render(<TradeInEstimator {...defaultProps} {...props} />);
};

describe('TradeInEstimator Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    api.getMakes.mockResolvedValue(mockMakes);
    api.getModels.mockResolvedValue(mockModels);
    api.decodeTradeInVin.mockResolvedValue({
      year: 2020,
      make: 'Honda',
      model: 'Accord',
      trim: 'EX-L',
    });
    api.getTradeInEstimate.mockResolvedValue(mockEstimate);
    api.requestAppraisal.mockResolvedValue({ success: true });
  });

  describe('Step 1 - Vehicle Information', () => {
    test('displays step title', () => {
      renderTradeInEstimator();
      expect(screen.getByText(/Tell us about your vehicle/i)).toBeInTheDocument();
    });

    test('displays VIN input', () => {
      renderTradeInEstimator();
      expect(screen.getByPlaceholderText(/17-character VIN/i)).toBeInTheDocument();
    });

    test('displays Year dropdown', () => {
      renderTradeInEstimator();
      expect(screen.getByText('Year *')).toBeInTheDocument();
    });

    test('displays Make dropdown', () => {
      renderTradeInEstimator();
      expect(screen.getByText('Make *')).toBeInTheDocument();
    });

    test('displays Model dropdown', () => {
      renderTradeInEstimator();
      expect(screen.getByText('Model *')).toBeInTheDocument();
    });

    test('displays Mileage input', () => {
      renderTradeInEstimator();
      expect(screen.getByText(/Current Mileage/i)).toBeInTheDocument();
    });

    test('displays Continue button', () => {
      renderTradeInEstimator();
      expect(screen.getByText('Continue')).toBeInTheDocument();
    });

    test('loads makes on mount', async () => {
      renderTradeInEstimator();
      await waitFor(() => {
        expect(api.getMakes).toHaveBeenCalledTimes(1);
      });
    });

    test('Continue button is disabled without required fields', () => {
      renderTradeInEstimator();
      const continueButton = screen.getByText('Continue');
      expect(continueButton).toBeDisabled();
    });

    test('selecting year populates options', async () => {
      renderTradeInEstimator();
      const selects = screen.getAllByRole('combobox');
      fireEvent.change(selects[0], { target: { value: '2020' } });
      expect(selects[0]).toHaveValue('2020');
    });

    test('selecting make loads models', async () => {
      renderTradeInEstimator();
      await waitFor(() => {
        expect(api.getMakes).toHaveBeenCalled();
      });
      const selects = screen.getAllByRole('combobox');
      fireEvent.change(selects[0], { target: { value: '2020' } });
      fireEvent.change(selects[1], { target: { value: 'Honda' } });
      await waitFor(() => {
        expect(api.getModels).toHaveBeenCalledWith('Honda', 2020);
      });
    });
  });

  describe('VIN Decode', () => {
    test('VIN decode button appears with 17-char VIN', async () => {
      renderTradeInEstimator();
      const vinInput = screen.getByPlaceholderText(/17-character VIN/i);
      fireEvent.change(vinInput, { target: { value: '1HGCM82633A004352' } });
      await waitFor(() => {
        expect(screen.getByText(/Decode VIN/i)).toBeInTheDocument();
      });
    });

    test('clicking Decode VIN calls API', async () => {
      renderTradeInEstimator();
      const vinInput = screen.getByPlaceholderText(/17-character VIN/i);
      fireEvent.change(vinInput, { target: { value: '1HGCM82633A004352' } });
      await waitFor(() => {
        expect(screen.getByText(/Decode VIN/i)).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText(/Decode VIN/i));
      await waitFor(() => {
        expect(api.decodeTradeInVin).toHaveBeenCalledWith('1HGCM82633A004352');
      });
    });

    test('successful decode fills form fields', async () => {
      renderTradeInEstimator();
      const vinInput = screen.getByPlaceholderText(/17-character VIN/i);
      fireEvent.change(vinInput, { target: { value: '1HGCM82633A004352' } });
      await waitFor(() => {
        expect(screen.getByText(/Decode VIN/i)).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText(/Decode VIN/i));
      await waitFor(() => {
        const selects = screen.getAllByRole('combobox');
        expect(selects[0]).toHaveValue('2020');
      });
    });
  });

  describe('Step Navigation', () => {
    const goToStep2 = async () => {
      renderTradeInEstimator();
      await waitFor(() => {
        expect(api.getMakes).toHaveBeenCalled();
      });
      const selects = screen.getAllByRole('combobox');
      fireEvent.change(selects[0], { target: { value: '2020' } });
      fireEvent.change(selects[1], { target: { value: 'Honda' } });
      await waitFor(() => {
        expect(api.getModels).toHaveBeenCalled();
      });
      fireEvent.change(selects[2], { target: { value: 'Accord' } });
      const mileageInput = screen.getByPlaceholderText(/45,000/i);
      fireEvent.change(mileageInput, { target: { value: '50000' } });
      fireEvent.click(screen.getByText('Continue'));
      await waitFor(() => {
        expect(screen.getByText(/Do you owe money/i)).toBeInTheDocument();
      });
    };

    test('progresses to step 2 with valid info', async () => {
      await goToStep2();
      expect(screen.getByText(/Do you owe money/i)).toBeInTheDocument();
    });

    test('step 2 shows ownership question', async () => {
      await goToStep2();
      expect(screen.getByText(/No, I own it outright/i)).toBeInTheDocument();
    });

    test('step 2 shows payoff option', async () => {
      await goToStep2();
      expect(screen.getByText(/Yes, I have a loan/i)).toBeInTheDocument();
    });
  });

  describe('Step 2 - Ownership', () => {
    const goToStep2 = async () => {
      renderTradeInEstimator();
      await waitFor(() => {
        expect(api.getMakes).toHaveBeenCalled();
      });
      const selects = screen.getAllByRole('combobox');
      fireEvent.change(selects[0], { target: { value: '2020' } });
      fireEvent.change(selects[1], { target: { value: 'Honda' } });
      await waitFor(() => {
        expect(api.getModels).toHaveBeenCalled();
      });
      fireEvent.change(selects[2], { target: { value: 'Accord' } });
      const mileageInput = screen.getByPlaceholderText(/45,000/i);
      fireEvent.change(mileageInput, { target: { value: '50000' } });
      fireEvent.click(screen.getByText('Continue'));
      await waitFor(() => {
        expect(screen.getByText(/Do you owe money/i)).toBeInTheDocument();
      });
    };

    test('selecting owned outright continues to step 3', async () => {
      await goToStep2();
      fireEvent.click(screen.getByText(/No, I own it outright/i));
      fireEvent.click(screen.getByText('Continue'));
      await waitFor(() => {
        expect(screen.getByText(/Vehicle Condition/i)).toBeInTheDocument();
      });
    });

    test('selecting loan shows payoff fields', async () => {
      await goToStep2();
      fireEvent.click(screen.getByText(/Yes, I have a loan/i));
      await waitFor(() => {
        expect(screen.getByText(/Payoff Amount/i)).toBeInTheDocument();
      });
    });
  });

  describe('Step 3 - Payoff Details', () => {
    const goToStep3WithLoan = async () => {
      renderTradeInEstimator();
      await waitFor(() => {
        expect(api.getMakes).toHaveBeenCalled();
      });
      const selects = screen.getAllByRole('combobox');
      fireEvent.change(selects[0], { target: { value: '2020' } });
      fireEvent.change(selects[1], { target: { value: 'Honda' } });
      await waitFor(() => {
        expect(api.getModels).toHaveBeenCalled();
      });
      fireEvent.change(selects[2], { target: { value: 'Accord' } });
      const mileageInput = screen.getByPlaceholderText(/45,000/i);
      fireEvent.change(mileageInput, { target: { value: '50000' } });
      fireEvent.click(screen.getByText('Continue'));
      await waitFor(() => {
        expect(screen.getByText(/Do you owe money/i)).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText(/Yes, I have a loan/i));
      await waitFor(() => {
        expect(screen.getByText(/Payoff Amount/i)).toBeInTheDocument();
      });
    };

    test('displays payoff amount input', async () => {
      await goToStep3WithLoan();
      expect(screen.getByText(/Payoff Amount/i)).toBeInTheDocument();
    });

    test('displays lender input', async () => {
      await goToStep3WithLoan();
      expect(screen.getByText(/Financed With/i)).toBeInTheDocument();
    });
  });

  describe('Step 4 - Condition', () => {
    const goToStep4ViaOwnedOutright = async () => {
      renderTradeInEstimator();
      await waitFor(() => {
        expect(api.getMakes).toHaveBeenCalled();
      });
      const selects = screen.getAllByRole('combobox');
      fireEvent.change(selects[0], { target: { value: '2020' } });
      fireEvent.change(selects[1], { target: { value: 'Honda' } });
      await waitFor(() => {
        expect(api.getModels).toHaveBeenCalled();
      });
      fireEvent.change(selects[2], { target: { value: 'Accord' } });
      const mileageInput = screen.getByPlaceholderText(/45,000/i);
      fireEvent.change(mileageInput, { target: { value: '50000' } });
      fireEvent.click(screen.getByText('Continue'));
      await waitFor(() => {
        expect(screen.getByText(/Do you owe money/i)).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText(/No, I own it outright/i));
      fireEvent.click(screen.getByText('Continue'));
      await waitFor(() => {
        expect(screen.getByText(/Vehicle Condition/i)).toBeInTheDocument();
      });
    };

    test('displays condition options', async () => {
      await goToStep4ViaOwnedOutright();
      expect(screen.getByText('Excellent')).toBeInTheDocument();
      expect(screen.getByText('Good')).toBeInTheDocument();
      expect(screen.getByText('Fair')).toBeInTheDocument();
    });

    test('displays Get My Estimate button', async () => {
      await goToStep4ViaOwnedOutright();
      expect(screen.getByRole('button', { name: /Get My Estimate/i })).toBeInTheDocument();
    });

    test('clicking condition enables Get Estimate', async () => {
      await goToStep4ViaOwnedOutright();
      fireEvent.click(screen.getByText('Good'));
      const estimateButton = screen.getByRole('button', { name: /Get My Estimate/i });
      expect(estimateButton).not.toBeDisabled();
    });

    test('Get Estimate calls API', async () => {
      await goToStep4ViaOwnedOutright();
      fireEvent.click(screen.getByText('Good'));
      fireEvent.click(screen.getByRole('button', { name: /Get My Estimate/i }));
      await waitFor(() => {
        expect(api.getTradeInEstimate).toHaveBeenCalled();
      });
    });
  });

  describe('Step 5 - Results', () => {
    const goToStep5 = async () => {
      renderTradeInEstimator();
      await waitFor(() => {
        expect(api.getMakes).toHaveBeenCalled();
      });
      const selects = screen.getAllByRole('combobox');
      fireEvent.change(selects[0], { target: { value: '2020' } });
      fireEvent.change(selects[1], { target: { value: 'Honda' } });
      await waitFor(() => {
        expect(api.getModels).toHaveBeenCalled();
      });
      fireEvent.change(selects[2], { target: { value: 'Accord' } });
      const mileageInput = screen.getByPlaceholderText(/45,000/i);
      fireEvent.change(mileageInput, { target: { value: '50000' } });
      fireEvent.click(screen.getByText('Continue'));
      await waitFor(() => {
        expect(screen.getByText(/Do you owe money/i)).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText(/No, I own it outright/i));
      fireEvent.click(screen.getByText('Continue'));
      await waitFor(() => {
        expect(screen.getByText(/Vehicle Condition/i)).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText('Good'));
      fireEvent.click(screen.getByRole('button', { name: /Get My Estimate/i }));
      await waitFor(() => {
        expect(screen.getByText(/\$25,000/)).toBeInTheDocument();
      });
    };

    test('displays estimate value', async () => {
      await goToStep5();
      expect(screen.getByText(/\$25,000/)).toBeInTheDocument();
    });

    test('displays Apply to Purchase button', async () => {
      await goToStep5();
      expect(screen.getByText(/Apply.*Purchase/i)).toBeInTheDocument();
    });

    test('clicking Apply to Purchase updates customer data', async () => {
      await goToStep5();
      fireEvent.click(screen.getByText(/Apply.*Purchase/i));
      expect(mockUpdateCustomerData).toHaveBeenCalledWith(
        expect.objectContaining({
          tradeIn: expect.objectContaining({
            hasTrade: true,
            estimatedValue: 25000,
          }),
        })
      );
    });
  });

  describe('Error Handling', () => {
    let consoleErrorSpy;

    beforeEach(() => {
      consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
      consoleErrorSpy.mockRestore();
    });

    test('handles API error gracefully', async () => {
      api.getTradeInEstimate.mockRejectedValue(new Error('Network error'));
      renderTradeInEstimator();
      await waitFor(() => {
        expect(api.getMakes).toHaveBeenCalled();
      });
      const selects = screen.getAllByRole('combobox');
      fireEvent.change(selects[0], { target: { value: '2020' } });
      fireEvent.change(selects[1], { target: { value: 'Honda' } });
      await waitFor(() => {
        expect(api.getModels).toHaveBeenCalled();
      });
      fireEvent.change(selects[2], { target: { value: 'Accord' } });
      const mileageInput = screen.getByPlaceholderText(/45,000/i);
      fireEvent.change(mileageInput, { target: { value: '50000' } });
      fireEvent.click(screen.getByText('Continue'));
      await waitFor(() => {
        expect(screen.getByText(/Do you owe money/i)).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText(/No, I own it outright/i));
      fireEvent.click(screen.getByText('Continue'));
      await waitFor(() => {
        expect(screen.getByText(/Vehicle Condition/i)).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText('Good'));
      fireEvent.click(screen.getByRole('button', { name: /Get My Estimate/i }));
      await waitFor(() => {
        expect(screen.getByText(/Unable to calculate estimate/i)).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    test('form fields have labels', () => {
      renderTradeInEstimator();
      expect(screen.getByText('Year *')).toBeInTheDocument();
      expect(screen.getByText('Make *')).toBeInTheDocument();
      expect(screen.getByText('Model *')).toBeInTheDocument();
    });

    test('VIN input has placeholder', () => {
      renderTradeInEstimator();
      expect(screen.getByPlaceholderText(/17-character VIN/i)).toBeInTheDocument();
    });

    test('Continue button is accessible', () => {
      renderTradeInEstimator();
      const button = screen.getByText('Continue');
      expect(button.tagName).toBe('BUTTON');
    });
  });
});
