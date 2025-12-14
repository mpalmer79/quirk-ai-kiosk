import { useCallback } from 'react';
import type { ExtractedData, ObjectionResult } from '../types';
import { SPOUSE_RESPONSES } from '../constants';

export const useDataExtraction = () => {
  
  const extractDataFromMessage = useCallback((text: string, currentData: ExtractedData): ExtractedData => {
    const lowerText = text.toLowerCase();
    const newData = JSON.parse(JSON.stringify(currentData)) as ExtractedData;

    // Model extraction
    const models = ['silverado', 'colorado', 'tahoe', 'suburban', 'traverse', 'equinox', 'blazer', 'trax', 'trailblazer', 'camaro', 'corvette', 'malibu', 'bolt'];
    for (const model of models) {
      if (lowerText.includes(model)) {
        newData.vehicleInterest.model = model.charAt(0).toUpperCase() + model.slice(1);
        break;
      }
    }

    // Body type extraction
    if (lowerText.includes('truck') || lowerText.includes('pickup')) {
      newData.vehicleInterest.bodyType = 'Truck';
    } else if (lowerText.includes('suv')) {
      newData.vehicleInterest.bodyType = 'SUV';
    } else if (lowerText.includes('sedan') || lowerText.includes('car')) {
      newData.vehicleInterest.bodyType = 'Sedan';
    }

    // Budget extraction
    const budgetMatch = text.match(/\$?([\d,]+)(?:\s*k)?/gi);
    if (budgetMatch) {
      for (const match of budgetMatch) {
        const num = parseInt(match.replace(/[$,k]/gi, '')) * (match.toLowerCase().includes('k') ? 1000 : 1);
        if (num >= 1000 && num <= 200000) {
          if (!newData.budget.max || num > newData.budget.max) {
            newData.budget.max = num;
          }
          if (!newData.budget.min) {
            newData.budget.min = Math.max(num - 10000, 20000);
          }
        }
      }
    }

    // Monthly payment extraction
    const monthlyMatch = text.match(/\$?([\d,]+)\s*(?:per|a|\/)\s*month/i);
    if (monthlyMatch) {
      newData.budget.monthlyPayment = parseInt(monthlyMatch[1].replace(/,/g, ''));
    }

    // Trade-in detection
    if (lowerText.includes('trade') || lowerText.includes('trading in') || lowerText.includes('have a car')) {
      newData.tradeIn.hasTrade = true;
    }

    // Trade-in vehicle details
    const yearMatch = text.match(/\b(19|20)\d{2}\b/);
    if (yearMatch && newData.tradeIn.hasTrade) {
      if (!newData.tradeIn.vehicle) {
        newData.tradeIn.vehicle = { year: null, make: null, model: null, mileage: null, condition: null };
      }
      newData.tradeIn.vehicle.year = yearMatch[0];
    }

    // Payoff detection
    if (lowerText.includes('owe') || lowerText.includes('payoff') || lowerText.includes('loan')) {
      newData.tradeIn.hasPayoff = true;
    }

    return newData;
  }, []);

  const detectObjection = useCallback((text: string): ObjectionResult => {
    const lowerText = text.toLowerCase();

    // Check for spouse/partner objection
    for (const response of SPOUSE_RESPONSES) {
      for (const trigger of response.triggers) {
        if (lowerText.includes(trigger)) {
          return {
            category: 'spouse',
            followups: response.followups,
          };
        }
      }
    }

    // Check for other objection types
    if (lowerText.includes('expensive') || lowerText.includes('too much') || lowerText.includes('price')) {
      return { category: 'price', followups: [] };
    }

    if (lowerText.includes('think about') || lowerText.includes('not ready') || lowerText.includes('just looking')) {
      return { category: 'timing', followups: [] };
    }

    if (lowerText.includes('credit') || lowerText.includes('financing') || lowerText.includes('interest')) {
      return { category: 'credit', followups: [] };
    }

    return { category: null, followups: [] };
  }, []);

  const detectHoursQuery = useCallback((text: string): boolean => {
    const lowerContent = text.toLowerCase();
    return lowerContent.includes('hour') || 
      lowerContent.includes('open') || 
      lowerContent.includes('close') || 
      lowerContent.includes('closing') ||
      lowerContent.includes('when do you') ||
      lowerContent.includes('what time') ||
      lowerContent.includes('schedule') ||
      lowerContent.includes('sunday') ||
      lowerContent.includes('saturday') ||
      lowerContent.includes('weekend') ||
      lowerContent.includes('phone number') ||
      lowerContent.includes('call you') ||
      lowerContent.includes('contact') ||
      lowerContent.includes('location') ||
      lowerContent.includes('address') ||
      lowerContent.includes('where are you');
  }, []);

  return {
    extractDataFromMessage,
    detectObjection,
    detectHoursQuery,
  };
};

export default useDataExtraction;
