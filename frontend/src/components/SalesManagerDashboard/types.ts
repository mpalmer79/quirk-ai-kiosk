/**
 * Sales Manager Dashboard - Type Definitions
 */

export interface CustomerSession {
  sessionId: string;
  customerName: string | null;
  phone: string | null;
  startTime: string;
  lastActivity: string;
  currentStep: string;
  vehicleInterest: {
    model: string | null;
    cab: string | null;
    colors: string[];
  };
  budget: {
    min: number | null;
    max: number | null;
    downPaymentPercent: number | null;
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
    estimatedValue?: number | null;
  };
  selectedVehicle: {
    stockNumber: string | null;
    year: number | null;
    make: string | null;
    model: string | null;
    trim: string | null;
    price: number | null;
    msrp?: number | null;
  } | null;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
}

export interface SessionDetail {
  sessionId: string;
  customerName?: string;
  phone?: string;
  path?: string;
  currentStep?: string;
  createdAt: string;
  updatedAt: string;
  vehicleInterest?: CustomerSession['vehicleInterest'];
  budget?: CustomerSession['budget'];
  tradeIn?: Partial<CustomerSession['tradeIn']>;
  vehicle?: Partial<{
    stockNumber: string;
    year: number;
    make: string;
    model: string;
    trim: string;
    price: number;
    msrp?: number;
  }>;
  chatHistory?: ChatMessage[];
  actions?: string[];
}

export interface DealOverrides {
  salePrice: number | null;
  tradeACV: number | null;
  downPayment: number | null;
  adminFee: number;
  financeTerm: number;
  financeAPR: number;
  leaseTerm: number;
  leaseMoneyFactor: number;
  leaseResidual: number;
}

export interface WorksheetData {
  id: string;
  session_id: string;
  status: 'draft' | 'ready' | 'negotiating' | 'accepted' | 'declined' | 'expired';
  vehicle: {
    stock_number: string;
    year: number;
    make: string;
    model: string;
    trim?: string;
    exterior_color?: string;
    msrp: number;
  };
  customer_name?: string;
  customer_phone?: string;
  customer_email?: string;
  selling_price: number;
  down_payment: number;
  monthly_payment: number;
  amount_financed: number;
  selected_term?: number;
  term_options: TermOption[];
  trade_equity: number;
  has_trade: boolean;
  trade_in?: TradeInData;
  lead_score: number;
  created_at: string;
  updated_at: string;
  manager_notes?: string;
  manager_adjustment?: number;
  counter_offer_sent?: boolean;
  doc_fee: number;
  total_due_at_signing: number;
}

export interface TermOption {
  term_months: number;
  apr: number;
  monthly_payment: number;
  total_of_payments: number;
  total_interest: number;
  is_selected: boolean;
}

export interface TradeInData {
  year?: number;
  make?: string;
  model?: string;
  mileage?: number;
  estimated_value?: number;
  appraised_value?: number;
  payoff_amount?: number;
  equity?: number;
}

export interface LeadScoreBadge {
  label: string;
  color: string;
  bg: string;
  icon: string;
}

export interface StatusBadge {
  label: string;
  color: string;
  bg: string;
}

export interface PaymentResult {
  monthly: number;
  totalCost: number;
  totalInterest: number;
}

export interface LeaseResult {
  monthly: number;
  dueAtSigning: number;
  residualValue: number;
}

export type TabType = 'sessions' | 'worksheets';
export type PaymentMode = 'finance' | 'lease';
