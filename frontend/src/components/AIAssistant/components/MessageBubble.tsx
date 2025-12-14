import React from 'react';
import type { Message, Vehicle } from '../types';
import { styles } from '../styles';
import VehicleCard from './VehicleCard';

interface MessageBubbleProps {
  message: Message;
  onVehicleClick: (vehicle: Vehicle) => void;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message, onVehicleClick }) => {
  const isUser = message.role === 'user';
  
  return (
    <div
      style={{
        ...styles.messageWrapper,
        justifyContent: isUser ? 'flex-end' : 'flex-start',
      }}
    >
      <div
        style={{
          ...styles.messageBubble,
          ...(isUser ? styles.userBubble : styles.assistantBubble),
        }}
      >
        {!isUser && (
          <div style={styles.aiAvatar}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <path d="M8 14s1.5 2 4 2 4-2 4-2"/>
              <circle cx="9" cy="9" r="1" fill="currentColor"/>
              <circle cx="15" cy="9" r="1" fill="currentColor"/>
            </svg>
          </div>
        )}
        
        <p style={{
          ...styles.messageText,
          color: isUser ? '#ffffff' : '#1a1a1a',
        }}>
          {message.content}
        </p>
        
        {/* Dealership Info Image */}
        {message.showDealerInfo && (
          <div style={styles.dealerInfoContainer}>
            <img 
              src="/images/dealership-info.png" 
              alt="Dealership Hours and Contact Information"
              style={styles.dealerInfoImage}
            />
          </div>
        )}
        
        {/* Vehicle Cards */}
        {message.vehicles && message.vehicles.length > 0 && (
          <div style={styles.vehicleGrid}>
            {message.vehicles.map((vehicle, idx) => (
              <VehicleCard
                key={idx}
                vehicle={vehicle}
                onClick={() => onVehicleClick(vehicle)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MessageBubble;
