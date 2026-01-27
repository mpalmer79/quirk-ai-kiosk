import type { Vehicle } from '../../types';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  vehicles?: Vehicle[];
  showDealerInfo?: boolean;
  timestamp: Date;
  worksheetId?: string;
}

export interface ExtractedData {
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
      condition: string | null;
    } | null;
    hasPayoff: boolean | null;
    payoffAmount: number | null;
    monthlyPayment: number | null;
    financedWith: string | null;
  };
}

export interface ObjectionCategory {
  id: string;
  label: string;
  icon: string;
  prompts: string[];
}

export interface ObjectionResult {
  category: string | null;
  followups: string[];
}

export { Vehicle };
