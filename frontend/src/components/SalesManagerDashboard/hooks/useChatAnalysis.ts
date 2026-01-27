/**
 * Hook for analyzing chat history
 */

import { useCallback } from 'react';
import type { ChatMessage } from '../types';

interface VehicleFromChat {
  stockNumber: string;
  year: string;
  model: string;
  trim?: string;
  price?: number;
}

interface TradeFromChat {
  hasTrade: boolean;
  description: string;
}

interface PaymentFromChat {
  downPayment?: number;
  monthlyBudget?: number;
  payingCash?: boolean;
}

interface UseChatAnalysisReturn {
  extractVehicles: (chatHistory: ChatMessage[] | undefined) => VehicleFromChat[];
  extractTradeIn: (chatHistory: ChatMessage[] | undefined) => TradeFromChat | null;
  extractPaymentInfo: (chatHistory: ChatMessage[] | undefined) => PaymentFromChat | null;
}

export const useChatAnalysis = (): UseChatAnalysisReturn => {
  const extractVehicles = useCallback((chatHistory: ChatMessage[] | undefined): VehicleFromChat[] => {
    if (!chatHistory || chatHistory.length === 0) return [];
    
    const vehicles: VehicleFromChat[] = [];
    const vehiclePattern = /\*?\*?(\d{4})\s+([A-Za-z]+(?:\s+[A-Za-z0-9]+)?)\s+([A-Za-z0-9]+)?\s*\(Stock\s*#?([A-Za-z0-9]+)\)\*?\*?\s*[-–]?\s*\$?([\d,]+)?/gi;
    
    chatHistory.forEach(msg => {
      if (msg.role === 'assistant') {
        vehiclePattern.lastIndex = 0;
        let match;
        while ((match = vehiclePattern.exec(msg.content)) !== null) {
          const [, year, model, trim, stock, price] = match;
          if (!vehicles.find(v => v.stockNumber === stock)) {
            vehicles.push({
              stockNumber: stock,
              year: year,
              model: model.trim(),
              trim: trim?.trim(),
              price: price ? parseInt(price.replace(/,/g, '')) : undefined
            });
          }
        }
      }
    });
    
    return vehicles;
  }, []);

  const extractTradeIn = useCallback((chatHistory: ChatMessage[] | undefined): TradeFromChat | null => {
    if (!chatHistory || chatHistory.length === 0) return null;
    
    const tradeKeywords = ['trade', 'trading', 'trade-in', 'current vehicle', 'my car', 'i have a', 'want to trade'];
    
    for (const msg of chatHistory) {
      if (msg.role === 'user') {
        const lowerContent = msg.content.toLowerCase();
        if (tradeKeywords.some(keyword => lowerContent.includes(keyword))) {
          return {
            hasTrade: true,
            description: msg.content
          };
        }
      }
    }
    
    return null;
  }, []);

  const extractPaymentInfo = useCallback((chatHistory: ChatMessage[] | undefined): PaymentFromChat | null => {
    if (!chatHistory || chatHistory.length === 0) return null;
    
    const result: PaymentFromChat = {};
    
    chatHistory.forEach(msg => {
      if (msg.role === 'user') {
        const lowerContent = msg.content.toLowerCase();
        
        if (lowerContent.includes('cash') || lowerContent.includes('paying cash') || lowerContent.includes('pay cash')) {
          result.payingCash = true;
        }
        
        const downMatch = msg.content.match(/(\$?[\d,]+)\s*(down|down payment)/i);
        if (downMatch) {
          result.downPayment = parseInt(downMatch[1].replace(/[$,]/g, ''));
        }
        
        const monthlyMatch = msg.content.match(/(\$?[\d,]+)\s*(per month|\/month|monthly|a month)/i);
        if (monthlyMatch) {
          result.monthlyBudget = parseInt(monthlyMatch[1].replace(/[$,]/g, ''));
        }
      }
    });
    
    return Object.keys(result).length > 0 ? result : null;
  }, []);

  return {
    extractVehicles,
    extractTradeIn,
    extractPaymentInfo,
  };
};
