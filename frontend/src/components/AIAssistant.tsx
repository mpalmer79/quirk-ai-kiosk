import React, { useState, useRef, useEffect, useCallback, KeyboardEvent, CSSProperties } from 'react';
import api from './api';
import type { Vehicle, KioskComponentProps } from '../types';

// Message types
interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  vehicles?: Vehicle[];
  timestamp: Date;
}

// Extracted data from conversation for 4-square
interface ExtractedData {
  vehicleInterest: {
    model: string | null;
    bodyType: string | null;
    features: string[];
  };
  budget: {
    min: number | null;
    max: number | null;
    monthlyPayment: number | null;
    downPayment: number | null;
  };
  tradeIn: {
    hasTrade: boolean | null;
    vehicle: {
      year: string | null;
      make: string | null;
      model: string | null;
      mileage: number | null;
    } | null;
    hasPayoff: boolean | null;
    payoffAmount: number | null;
    monthlyPayment: number | null;
    financedWith: string | null;
  };
}

// Suggested prompts for users
const SUGGESTED_PROMPTS = [
  "I need a truck that can tow a boat",
  "What's the best family SUV under $50k?",
  "Show me something fuel efficient for commuting",
  "I want a sporty car with good tech features",
  "What electric vehicles do you have?",
];

const AIAssistant: React.FC<KioskComponentProps> = ({ 
  navigateTo, 
  updateCustomerData, 
  customerData,
  resetJourney 
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [inventory, setInventory] = useState<Vehicle[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [extractedData, setExtractedData] = useState<ExtractedData>({
    vehicleInterest: { model: null, bodyType: null, features: [] },
    budget: { min: null, max: null, monthlyPayment: null, downPayment: null },
    tradeIn: { hasTrade: null, vehicle: null, hasPayoff: null, payoffAmount: null, monthlyPayment: null, financedWith: null }
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);
  const sendMessageRef = useRef<(content: string) => void>();
  const speechSynthRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Extract data from conversation text
  const extractDataFromMessage = useCallback((text: string, currentData: ExtractedData): ExtractedData => {
    const lowerText = text.toLowerCase();
    const newData = { ...currentData };

    // Extract budget information
    // Patterns: "under $50k", "around $45,000", "$40k-$50k", "budget is 50000"
    const budgetPatterns = [
      /under\s*\$?(\d+),?(\d*)k?/i,
      /around\s*\$?(\d+),?(\d*)k?/i,
      /budget\s*(?:is|of)?\s*\$?(\d+),?(\d*)k?/i,
      /\$?(\d+),?(\d*)k?\s*(?:to|-)\s*\$?(\d+),?(\d*)k?/i,
      /(?:spend|pay)\s*(?:up to|around|about)?\s*\$?(\d+),?(\d*)k?/i,
    ];

    for (const pattern of budgetPatterns) {
      const match = text.match(pattern);
      if (match) {
        let amount = parseInt(match[1] + (match[2] || ''));
        // Handle "k" suffix
        if (amount < 1000 && lowerText.includes('k')) {
          amount *= 1000;
        } else if (amount < 200) {
          amount *= 1000; // Assume they mean thousands
        }
        newData.budget.max = amount;
        newData.budget.min = Math.round(amount * 0.8); // Estimate min as 80% of max
        break;
      }
    }

    // Extract monthly payment
    const monthlyPatterns = [
      /\$?(\d+)\s*(?:\/|per|a)\s*month/i,
      /monthly\s*(?:payment)?\s*(?:of|around|about)?\s*\$?(\d+)/i,
      /(\d+)\s*(?:\/mo|mo)/i,
    ];

    for (const pattern of monthlyPatterns) {
      const match = text.match(pattern);
      if (match) {
        newData.budget.monthlyPayment = parseInt(match[1]);
        break;
      }
    }

    // Extract down payment
    const downPatterns = [
      /(\d+),?(\d*)\s*(?:down|to put down)/i,
      /down\s*(?:payment)?\s*(?:of|around|about)?\s*\$?(\d+),?(\d*)/i,
      /put(?:ting)?\s*(?:down)?\s*\$?(\d+),?(\d*)/i,
    ];

    for (const pattern of downPatterns) {
      const match = text.match(pattern);
      if (match) {
        let amount = parseInt(match[1] + (match[2] || ''));
        if (amount < 100) amount *= 1000; // Assume thousands
        newData.budget.downPayment = amount;
        break;
      }
    }

    // Extract vehicle interest
    const vehicleTypes: Record<string, string> = {
      'truck': 'Truck',
      'pickup': 'Truck',
      'silverado': 'Silverado',
      'colorado': 'Colorado',
      'suv': 'SUV',
      'tahoe': 'Tahoe',
      'suburban': 'Suburban',
      'equinox': 'Equinox',
      'traverse': 'Traverse',
      'trax': 'Trax',
      'trailblazer': 'Trailblazer',
      'blazer': 'Blazer',
      'corvette': 'Corvette',
      'camaro': 'Camaro',
      'malibu': 'Malibu',
      'electric': 'Electric',
      'ev': 'Electric',
      'family': 'Family SUV',
    };

    for (const [keyword, model] of Object.entries(vehicleTypes)) {
      if (lowerText.includes(keyword)) {
        newData.vehicleInterest.model = model;
        break;
      }
    }

    // Extract body type
    if (lowerText.includes('truck') || lowerText.includes('pickup')) {
      newData.vehicleInterest.bodyType = 'Truck';
    } else if (lowerText.includes('suv') || lowerText.includes('crossover')) {
      newData.vehicleInterest.bodyType = 'SUV';
    } else if (lowerText.includes('sedan') || lowerText.includes('car')) {
      newData.vehicleInterest.bodyType = 'Sedan';
    } else if (lowerText.includes('electric') || lowerText.includes('ev')) {
      newData.vehicleInterest.bodyType = 'Electric';
    }

    // Extract features
    const featureKeywords = [
      'towing', 'tow', '4wd', '4x4', 'awd', 'all wheel',
      'leather', 'heated seats', 'sunroof', 'navigation',
      'third row', '3rd row', 'family', 'fuel efficient',
      'sporty', 'fast', 'performance', 'luxury',
      'crew cab', 'extended cab', 'regular cab',
    ];

    for (const feature of featureKeywords) {
      if (lowerText.includes(feature) && !newData.vehicleInterest.features.includes(feature)) {
        newData.vehicleInterest.features.push(feature);
      }
    }

    // Extract trade-in information
    if (lowerText.includes('trade') || lowerText.includes('trading')) {
      newData.tradeIn.hasTrade = true;
    }

    // Extract trade-in vehicle details
    const tradeYearMatch = text.match(/(?:trade|trading|have a|my)\s*(?:in)?\s*(?:a|my)?\s*(\d{4})\s+(\w+)\s+(\w+)?/i);
    if (tradeYearMatch) {
      newData.tradeIn.hasTrade = true;
      newData.tradeIn.vehicle = {
        year: tradeYearMatch[1],
        make: tradeYearMatch[2],
        model: tradeYearMatch[3] || null,
        mileage: null
      };
    }

    // Extract trade mileage
    const mileageMatch = text.match(/(\d{2,3}),?(\d{3})?\s*(?:miles|mi)/i);
    if (mileageMatch && newData.tradeIn.vehicle) {
      const mileage = parseInt(mileageMatch[1] + (mileageMatch[2] || ''));
      newData.tradeIn.vehicle.mileage = mileage;
    }

    // Extract payoff information
    if (lowerText.includes('owe') || lowerText.includes('payoff') || lowerText.includes('pay off')) {
      newData.tradeIn.hasPayoff = true;
      
      const payoffMatch = text.match(/(?:owe|payoff|pay off|still owe)\s*(?:about|around)?\s*\$?(\d+),?(\d*)/i);
      if (payoffMatch) {
        newData.tradeIn.payoffAmount = parseInt(payoffMatch[1] + (payoffMatch[2] || ''));
      }
    }

    if (lowerText.includes('paid off') || lowerText.includes('own it') || lowerText.includes('no loan')) {
      newData.tradeIn.hasPayoff = false;
    }

    // Extract current monthly payment on trade
    const currentPaymentMatch = text.match(/(?:paying|pay)\s*\$?(\d+)\s*(?:\/|per|a)?\s*month/i);
    if (currentPaymentMatch) {
      newData.tradeIn.monthlyPayment = parseInt(currentPaymentMatch[1]);
    }

    // Extract lender/bank
    const banks = [
      'chase', 'capital one', 'ally', 'bank of america', 'wells fargo',
      'usaa', 'navy federal', 'pnc', 'td bank', 'citizens',
      'santander', 'gm financial', 'toyota financial', 'ford credit'
    ];

    for (const bank of banks) {
      if (lowerText.includes(bank)) {
        newData.tradeIn.financedWith = bank.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
        break;
      }
    }

    return newData;
  }, []);

  // Log session to backend with chat history and extracted data
  const logSessionUpdate = useCallback(async (
    chatMessages: Message[], 
    extracted: ExtractedData,
    selectedVehicle?: Vehicle
  ) => {
    try {
      await api.logTrafficSession({
        customerName: customerData?.customerName || null,
        path: 'aiAssistant',
        currentStep: 'aiChat',
        chatHistory: chatMessages.map(m => ({
          role: m.role,
          content: m.content,
          timestamp: m.timestamp.toISOString()
        })),
        vehicleInterest: {
          model: extracted.vehicleInterest.model,
          cab: extracted.vehicleInterest.features.find(f => f.includes('cab')) || null,
          colors: []
        },
        budget: {
          min: extracted.budget.min,
          max: extracted.budget.max,
          downPaymentPercent: extracted.budget.downPayment 
            ? Math.round((extracted.budget.downPayment / (extracted.budget.max || 50000)) * 100)
            : null
        },
        tradeIn: extracted.tradeIn,
        vehicle: selectedVehicle ? {
          stockNumber: selectedVehicle.stockNumber || selectedVehicle.stock_number,
          year: selectedVehicle.year,
          make: selectedVehicle.make,
          model: selectedVehicle.model,
          trim: selectedVehicle.trim,
          msrp: selectedVehicle.msrp || selectedVehicle.salePrice || selectedVehicle.price
        } : undefined,
        actions: ['ai_chat']
      });
      // Session updated with chat data
    } catch (err) {
      console.error('Failed to log session update:', err);
    }
  }, [customerData?.customerName]);

  // Text-to-Speech function
  const speakText = useCallback((text: string) => {
    if (!audioEnabled || !window.speechSynthesis) return;
    
    window.speechSynthesis.cancel();
    
    const cleanText = text
      .replace(/[\u{1F600}-\u{1F6FF}]/gu, '')
      .replace(/[#*_~`]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    
    if (!cleanText) return;
    
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;
    
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(voice => 
      voice.name.includes('Google') || 
      voice.name.includes('Samantha') || 
      voice.name.includes('Alex') ||
      voice.name.includes('Daniel') ||
      (voice.lang.startsWith('en') && voice.localService)
    ) || voices.find(voice => voice.lang.startsWith('en'));
    
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }
    
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    
    speechSynthRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  }, [audioEnabled]);

  const stopSpeaking = useCallback(() => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, []);

  const toggleAudio = useCallback(() => {
    if (audioEnabled) {
      stopSpeaking();
    }
    setAudioEnabled(prev => !prev);
  }, [audioEnabled, stopSpeaking]);

  useEffect(() => {
    const loadVoices = () => {
      window.speechSynthesis?.getVoices();
    };
    
    loadVoices();
    window.speechSynthesis?.addEventListener('voiceschanged', loadVoices);
    
    return () => {
      window.speechSynthesis?.removeEventListener('voiceschanged', loadVoices);
      stopSpeaking();
    };
  }, [stopSpeaking]);

  // Load inventory on mount
  useEffect(() => {
    const loadInventory = async () => {
      try {
        const data = await api.getInventory();
        const vehicles = Array.isArray(data) ? data : (data as any).vehicles || [];
        setInventory(vehicles);
      } catch (err) {
        console.error('Failed to load inventory:', err);
      }
    };
    loadInventory();
    
    // Log initial session start
    api.logTrafficSession({
      customerName: customerData?.customerName || null,
      path: 'aiAssistant',
      currentStep: 'aiChat',
      actions: ['started_ai_chat']
    }).catch(console.error);
  }, [customerData?.customerName]);

  // Build inventory context for AI
  const buildInventoryContext = useCallback((): string => {
    if (inventory.length === 0) return 'Inventory is loading...';
    
    const modelCounts: Record<string, number> = {};
    const priceRanges: Record<string, { min: number; max: number }> = {};
    
    inventory.forEach(v => {
      const model = v.model || 'Unknown';
      modelCounts[model] = (modelCounts[model] || 0) + 1;
      
      const price = v.salePrice || v.sale_price || v.price || v.msrp || 0;
      if (!priceRanges[model]) {
        priceRanges[model] = { min: price, max: price };
      } else {
        priceRanges[model].min = Math.min(priceRanges[model].min, price);
        priceRanges[model].max = Math.max(priceRanges[model].max, price);
      }
    });

    let context = `QUIRK CHEVROLET CURRENT INVENTORY (${inventory.length} vehicles):\n\n`;
    
    Object.entries(modelCounts).forEach(([model, count]) => {
      const range = priceRanges[model];
      context += `• ${model}: ${count} in stock ($${range.min.toLocaleString()} - $${range.max.toLocaleString()})\n`;
    });

    context += `\nDETAILED INVENTORY:\n`;
    inventory.slice(0, 50).forEach(v => {
      const stock = v.stockNumber || v.stock_number || '';
      const price = v.salePrice || v.sale_price || v.price || v.msrp || 0;
      const color = v.exteriorColor || v.exterior_color || '';
      context += `- Stock #${stock}: ${v.year} ${v.make} ${v.model} ${v.trim || ''}, ${color}, $${price.toLocaleString()}, ${v.drivetrain || ''}\n`;
    });

    return context;
  }, [inventory]);

 // Search inventory based on criteria
  const searchInventory = useCallback((query: string): Vehicle[] => {
    const lowerQuery = query.toLowerCase();
    
    return inventory.filter(v => {
      const searchText = `${v.year} ${v.make} ${v.model} ${v.trim} ${v.exteriorColor || v.exterior_color} ${v.drivetrain} ${v.engine}`.toLowerCase();
      
      const matchesQuery = searchText.includes(lowerQuery);
      
      const isTruck = lowerQuery.includes('truck') && 
        (v.model?.toLowerCase().includes('silverado') || v.model?.toLowerCase().includes('colorado'));
      const isSUV = (lowerQuery.includes('suv') || lowerQuery.includes('crossover')) && 
        ['tahoe', 'suburban', 'equinox', 'traverse', 'trax', 'trailblazer', 'blazer'].some(m => v.model?.toLowerCase().includes(m));
      const isElectric = lowerQuery.includes('electric') && 
        (v.model?.toLowerCase().includes('ev') || v.fuelType?.toLowerCase().includes('electric'));
      const isSporty = (lowerQuery.includes('sport') || lowerQuery.includes('fast') || lowerQuery.includes('performance')) && 
        (v.model?.toLowerCase().includes('corvette') || v.model?.toLowerCase().includes('camaro'));
      
      let matchesPrice = true;
      const priceMatch = lowerQuery.match(/under\s*\$?(\d+)k?/i);
      if (priceMatch) {
        const maxPrice = parseInt(priceMatch[1]) * (priceMatch[1].length <= 2 ? 1000 : 1);
        const vehiclePrice = v.salePrice || v.sale_price || v.price || v.msrp || 0;
        matchesPrice = vehiclePrice <= maxPrice;
      }

      return (matchesQuery || isTruck || isSUV || isElectric || isSporty) && matchesPrice;
    }).slice(0, 6);
  }, [inventory]);
  // Send message to AI
  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || isLoading) return;

    stopSpeaking();

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: content.trim(),
      timestamp: new Date(),
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInputValue('');
    setIsLoading(true);

    // Extract data from user message
    const newExtractedData = extractDataFromMessage(content, extractedData);
    setExtractedData(newExtractedData);

    try {
      const response = await api.chatWithAI({
        message: content,
        inventoryContext: buildInventoryContext(),
        conversationHistory: messages.map(m => ({ role: m.role, content: m.content })),
        customerName: customerData?.customerName,
      });

      const matchingVehicles = searchInventory(content);

      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: response.message,
        vehicles: matchingVehicles.length > 0 ? matchingVehicles : undefined,
        timestamp: new Date(),
      };

      const finalMessages = [...newMessages, assistantMessage];
      setMessages(finalMessages);
      
      // Log to backend with extracted data
      await logSessionUpdate(
        finalMessages, 
        newExtractedData,
        matchingVehicles.length > 0 ? matchingVehicles[0] : undefined
      );
      
      speakText(response.message);
      
    } catch (error) {
      console.error('AI Chat error:', error);
      
      const matchingVehicles = searchInventory(content);
      
      const fallbackContent = matchingVehicles.length > 0 
        ? `I found ${matchingVehicles.length} vehicles that might match what you're looking for! Take a look below. Would you like more details on any of these?`
        : `I'd be happy to help you find the perfect vehicle. Could you tell me more about what you're looking for? For example, do you need a truck for towing, an SUV for the family, or something sporty?`;
      
      const fallbackMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: fallbackContent,
        vehicles: matchingVehicles.length > 0 ? matchingVehicles : undefined,
        timestamp: new Date(),
      };
      
      const finalMessages = [...newMessages, fallbackMessage];
      setMessages(finalMessages);
      
      // Still log to backend even on error
      await logSessionUpdate(finalMessages, newExtractedData);
      
      speakText(fallbackContent);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, messages, customerData?.customerName, buildInventoryContext, searchInventory, speakText, stopSpeaking, extractDataFromMessage, extractedData, logSessionUpdate]);

  useEffect(() => {
    sendMessageRef.current = sendMessage;
  }, [sendMessage]);

  // Initialize Web Speech API for voice input
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';
      
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputValue(transcript);
        setTimeout(() => {
          sendMessageRef.current?.(transcript);
        }, 100);
      };
      
      recognition.onerror = () => {
        setIsListening(false);
      };
      
      recognition.onend = () => {
        setIsListening(false);
      };
      
      recognitionRef.current = recognition;
    }
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(inputValue);
    }
  };

  const toggleListening = () => {
    if (!recognitionRef.current) return;
    
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const handleVehicleClick = (vehicle: Vehicle) => {
    // Log vehicle selection
    logSessionUpdate(messages, extractedData, vehicle).catch(console.error);
    
    updateCustomerData({ 
      selectedVehicle: vehicle,
      path: 'aiAssistant'
    });
    navigateTo('vehicleDetail');
  };

  const handleStartOver = () => {
    stopSpeaking();
    if (resetJourney) {
      resetJourney();
    }
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerIcon}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
        </div>
        <div>
          <h1 style={styles.title}>
            {customerData?.customerName 
              ? `Hi ${customerData.customerName}, let's find your perfect vehicle!` 
              : "Let's find your perfect vehicle!"}
          </h1>
          <p style={styles.subtitle}>Ask me anything about our inventory</p>
        </div>
        
        {/* Audio Toggle */}
        <button
          style={{
            ...styles.audioToggle,
            background: audioEnabled ? 'rgba(74, 222, 128, 0.2)' : 'rgba(255,255,255,0.1)',
            borderColor: audioEnabled ? '#4ade80' : 'rgba(255,255,255,0.2)',
          }}
          onClick={toggleAudio}
        >
          {isSpeaking ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
              <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
              <path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>
            </svg>
          ) : audioEnabled ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
              <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
              <line x1="23" y1="9" x2="17" y2="15"/>
              <line x1="17" y1="9" x2="23" y2="15"/>
            </svg>
          )}
          <span style={styles.audioLabel}>
            {audioEnabled ? (isSpeaking ? 'Speaking...' : 'Audio On') : 'Audio Off'}
          </span>
        </button>
      </div>

      {/* Messages */}
      <div style={styles.messagesContainer}>
        {messages.length === 0 && (
          <div style={styles.suggestionsContainer}>
            <p style={styles.suggestionsLabel}>Try asking me:</p>
            <div style={styles.suggestionsGrid}>
              {SUGGESTED_PROMPTS.map((prompt, idx) => (
                <button
                  key={idx}
                  style={styles.suggestionButton}
                  onClick={() => sendMessage(prompt)}
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            style={{
              ...styles.messageWrapper,
              justifyContent: message.role === 'user' ? 'flex-end' : 'flex-start',
            }}
          >
            <div
              style={{
                ...styles.messageBubble,
                ...(message.role === 'user' ? styles.userBubble : styles.assistantBubble),
              }}
            >
              {message.role === 'assistant' && (
                <div style={styles.aiAvatar}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/>
                    <path d="M8 14s1.5 2 4 2 4-2 4-2"/>
                    <circle cx="9" cy="9" r="1" fill="currentColor"/>
                    <circle cx="15" cy="9" r="1" fill="currentColor"/>
                  </svg>
                </div>
              )}
              <p style={styles.messageText}>{message.content}</p>
              
              {/* Vehicle Cards */}
              {message.vehicles && message.vehicles.length > 0 && (
                <div style={styles.vehicleGrid}>
                  {message.vehicles.map((vehicle, idx) => {
                    const price = vehicle.salePrice || vehicle.sale_price || vehicle.price || vehicle.msrp || 0;
                    const stock = vehicle.stockNumber || vehicle.stock_number || '';
                    const color = vehicle.exteriorColor || vehicle.exterior_color || '';
                    
                    return (
                      <button
                        key={idx}
                        style={styles.vehicleCard}
                        onClick={() => handleVehicleClick(vehicle)}
                      >
                        <div style={styles.vehicleInfo}>
                          <span style={styles.vehicleYear}>{vehicle.year} • Stock #{stock}</span>
                          <span style={styles.vehicleModel}>{vehicle.model}</span>
                          <span style={styles.vehicleTrim}>{vehicle.trim}</span>
                        </div>
                        <div style={styles.vehicleDetails}>
                          <span style={styles.vehicleColor}>{color}</span>
                          <span style={styles.vehiclePrice}>${price.toLocaleString()}</span>
                        </div>
                        <span style={styles.viewButton}>View Details →</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div style={styles.messageWrapper}>
            <div style={{ ...styles.messageBubble, ...styles.assistantBubble }}>
              <div style={styles.loadingDots}>
                <span style={{ ...styles.dot, animationDelay: '0s' }}>●</span>
                <span style={{ ...styles.dot, animationDelay: '0.2s' }}>●</span>
                <span style={{ ...styles.dot, animationDelay: '0.4s' }}>●</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div style={styles.inputContainer}>
        <input
          ref={inputRef}
          type="text"
          style={styles.input}
          placeholder="Type your message..."
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={isLoading}
        />
        
        {recognitionRef.current && (
          <button
            style={{
              ...styles.micButton,
              background: isListening ? 'rgba(239, 68, 68, 0.3)' : 'rgba(255,255,255,0.1)',
              borderColor: isListening ? '#ef4444' : 'rgba(255,255,255,0.2)',
            }}
            onClick={toggleListening}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={isListening ? '#ef4444' : 'currentColor'} strokeWidth="2">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
              <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
              <line x1="12" y1="19" x2="12" y2="23"/>
              <line x1="8" y1="23" x2="16" y2="23"/>
            </svg>
          </button>
        )}
        
        <button
          style={{
            ...styles.sendButton,
            opacity: inputValue.trim() && !isLoading ? 1 : 0.5,
          }}
          onClick={() => sendMessage(inputValue)}
          disabled={!inputValue.trim() || isLoading}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="22" y1="2" x2="11" y2="13"/>
            <polygon points="22 2 15 22 11 13 2 9 22 2"/>
          </svg>
        </button>
      </div>

      {/* Start Over */}
      <div style={styles.startOverContainer}>
        <button style={styles.startOverButton} onClick={handleStartOver}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
            <path d="M3 3v5h5"/>
          </svg>
          Start Over
        </button>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  );
};

const styles: Record<string, CSSProperties> = {
  container: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    padding: '20px',
    maxWidth: '900px',
    margin: '0 auto',
    width: '100%',
    boxSizing: 'border-box',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    marginBottom: '24px',
    paddingBottom: '20px',
    borderBottom: '1px solid rgba(255,255,255,0.1)',
  },
  headerIcon: {
    width: '64px',
    height: '64px',
    borderRadius: '16px',
    background: 'linear-gradient(135deg, #1B7340 0%, #0d4a28 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#ffffff',
  },
  title: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#ffffff',
    margin: 0,
  },
  subtitle: {
    fontSize: '14px',
    color: 'rgba(255,255,255,0.6)',
    margin: '4px 0 0 0',
  },
  audioToggle: {
    marginLeft: 'auto',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 16px',
    borderRadius: '12px',
    border: '1px solid',
    color: '#ffffff',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  audioLabel: {
    fontSize: '13px',
  },
  messagesContainer: {
    flex: 1,
    overflowY: 'auto',
    padding: '20px 0',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  messageWrapper: {
    display: 'flex',
    width: '100%',
  },
  messageBubble: {
    maxWidth: '85%',
    padding: '16px',
    borderRadius: '16px',
    position: 'relative',
  },
  userBubble: {
    background: 'linear-gradient(135deg, #1B7340 0%, #0d4a28 100%)',
    borderBottomRightRadius: '4px',
  },
  assistantBubble: {
    background: 'rgba(255,255,255,0.1)',
    borderBottomLeftRadius: '4px',
  },
  aiAvatar: {
    position: 'absolute',
    top: '-10px',
    left: '-10px',
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #1B7340 0%, #0d4a28 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#ffffff',
    border: '2px solid #0a0a0a',
  },
  messageText: {
    fontSize: '15px',
    lineHeight: '1.6',
    color: '#ffffff',
    margin: 0,
    whiteSpace: 'pre-wrap',
  },
  vehicleGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '12px',
    marginTop: '16px',
  },
  vehicleCard: {
    background: 'rgba(0,0,0,0.3)',
    border: '1px solid rgba(255,255,255,0.15)',
    borderRadius: '12px',
    padding: '16px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    textAlign: 'left',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  vehicleInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  vehicleYear: {
    fontSize: '12px',
    color: '#4ade80',
    fontWeight: '600',
  },
  vehicleModel: {
    fontSize: '16px',
    fontWeight: '700',
    color: '#ffffff',
  },
  vehicleTrim: {
    fontSize: '12px',
    color: 'rgba(255,255,255,0.6)',
  },
  vehicleDetails: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: '8px',
  },
  vehicleColor: {
    fontSize: '12px',
    color: 'rgba(255,255,255,0.5)',
  },
  vehiclePrice: {
    fontSize: '16px',
    fontWeight: '700',
    color: '#4ade80',
  },
  viewButton: {
    fontSize: '13px',
    color: '#60a5fa',
    fontWeight: '600',
    marginTop: '8px',
  },
  loadingDots: {
    display: 'flex',
    gap: '6px',
    padding: '8px 0',
  },
  dot: {
    fontSize: '12px',
    color: '#4ade80',
    animation: 'pulse 1s infinite',
  },
  suggestionsContainer: {
    padding: '20px 0',
    borderTop: '1px solid rgba(255,255,255,0.1)',
  },
  suggestionsLabel: {
    fontSize: '14px',
    color: 'rgba(255,255,255,0.5)',
    margin: '0 0 12px 0',
  },
  suggestionsGrid: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
  },
  suggestionButton: {
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.15)',
    borderRadius: '20px',
    padding: '10px 16px',
    color: 'rgba(255,255,255,0.8)',
    fontSize: '13px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  inputContainer: {
    display: 'flex',
    gap: '12px',
    padding: '20px 0',
    borderTop: '1px solid rgba(255,255,255,0.1)',
  },
  input: {
    flex: 1,
    padding: '16px 20px',
    background: 'rgba(255,255,255,0.1)',
    border: '1px solid rgba(255,255,255,0.2)',
    borderRadius: '12px',
    color: '#ffffff',
    fontSize: '16px',
    outline: 'none',
  },
  sendButton: {
    width: '56px',
    height: '56px',
    borderRadius: '12px',
    background: 'linear-gradient(135deg, #1B7340 0%, #0d4a28 100%)',
    border: 'none',
    color: '#ffffff',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s ease',
  },
  micButton: {
    width: '56px',
    height: '56px',
    borderRadius: '12px',
    background: 'rgba(255,255,255,0.1)',
    border: '1px solid rgba(255,255,255,0.2)',
    color: '#ffffff',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s ease',
  },
  startOverContainer: {
    display: 'flex',
    justifyContent: 'center',
    paddingTop: '16px',
  },
  startOverButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    background: 'rgba(255,255,255,0.1)',
    border: '1px solid rgba(255,255,255,0.2)',
    borderRadius: '8px',
    padding: '12px 24px',
    color: '#ffffff',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
};

export default AIAssistant;
