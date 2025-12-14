import React, { useState, useRef, useEffect, useCallback } from 'react';
import api from '../api';
import type { Vehicle, KioskComponentProps } from '../../types';
import type { Message, ExtractedData } from './types';
import { styles } from './styles';
import { INITIAL_EXTRACTED_DATA } from './constants';
import { useSpeechRecognition, useTextToSpeech, useDataExtraction } from './hooks';
import {
  Header,
  MessageBubble,
  SuggestionChips,
  ObjectionPanel,
  ChatInput,
  LoadingIndicator,
} from './components';

const AIAssistant: React.FC<KioskComponentProps> = ({ 
  navigateTo, 
  updateCustomerData, 
  customerData,
  resetJourney 
}) => {
  // State
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [inventory, setInventory] = useState<Vehicle[]>([]);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [extractedData, setExtractedData] = useState<ExtractedData>(INITIAL_EXTRACTED_DATA);
  const [showObjectionPanel, setShowObjectionPanel] = useState(false);
  const [suggestedFollowups, setSuggestedFollowups] = useState<string[]>([]);
  
  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const sendMessageRef = useRef<(content: string) => void>();

  // Custom hooks
  const { extractDataFromMessage, detectObjection, detectHoursQuery } = useDataExtraction();
  const { isSpeaking, ttsAvailable, speakText, stopSpeaking } = useTextToSpeech({ enabled: audioEnabled });
  const { isListening, toggleListening } = useSpeechRecognition({
    onResult: (transcript) => {
      setInputValue(transcript);
      setTimeout(() => sendMessageRef.current?.(transcript), 100);
    },
  });

  // Load inventory on mount
  useEffect(() => {
    const loadInventory = async () => {
      try {
        const response = await api.getInventory({});
        const vehicles = Array.isArray(response) ? response : response.vehicles || [];
        setInventory(vehicles);
      } catch (error) {
        console.error('Failed to load inventory:', error);
      }
    };
    loadInventory();
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Search inventory helper
  const searchInventory = useCallback((query: string): Vehicle[] => {
    const lowerQuery = query.toLowerCase();
    
    // Color keywords mapping
    const colorKeywords: Record<string, string[]> = {
      'red': ['red', 'cherry', 'crimson', 'radiant'],
      'blue': ['blue', 'navy', 'glacier', 'lakeshore'],
      'black': ['black', 'onyx', 'midnight'],
      'white': ['white', 'summit', 'pearl', 'arctic'],
      'silver': ['silver', 'metallic', 'sterling'],
      'gray': ['gray', 'grey', 'graphite', 'shadow'],
      'green': ['green', 'evergreen'],
    };
    
    // Model keywords mapping
    const modelKeywords: Record<string, string[]> = {
      'silverado': ['silverado', 'truck', 'pickup'],
      'colorado': ['colorado', 'midsize truck'],
      'tahoe': ['tahoe', 'full size suv'],
      'suburban': ['suburban', 'large suv'],
      'traverse': ['traverse', 'family suv', '3 row'],
      'equinox': ['equinox', 'compact suv'],
      'blazer': ['blazer', 'sporty suv'],
      'trax': ['trax', 'small suv'],
      'trailblazer': ['trailblazer'],
    };

    let results = inventory.filter(vehicle => {
      const searchText = `${vehicle.year} ${vehicle.make} ${vehicle.model} ${vehicle.trim} ${vehicle.exteriorColor}`.toLowerCase();
      
      // Check for color matches
      for (const [color, keywords] of Object.entries(colorKeywords)) {
        if (keywords.some(k => lowerQuery.includes(k))) {
          if (!keywords.some(k => searchText.includes(k))) {
            return false;
          }
        }
      }
      
      // Check for model matches
      for (const [model, keywords] of Object.entries(modelKeywords)) {
        if (keywords.some(k => lowerQuery.includes(k))) {
          if (searchText.includes(model)) {
            return true;
          }
        }
      }
      
      // General search
      return lowerQuery.split(' ').some(word => 
        word.length > 2 && searchText.includes(word)
      );
    });

    return results.slice(0, 6);
  }, [inventory]);

  // Build inventory context for AI
  const buildInventoryContext = useCallback(() => {
    const models = [...new Set(inventory.map(v => v.model))];
    const priceRange = inventory.length > 0 
      ? { min: Math.min(...inventory.map(v => v.price || 0)), max: Math.max(...inventory.map(v => v.price || 0)) }
      : { min: 0, max: 0 };
    
    return {
      totalVehicles: inventory.length,
      models: models.slice(0, 10),
      priceRange,
    };
  }, [inventory]);

  // Send message handler
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
    
    // Detect objections
    const objectionResult = detectObjection(content);
    if (objectionResult.category) {
      setSuggestedFollowups(objectionResult.followups);
    } else {
      setSuggestedFollowups([]);
    }

    try {
      const response = await api.chatWithAI({
        message: content,
        inventoryContext: buildInventoryContext(),
        conversationHistory: messages.map(m => ({ role: m.role, content: m.content })),
        customerName: customerData?.customerName,
      });

      const matchingVehicles = searchInventory(content);
      const isHoursQuery = detectHoursQuery(content);

      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: response.message,
        vehicles: matchingVehicles.length > 0 ? matchingVehicles : undefined,
        showDealerInfo: isHoursQuery,
        timestamp: new Date(),
      };

      setMessages([...newMessages, assistantMessage]);
      speakText(response.message);
      
    } catch (error) {
      console.error('AI Chat error:', error);
      
      const matchingVehicles = searchInventory(content);
      
      const fallbackContent = matchingVehicles.length > 0 
        ? `I found ${matchingVehicles.length} vehicles that might match what you're looking for! Take a look below.`
        : `I'd be happy to help you find the perfect vehicle. Could you tell me more about what you're looking for?`;
      
      const fallbackMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: fallbackContent,
        vehicles: matchingVehicles.length > 0 ? matchingVehicles : undefined,
        timestamp: new Date(),
      };
      
      setMessages([...newMessages, fallbackMessage]);
    }

    setIsLoading(false);
  }, [messages, isLoading, extractedData, customerData, inventory, extractDataFromMessage, detectObjection, detectHoursQuery, searchInventory, buildInventoryContext, speakText, stopSpeaking]);

  // Store sendMessage in ref for speech recognition callback
  useEffect(() => {
    sendMessageRef.current = sendMessage;
  }, [sendMessage]);

  // Handle vehicle click
  const handleVehicleClick = (vehicle: Vehicle) => {
    updateCustomerData({ selectedVehicle: vehicle });
    navigateTo('vehicleDetail');
  };

  // Handle start over
  const handleStartOver = () => {
    setMessages([]);
    setExtractedData(INITIAL_EXTRACTED_DATA);
    setSuggestedFollowups([]);
    resetJourney?.();
    navigateTo('welcome');
  };

  // Toggle audio
  const toggleAudio = () => {
    if (audioEnabled) {
      stopSpeaking();
    }
    setAudioEnabled(!audioEnabled);
  };

  return (
    <div style={styles.container}>
      <Header
        customerName={customerData?.customerName}
        audioEnabled={audioEnabled}
        isSpeaking={isSpeaking}
        ttsAvailable={ttsAvailable}
        showObjectionPanel={showObjectionPanel}
        onToggleAudio={toggleAudio}
        onToggleObjectionPanel={() => setShowObjectionPanel(!showObjectionPanel)}
      />
      
      {showObjectionPanel && (
        <ObjectionPanel
          onSelectPrompt={sendMessage}
          onClose={() => setShowObjectionPanel(false)}
        />
      )}

      {/* Messages */}
      <div style={styles.messagesContainer}>
        {messages.length === 0 && (
          <SuggestionChips onSelect={sendMessage} />
        )}

        {messages.map((message) => (
          <MessageBubble
            key={message.id}
            message={message}
            onVehicleClick={handleVehicleClick}
          />
        ))}

        {isLoading && <LoadingIndicator />}

        {/* Suggested Followups */}
        {suggestedFollowups.length > 0 && !isLoading && (
          <div style={styles.followupsContainer}>
            <p style={styles.followupsLabel}>You might also want to ask:</p>
            <div style={styles.followupsGrid}>
              {suggestedFollowups.map((followup, idx) => (
                <button
                  key={idx}
                  style={styles.followupButton}
                  onClick={() => sendMessage(followup)}
                >
                  {followup}
                </button>
              ))}
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <ChatInput
        value={inputValue}
        onChange={setInputValue}
        onSend={() => sendMessage(inputValue)}
        onMicClick={toggleListening}
        isListening={isListening}
        isLoading={isLoading}
        onStartOver={handleStartOver}
      />

      {/* Animations */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default AIAssistant;
