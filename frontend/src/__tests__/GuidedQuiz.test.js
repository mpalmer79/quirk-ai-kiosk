import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import GuidedQuiz from '../components/Guidedquiz';

const mockNavigateTo = jest.fn();
const mockUpdateCustomerData = jest.fn();
const defaultCustomerData = {};

const renderGuidedQuiz = (props = {}) => {
  return render(
    <GuidedQuiz
      navigateTo={mockNavigateTo}
      updateCustomerData={mockUpdateCustomerData}
      customerData={defaultCustomerData}
      {...props}
    />
  );
};

describe('GuidedQuiz Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Initial Render', () => {
    test('renders first question on mount', () => {
      renderGuidedQuiz();
      expect(screen.getByText(/What will you primarily use this vehicle for/i)).toBeInTheDocument();
    });

    test('displays progress indicator as Question 1', () => {
      renderGuidedQuiz();
      expect(screen.getByText(/Question 1 of/i)).toBeInTheDocument();
    });

    test('renders all primary use options', () => {
      renderGuidedQuiz();
      expect(screen.getByText('Daily Commute')).toBeInTheDocument();
      expect(screen.getByText('Family Hauling')).toBeInTheDocument();
      expect(screen.getByText('Work & Towing')).toBeInTheDocument();
      expect(screen.getByText('Weekend Fun')).toBeInTheDocument();
      expect(screen.getByText('All of the Above')).toBeInTheDocument();
    });

    test('Previous button is disabled on first question', () => {
      renderGuidedQuiz();
      const prevButton = screen.getByText('Previous');
      expect(prevButton).toHaveStyle({ opacity: '0.3' });
    });
  });

  describe('Question Navigation', () => {
    test('selecting an option advances to next question', async () => {
      renderGuidedQuiz();
      
      fireEvent.click(screen.getByText('Daily Commute'));
      
      await waitFor(() => {
        expect(screen.getByText(/How many passengers/i)).toBeInTheDocument();
      }, { timeout: 500 });
    });

    test('Previous button navigates back', async () => {
      renderGuidedQuiz();
      
      fireEvent.click(screen.getByText('Daily Commute'));
      
      await waitFor(() => {
        expect(screen.getByText(/How many passengers/i)).toBeInTheDocument();
      });
      
      fireEvent.click(screen.getByText('Previous'));
      
      await waitFor(() => {
        expect(screen.getByText(/What will you primarily use/i)).toBeInTheDocument();
      });
    });

    test('progress bar updates with each question', async () => {
      renderGuidedQuiz();
      
      expect(screen.getByText(/Question 1 of 10/i)).toBeInTheDocument();
      
      fireEvent.click(screen.getByText('Daily Commute'));
      
      await waitFor(() => {
        expect(screen.getByText(/Question 2 of 10/i)).toBeInTheDocument();
      });
    });
  });

  describe('Option Selection', () => {
    test('selected option shows visual feedback', () => {
      renderGuidedQuiz();
      
      const option = screen.getByText('Daily Commute').closest('button');
      fireEvent.click(option);
      
      expect(option).toHaveStyle({ borderColor: '#1B7340' });
    });
  });

  describe('Lease vs Finance Help Modal', () => {
    const navigateToPaymentQuestion = async () => {
      renderGuidedQuiz();
      
      const answers = [
        'Daily Commute',
        'Just Me',
        'Under 10,000',
        'No',
      ];
      
      for (const answer of answers) {
        fireEvent.click(screen.getByText(answer));
        await waitFor(() => {}, { timeout: 400 });
      }
      
      await waitFor(() => {
        expect(screen.getByText(/lease or finance/i)).toBeInTheDocument();
      });
    };

    test('selecting "Help Me Decide" shows lease comparison modal', async () => {
      await navigateToPaymentQuestion();
      
      fireEvent.click(screen.getByText('Help Me Decide'));
      
      await waitFor(() => {
        expect(screen.getByText(/Lease vs. Finance/i)).toBeInTheDocument();
      });
    });

    test('lease modal shows AI recommendation based on mileage', async () => {
      await navigateToPaymentQuestion();
      
      fireEvent.click(screen.getByText('Help Me Decide'));
      
      await waitFor(() => {
        expect(screen.getByText(/AI Recommendation/i)).toBeInTheDocument();
      });
    });

    test('clicking "I\'ll Lease" closes modal and continues', async () => {
      await navigateToPaymentQuestion();
      
      fireEvent.click(screen.getByText('Help Me Decide'));
      
      await waitFor(() => {
        expect(screen.getByText(/Lease vs. Finance/i)).toBeInTheDocument();
      });
      
      fireEvent.click(screen.getByText("I'll Lease"));
      
      await waitFor(() => {
        expect(screen.getByText(/monthly payment/i)).toBeInTheDocument();
      });
    });

    test('back to quiz button returns to question', async () => {
      await navigateToPaymentQuestion();
      
      fireEvent.click(screen.getByText('Help Me Decide'));
      
      await waitFor(() => {
        expect(screen.getByText('← Back to question')).toBeInTheDocument();
      });
      
      fireEvent.click(screen.getByText('← Back to question'));
      
      await waitFor(() => {
        expect(screen.getByText(/lease or finance/i)).toBeInTheDocument();
      });
    });
  });
});

describe('GuidedQuiz Accessibility', () => {
  test('options are keyboard accessible', () => {
    renderGuidedQuiz();
    
    const option = screen.getByText('Daily Commute').closest('button');
    expect(option.tagName).toBe('BUTTON');
  });

  test('navigation buttons are focusable', () => {
    renderGuidedQuiz();
    
    const prevButton = screen.getByText('Previous');
    expect(prevButton.tagName).toBe('BUTTON');
  });
});
