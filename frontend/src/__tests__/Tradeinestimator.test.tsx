import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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

const defaultCustomerData = {
  customerName: 'John Doe',
  phone: '555-123-4567',
};

const mockMakes = ['Chevrolet', 'Ford', 'Toyota', 'Honda', 'GMC'];
const mockModels = ['Silverado', 'Tahoe', 'Equinox', 'Malibu'];

const mockEstimate = {
  estimatedValue: 25000,
  range: { low: 22000, high: 28000 },
  adjustments: { condition: 0, mileage: -500 },
};

const renderTradeInEstimator = (props = {}) => {
  return render(
    <TradeInEstimator
      navigateTo={mockNavigateTo}
      updateCustomerData={mockUpdateCustomerData}
      customerData={{ ...defaultCustomerData, ...props }}
    />
  );
};

describe('TradeInEstimator Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (api.getMakes as jest.Mock).mockResolvedValue(mockMakes);
    (api.getModels as jest.Mock).mockResolvedValue(mockModels);
    (api.decodeTradeInVin as jest.Mock).mockResolvedValue({
      year: 2020,
      make: 'Chevrolet',
      model: 'Silverado',
      trim: 'LT',
    });
    (api.getTradeInEstimate as jest.Mock).mockResolvedValue(mockEstimate);
    (api.requestAppraisal as jest.Mock).mockResolvedValue({ success: true });
  });

  describe('Initial Render - Step 1 (Vehicle Info)', () => {
    test('displays step 1 header', async () => {
      renderTradeInEstimator();

      expect(screen.getByText(/Vehicle Information/i)).toBeInTheDocument();
    });

    test('displays progress indicator showing step 1 of 5', async () => {
      renderTradeInEstimator();

      expect(screen.getByText(/Step 1/i)).toBeInTheDocument();
    });

    test('displays year dropdown', async () => {
      renderTradeInEstimator();

      expect(screen.getByText(/Year/i)).toBeInTheDocument();
    });

    test('displays make dropdown', async () => {
      renderTradeInEstimator();

      await waitFor(() => {
        expect(screen.getByText(/Make/i)).toBeInTheDocument();
      });
    });

    test('displays model dropdown', async () => {
      renderTradeInEstimator();

      expect(screen.getByText(/Model/i)).toBeInTheDocument();
    });

    test('displays mileage input', async () => {
      renderTradeInEstimator();

      expect(screen.getByPlaceholderText(/Enter mileage/i)).toBeInTheDocument();
    });

    test('displays VIN input', async () => {
      renderTradeInEstimator();

      expect(screen.getByPlaceholderText(/17-character VIN/i)).toBeInTheDocument();
    });

    test('loads makes on mount', async () => {
      renderTradeInEstimator();

      await waitFor(() => {
        expect(api.getMakes).toHaveBeenCalledTimes(1);
      });
    });

    test('continue button is disabled without required fields', async () => {
      renderTradeInEstimator();

      const continueButton = screen.getByText(/Continue/i);
      expect(continueButton).toBeDisabled();
    });
  });

  describe('Step 1 - Form Validation', () => {
    test('enables continue after filling required fields', async () => {
      renderTradeInEstimator();

      await waitFor(() => {
        expect(api.getMakes).toHaveBeenCalled();
      });

      // Fill year
      const yearSelect = screen.getByLabelText(/Year/i) || screen.getAllByRole('combobox')[0];
      fireEvent.change(yearSelect, { target: { value: '2020' } });

      // Fill make
      const makeSelect = screen.getAllByRole('combobox')[1];
      fireEvent.change(makeSelect, { target: { value: 'Chevrolet' } });

      await waitFor(() => {
        expect(api.getModels).toHaveBeenCalledWith('Chevrolet');
      });

      // Fill model
      const modelSelect = screen.getAllByRole('combobox')[2];
      fireEvent.change(modelSelect, { target: { value: 'Silverado' } });

      // Fill mileage
      const mileageInput = screen.getByPlaceholderText(/Enter mileage/i);
      fireEvent.change(mileageInput, { target: { value: '50000' } });

      const continueButton = screen.getByText(/Continue/i);
      expect(continueButton).not.toBeDisabled();
    });

    test('loads models when make is selected', async () => {
      renderTradeInEstimator();

      await waitFor(() => {
        expect(api.getMakes).toHaveBeenCalled();
      });

      const makeSelect = screen.getAllByRole('combobox')[1];
      fireEvent.change(makeSelect, { target: { value: 'Chevrolet' } });

      await waitFor(() => {
        expect(api.getModels).toHaveBeenCalledWith('Chevrolet');
      });
    });
  });

  describe('VIN Decode', () => {
    test('decode button appears when VIN is 17 characters', async () => {
      renderTradeInEstimator();

      const vinInput = screen.getByPlaceholderText(/17-character VIN/i);
      fireEvent.change(vinInput, { target: { value: '1GCUDDED5RZ123456' } });

      await waitFor(() => {
        expect(screen.getByText(/Decode/i)).toBeInTheDocument();
      });
    });

    test('clicking decode calls API', async () => {
      renderTradeInEstimator();

      const vinInput = screen.getByPlaceholderText(/17-character VIN/i);
      fireEvent.change(vinInput, { target: { value: '1GCUDDED5RZ123456' } });

      await waitFor(() => {
        expect(screen.getByText(/Decode/i)).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText(/Decode/i));

      await waitFor(() => {
        expect(api.decodeTradeInVin).toHaveBeenCalledWith('1GCUDDED5RZ123456');
      });
    });

    test('VIN decode auto-fills year, make, model', async () => {
      renderTradeInEstimator();

      const vinInput = screen.getByPlaceholderText(/17-character VIN/i);
      fireEvent.change(vinInput, { target: { value: '1GCUDDED5RZ123456' } });

      await waitFor(() => {
        expect(screen.getByText(/Decode/i)).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText(/Decode/i));

      await waitFor(() => {
        // Year should be filled
        const yearSelect = screen.getAllByRole('combobox')[0];
        expect(yearSelect).toHaveValue('2020');
      });
    });
  });

  describe('Step 2 - Ownership Question', () => {
    const fillStep1AndContinue = async () => {
      renderTradeInEstimator();

      await waitFor(() => {
        expect(api.getMakes).toHaveBeenCalled();
      });

      // Fill required fields
      const yearSelect = screen.getAllByRole('combobox')[0];
      fireEvent.change(yearSelect, { target: { value: '2020' } });

      const makeSelect = screen.getAllByRole('combobox')[1];
      fireEvent.change(makeSelect, { target: { value: 'Chevrolet' } });

      await waitFor(() => {
        expect(api.getModels).toHaveBeenCalled();
      });

      const modelSelect = screen.getAllByRole('combobox')[2];
      fireEvent.change(modelSelect, { target: { value: 'Silverado' } });

      const mileageInput = screen.getByPlaceholderText(/Enter mileage/i);
      fireEvent.change(mileageInput, { target: { value: '50000' } });

      fireEvent.click(screen.getByText(/Continue/i));
    };

    test('displays step 2 after completing step 1', async () => {
      await fillStep1AndContinue();

      await waitFor(() => {
        expect(screen.getByText(/Do you still owe money/i)).toBeInTheDocument();
      });
    });

    test('displays Yes and No options', async () => {
      await fillStep1AndContinue();

      await waitFor(() => {
        expect(screen.getByText(/Yes, I have a payoff/i)).toBeInTheDocument();
        expect(screen.getByText(/No, it's paid off/i)).toBeInTheDocument();
      });
    });

    test('selecting Yes advances to step 3 (payoff details)', async () => {
      await fillStep1AndContinue();

      await waitFor(() => {
        expect(screen.getByText(/Yes, I have a payoff/i)).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText(/Yes, I have a payoff/i));

      await waitFor(() => {
        expect(screen.getByText(/Payoff Details/i)).toBeInTheDocument();
      });
    });

    test('selecting No skips to step 4 (condition)', async () => {
      await fillStep1AndContinue();

      await waitFor(() => {
        expect(screen.getByText(/No, it's paid off/i)).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText(/No, it's paid off/i));

      await waitFor(() => {
        expect(screen.getByText(/Vehicle Condition/i)).toBeInTheDocument();
      });
    });
  });

  describe('Step 3 - Payoff Details', () => {
    const fillToStep3 = async () => {
      renderTradeInEstimator();

      await waitFor(() => {
        expect(api.getMakes).toHaveBeenCalled();
      });

      // Step 1
      const yearSelect = screen.getAllByRole('combobox')[0];
      fireEvent.change(yearSelect, { target: { value: '2020' } });

      const makeSelect = screen.getAllByRole('combobox')[1];
      fireEvent.change(makeSelect, { target: { value: 'Chevrolet' } });

      await waitFor(() => {
        expect(api.getModels).toHaveBeenCalled();
      });

      const modelSelect = screen.getAllByRole('combobox')[2];
      fireEvent.change(modelSelect, { target: { value: 'Silverado' } });

      const mileageInput = screen.getByPlaceholderText(/Enter mileage/i);
      fireEvent.change(mileageInput, { target: { value: '50000' } });

      fireEvent.click(screen.getByText(/Continue/i));

      // Step 2 - select Yes
      await waitFor(() => {
        expect(screen.getByText(/Yes, I have a payoff/i)).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText(/Yes, I have a payoff/i));
    };

    test('displays payoff amount input', async () => {
      await fillToStep3();

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/Payoff amount/i)).toBeInTheDocument();
      });
    });

    test('displays monthly payment input', async () => {
      await fillToStep3();

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/Monthly payment/i)).toBeInTheDocument();
      });
    });

    test('displays lender dropdown', async () => {
      await fillToStep3();

      await waitFor(() => {
        expect(screen.getByText(/Financed With/i)).toBeInTheDocument();
      });
    });

    test('continue requires payoff amount', async () => {
      await fillToStep3();

      await waitFor(() => {
        expect(screen.getByText(/Continue/i)).toBeDisabled();
      });
    });

    test('filling payoff enables continue', async () => {
      await fillToStep3();

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/Payoff amount/i)).toBeInTheDocument();
      });

      fireEvent.change(screen.getByPlaceholderText(/Payoff amount/i), { target: { value: '15000' } });

      const continueButton = screen.getByText(/Continue/i);
      expect(continueButton).not.toBeDisabled();
    });
  });

  describe('Step 4 - Condition Selection', () => {
    const fillToStep4 = async () => {
      renderTradeInEstimator();

      await waitFor(() => {
        expect(api.getMakes).toHaveBeenCalled();
      });

      // Step 1
      const yearSelect = screen.getAllByRole('combobox')[0];
      fireEvent.change(yearSelect, { target: { value: '2020' } });

      const makeSelect = screen.getAllByRole('combobox')[1];
      fireEvent.change(makeSelect, { target: { value: 'Chevrolet' } });

      await waitFor(() => {
        expect(api.getModels).toHaveBeenCalled();
      });

      const modelSelect = screen.getAllByRole('combobox')[2];
      fireEvent.change(modelSelect, { target: { value: 'Silverado' } });

      const mileageInput = screen.getByPlaceholderText(/Enter mileage/i);
      fireEvent.change(mileageInput, { target: { value: '50000' } });

      fireEvent.click(screen.getByText(/Continue/i));

      // Step 2 - select No (paid off)
      await waitFor(() => {
        expect(screen.getByText(/No, it's paid off/i)).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText(/No, it's paid off/i));
    };

    test('displays condition options', async () => {
      await fillToStep4();

      await waitFor(() => {
        expect(screen.getByText(/Excellent/i)).toBeInTheDocument();
        expect(screen.getByText(/Good/i)).toBeInTheDocument();
        expect(screen.getByText(/Fair/i)).toBeInTheDocument();
        expect(screen.getByText(/Poor/i)).toBeInTheDocument();
      });
    });

    test('displays photo upload section', async () => {
      await fillToStep4();

      await waitFor(() => {
        expect(screen.getByText(/Photos/i)).toBeInTheDocument();
      });
    });

    test('displays photo spots for front, rear, interior', async () => {
      await fillToStep4();

      await waitFor(() => {
        expect(screen.getByText(/Front/i)).toBeInTheDocument();
        expect(screen.getByText(/Rear/i)).toBeInTheDocument();
        expect(screen.getByText(/Interior/i)).toBeInTheDocument();
      });
    });

    test('selecting condition enables get estimate button', async () => {
      await fillToStep4();

      await waitFor(() => {
        expect(screen.getByText(/Good/i)).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText(/Good/i));

      const estimateButton = screen.getByText(/Get Estimate/i);
      expect(estimateButton).not.toBeDisabled();
    });

    test('clicking get estimate calls API', async () => {
      await fillToStep4();

      await waitFor(() => {
        expect(screen.getByText(/Good/i)).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText(/Good/i));
      fireEvent.click(screen.getByText(/Get Estimate/i));

      await waitFor(() => {
        expect(api.getTradeInEstimate).toHaveBeenCalled();
      });
    });
  });

  describe('Step 5 - Results', () => {
    const fillToStep5 = async () => {
      renderTradeInEstimator();

      await waitFor(() => {
        expect(api.getMakes).toHaveBeenCalled();
      });

      // Step 1
      const yearSelect = screen.getAllByRole('combobox')[0];
      fireEvent.change(yearSelect, { target: { value: '2020' } });

      const makeSelect = screen.getAllByRole('combobox')[1];
      fireEvent.change(makeSelect, { target: { value: 'Chevrolet' } });

      await waitFor(() => {
        expect(api.getModels).toHaveBeenCalled();
      });

      const modelSelect = screen.getAllByRole('combobox')[2];
      fireEvent.change(modelSelect, { target: { value: 'Silverado' } });

      const mileageInput = screen.getByPlaceholderText(/Enter mileage/i);
      fireEvent.change(mileageInput, { target: { value: '50000' } });

      fireEvent.click(screen.getByText(/Continue/i));

      // Step 2 - No payoff
      await waitFor(() => {
        expect(screen.getByText(/No, it's paid off/i)).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText(/No, it's paid off/i));

      // Step 4 - Condition
      await waitFor(() => {
        expect(screen.getByText(/Good/i)).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText(/Good/i));
      fireEvent.click(screen.getByText(/Get Estimate/i));
    };

    test('displays estimate value', async () => {
      await fillToStep5();

      await waitFor(() => {
        expect(screen.getByText(/\$25,000/i)).toBeInTheDocument();
      });
    });

    test('displays value range', async () => {
      await fillToStep5();

      await waitFor(() => {
        expect(screen.getByText(/\$22,000/i)).toBeInTheDocument();
        expect(screen.getByText(/\$28,000/i)).toBeInTheDocument();
      });
    });

    test('displays Apply Trade button', async () => {
      await fillToStep5();

      await waitFor(() => {
        expect(screen.getByText(/Apply Trade/i)).toBeInTheDocument();
      });
    });

    test('displays Request Appraisal button', async () => {
      await fillToStep5();

      await waitFor(() => {
        expect(screen.getByText(/Request.*Appraisal/i)).toBeInTheDocument();
      });
    });

    test('clicking Apply Trade updates customer data and navigates', async () => {
      await fillToStep5();

      await waitFor(() => {
        expect(screen.getByText(/Apply Trade/i)).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText(/Apply Trade/i));

      expect(mockUpdateCustomerData).toHaveBeenCalledWith(
        expect.objectContaining({
          tradeIn: expect.objectContaining({
            hasTrade: true,
            estimatedValue: 25000,
          }),
        })
      );

      expect(mockNavigateTo).toHaveBeenCalledWith('paymentCalculator');
    });
  });

  describe('Navigation', () => {
    test('back button returns to previous step', async () => {
      renderTradeInEstimator();

      await waitFor(() => {
        expect(api.getMakes).toHaveBeenCalled();
      });

      // Fill step 1
      const yearSelect = screen.getAllByRole('combobox')[0];
      fireEvent.change(yearSelect, { target: { value: '2020' } });

      const makeSelect = screen.getAllByRole('combobox')[1];
      fireEvent.change(makeSelect, { target: { value: 'Chevrolet' } });

      await waitFor(() => {
        expect(api.getModels).toHaveBeenCalled();
      });

      const modelSelect = screen.getAllByRole('combobox')[2];
      fireEvent.change(modelSelect, { target: { value: 'Silverado' } });

      const mileageInput = screen.getByPlaceholderText(/Enter mileage/i);
      fireEvent.change(mileageInput, { target: { value: '50000' } });

      fireEvent.click(screen.getByText(/Continue/i));

      // Now on step 2
      await waitFor(() => {
        expect(screen.getByText(/Do you still owe money/i)).toBeInTheDocument();
      });

      // Click back
      const backButton = screen.getByText(/Back/i);
      fireEvent.click(backButton);

      // Should be on step 1
      await waitFor(() => {
        expect(screen.getByText(/Vehicle Information/i)).toBeInTheDocument();
      });
    });

    test('data is preserved when going back', async () => {
      renderTradeInEstimator();

      await waitFor(() => {
        expect(api.getMakes).toHaveBeenCalled();
      });

      // Fill step 1
      const mileageInput = screen.getByPlaceholderText(/Enter mileage/i);
      fireEvent.change(mileageInput, { target: { value: '50000' } });

      const yearSelect = screen.getAllByRole('combobox')[0];
      fireEvent.change(yearSelect, { target: { value: '2020' } });

      const makeSelect = screen.getAllByRole('combobox')[1];
      fireEvent.change(makeSelect, { target: { value: 'Chevrolet' } });

      await waitFor(() => {
        expect(api.getModels).toHaveBeenCalled();
      });

      const modelSelect = screen.getAllByRole('combobox')[2];
      fireEvent.change(modelSelect, { target: { value: 'Silverado' } });

      fireEvent.click(screen.getByText(/Continue/i));

      // Go to step 2 then back
      await waitFor(() => {
        expect(screen.getByText(/Do you still owe money/i)).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText(/Back/i));

      // Mileage should still be 50000
      await waitFor(() => {
        const mileage = screen.getByPlaceholderText(/Enter mileage/i) as HTMLInputElement;
        expect(mileage.value).toBe('50,000');
      });
    });
  });

  describe('Error Handling', () => {
    test('displays error when estimate API fails', async () => {
      (api.getTradeInEstimate as jest.Mock).mockRejectedValue(new Error('API Error'));

      renderTradeInEstimator();

      await waitFor(() => {
        expect(api.getMakes).toHaveBeenCalled();
      });

      // Fill through to step 4
      const yearSelect = screen.getAllByRole('combobox')[0];
      fireEvent.change(yearSelect, { target: { value: '2020' } });

      const makeSelect = screen.getAllByRole('combobox')[1];
      fireEvent.change(makeSelect, { target: { value: 'Chevrolet' } });

      await waitFor(() => {
        expect(api.getModels).toHaveBeenCalled();
      });

      const modelSelect = screen.getAllByRole('combobox')[2];
      fireEvent.change(modelSelect, { target: { value: 'Silverado' } });

      const mileageInput = screen.getByPlaceholderText(/Enter mileage/i);
      fireEvent.change(mileageInput, { target: { value: '50000' } });

      fireEvent.click(screen.getByText(/Continue/i));

      await waitFor(() => {
        expect(screen.getByText(/No, it's paid off/i)).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText(/No, it's paid off/i));

      await waitFor(() => {
        expect(screen.getByText(/Good/i)).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText(/Good/i));
      fireEvent.click(screen.getByText(/Get Estimate/i));

      await waitFor(() => {
        expect(screen.getByText(/Unable to calculate estimate/i)).toBeInTheDocument();
      });
    });

    test('handles VIN decode failure gracefully', async () => {
      (api.decodeTradeInVin as jest.Mock).mockRejectedValue(new Error('VIN Error'));
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      renderTradeInEstimator();

      const vinInput = screen.getByPlaceholderText(/17-character VIN/i);
      fireEvent.change(vinInput, { target: { value: '1GCUDDED5RZ123456' } });

      await waitFor(() => {
        expect(screen.getByText(/Decode/i)).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText(/Decode/i));

      // Should not crash - form should still be usable
      await waitFor(() => {
        expect(screen.getByPlaceholderText(/Enter mileage/i)).toBeInTheDocument();
      });

      consoleSpy.mockRestore();
    });

    test('uses fallback makes when API fails', async () => {
      (api.getMakes as jest.Mock).mockRejectedValue(new Error('API Error'));
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      renderTradeInEstimator();

      // Should show fallback makes
      await waitFor(() => {
        const makeSelect = screen.getAllByRole('combobox')[1];
        expect(makeSelect).toBeInTheDocument();
      });

      consoleSpy.mockRestore();
    });
  });

  describe('Accessibility', () => {
    test('form inputs have labels', async () => {
      renderTradeInEstimator();

      expect(screen.getByText(/Year/i)).toBeInTheDocument();
      expect(screen.getByText(/Make/i)).toBeInTheDocument();
      expect(screen.getByText(/Model/i)).toBeInTheDocument();
      expect(screen.getByText(/Mileage/i)).toBeInTheDocument();
    });

    test('buttons are focusable', async () => {
      renderTradeInEstimator();

      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).not.toHaveAttribute('tabindex', '-1');
      });
    });

    test('progress is communicated visually', async () => {
      renderTradeInEstimator();

      expect(screen.getByText(/Step 1/i)).toBeInTheDocument();
    });
  });

  describe('Mobile Responsiveness', () => {
    test('renders correctly at mobile width', async () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', { value: 375 });
      window.dispatchEvent(new Event('resize'));

      renderTradeInEstimator();

      // Component should still render all elements
      expect(screen.getByText(/Vehicle Information/i)).toBeInTheDocument();
    });
  });
});

describe('TradeInEstimator Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (api.getMakes as jest.Mock).mockResolvedValue(mockMakes);
    (api.getModels as jest.Mock).mockResolvedValue(mockModels);
    (api.getTradeInEstimate as jest.Mock).mockResolvedValue(mockEstimate);
  });

  test('complete flow with payoff updates customer data correctly', async () => {
    renderTradeInEstimator();

    await waitFor(() => {
      expect(api.getMakes).toHaveBeenCalled();
    });

    // Step 1
    fireEvent.change(screen.getAllByRole('combobox')[0], { target: { value: '2020' } });
    fireEvent.change(screen.getAllByRole('combobox')[1], { target: { value: 'Chevrolet' } });

    await waitFor(() => {
      expect(api.getModels).toHaveBeenCalled();
    });

    fireEvent.change(screen.getAllByRole('combobox')[2], { target: { value: 'Silverado' } });
    fireEvent.change(screen.getByPlaceholderText(/Enter mileage/i), { target: { value: '50000' } });
    fireEvent.click(screen.getByText(/Continue/i));

    // Step 2 - Yes payoff
    await waitFor(() => {
      expect(screen.getByText(/Yes, I have a payoff/i)).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText(/Yes, I have a payoff/i));

    // Step 3 - Payoff details
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/Payoff amount/i)).toBeInTheDocument();
    });
    fireEvent.change(screen.getByPlaceholderText(/Payoff amount/i), { target: { value: '15000' } });
    fireEvent.change(screen.getByPlaceholderText(/Monthly payment/i), { target: { value: '450' } });
    fireEvent.click(screen.getByText(/Continue/i));

    // Step 4 - Condition
    await waitFor(() => {
      expect(screen.getByText(/Good/i)).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText(/Good/i));
    fireEvent.click(screen.getByText(/Get Estimate/i));

    // Step 5 - Results
    await waitFor(() => {
      expect(screen.getByText(/Apply Trade/i)).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText(/Apply Trade/i));

    expect(mockUpdateCustomerData).toHaveBeenCalledWith(
      expect.objectContaining({
        tradeIn: expect.objectContaining({
          hasTrade: true,
          hasPayoff: true,
          payoffAmount: 15000,
          monthlyPayment: 450,
          estimatedValue: 25000,
          equity: 10000, // 25000 - 15000
        }),
      })
    );
  });
});
