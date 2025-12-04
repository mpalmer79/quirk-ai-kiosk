// Vehicle & Inventory Types
export interface Vehicle {
  stock_number?: string;
  stockNumber?: string;
  vin?: string;
  year?: number;
  make?: string;
  model?: string;
  trim?: string;
  exterior_color?: string;
  exteriorColor?: string;
  interior_color?: string;
  interiorColor?: string;
  msrp?: number;
  price?: number;
  sale_price?: number;
  salePrice?: number;
  mileage?: number;
  engine?: string;
  transmission?: string;
  drivetrain?: string;
  fuel_type?: string;
  fuelType?: string;
  mpg_city?: number;
  mpg_highway?: number;
  body_style?: string;
  bodyStyle?: string;
  doors?: number;
  image_url?: string;
  imageUrl?: string;
  images?: string[];
  features?: string[];
  description?: string;
  status?: 'available' | 'sold' | 'pending' | 'hold';
  cab_type?: string;
  cabType?: string;
}

// GM Color Types
export interface GMColor {
  name: string;
  code: string;
  hex: string;
  premium: boolean;
  price?: number;
}

export type GMColorsByModel = Record<string, GMColor[]>;

// Category Types
export interface CabOptions {
  [modelName: string]: string[];
}

export interface BaseCategory {
  name: string;
  icon: string;
  modelNames: string[];
  cabOptions?: CabOptions;
}

export interface AvailableModel {
  name: string;
  count: number;
  cabOptions?: string[];
}

export interface VehicleCategory {
  name: string;
  icon: string;
  models: AvailableModel[];
}

export type BaseCategories = Record<string, BaseCategory>;
export type VehicleCategories = Record<string, VehicleCategory>;

// Customer Data Types
export interface BudgetRange {
  min: number;
  max: number;
}

export type SortOption = 'recommended' | 'price-low' | 'price-high' | 'newest' | 'mileage';

export interface CustomerData {
  customerName?: string;
  selectedModel?: string;
  selectedCab?: string;
  colorPreferences?: string[];
  budgetRange?: BudgetRange;
  downPaymentPercent?: number;
  hasTrade?: boolean | null;
  hasPayoff?: boolean | null;
  payoffAmount?: number | null;
  path?: 'modelBudget' | 'stockLookup' | 'inventory' | 'browse' | 'aiChat';
  selectedVehicle?: Vehicle;
  protectionPackages?: string[];
  protectionTotal?: number;
  sortBy?: SortOption;
  preferences?: {
    bodyStyle?: string;
    [key: string]: unknown;
  };
  quizAnswers?: Record<string, string>;
  contactInfo?: {
    phone?: string;
    email?: string;
    [key: string]: unknown;
  };
  paymentPreference?: {
    type?: string;
    monthly?: number;
    term?: number;
    downPayment?: number;
    [key: string]: unknown;
  };
  tradeIn?: {
    year?: number;
    make?: string;
    model?: string;
    mileage?: number;
    condition?: string;
    estimatedValue?: number;
    [key: string]: unknown;
  };
  vehicleRequested?: {
    stockNumber?: string;
    requestedAt?: string;
    [key: string]: unknown;
  };
}

// Protection Package Types
export interface ProtectionPackage {
  id: string;
  name: string;
  price: number;
  monthlyPrice: number;
  description: string;
  highlights: string[];
  fullDescription: string;
  color: string;
}

// Traffic Log Types
export interface TrafficLogEntry {
  id?: number;
  session_id: string;
  timestamp: string;
  event_type: 'session_start' | 'navigation' | 'vehicle_view' | 'vehicle_request' | 'session_end';
  screen_name?: string;
  vehicle_stock_number?: string;
  customer_name?: string;
  additional_data?: Record<string, unknown>;
}

// API Response Types
export interface InventoryResponse {
  vehicles?: Vehicle[];
  total?: number;
  page?: number;
  limit?: number;
}

export interface ApiError {
  message: string;
  status?: number;
  code?: string;
}

// Component Props Types
export interface NavigationProps {
  navigateTo: (screen: string) => void;
  resetJourney?: () => void;
}

export interface CustomerDataProps {
  customerData: CustomerData;
  updateCustomerData: (data: Partial<CustomerData>) => void;
}

export interface KioskComponentProps extends NavigationProps, CustomerDataProps {}

// Style Types (for inline styles)
export type CSSProperties = React.CSSProperties;
export type StyleObject = Record<string, CSSProperties>;
