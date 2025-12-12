import '@testing-library/jest-dom';

// =============================================================================
// DOM API MOCKS
// =============================================================================

// Mock scrollTo
window.scrollTo = jest.fn();

// Mock scrollIntoView
Element.prototype.scrollIntoView = jest.fn();

// Mock IntersectionObserver
class MockIntersectionObserver {
  constructor(callback) {
    this.callback = callback;
  }
  observe() { return null; }
  unobserve() { return null; }
  disconnect() { return null; }
}
window.IntersectionObserver = MockIntersectionObserver;

// Mock ResizeObserver
class MockResizeObserver {
  constructor(callback) {
    this.callback = callback;
  }
  observe() { return null; }
  unobserve() { return null; }
  disconnect() { return null; }
}
window.ResizeObserver = MockResizeObserver;

// Mock matchMedia
window.matchMedia = window.matchMedia || function(query) {
  return {
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  };
};

// Mock HTMLMediaElement methods (for video/audio elements in tests)
window.HTMLMediaElement.prototype.play = jest.fn().mockResolvedValue(undefined);
window.HTMLMediaElement.prototype.pause = jest.fn();
window.HTMLMediaElement.prototype.load = jest.fn();

// =============================================================================
// SPEECH SYNTHESIS MOCK
// =============================================================================

const mockSpeechSynthesis = {
  speak: jest.fn(),
  cancel: jest.fn(),
  pause: jest.fn(),
  resume: jest.fn(),
  getVoices: jest.fn(() => [
    { name: 'Google US English', lang: 'en-US', default: true },
    { name: 'Google UK English Female', lang: 'en-GB', default: false },
  ]),
  speaking: false,
  paused: false,
  pending: false,
  onvoiceschanged: null,
};

Object.defineProperty(window, 'speechSynthesis', {
  value: mockSpeechSynthesis,
  writable: true,
  configurable: true,
});

// Mock SpeechSynthesisUtterance
class MockSpeechSynthesisUtterance {
  constructor(text) {
    this.text = text;
    this.lang = 'en-US';
    this.voice = null;
    this.volume = 1;
    this.rate = 1;
    this.pitch = 1;
    this.onend = null;
    this.onerror = null;
    this.onstart = null;
  }
}

window.SpeechSynthesisUtterance = MockSpeechSynthesisUtterance;

// =============================================================================
// FETCH MOCK HELPER
// =============================================================================

// Helper to create mock fetch responses
global.createMockResponse = (data, status = 200) => {
  return Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(JSON.stringify(data)),
    headers: new Headers({ 'Content-Type': 'application/json' }),
  });
};

// =============================================================================
// CONSOLE SUPPRESSION (for cleaner test output)
// =============================================================================

// Suppress console.error for expected errors in tests
const originalError = console.error;
beforeAll(() => {
  console.error = (...args) => {
    // Filter out React act() warnings and expected test errors
    const message = args[0];
    if (
      typeof message === 'string' &&
      (message.includes('Warning: An update to') ||
       message.includes('Warning: ReactDOM.render') ||
       message.includes('act(...)') ||
       message.includes('Removing a style property during rerender') ||
       message.includes('Not implemented: HTMLMediaElement.prototype.play') ||
       message.includes('Error: API Error'))
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});

// =============================================================================
// ENVIRONMENT VARIABLES
// =============================================================================

process.env.REACT_APP_API_URL = 'http://localhost:8000/api/v1';
process.env.REACT_APP_ENVIRONMENT = 'test';
process.env.REACT_APP_DEALERSHIP = 'Test Dealership';
process.env.REACT_APP_KIOSK_ID = 'TEST-KIOSK-001';
