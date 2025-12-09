// Mock SpeechSynthesis BEFORE any imports - must be at the very top
// Create a proper mock that behaves like an EventTarget

class MockSpeechSynthesis {
  private listeners: { [key: string]: Function[] } = {};
  
  speak = jest.fn();
  cancel = jest.fn();
  pause = jest.fn();
  resume = jest.fn();
  getVoices = jest.fn(() => []);
  paused = false;
  pending = false;
  speaking = false;
  onvoiceschanged: ((this: SpeechSynthesis, ev: Event) => any) | null = null;

  addEventListener(type: string, listener: EventListener) {
    if (!this.listeners[type]) {
      this.listeners[type] = [];
    }
    this.listeners[type].push(listener);
  }

  removeEventListener(type: string, listener: EventListener) {
    if (this.listeners[type]) {
      this.listeners[type] = this.listeners[type].filter(l => l !== listener);
    }
  }

  dispatchEvent(event: Event): boolean {
    return true;
  }
}

const mockSpeechSynthesis = new MockSpeechSynthesis();

// Delete any existing speechSynthesis to avoid jsdom conflicts
if (typeof window !== 'undefined') {
  delete (window as any).speechSynthesis;
}

Object.defineProperty(window, 'speechSynthesis', {
  value: mockSpeechSynthesis,
  writable: true,
  configurable: true,
});

// Mock SpeechSynthesisUtterance
global.SpeechSynthesisUtterance = jest.fn().mockImplementation(() => ({
  text: '',
  voice: null,
  lang: '',
  rate: 1,
  pitch: 1,
  volume: 1,
  onstart: null,
  onend: null,
  onerror: null,
  onpause: null,
  onresume: null,
  onmark: null,
  onboundary: null,
}));

// Mock SpeechRecognition
const mockSpeechRecognition = {
  start: jest.fn(),
  stop: jest.fn(),
  abort: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  onresult: null,
  onend: null,
  onerror: null,
  continuous: false,
  interimResults: false,
  lang: '',
};

global.webkitSpeechRecognition = jest.fn(() => mockSpeechRecognition);
global.SpeechRecognition = jest.fn(() => mockSpeechRecognition);

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AIAssistant from '../components/AIAssistant';

// Mock the api module
jest.mock('../components/api', () => ({
  getInventory: jest.fn(),
  chatWithAI: jest.fn(),
  logTrafficSession: jest.fn(),
}));

import api from '../components/api';

// Mock props
const mockNavigateTo = jest.fn();
const mockUpdateCustomerData = jest.fn();
const mockResetJourney = jest.fn();

const mockVehicles = [
  {
    id: '1',
    stockNumber: 'M12345',
    stock_number: 'M12345',
    year: 2025,
    make: 'Chevrolet',
    model: 'Silverado 1500',
    trim: 'LT',
    exteriorColor: 'Summit White',
    exterior_color: 'Summit White',
    price: 52000,
    salePrice: 52000,
    sale_price: 52000,
    msrp: 54000,
    status: 'In Stock',
  },
  {
    id: '2',
    stockNumber: 'M12346',
    stock_number: 'M12346',
    year: 2025,
    make: 'Chevrolet',
    model: 'Equinox',
    trim: 'RS',
    exteriorColor: 'Black',
    exterior_color: 'Black',
    price: 35000,
    salePrice: 35000,
    sale_price: 35000,
    msrp: 36500,
    status: 'In Stock',
  },
];

const defaultProps = {
  navigateTo: mockNavigateTo,
  updateCustomerData: mockUpdateCustomerData,
  customerData: { customerName: 'John' },
  resetJourney: mockResetJourney,
};

const renderAIAssistant = (props = {}) => {
  return render(<AIAssistant {...defaultProps} {...props} />);
};

describe('AIAssistant Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    api.getInventory.mockResolvedValue(mockVehicles);
    api.chatWithAI.mockResolvedValue({
      message: 'I found some great trucks for you!',
      suggestedVehicles: ['M12345'],
    });
    api.logTrafficSession.mockResolvedValue(undefined);
  });

  describe('Initial Render', () => {
    test('displays personalized greeting when customer name provided', () => {
      renderAIAssistant();
      expect(screen.getByText(/Hi John/i)).toBeInTheDocument();
    });

    test('displays generic greeting when no customer name', () => {
      renderAIAssistant({ customerData: {} });
      expect(screen.getByText(/find your perfect vehicle/i)).toBeInTheDocument();
    });

    test('displays subtitle text', () => {
      renderAIAssistant();
      expect(screen.getByText(/Ask me anything about our inventory/i)).toBeInTheDocument();
    });

    test('displays message input field', () => {
      renderAIAssistant();
      expect(screen.getByPlaceholderText(/Type your message/i)).toBeInTheDocument();
    });

    test('loads inventory on mount', async () => {
      renderAIAssistant();
      await waitFor(() => {
        expect(api.getInventory).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('Suggested Prompts', () => {
    test('displays suggested prompts when no messages', () => {
      renderAIAssistant();
      expect(screen.getByText(/Try asking me/i)).toBeInTheDocument();
    });

    test('displays truck towing prompt', () => {
      renderAIAssistant();
      expect(screen.getByText(/I need a truck that can tow a boat/i)).toBeInTheDocument();
    });

    test('displays family SUV prompt', () => {
      renderAIAssistant();
      expect(screen.getByText(/best family SUV/i)).toBeInTheDocument();
    });

    test('clicking suggested prompt sends message', async () => {
      renderAIAssistant();
      fireEvent.click(screen.getByText(/I need a truck that can tow a boat/i));
      await waitFor(() => {
        expect(api.chatWithAI).toHaveBeenCalled();
      });
    });
  });

  describe('Message Input', () => {
    test('sends message when Enter key pressed', async () => {
      renderAIAssistant();
      const input = screen.getByPlaceholderText(/Type your message/i);
      fireEvent.change(input, { target: { value: 'Show me trucks' } });
      fireEvent.keyPress(input, { key: 'Enter', code: 'Enter', charCode: 13 });
      await waitFor(() => {
        expect(api.chatWithAI).toHaveBeenCalled();
      });
    });

    test('does not send empty message', () => {
      renderAIAssistant();
      const input = screen.getByPlaceholderText(/Type your message/i);
      fireEvent.keyPress(input, { key: 'Enter', code: 'Enter', charCode: 13 });
      expect(api.chatWithAI).not.toHaveBeenCalled();
    });

    test('clears input after sending', async () => {
      renderAIAssistant();
      const input = screen.getByPlaceholderText(/Type your message/i) as HTMLInputElement;
      fireEvent.change(input, { target: { value: 'Show me trucks' } });
      fireEvent.keyPress(input, { key: 'Enter', code: 'Enter', charCode: 13 });
      await waitFor(() => {
        expect(input.value).toBe('');
      });
    });
  });

  describe('Chat Messages', () => {
    test('displays user message in chat', async () => {
      renderAIAssistant();
      const input = screen.getByPlaceholderText(/Type your message/i);
      fireEvent.change(input, { target: { value: 'I need a truck' } });
      fireEvent.keyPress(input, { key: 'Enter', code: 'Enter', charCode: 13 });
      await waitFor(() => {
        expect(screen.getByText('I need a truck')).toBeInTheDocument();
      });
    });

    test('displays AI response in chat', async () => {
      renderAIAssistant();
      const input = screen.getByPlaceholderText(/Type your message/i);
      fireEvent.change(input, { target: { value: 'Show me trucks' } });
      fireEvent.keyPress(input, { key: 'Enter', code: 'Enter', charCode: 13 });
      await waitFor(() => {
        expect(screen.getByText(/I found some great trucks/i)).toBeInTheDocument();
      });
    });
  });

  describe('Vehicle Suggestions', () => {
    test('displays vehicle cards when AI suggests vehicles', async () => {
      api.chatWithAI.mockResolvedValue({
        message: 'Here are some options',
        suggestedVehicles: ['M12345'],
      });
      renderAIAssistant();
      const input = screen.getByPlaceholderText(/Type your message/i);
      fireEvent.change(input, { target: { value: 'Show me trucks' } });
      fireEvent.keyPress(input, { key: 'Enter', code: 'Enter', charCode: 13 });
      await waitFor(() => {
        const silveradoMatches = screen.getAllByText(/Silverado 1500/i);
        expect(silveradoMatches.length).toBeGreaterThan(0);
      });
    });

    test('displays View Details link for vehicle', async () => {
      api.chatWithAI.mockResolvedValue({
        message: 'Here are some options',
        suggestedVehicles: ['M12345'],
      });
      renderAIAssistant();
      const input = screen.getByPlaceholderText(/Type your message/i);
      fireEvent.change(input, { target: { value: 'Show me trucks' } });
      fireEvent.keyPress(input, { key: 'Enter', code: 'Enter', charCode: 13 });
      await waitFor(() => {
        expect(screen.getByText(/View Details/i)).toBeInTheDocument();
      });
    });

    test('clicking vehicle navigates to detail page', async () => {
      api.chatWithAI.mockResolvedValue({
        message: 'Here are some options',
        suggestedVehicles: ['M12345'],
      });
      renderAIAssistant();
      const input = screen.getByPlaceholderText(/Type your message/i);
      fireEvent.change(input, { target: { value: 'Show me trucks' } });
      fireEvent.keyPress(input, { key: 'Enter', code: 'Enter', charCode: 13 });
      await waitFor(() => {
        expect(screen.getByText(/View Details/i)).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText(/View Details/i));
      expect(mockNavigateTo).toHaveBeenCalledWith('vehicleDetail');
    });
  });

  describe('Start Over', () => {
    test('displays Start Over button', () => {
      renderAIAssistant();
      expect(screen.getByText('Start Over')).toBeInTheDocument();
    });

    test('clicking Start Over calls resetJourney', () => {
      renderAIAssistant();
      fireEvent.click(screen.getByText('Start Over'));
      expect(mockResetJourney).toHaveBeenCalled();
    });
  });

  describe('Audio Toggle', () => {
    test('displays Audio Off by default', () => {
      renderAIAssistant();
      expect(screen.getByText('Audio Off')).toBeInTheDocument();
    });

    test('clicking audio button toggles audio state', () => {
      renderAIAssistant();
      fireEvent.click(screen.getByText('Audio Off'));
      expect(screen.getByText('Audio On')).toBeInTheDocument();
    });
  });

  describe('API Integration', () => {
    test('includes customer name in chat request', async () => {
      renderAIAssistant();
      const input = screen.getByPlaceholderText(/Type your message/i);
      fireEvent.change(input, { target: { value: 'Show me trucks' } });
      fireEvent.keyPress(input, { key: 'Enter', code: 'Enter', charCode: 13 });
      await waitFor(() => {
        expect(api.chatWithAI).toHaveBeenCalledWith(
          expect.objectContaining({
            customerName: 'John',
          })
        );
      });
    });

    test('logs session on message send', async () => {
      renderAIAssistant();
      const input = screen.getByPlaceholderText(/Type your message/i);
      fireEvent.change(input, { target: { value: 'Show me trucks' } });
      fireEvent.keyPress(input, { key: 'Enter', code: 'Enter', charCode: 13 });
      await waitFor(() => {
        expect(api.chatWithAI).toHaveBeenCalled();
      });
      await waitFor(() => {
        expect(api.logTrafficSession).toHaveBeenCalled();
      });
    });
  });

  describe('Error Handling', () => {
    let consoleErrorSpy: jest.SpyInstance;

    beforeEach(() => {
      consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
      consoleErrorSpy.mockRestore();
    });

    test('handles chat API error gracefully', async () => {
      api.chatWithAI.mockRejectedValue(new Error('Network error'));
      renderAIAssistant();
      const input = screen.getByPlaceholderText(/Type your message/i);
      fireEvent.change(input, { target: { value: 'Show me trucks' } });
      fireEvent.keyPress(input, { key: 'Enter', code: 'Enter', charCode: 13 });
      await waitFor(() => {
        expect(screen.getByPlaceholderText(/Type your message/i)).toBeInTheDocument();
      });
    });

    test('handles inventory API error gracefully', async () => {
      api.getInventory.mockRejectedValue(new Error('Network error'));
      renderAIAssistant();
      expect(screen.getByText(/Hi John/i)).toBeInTheDocument();
    });
  });
});
