import type { AvailableModel, BudgetRange, VehicleCategories } from '../../types';

// Color choices state interface
export interface ColorChoices {
  first: string;
  second: string;
}

// Trade-in vehicle info for this flow
export interface TradeVehicleInfo {
  year: string;
  make: string;
  model: string;
  mileage: string;
}

// Inventory count by model name
export type InventoryByModel = Record<string, number>;

// Shared state passed between steps
export interface ModelBudgetState {
  selectedCategory: string | null;
  selectedModel: AvailableModel | null;
  selectedCab: string | null;
  colorChoices: ColorChoices;
  budgetRange: BudgetRange;
  downPaymentPercent: number;
  hasTrade: boolean | null;
  hasPayoff: boolean | null;
  payoffAmount: string;
  monthlyPayment: string;
  financedWith: string;
  tradeVehicle: TradeVehicleInfo;
}

// Initial state values
export const initialModelBudgetState: ModelBudgetState = {
  selectedCategory: null,
  selectedModel: null,
  selectedCab: null,
  colorChoices: { first: '', second: '' },
  budgetRange: { min: 400, max: 900 },
  downPaymentPercent: 10,
  hasTrade: null,
  hasPayoff: null,
  payoffAmount: '',
  monthlyPayment: '',
  financedWith: '',
  tradeVehicle: {
    year: '',
    make: '',
    model: '',
    mileage: '',
  },
};

// Step component props
export interface StepProps {
  state: ModelBudgetState;
  updateState: (updates: Partial<ModelBudgetState>) => void;
  navigateTo: (screen: string) => void;
  inventoryByModel: InventoryByModel;
  vehicleCategories: VehicleCategories;
  resetJourney?: () => void;
}

// Model Budget step names for URL routing
export type ModelBudgetStep = 
  | 'category'
  | 'model'
  | 'cab'
  | 'color'
  | 'budget'
  | 'trade';

// URL parameter data
export interface StepParams {
  category?: string;
  model?: string;
}
