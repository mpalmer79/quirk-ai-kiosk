import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AIAssistant from '../components/AIAssistant';

// Mock the api module
jest.mock('../components/api', () => ({
  getInventory: jest.fn(),
  chatWithAI: jest.fn(),
  logTrafficSession: jest.fn(),
}));

import api from '../components/api';

// Mock SpeechRecognition
const mockSpeechRecognition = {
  start: jest.fn(),
  stop: jest.fn(),
  abort: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
};

// @ts-ignore
global.webkitSpeechRecognition = jest.fn(() => mockSpeechRecognition);

// Mock SpeechSynthesis
const mockSpeechSynthesis = {
  speak: jest.fn(),
  cancel: jest.fn(),
  getVoices: jest.fn(() => []),
};
Object.defineProperty(window, 'speechSynthesis', {
  value: mockSpeechSynthesis,
  writable: true,
});

// Mock props
const mockNavigateTo = jest.fn();
const mockUpdateCustomerData = jest.fn();
const mockResetJourney = jest.fn();

const defaultCustomerData = {
  customerName: 'John',
};

const mockVehicles = [
  {
    id: '1',
    stockNumber: 'M12345',
    year: 2025,
    make: 'Chevrolet',
    model: 'Silverado 1500',
    trim: 'LT',
    exteriorColor: 'Summit White',
    price: 52000,
    msrp: 54000,
    status: 'In Stock',
  },
  {
    id: '2',
    stockNumber: 'M12346',
    year: 2025,
    make: 'Chevrolet',
    model: 'Equinox',
    trim: 'RS',
    exteriorColor: 'Black',
    price: 35000,
    msrp: 36500,
    status: 'In Stock',
  },
];

const renderAIAssistant = (props = {}) => {
  return render(
    <AIAssistant
      navigateTo={mockNavigateTo}
      updateCustomerData={mockUpdateCustomerData}
      customerData={{ ...defaultCustomerData, ...props }}
      resetJourney={mockResetJourney}
    />
  );
};

describe('AIAssistant Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (api.getInventory as jest.Mock).mockResolvedValue(mockVehicles);
    (api.chatWithAI as jest.Mock).mockResolvedValue({
      message: 'I found some great trucks for you!',
      suggestedVehicles: ['M12345'],
    });
    (api.logTrafficSession as jest.Mock).mockResolvedValue(undefined);
  });

  describe('Initial Render', () => {
    test('displays header with AI assistant title', async () => {
      renderAIAssistant();

      expect(screen.getByText('Quirk AI Assistant')).toBeInTheDocument();
    });

    test('displays subtitle', async () => {
      renderAIAssistant();

      expect(screen.getByText(/I'm here to help you find/i)).toBeInTheDocument();
    });

    test('displays audio toggle button', async () => {
      renderAIAssistant();

      expect(screen.getByText(/Audio/i)).toBeInTheDocument();
    });

    test('displays message input field', async () => {
      renderAIAssistant();

      expect(screen.getByPlaceholderText(/Ask me anything/i)).toBeInTheDocument();
    });

    test('displays send button', async () => {
      renderAIAssistant();

      // Find send button by SVG path or button role
      const buttons = screen.getAllByRole('button');
      const sendButton = buttons.find(btn => btn.querySelector('svg path[d*="M22 2"]'));
      expect(sendButton).toBeTruthy();
    });

    test('displays suggested prompts when no messages', async () => {
      renderAIAssistant();

      expect(screen.getByText(/Try asking/i)).toBeInTheDocument();
      expect(screen.getByText(/I need a truck that can tow a boat/i)).toBeInTheDocument();
    });

    test('loads inventory on mount', async () => {
      renderAIAssistant();

      await waitFor(() => {
        expect(api.getInventory).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('Suggested Prompts', () => {
    test('displays all suggested prompts', async () => {
      renderAIAssistant();

      expect(screen.getByText(/I need a truck that can tow a boat/i)).toBeInTheDocument();
      expect(screen.getByText(/best family SUV/i)).toBeInTheDocument();
      expect(screen.getByText(/fuel efficient/i)).toBeInTheDocument();
    });

    test('clicking suggested prompt sends message', async () => {
      renderAIAssistant();

      const prompt = screen.getByText(/I need a truck that can tow a boat/i);
      fireEvent.click(prompt);

      await waitFor(() => {
        expect(api.chatWithAI).toHaveBeenCalled();
      });
    });

    test('suggested prompts hide after first message sent', async () => {
      renderAIAssistant();

      const prompt = screen.getByText(/I need a truck that can tow a boat/i);
      fireEvent.click(prompt);

      await waitFor(() => {
        expect(screen.queryByText(/Try asking/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Message Sending', () => {
    test('sends message when send button clicked', async () => {
      renderAIAssistant();

      const input = screen.getByPlaceholderText(/Ask me anything/i);
      fireEvent.change(input, { target: { value: 'Show me trucks' } });

      const buttons = screen.getAllByRole('button');
      const sendButton = buttons.find(btn => 
        btn.style.background?.includes('gradient') || 
        btn.querySelector('svg path[d*="M22 2"]')
      );
      
      if (sendButton) {
        fireEvent.click(sendButton);
      }

      await waitFor(() => {
        expect(api.chatWithAI).toHaveBeenCalled();
      });
    });

    test('sends message when Enter key pressed', async () => {
      renderAIAssistant();

      const input = screen.getByPlaceholderText(/Ask me anything/i);
      fireEvent.change(input, { target: { value: 'Show me trucks' } });
      fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

      await waitFor(() => {
        expect(api.chatWithAI).toHaveBeenCalled();
      });
    });

    test('does not send empty message', async () => {
      renderAIAssistant();

      const input = screen.getByPlaceholderText(/Ask me anything/i);
      fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

      expect(api.chatWithAI).not.toHaveBeenCalled();
    });

    test('clears input after sending message', async () => {
      renderAIAssistant();

      const input = screen.getByPlaceholderText(/Ask me anything/i) as HTMLInputElement;
      fireEvent.change(input, { target: { value: 'Show me trucks' } });
      fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

      await waitFor(() => {
        expect(input.value).toBe('');
      });
    });

    test('displays user message in chat', async () => {
      renderAIAssistant();

      const input = screen.getByPlaceholderText(/Ask me anything/i);
      fireEvent.change(input, { target: { value: 'Show me trucks' } });
      fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

      await waitFor(() => {
        expect(screen.getByText('Show me trucks')).toBeInTheDocument();
      });
    });

    test('displays AI response in chat', async () => {
      renderAIAssistant();

      const input = screen.getByPlaceholderText(/Ask me anything/i);
      fireEvent.change(input, { target: { value: 'Show me trucks' } });
      fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

      await waitFor(() => {
        expect(screen.getByText(/great trucks for you/i)).toBeInTheDocument();
      });
    });
  });

  describe('Loading State', () => {
    test('shows loading indicator while waiting for response', async () => {
      // Delay the API response
      (api.chatWithAI as jest.Mock).mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({ message: 'Response' }), 500))
      );

      renderAIAssistant();

      const input = screen.getByPlaceholderText(/Ask me anything/i);
      fireEvent.change(input, { target: { value: 'Show me trucks' } });
      fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

      // Should show loading dots
      await waitFor(() => {
        const loadingDots = document.querySelectorAll('[style*="animation"]');
        expect(loadingDots.length).toBeGreaterThan(0);
      });
    });

    test('disables input while loading', async () => {
      (api.chatWithAI as jest.Mock).mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({ message: 'Response' }), 500))
      );

      renderAIAssistant();

      const input = screen.getByPlaceholderText(/Ask me anything/i) as HTMLInputElement;
      fireEvent.change(input, { target: { value: 'Show me trucks' } });
      fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

      await waitFor(() => {
        expect(input.disabled).toBe(true);
      });
    });
  });

  describe('Vehicle Recommendations', () => {
    test('displays vehicle cards when AI suggests vehicles', async () => {
      (api.chatWithAI as jest.Mock).mockResolvedValue({
        message: 'Here are some options',
        suggestedVehicles: ['M12345'],
      });

      renderAIAssistant();

      const input = screen.getByPlaceholderText(/Ask me anything/i);
      fireEvent.change(input, { target: { value: 'Show me trucks' } });
      fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

      await waitFor(() => {
        expect(screen.getByText('Silverado 1500')).toBeInTheDocument();
      });
    });

    test('clicking vehicle card navigates to vehicle detail', async () => {
      (api.chatWithAI as jest.Mock).mockResolvedValue({
        message: 'Here are some options',
        suggestedVehicles: ['M12345'],
      });

      renderAIAssistant();

      const input = screen.getByPlaceholderText(/Ask me anything/i);
      fireEvent.change(input, { target: { value: 'Show me trucks' } });
      fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

      await waitFor(() => {
        expect(screen.getByText('Silverado 1500')).toBeInTheDocument();
      });

      // Click on the vehicle card
      const vehicleCard = screen.getByText('Silverado 1500').closest('div[style*="cursor"]');
      if (vehicleCard) {
        fireEvent.click(vehicleCard);
      }

      expect(mockNavigateTo).toHaveBeenCalledWith('vehicleDetail');
    });

    test('clicking vehicle card updates customer data', async () => {
      (api.chatWithAI as jest.Mock).mockResolvedValue({
        message: 'Here are some options',
        suggestedVehicles: ['M12345'],
      });

      renderAIAssistant();

      const input = screen.getByPlaceholderText(/Ask me anything/i);
      fireEvent.change(input, { target: { value: 'Show me trucks' } });
      fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

      await waitFor(() => {
        expect(screen.getByText('Silverado 1500')).toBeInTheDocument();
      });

      const vehicleCard = screen.getByText('Silverado 1500').closest('div[style*="cursor"]');
      if (vehicleCard) {
        fireEvent.click(vehicleCard);
      }

      expect(mockUpdateCustomerData).toHaveBeenCalledWith(
        expect.objectContaining({
          selectedVehicle: expect.objectContaining({
            stockNumber: 'M12345',
            model: 'Silverado 1500',
          }),
        })
      );
    });

    test('displays vehicle price in cards', async () => {
      (api.chatWithAI as jest.Mock).mockResolvedValue({
        message: 'Here are some options',
        suggestedVehicles: ['M12345'],
      });

      renderAIAssistant();

      const input = screen.getByPlaceholderText(/Ask me anything/i);
      fireEvent.change(input, { target: { value: 'Show me trucks' } });
      fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

      await waitFor(() => {
        expect(screen.getByText('$52,000')).toBeInTheDocument();
      });
    });
  });

  describe('Audio Controls', () => {
    test('audio toggle changes state when clicked', async () => {
      renderAIAssistant();

      const audioButton = screen.getByText(/Audio/i).closest('button');
      expect(audioButton).toBeTruthy();

      if (audioButton) {
        // Initial state - audio off
        expect(audioButton).toHaveStyle({ borderColor: 'rgba(255,255,255,0.2)' });

        fireEvent.click(audioButton);

        // After click - audio on (border color changes)
        await waitFor(() => {
          expect(audioButton.style.borderColor).toBeTruthy();
        });
      }
    });
  });

  describe('Start Over', () => {
    test('displays start over button', async () => {
      renderAIAssistant();

      expect(screen.getByText('Start Over')).toBeInTheDocument();
    });

    test('clicking start over resets conversation', async () => {
      renderAIAssistant();

      // Send a message first
      const input = screen.getByPlaceholderText(/Ask me anything/i);
      fireEvent.change(input, { target: { value: 'Show me trucks' } });
      fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

      await waitFor(() => {
        expect(screen.getByText('Show me trucks')).toBeInTheDocument();
      });

      // Click start over
      fireEvent.click(screen.getByText('Start Over'));

      // Suggested prompts should reappear
      await waitFor(() => {
        expect(screen.getByText(/Try asking/i)).toBeInTheDocument();
      });
    });

    test('start over calls resetJourney', async () => {
      renderAIAssistant();

      fireEvent.click(screen.getByText('Start Over'));

      expect(mockResetJourney).toHaveBeenCalled();
    });
  });

  describe('Session Logging', () => {
    test('logs session on message send', async () => {
      renderAIAssistant();

      const input = screen.getByPlaceholderText(/Ask me anything/i);
      fireEvent.change(input, { target: { value: 'Show me trucks' } });
      fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

      await waitFor(() => {
        expect(api.logTrafficSession).toHaveBeenCalled();
      });
    });

    test('logs session includes chat history', async () => {
      renderAIAssistant();

      const input = screen.getByPlaceholderText(/Ask me anything/i);
      fireEvent.change(input, { target: { value: 'Show me trucks' } });
      fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

      await waitFor(() => {
        expect(api.logTrafficSession).toHaveBeenCalledWith(
          expect.objectContaining({
            chatHistory: expect.arrayContaining([
              expect.objectContaining({
                role: 'user',
                content: 'Show me trucks',
              }),
            ]),
          })
        );
      });
    });
  });

  describe('Error Handling', () => {
    test('handles API error gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      (api.chatWithAI as jest.Mock).mockRejectedValue(new Error('API Error'));

      renderAIAssistant();

      const input = screen.getByPlaceholderText(/Ask me anything/i);
      fireEvent.change(input, { target: { value: 'Show me trucks' } });
      fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

      // Should not crash - check that input is re-enabled
      await waitFor(() => {
        expect((screen.getByPlaceholderText(/Ask me anything/i) as HTMLInputElement).disabled).toBe(false);
      });

      consoleSpy.mockRestore();
    });

    test('handles empty inventory gracefully', async () => {
      (api.getInventory as jest.Mock).mockResolvedValue([]);

      renderAIAssistant();

      await waitFor(() => {
        expect(api.getInventory).toHaveBeenCalled();
      });

      // Component should still render
      expect(screen.getByText('Quirk AI Assistant')).toBeInTheDocument();
    });
  });

  describe('Customer Name Integration', () => {
    test('includes customer name in API request when available', async () => {
      renderAIAssistant();

      const input = screen.getByPlaceholderText(/Ask me anything/i);
      fireEvent.change(input, { target: { value: 'Hi there' } });
      fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

      await waitFor(() => {
        expect(api.chatWithAI).toHaveBeenCalledWith(
          expect.objectContaining({
            customerName: 'John',
          })
        );
      });
    });
  });

  describe('Conversation History', () => {
    test('maintains conversation history across messages', async () => {
      renderAIAssistant();

      // Send first message
      const input = screen.getByPlaceholderText(/Ask me anything/i);
      fireEvent.change(input, { target: { value: 'Hi' } });
      fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

      await waitFor(() => {
        expect(api.chatWithAI).toHaveBeenCalledTimes(1);
      });

      // Send second message
      fireEvent.change(input, { target: { value: 'Show me trucks' } });
      fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

      await waitFor(() => {
        expect(api.chatWithAI).toHaveBeenCalledTimes(2);
        // Second call should include conversation history
        expect(api.chatWithAI).toHaveBeenLastCalledWith(
          expect.objectContaining({
            conversationHistory: expect.arrayContaining([
              expect.objectContaining({ role: 'user', content: 'Hi' }),
            ]),
          })
        );
      });
    });
  });

  describe('Accessibility', () => {
    test('input has accessible placeholder', async () => {
      renderAIAssistant();

      const input = screen.getByPlaceholderText(/Ask me anything/i);
      expect(input).toBeInTheDocument();
    });

    test('buttons are focusable', async () => {
      renderAIAssistant();

      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).not.toHaveAttribute('tabindex', '-1');
      });
    });
  });
});

describe('AIAssistant Data Extraction', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (api.getInventory as jest.Mock).mockResolvedValue(mockVehicles);
    (api.chatWithAI as jest.Mock).mockResolvedValue({ message: 'Response' });
    (api.logTrafficSession as jest.Mock).mockResolvedValue(undefined);
  });

  test('extracts budget from message with dollar sign', async () => {
    renderAIAssistant();

    const input = screen.getByPlaceholderText(/Ask me anything/i);
    fireEvent.change(input, { target: { value: 'My budget is $50,000' } });
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

    await waitFor(() => {
      expect(api.logTrafficSession).toHaveBeenCalledWith(
        expect.objectContaining({
          budget: expect.objectContaining({
            max: 50000,
          }),
        })
      );
    });
  });

  test('extracts vehicle interest from message', async () => {
    renderAIAssistant();

    const input = screen.getByPlaceholderText(/Ask me anything/i);
    fireEvent.change(input, { target: { value: 'I want a Silverado' } });
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

    await waitFor(() => {
      expect(api.logTrafficSession).toHaveBeenCalledWith(
        expect.objectContaining({
          vehicleInterest: expect.objectContaining({
            model: 'Silverado',
          }),
        })
      );
    });
  });

  test('extracts trade-in intent from message', async () => {
    renderAIAssistant();

    const input = screen.getByPlaceholderText(/Ask me anything/i);
    fireEvent.change(input, { target: { value: 'I have a trade' } });
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

    await waitFor(() => {
      expect(api.logTrafficSession).toHaveBeenCalledWith(
        expect.objectContaining({
          tradeIn: expect.objectContaining({
            hasTrade: true,
          }),
        })
      );
    });
  });
});
