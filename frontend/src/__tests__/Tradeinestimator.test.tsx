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
  });

  describe('Step 1 - Form Interactions', () => {
    test('selecting year updates form', async () => {
      renderTradeInEstimator();
      
      const selects = screen.getAllByRole('combobox');
      const yearSelect = selects[0];
      
      fireEvent.change(yearSelect, { target: { value: '2020' } });
      expect(yearSelect.value).toBe('2020');
    });

    test('selecting make loads models', async () => {
      renderTradeInEstimator();

      await waitFor(() => {
        expect(api.getMakes).toHaveBeenCalled();
      });

      const selects = screen.getAllByRole('combobox');
      const makeSelect = selects[1];

      fireEvent.change(makeSelect, { target: { value: 'Honda' } });

      await waitFor(() => {
        expect(api.getModels).toHaveBeenCalledWith('Honda');
      });
    });

    test('mileage input formats with commas', () => {
      renderTradeInEstimator();

      const mileageInput = screen.getByPlaceholderText(/45,000/i);
      fireEvent.change(mileageInput, { target: { value: '50000' } });

      expect(mileageInput.value).toBe('50,000');
    });
  });

  describe('Step 1 - VIN Decode', () => {
    test('VIN input accepts text', () => {
      renderTradeInEstimator();

      const vinInput = screen.getByPlaceholderText(/17-character VIN/i);
      fireEvent.change(vinInput, { target: { value: '1HGBH41JXMN109186' } });

      expect(vinInput.value).toBe('1HGBH41JXMN109186');
    });

    test('VIN auto-decode on blur', async () => {
      renderTradeInEstimator();

      const vinInput = screen.getByPlaceholderText(/17-character VIN/i);
      fireEvent.change(vinInput, { target: { value: '1HGBH41JXMN109186' } });
      fireEvent.blur(vinInput);

      await waitFor(() => {
        expect(api.decodeTradeInVin).toHaveBeenCalledWith('1HGBH41JXMN109186');
      });
    });
  });

  describe('Step 1 to Step 2 Navigation', () => {
    const fillStep1 = async () => {
      renderTradeInEstimator();

      await waitFor(() => {
        expect(api.getMakes).toHaveBeenCalled();
      });

      // Fill year
      const selects = screen.getAllByRole('combobox');
      fireEvent.change(selects[0], { target: { value: '2020' } });

      // Fill make
      fireEvent.change(selects[1], { target: { value: 'Honda' } });

      await waitFor(() => {
        expect(api.getModels).toHaveBeenCalled();
      });

      // Fill model
      fireEvent.change(selects[2], { target: { value: 'Accord' } });

      // Fill mileage
      const mileageInput = screen.getByPlaceholderText(/45,000/i);
      fireEvent.change(mileageInput, { target: { value: '50000' } });

      // Click continue
      fireEvent.click(screen.getByText('Continue'));
    };

    test('Continue advances to step 2', async () => {
      await fillStep1();

      await waitFor(() => {
        expect(screen.getByText(/Do you owe money on this vehicle/i)).toBeInTheDocument();
      });
    });
  });

  describe('Step 2 - Ownership Question', () => {
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

    test('displays ownership options', async () => {
      await goToStep2();

      expect(screen.getByText(/Yes, I still owe/i)).toBeInTheDocument();
      expect(screen.getByText(/No, I own it outright/i)).toBeInTheDocument();
    });

    test('displays Back button', async () => {
      await goToStep2();
      expect(screen.getByText('Back')).toBeInTheDocument();
    });

    test('clicking Back returns to step 1', async () => {
      await goToStep2();

      fireEvent.click(screen.getByText('Back'));

      await waitFor(() => {
        expect(screen.getByText(/Tell us about your vehicle/i)).toBeInTheDocument();
      });
    });

    test('selecting "No, I own it outright" skips to step 4', async () => {
      await goToStep2();

      fireEvent.click(screen.getByText(/No, I own it outright/i));
      fireEvent.click(screen.getByText('Continue'));

      await waitFor(() => {
        expect(screen.getByText(/Vehicle Condition/i)).toBeInTheDocument();
      });
    });

    test('selecting "Yes, I still owe" goes to step 3', async () => {
      await goToStep2();

      fireEvent.click(screen.getByText(/Yes, I still owe/i));
      fireEvent.click(screen.getByText('Continue'));

      await waitFor(() => {
        expect(screen.getByText(/Tell us about your payoff/i)).toBeInTheDocument();
      });
    });
  });

  describe('Step 3 - Payoff Details', () => {
    const goToStep3 = async () => {
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

      fireEvent.click(screen.getByText(/Yes, I still owe/i));
      fireEvent.click(screen.getByText('Continue'));

      await waitFor(() => {
        expect(screen.getByText(/Tell us about your payoff/i)).toBeInTheDocument();
      });
    };

    test('displays payoff amount input', async () => {
      await goToStep3();
      expect(screen.getByText(/Approximate Payoff Amount/i)).toBeInTheDocument();
    });

    test('displays monthly payment input', async () => {
      await goToStep3();
      expect(screen.getByText(/Current Monthly Payment/i)).toBeInTheDocument();
    });

    test('displays lender dropdown', async () => {
      await goToStep3();
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
      expect(screen.getByText('Poor')).toBeInTheDocument();
    });

    test('displays photo upload section', async () => {
      await goToStep4ViaOwnedOutright();
      expect(screen.getByText(/Photos/i)).toBeInTheDocument();
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

    test('displays Request Appraisal button', async () => {
      await goToStep5();
      expect(screen.getByText(/Request.*Appraisal/i)).toBeInTheDocument();
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

    test('clicking Apply to Purchase navigates to payment calculator', async () => {
      await goToStep5();

      fireEvent.click(screen.getByText(/Apply.*Purchase/i));

      expect(mockNavigateTo).toHaveBeenCalledWith('paymentCalculator');
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

    test('handles makes API error gracefully', async () => {
      api.getMakes.mockRejectedValue(new Error('API Error'));

      renderTradeInEstimator();

      // Should still render with fallback makes
      await waitFor(() => {
        expect(screen.getByText(/Tell us about your vehicle/i)).toBeInTheDocument();
      });
    });

    test('handles VIN decode error gracefully', async () => {
      api.decodeTradeInVin.mockRejectedValue(new Error('VIN Error'));

      renderTradeInEstimator();

      const vinInput = screen.getByPlaceholderText(/17-character VIN/i);
      fireEvent.change(vinInput, { target: { value: '1HGBH41JXMN109186' } });
      fireEvent.blur(vinInput);

      // Should not crash
      await waitFor(() => {
        expect(screen.getByText(/Tell us about your vehicle/i)).toBeInTheDocument();
      });
    });

    test('displays error message when estimate fails', async () => {
      api.getTradeInEstimate.mockRejectedValue(new Error('API Error'));

      renderTradeInEstimator();

      await waitFor(() => {
        expect(api.getMakes).toHaveBeenCalled();
      });

      // Fill out form to get to estimate
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

    test('Continue is a button', () => {
      renderTradeInEstimator();
      expect(screen.getByText('Continue').tagName).toBe('BUTTON');
    });
  });
});
