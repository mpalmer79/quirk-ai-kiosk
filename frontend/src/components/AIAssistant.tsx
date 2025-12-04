import React, { useState, useRef, useEffect, KeyboardEvent, CSSProperties } from 'react';
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
  const [isListening, setIsListening] = useState(false);
  const [inventory, setInventory] = useState<Vehicle[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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
    const welcomeMessage: Message = {
      id: 'welcome',
      role: 'assistant',
      content: customerData?.customerName 
        ? `Hi ${customerData.customerName}! 👋 I'm your AI assistant at Quirk Chevrolet. Tell me what you're looking for in a vehicle - whether it's towing capacity, fuel efficiency, family space, or just something fun to drive. I'll search our ${inventory.length || 'entire'} vehicle inventory to find the perfect match for you!`
        : `Hi there! 👋 I'm your AI assistant at Quirk Chevrolet. Tell me what you're looking for in a vehicle - whether it's towing capacity, fuel efficiency, family space, or just something fun to drive. I'll search our inventory to find the perfect match for you!`,
      timestamp: new Date(),
    };
    setMessages([welcomeMessage]);
  }, [customerData?.customerName, inventory.length]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Save conversation log to customer data
  useEffect(() => {
    // Skip the initial welcome message only
    if (messages.length <= 1) return;
    
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
  }, [messages, updateCustomerData]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Build inventory context for AI
  const buildInventoryContext = (): string => {
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
  };

  // Search inventory based on criteria
  const searchInventory = (query: string): Vehicle[] => {
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
  };

  // Send message to AI
  const sendMessage = async (content: string) => {
    if (!content.trim() || isLoading) return;

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
    } catch (error) {
      console.error('AI Chat error:', error);
      
      // Fallback response with local search
      const matchingVehicles = searchInventory(content);
      
      const fallbackMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: matchingVehicles.length > 0 
          ? `I found ${matchingVehicles.length} vehicles that might match what you're looking for! Take a look below. Would you like more details on any of these?`
          : `I'd be happy to help you find the perfect vehicle. Could you tell me more about what you're looking for? For example, do you need a truck for towing, an SUV for the family, or something sporty?`,
        vehicles: matchingVehicles.length > 0 ? matchingVehicles : undefined,
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, fallbackMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(inputValue);
    }
  };

  // Handle microphone button - visual only for now
  const handleMicrophoneClick = () => {
    setIsListening(!isListening);
    // TODO: Implement speech-to-text functionality
  };

  const handleVehicleClick = (vehicle: Vehicle) => {
    updateCustomerData({ selectedVehicle: vehicle, path: 'aiChat' });
    navigateTo('vehicleDetail');
  };

  const handleSuggestedPrompt = (prompt: string) => {
    setInputValue(prompt);
    sendMessage(prompt);
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerIcon}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            <circle cx="12" cy="10" r="1" fill="currentColor"/>
            <circle cx="8" cy="10" r="1" fill="currentColor"/>
            <circle cx="16" cy="10" r="1" fill="currentColor"/>
          </svg>
        </div>
        <div>
          <h1 style={styles.title}>Chat with AI Assistant</h1>
          <p style={styles.subtitle}>Tell me what you're looking for in natural language</p>
        </div>
      </div>

      {/* Messages Container */}
      <div style={styles.messagesContainer} className="ai-messages-container">
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
                    <circle cx="9" cy="10" r="1.5" fill="currentColor"/>
                    <circle cx="15" cy="10" r="1.5" fill="currentColor"/>
                    <path d="M8 14s1.5 2 4 2 4-2 4-2"/>
                  </svg>
                </div>
              )}
              <p style={styles.messageText}>{message.content}</p>
              
              {/* Vehicle Cards */}
              {message.vehicles && message.vehicles.length > 0 && (
                <div style={styles.vehicleGrid}>
                  {message.vehicles.map((vehicle, idx) => (
                    <button
                      key={`${vehicle.stockNumber || vehicle.stock_number}-${idx}`}
                      style={styles.vehicleCard}
                      onClick={() => handleVehicleClick(vehicle)}
                    >
                      <div style={styles.vehicleInfo}>
                        <span style={styles.vehicleYear}>{vehicle.year}</span>
                        <span style={styles.vehicleModel}>{vehicle.make} {vehicle.model}</span>
                        <span style={styles.vehicleTrim}>{vehicle.trim}</span>
                      </div>
                      <div style={styles.vehicleDetails}>
                        <span style={styles.vehicleColor}>
                          {vehicle.exteriorColor || vehicle.exterior_color}
                        </span>
                        <span style={styles.vehiclePrice}>
                          ${(vehicle.salePrice || vehicle.sale_price || vehicle.price || vehicle.msrp || 0).toLocaleString()}
                        </span>
                      </div>
                      <div style={styles.viewButton}>
                        View Details →
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        
        {/* Loading Indicator */}
        {isLoading && (
          <div style={styles.messageWrapper}>
            <div style={{ ...styles.messageBubble, ...styles.assistantBubble }}>
              <div style={styles.loadingDots}>
                <span style={styles.dot}>●</span>
                <span style={{ ...styles.dot, animationDelay: '0.2s' }}>●</span>
                <span style={{ ...styles.dot, animationDelay: '0.4s' }}>●</span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Prompts */}
      {messages.length <= 1 && (
        <div style={styles.suggestionsContainer}>
          <p style={styles.suggestionsLabel}>Try asking:</p>
          <div style={styles.suggestionsGrid}>
            {SUGGESTED_PROMPTS.map((prompt, idx) => (
              <button
                key={idx}
                style={styles.suggestionButton}
                onClick={() => handleSuggestedPrompt(prompt)}
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Area */}
      <div style={styles.inputContainer}>
        <input
          ref={inputRef}
          type="text"
          style={styles.input}
          placeholder={isListening ? "Listening..." : "Describe your ideal vehicle..."}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={isLoading || isListening}
        />
        <button
          style={{
            ...styles.micButton,
            ...(isListening ? styles.micButtonActive : {}),
          }}
          onClick={handleMicrophoneClick}
          disabled={isLoading}
          aria-label={isListening ? "Stop listening" : "Start voice input"}
        >
          {isListening ? (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <rect x="6" y="6" width="12" height="12" rx="2" />
            </svg>
          ) : (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
              <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
              <line x1="12" y1="19" x2="12" y2="23"/>
              <line x1="8" y1="23" x2="16" y2="23"/>
            </svg>
          )}
        </button>
        <button
          style={{
            ...styles.sendButton,
            opacity: inputValue.trim() && !isLoading ? 1 : 0.5,
          }}
          onClick={() => sendMessage(inputValue)}
          disabled={!inputValue.trim() || isLoading}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/>
          </svg>
        </button>
      </div>

      {/* Start Over Button */}
      {resetJourney && (
        <div style={styles.startOverContainer}>
          <button style={styles.startOverButton} onClick={resetJourney}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
            </svg>
            Start Over
          </button>
        </div>
      )}

      {/* CSS Animations */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 1; }
        }
        
        /* Scrollbar styling for webkit browsers */
        .ai-messages-container::-webkit-scrollbar {
          width: 8px;
        }
        .ai-messages-container::-webkit-scrollbar-track {
          background: transparent;
        }
        .ai-messages-container::-webkit-scrollbar-thumb {
          background: rgba(255,255,255,0.3);
          border-radius: 4px;
        }
        .ai-messages-container::-webkit-scrollbar-thumb:hover {
          background: rgba(255,255,255,0.5);
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
    height: '100%',
    minHeight: 0,
    overflow: 'hidden',
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
  messagesContainer: {
    flex: 1,
    overflowY: 'auto',
    overflowX: 'hidden',
    padding: '20px 10px 20px 0',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    minHeight: 0,
    scrollbarWidth: 'thin',
    scrollbarColor: 'rgba(255,255,255,0.3) transparent',
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
  micButtonActive: {
    background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
    border: '1px solid #ef4444',
    animation: 'pulse 1s infinite',
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
