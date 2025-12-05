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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);
  const sendMessageRef = useRef<(content: string) => void>();
  const speechSynthRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Text-to-Speech function
  const speakText = useCallback((text: string) => {
    if (!audioEnabled || !window.speechSynthesis) return;
    
    // Cancel any ongoing speech
    window.speechSynthesis.cancel();
    
    // Clean text for speech (remove emojis, special characters)
    const cleanText = text
      .replace(/[\u{1F600}-\u{1F6FF}]/gu, '') // Remove emojis
      .replace(/[#*_~`]/g, '') // Remove markdown characters
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
    
    if (!cleanText) return;
    
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.0; // Speed (0.1 to 10)
    utterance.pitch = 1.0; // Pitch (0 to 2)
    utterance.volume = 1.0; // Volume (0 to 1)
    
    // Try to use a natural-sounding voice
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

  // Stop speaking
  const stopSpeaking = useCallback(() => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, []);

  // Toggle audio mode
  const toggleAudio = useCallback(() => {
    if (audioEnabled) {
      stopSpeaking();
    }
    setAudioEnabled(prev => !prev);
  }, [audioEnabled, stopSpeaking]);

  // Load voices when available (needed for some browsers)
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

  // Build inventory context for AI
  const buildInventoryContext = useCallback((): string => {
    if (inventory.length === 0) return 'Inventory is loading...';
    
    // Group by model for summary
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
      
      // Check for specific criteria
      const matchesQuery = searchText.includes(lowerQuery);
      
      // Check for category keywords
      const isTruck = lowerQuery.includes('truck') && 
        (v.model?.toLowerCase().includes('silverado') || v.model?.toLowerCase().includes('colorado'));
      const isSUV = (lowerQuery.includes('suv') || lowerQuery.includes('crossover')) && 
        ['tahoe', 'suburban', 'equinox', 'traverse', 'trax', 'trailblazer', 'blazer'].some(m => v.model?.toLowerCase().includes(m));
      const isElectric = lowerQuery.includes('electric') && 
        (v.model?.toLowerCase().includes('ev') || v.fuelType?.toLowerCase().includes('electric'));
      const isSporty = (lowerQuery.includes('sport') || lowerQuery.includes('fast') || lowerQuery.includes('performance')) && 
        (v.model?.toLowerCase().includes('corvette') || v.model?.toLowerCase().includes('camaro'));
      
      // Price filtering
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

    // Stop any ongoing speech when user sends a message
    stopSpeaking();

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: content.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      // Call AI endpoint
      const response = await api.chatWithAI({
        message: content,
        inventoryContext: buildInventoryContext(),
        conversationHistory: messages.map(m => ({ role: m.role, content: m.content })),
        customerName: customerData?.customerName,
      });

      // Search for matching vehicles
      const matchingVehicles = searchInventory(content);

      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: response.message,
        vehicles: matchingVehicles.length > 0 ? matchingVehicles : undefined,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
      
      // Speak the response if audio is enabled
      speakText(response.message);
      
    } catch (error) {
      console.error('AI Chat error:', error);
      
      // Fallback response with local search
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
      
      setMessages(prev => [...prev, fallbackMessage]);
      
      // Speak the fallback response if audio is enabled
      speakText(fallbackContent);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, messages, customerData?.customerName, buildInventoryContext, searchInventory, speakText, stopSpeaking]);

  // Keep sendMessageRef updated with latest sendMessage
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
        setIsListening(false);
        // Auto-send after voice input
        setTimeout(() => {
          if (transcript.trim()) {
            sendMessageRef.current?.(transcript);
          }
        }, 300);
      };
      
      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };
      
      recognition.onend = () => {
        setIsListening(false);
      };
      
      recognitionRef.current = recognition;
    }
  }, []);

  const toggleVoiceInput = () => {
    if (!recognitionRef.current) {
      alert('Voice input is not supported in this browser');
      return;
    }
    
    // Stop speaking when user wants to talk
    stopSpeaking();
    
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      setInputValue('');
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  // Load inventory on mount
  useEffect(() => {
    const loadInventory = async () => {
      try {
        const data = await api.getInventory({});
        // Handle both array and object response types
        const vehicles = Array.isArray(data) ? data : (data as { vehicles?: Vehicle[] }).vehicles || [];
        setInventory(vehicles);
      } catch (err) {
        console.error('Error loading inventory:', err);
      }
    };
    loadInventory();
  }, []);

  // Add welcome message on mount
  useEffect(() => {
    const welcomeContent = customerData?.customerName 
      ? `Hi ${customerData.customerName}! I'm your AI assistant at Quirk Chevrolet. Tell me what you're looking for in a vehicle - whether it's towing capacity, fuel efficiency, family space, or just something fun to drive. I'll search our ${inventory.length || 'entire'} vehicle inventory to find the perfect match for you!`
      : `Hi there! I'm your AI assistant at Quirk Chevrolet. Tell me what you're looking for in a vehicle - whether it's towing capacity, fuel efficiency, family space, or just something fun to drive. I'll search our inventory to find the perfect match for you!`;
    
    const welcomeMessage: Message = {
      id: 'welcome',
      role: 'assistant',
      content: welcomeContent,
      timestamp: new Date(),
    };
    setMessages([welcomeMessage]);
    
    // Speak welcome message if audio is enabled
    if (audioEnabled) {
      setTimeout(() => speakText(welcomeContent), 500);
    }
    
    // Log initial AI chat session
    api.logTrafficSession({
      path: 'aiChat',
      customerName: customerData?.customerName,
      actions: ['started_ai_chat'],
    });
  }, [customerData?.customerName, inventory.length, audioEnabled, speakText]);

  // Log chat history whenever messages change (after initial welcome)
  useEffect(() => {
    // Only log if there are user messages (more than just the welcome message)
    if (messages.length > 1) {
      // Store conversation log in customer data for handoff
      const conversationLog = messages.map(m => ({
        role: m.role,
        content: m.content,
        timestamp: m.timestamp.toISOString(),
        vehicles: m.vehicles?.map(v => ({
          stockNumber: v.stockNumber || v.stock_number,
          model: v.model,
          price: v.salePrice || v.sale_price || v.price,
        })),
      }));
      
      updateCustomerData({ conversationLog });
    }
  }, [messages, updateCustomerData]);

  // Scroll to bottom when messages change
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

  const handleVehicleClick = (vehicle: Vehicle) => {
    stopSpeaking();
    updateCustomerData({ selectedVehicle: vehicle });
    navigateTo('vehicleDetail');
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerIcon}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2a2 2 0 012 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 017 7h1a1 1 0 011 1v3a1 1 0 01-1 1h-1v1a2 2 0 01-2 2H5a2 2 0 01-2-2v-1H2a1 1 0 01-1-1v-3a1 1 0 011-1h1a7 7 0 017-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 012-2z"/>
            <path d="M7.5 14a1.5 1.5 0 110 3 1.5 1.5 0 010-3zM16.5 14a1.5 1.5 0 110 3 1.5 1.5 0 010-3z"/>
          </svg>
        </div>
        <div>
          <h1 style={styles.title}>QUIRK AI Assistant</h1>
          <p style={styles.subtitle}>Ask me anything about our vehicles</p>
        </div>
        
        {/* Audio Toggle Button */}
        <button
          style={{
            ...styles.audioToggle,
            background: audioEnabled 
              ? 'linear-gradient(135deg, #1B7340 0%, #0d4a28 100%)' 
              : 'rgba(255,255,255,0.1)',
            borderColor: audioEnabled ? '#1B7340' : 'rgba(255,255,255,0.2)',
          }}
          onClick={toggleAudio}
          title={audioEnabled ? 'Turn off voice responses' : 'Turn on voice responses'}
        >
          {isSpeaking ? (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M11 5L6 9H2v6h4l5 4V5z"/>
              <path d="M15.54 8.46a5 5 0 010 7.07"/>
              <path d="M19.07 4.93a10 10 0 010 14.14"/>
            </svg>
          ) : audioEnabled ? (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M11 5L6 9H2v6h4l5 4V5z"/>
              <path d="M15.54 8.46a5 5 0 010 7.07"/>
            </svg>
          ) : (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M11 5L6 9H2v6h4l5 4V5z"/>
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
                    <path d="M12 2a2 2 0 012 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 017 7h1"/>
                  </svg>
                </div>
              )}
              <p style={styles.messageText}>{message.content}</p>
              
              {/* Vehicle Cards */}
              {message.vehicles && message.vehicles.length > 0 && (
                <div style={styles.vehicleGrid}>
                  {message.vehicles.map((vehicle, idx) => {
                    const price = vehicle.salePrice || vehicle.sale_price || vehicle.price || vehicle.msrp || 0;
                    return (
                      <button
                        key={`${vehicle.stockNumber || vehicle.stock_number || idx}`}
                        style={styles.vehicleCard}
                        onClick={() => handleVehicleClick(vehicle)}
                      >
                        <div style={styles.vehicleInfo}>
                          <span style={styles.vehicleYear}>{vehicle.year} Chevrolet</span>
                          <span style={styles.vehicleModel}>{vehicle.model}</span>
                          <span style={styles.vehicleTrim}>{vehicle.trim}</span>
                        </div>
                        <div style={styles.vehicleDetails}>
                          <span style={styles.vehicleColor}>{vehicle.exteriorColor || vehicle.exterior_color}</span>
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
        
        {/* Loading indicator */}
        {isLoading && (
          <div style={{ ...styles.messageWrapper, justifyContent: 'flex-start' }}>
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

      {/* Suggested Prompts (show when no user messages) */}
      {messages.length <= 1 && (
        <div style={styles.suggestionsContainer}>
          <p style={styles.suggestionsLabel}>Try asking:</p>
          <div style={styles.suggestionsGrid}>
            {SUGGESTED_PROMPTS.map((p
