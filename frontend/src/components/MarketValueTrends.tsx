/**
 * QUIRK AI Kiosk - Market Value Trends (Feature #13)
 * 
 * Features:
 * - Depreciation curve visualization
 * - Market price history (12-month trend)
 * - Similar vehicle comparisons
 * - Buy/Sell timing indicators
 * - Mobile-responsive Recharts integration
 * 
 * @version 1.0.0
 */

import React, { useState, useEffect, CSSProperties } from 'react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Legend,
} from 'recharts';

// ============================================================================
// Types
// ============================================================================

interface VehicleInfo {
  year: number;
  make: string;
  model: string;
  trim?: string;
  mileage?: number;
  currentValue?: number;
}

interface MarketDataPoint {
  month: string;
  value: number;
  marketAvg: number;
  highValue: number;
  lowValue: number;
}

interface DepreciationPoint {
  year: number;
  age: string;
  value: number;
  percentRetained: number;
}

interface ComparisonVehicle {
  name: string;
  value: number;
  change: number;
  daysOnMarket: number;
}

interface MarketInsight {
  type: 'positive' | 'neutral' | 'negative';
  title: string;
  description: string;
  icon: string;
}

interface MarketValueTrendsProps {
  vehicle: VehicleInfo;
  onClose?: () => void;
  isModal?: boolean;
  showComparisons?: boolean;
}

// ============================================================================
// Mock Data Generators (Replace with API calls in production)
// ============================================================================

const generateMarketHistory = (vehicle: VehicleInfo): MarketDataPoint[] => {
  const baseValue = vehicle.currentValue || estimateBaseValue(vehicle);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const currentMonth = new Date().getMonth();
  
  return months.map((month, idx) => {
    // Simulate seasonal fluctuations + slight depreciation
    const seasonalFactor = 1 + (Math.sin((idx - 3) * Math.PI / 6) * 0.03);
    const depreciationFactor = 1 - (idx * 0.005);
    const randomVariance = 0.97 + (Math.random() * 0.06);
    
    const value = Math.round(baseValue * seasonalFactor * depreciationFactor * randomVariance);
    const marketAvg = Math.round(value * (0.95 + Math.random() * 0.1));
    
    return {
      month,
      value: idx <= currentMonth ? value : 0, // Only show past months
      marketAvg: idx <= currentMonth ? marketAvg : 0,
      highValue: Math.round(value * 1.08),
      lowValue: Math.round(value * 0.92),
    };
  }).filter(d => d.value > 0);
};

const generateDepreciationCurve = (vehicle: VehicleInfo): DepreciationPoint[] => {
  const msrp = estimateMSRP(vehicle);
  const currentAge = new Date().getFullYear() - vehicle.year;
  
  const depreciationRates = [
    { age: 0, retained: 1.0 },
    { age: 1, retained: 0.81 },
    { age: 2, retained: 0.69 },
    { age: 3, retained: 0.58 },
    { age: 4, retained: 0.49 },
    { age: 5, retained: 0.40 },
    { age: 6, retained: 0.34 },
    { age: 7, retained: 0.28 },
    { age: 8, retained: 0.24 },
    { age: 9, retained: 0.20 },
    { age: 10, retained: 0.17 },
  ];
  
  return depreciationRates.map((point, idx) => ({
    year: vehicle.year + idx,
    age: idx === 0 ? 'New' : `${idx} yr${idx > 1 ? 's' : ''}`,
    value: Math.round(msrp * point.retained),
    percentRetained: Math.round(point.retained * 100),
  }));
};

const generateComparisons = (vehicle: VehicleInfo): ComparisonVehicle[] => {
  const baseValue = vehicle.currentValue || estimateBaseValue(vehicle);
  
  const competitors: Record<string, string[]> = {
    'Equinox': ['CR-V', 'RAV4', 'Rogue', 'Tucson'],
    'Silverado': ['F-150', 'Ram 1500', 'Tundra', 'Sierra'],
    'Traverse': ['Pilot', 'Highlander', 'Pathfinder', 'Atlas'],
    'Tahoe': ['Expedition', 'Sequoia', 'Armada', 'Yukon'],
    'Malibu': ['Accord', 'Camry', 'Altima', 'Sonata'],
    'Corvette': ['911', 'Supra', 'Z', 'Mustang GT'],
    'Blazer': ['Edge', 'Murano', 'Venza', 'Passport'],
    'Colorado': ['Tacoma', 'Ranger', 'Frontier', 'Canyon'],
    'Trax': ['HR-V', 'C-HR', 'Kicks', 'Venue'],
  };
  
  const modelComps = competitors[vehicle.model] || ['Similar 1', 'Similar 2', 'Similar 3', 'Similar 4'];
  
  return modelComps.slice(0, 4).map(name => ({
    name,
    value: Math.round(baseValue * (0.85 + Math.random() * 0.3)),
    change: Math.round((Math.random() - 0.5) * 8 * 10) / 10,
    daysOnMarket: Math.round(20 + Math.random() * 40),
  }));
};

const generateInsights = (vehicle: VehicleInfo): MarketInsight[] => {
  const currentAge = new Date().getFullYear() - vehicle.year;
  const insights: MarketInsight[] = [];
  
  // Seasonal insight
  const month = new Date().getMonth();
  if (month >= 2 && month <= 4) {
    insights.push({
      type: 'positive',
      title: 'Peak Trade-In Season',
      description: 'Spring is historically the best time to trade in. Demand is high.',
      icon: '📈',
    });
  } else if (month >= 10 || month <= 1) {
    insights.push({
      type: 'negative',
      title: 'Off-Peak Season',
      description: 'Winter typically sees lower trade-in values. Consider waiting until spring.',
      icon: '📉',
    });
  }
  
  // Age-based insight
  if (currentAge <= 3) {
    insights.push({
      type: 'positive',
      title: 'Low Depreciation Zone',
      description: `Your ${vehicle.year} is still in the prime resale window.`,
      icon: '✨',
    });
  } else if (currentAge >= 7) {
    insights.push({
      type: 'neutral',
      title: 'Stable Value Range',
      description: 'Depreciation has leveled off. Value is more stable now.',
      icon: '⚖️',
    });
  }
  
  // Market trend insight
  insights.push({
    type: 'positive',
    title: 'Strong Local Demand',
    description: `${vehicle.make} ${vehicle.model} models are selling quickly in NH.`,
    icon: '🔥',
  });
  
  // Mileage insight
  if (vehicle.mileage && vehicle.mileage < 50000) {
    insights.push({
      type: 'positive',
      title: 'Low Mileage Premium',
      description: 'Below-average mileage adds $1,500-2,500 to trade value.',
      icon: '🎯',
    });
  } else if (vehicle.mileage && vehicle.mileage > 100000) {
    insights.push({
      type: 'negative',
      title: 'High Mileage Factor',
      description: 'Above 100K miles typically reduces value by 15-20%.',
      icon: '⚠️',
    });
  }
  
  return insights.slice(0, 3);
};

// Helper functions
const estimateBaseValue = (vehicle: VehicleInfo): number => {
  const msrp = estimateMSRP(vehicle);
  const age = new Date().getFullYear() - vehicle.year;
  const depreciationRate = Math.pow(0.85, age);
  const mileageFactor = vehicle.mileage ? Math.max(0.7, 1 - (vehicle.mileage / 200000) * 0.3) : 1;
  return Math.round(msrp * depreciationRate * mileageFactor);
};

const estimateMSRP = (vehicle: VehicleInfo): number => {
  const basePrices: Record<string, number> = {
    'Trax': 24000,
    'Trailblazer': 27000,
    'Equinox': 32000,
    'Blazer': 40000,
    'Traverse': 45000,
    'Tahoe': 58000,
    'Suburban': 62000,
    'Colorado': 35000,
    'Silverado': 48000,
    'Silverado 1500': 48000,
    'Silverado 2500HD': 55000,
    'Silverado 3500HD': 60000,
    'Malibu': 28000,
    'Camaro': 35000,
    'Corvette': 68000,
    'Bolt EV': 32000,
    'Bolt EUV': 34000,
  };
  return basePrices[vehicle.model] || 35000;
};

// ============================================================================
// Custom Tooltip Components
// ============================================================================

interface TooltipProps {
  active?: boolean;
  payload?: Array<{ value: number; name: string; color: string }>;
  label?: string;
}

const CustomTooltip: React.FC<TooltipProps> = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  
  return (
    <div style={tooltipStyles.container}>
      <p style={tooltipStyles.label}>{label}</p>
      {payload.map((entry, idx) => (
        <p key={idx} style={{ ...tooltipStyles.value, color: entry.color }}>
          {entry.name}: ${entry.value.toLocaleString()}
        </p>
      ))}
    </div>
  );
};

const tooltipStyles = {
  container: {
    background: 'rgba(0,0,0,0.9)',
    border: '1px solid rgba(255,255,255,0.2)',
    borderRadius: '8px',
    padding: '12px',
  } as CSSProperties,
  label: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: '12px',
    margin: '0 0 8px 0',
  } as CSSProperties,
  value: {
    fontSize: '14px',
    fontWeight: 600,
    margin: '4px 0',
  } as CSSProperties,
};

// ============================================================================
// Component
// ============================================================================

const MarketValueTrends: React.FC<MarketValueTrendsProps> = ({
  vehicle,
  onClose,
  isModal = false,
  showComparisons = true,
}) => {
  const [activeTab, setActiveTab] = useState<'history' | 'depreciation' | 'compare'>('history');
  const [marketData, setMarketData] = useState<MarketDataPoint[]>([]);
  const [depreciationData, setDepreciationData] = useState<DepreciationPoint[]>([]);
  const [comparisons, setComparisons] = useState<ComparisonVehicle[]>([]);
  const [insights, setInsights] = useState<MarketInsight[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Load data
  useEffect(() => {
    setIsLoading(true);
    
    // Simulate API delay
    setTimeout(() => {
      setMarketData(generateMarketHistory(vehicle));
      setDepreciationData(generateDepreciationCurve(vehicle));
      setComparisons(generateComparisons(vehicle));
      setInsights(generateInsights(vehicle));
      setIsLoading(false);
    }, 500);
  }, [vehicle]);

  const currentValue = vehicle.currentValue || estimateBaseValue(vehicle);
  const currentAge = new Date().getFullYear() - vehicle.year;

  // ============================================================================
  // Render Sections
  // ============================================================================

  const renderHeader = () => (
    <div style={styles.header}>
      {isModal && onClose && (
        <button style={styles.closeButton} onClick={onClose}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12"/>
          </svg>
        </button>
      )}
      <div style={styles.headerIcon}>
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 3v18h18"/>
          <path d="M18 9l-5 5-4-4-3 3"/>
        </svg>
      </div>
      <div>
        <h2 style={styles.title}>Market Value Trends</h2>
        <p style={styles.subtitle}>
          {vehicle.year} {vehicle.make} {vehicle.model} {vehicle.trim || ''}
        </p>
      </div>
    </div>
  );

  const renderValueSummary = () => (
    <div style={styles.valueSummary}>
      <div style={styles.currentValue}>
        <span style={styles.valueLabel}>Current Estimated Value</span>
        <span style={styles.valueAmount}>${currentValue.toLocaleString()}</span>
      </div>
      <div style={styles.valueStats}>
        <div style={styles.statItem}>
          <span style={styles.statValue}>{currentAge}</span>
          <span style={styles.statLabel}>Years Old</span>
        </div>
        <div style={styles.statDivider} />
        <div style={styles.statItem}>
          <span style={styles.statValue}>
            {vehicle.mileage ? `${Math.round(vehicle.mileage / 1000)}K` : 'N/A'}
          </span>
          <span style={styles.statLabel}>Miles</span>
        </div>
        <div style={styles.statDivider} />
        <div style={styles.statItem}>
          <span style={{ ...styles.statValue, color: '#4ade80' }}>
            {Math.round((currentValue / estimateMSRP(vehicle)) * 100)}%
          </span>
          <span style={styles.statLabel}>Retained</span>
        </div>
      </div>
    </div>
  );

  const renderTabs = () => (
    <div style={styles.tabs}>
      <button
        style={{
          ...styles.tab,
          ...(activeTab === 'history' ? styles.tabActive : {}),
        }}
        onClick={() => setActiveTab('history')}
      >
        📈 Price History
      </button>
      <button
        style={{
          ...styles.tab,
          ...(activeTab === 'depreciation' ? styles.tabActive : {}),
        }}
        onClick={() => setActiveTab('depreciation')}
      >
        📉 Depreciation
      </button>
      {showComparisons && (
        <button
          style={{
            ...styles.tab,
            ...(activeTab === 'compare' ? styles.tabActive : {}),
          }}
          onClick={() => setActiveTab('compare')}
        >
          ⚖️ Compare
        </button>
      )}
    </div>
  );

  const renderPriceHistoryChart = () => (
    <div style={styles.chartContainer}>
      <h3 style={styles.chartTitle}>12-Month Price History</h3>
      <ResponsiveContainer width="100%" height={isMobile ? 250 : 300}>
        <AreaChart data={marketData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="valueGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#4ade80" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#4ade80" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="avgGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#60a5fa" stopOpacity={0.2}/>
              <stop offset="95%" stopColor="#60a5fa" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
          <XAxis 
            dataKey="month" 
            stroke="rgba(255,255,255,0.5)" 
            fontSize={12}
            tickLine={false}
          />
          <YAxis 
            stroke="rgba(255,255,255,0.5)" 
            fontSize={12}
            tickLine={false}
            tickFormatter={(v) => `$${(v/1000).toFixed(0)}K`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area 
            type="monotone" 
            dataKey="value" 
            stroke="#4ade80" 
            strokeWidth={2}
            fill="url(#valueGradient)" 
            name="Your Vehicle"
          />
          <Area 
            type="monotone" 
            dataKey="marketAvg" 
            stroke="#60a5fa" 
            strokeWidth={2}
            strokeDasharray="5 5"
            fill="url(#avgGradient)" 
            name="Market Average"
          />
          <Legend 
            wrapperStyle={{ paddingTop: '20px' }}
            formatter={(value) => <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: '12px' }}>{value}</span>}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );

  const renderDepreciationChart = () => {
    const currentYearIndex = depreciationData.findIndex(d => d.year === new Date().getFullYear());
    
    return (
      <div style={styles.chartContainer}>
        <h3 style={styles.chartTitle}>Depreciation Curve</h3>
        <ResponsiveContainer width="100%" height={isMobile ? 250 : 300}>
          <LineChart data={depreciationData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis 
              dataKey="age" 
              stroke="rgba(255,255,255,0.5)" 
              fontSize={12}
              tickLine={false}
            />
            <YAxis 
              stroke="rgba(255,255,255,0.5)" 
              fontSize={12}
              tickLine={false}
              tickFormatter={(v) => `$${(v/1000).toFixed(0)}K`}
            />
            <Tooltip content={<CustomTooltip />} />
            {currentYearIndex >= 0 && (
              <ReferenceLine 
                x={depreciationData[currentYearIndex]?.age} 
                stroke="#fbbf24" 
                strokeWidth={2}
                strokeDasharray="5 5"
                label={{ 
                  value: 'Now', 
                  position: 'top', 
                  fill: '#fbbf24',
                  fontSize: 12,
                }}
              />
            )}
            <Line 
              type="monotone" 
              dataKey="value" 
              stroke="#f472b6" 
              strokeWidth={3}
              dot={{ fill: '#f472b6', strokeWidth: 0, r: 4 }}
              activeDot={{ r: 6, fill: '#f472b6' }}
              name="Value"
            />
          </LineChart>
        </ResponsiveContainer>
        
        <div style={styles.depreciationLegend}>
          <div style={styles.legendItem}>
            <span style={styles.legendDot}></span>
            <span style={styles.legendText}>
              MSRP: ${estimateMSRP(vehicle).toLocaleString()}
            </span>
          </div>
          <div style={styles.legendItem}>
            <span style={{ ...styles.legendDot, background: '#fbbf24' }}></span>
            <span style={styles.legendText}>
              Current: ${currentValue.toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    );
  };

  const renderComparisons = () => (
    <div style={styles.chartContainer}>
      <h3 style={styles.chartTitle}>Similar Vehicles</h3>
      <div style={styles.comparisonList}>
        {comparisons.map((comp, idx) => (
          <div key={idx} style={styles.comparisonItem}>
            <div style={styles.compName}>{comp.name}</div>
            <div style={styles.compDetails}>
              <span style={styles.compValue}>${comp.value.toLocaleString()}</span>
              <span style={{
                ...styles.compChange,
                color: comp.change >= 0 ? '#4ade80' : '#f87171',
              }}>
                {comp.change >= 0 ? '↑' : '↓'} {Math.abs(comp.change)}%
              </span>
              <span style={styles.compDays}>{comp.daysOnMarket} days avg</span>
            </div>
          </div>
        ))}
      </div>
      
      <div style={styles.comparisonNote}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10"/>
          <path d="M12 16v-4M12 8h.01"/>
        </svg>
        Based on similar {vehicle.year} vehicles in the New England market
      </div>
    </div>
  );

  const renderInsights = () => (
    <div style={styles.insightsSection}>
      <h3 style={styles.insightsTitle}>💡 Market Insights</h3>
      <div style={styles.insightsList}>
        {insights.map((insight, idx) => (
          <div
            key={idx}
            style={{
              ...styles.insightCard,
              borderColor: insight.type === 'positive' ? 'rgba(74, 222, 128, 0.3)' :
                          insight.type === 'negative' ? 'rgba(248, 113, 113, 0.3)' :
                          'rgba(251, 191, 36, 0.3)',
              background: insight.type === 'positive' ? 'rgba(74, 222, 128, 0.05)' :
                          insight.type === 'negative' ? 'rgba(248, 113, 113, 0.05)' :
                          'rgba(251, 191, 36, 0.05)',
            }}
          >
            <span style={styles.insightIcon}>{insight.icon}</span>
            <div style={styles.insightContent}>
              <span style={styles.insightTitle}>{insight.title}</span>
              <span style={styles.insightDesc}>{insight.description}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // ============================================================================
  // Main Render
  // ============================================================================

  if (isLoading) {
    return (
      <div style={{ ...styles.container, ...(isModal ? styles.modal : {}) }}>
        <div style={styles.loading}>
          <div style={styles.spinner} />
          <p>Loading market data...</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ ...styles.container, ...(isModal ? styles.modal : {}) }}>
      {renderHeader()}
      {renderValueSummary()}
      {renderTabs()}
      
      {activeTab === 'history' && renderPriceHistoryChart()}
      {activeTab === 'depreciation' && renderDepreciationChart()}
      {activeTab === 'compare' && renderComparisons()}
      
      {renderInsights()}
      
      {isModal && onClose && (
        <button style={styles.doneButton} onClick={onClose}>
          Done
        </button>
      )}
    </div>
  );
};

// ============================================================================
// Styles
// ============================================================================

const styles: { [key: string]: CSSProperties } = {
  container: {
    padding: '24px 20px',
    background: 'linear-gradient(180deg, rgba(10,10,10,0.98) 0%, rgba(15,15,15,0.98) 100%)',
    minHeight: '100%',
    boxSizing: 'border-box',
  },
  modal: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
    overflow: 'auto',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    marginBottom: '24px',
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    top: 0,
    right: 0,
    background: 'rgba(255,255,255,0.1)',
    border: 'none',
    borderRadius: '50%',
    width: '40px',
    height: '40px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#ffffff',
    cursor: 'pointer',
  },
  headerIcon: {
    width: '56px',
    height: '56px',
    borderRadius: '14px',
    background: 'linear-gradient(135deg, #1B7340 0%, #0d4a28 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#ffffff',
    flexShrink: 0,
  },
  title: {
    fontSize: '24px',
    fontWeight: 700,
    color: '#ffffff',
    margin: 0,
  },
  subtitle: {
    fontSize: '14px',
    color: 'rgba(255,255,255,0.6)',
    margin: '4px 0 0 0',
  },
  valueSummary: {
    background: 'rgba(255,255,255,0.05)',
    borderRadius: '16px',
    padding: '20px',
    marginBottom: '24px',
  },
  currentValue: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    marginBottom: '20px',
  },
  valueLabel: {
    fontSize: '13px',
    color: 'rgba(255,255,255,0.5)',
    textTransform: 'uppercase',
    letterSpacing: '1px',
  },
  valueAmount: {
    fontSize: '42px',
    fontWeight: 700,
    color: '#4ade80',
    marginTop: '4px',
  },
  valueStats: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '24px',
  },
  statItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  statValue: {
    fontSize: '24px',
    fontWeight: 700,
    color: '#ffffff',
  },
  statLabel: {
    fontSize: '11px',
    color: 'rgba(255,255,255,0.5)',
    textTransform: 'uppercase',
    marginTop: '2px',
  },
  statDivider: {
    width: '1px',
    height: '40px',
    background: 'rgba(255,255,255,0.1)',
  },
  tabs: {
    display: 'flex',
    gap: '8px',
    marginBottom: '20px',
    overflowX: 'auto',
    WebkitOverflowScrolling: 'touch',
  },
  tab: {
    padding: '12px 20px',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '10px',
    color: 'rgba(255,255,255,0.7)',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    transition: 'all 0.2s ease',
  },
  tabActive: {
    background: 'rgba(27, 115, 64, 0.2)',
    borderColor: '#1B7340',
    color: '#4ade80',
  },
  chartContainer: {
    background: 'rgba(255,255,255,0.03)',
    borderRadius: '16px',
    padding: '20px',
    marginBottom: '20px',
  },
  chartTitle: {
    fontSize: '16px',
    fontWeight: 600,
    color: '#ffffff',
    margin: '0 0 16px 0',
  },
  depreciationLegend: {
    display: 'flex',
    justifyContent: 'center',
    gap: '24px',
    marginTop: '16px',
    paddingTop: '16px',
    borderTop: '1px solid rgba(255,255,255,0.1)',
  },
  legendItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  legendDot: {
    width: '10px',
    height: '10px',
    borderRadius: '50%',
    background: '#f472b6',
  },
  legendText: {
    fontSize: '13px',
    color: 'rgba(255,255,255,0.7)',
  },
  comparisonList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  comparisonItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '14px 16px',
    background: 'rgba(255,255,255,0.03)',
    borderRadius: '10px',
    border: '1px solid rgba(255,255,255,0.08)',
  },
  compName: {
    fontSize: '15px',
    fontWeight: 600,
    color: '#ffffff',
  },
  compDetails: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  compValue: {
    fontSize: '15px',
    fontWeight: 600,
    color: '#ffffff',
  },
  compChange: {
    fontSize: '13px',
    fontWeight: 600,
  },
  compDays: {
    fontSize: '12px',
    color: 'rgba(255,255,255,0.5)',
  },
  comparisonNote: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginTop: '16px',
    padding: '12px',
    background: 'rgba(255,255,255,0.03)',
    borderRadius: '8px',
    fontSize: '12px',
    color: 'rgba(255,255,255,0.5)',
  },
  insightsSection: {
    marginBottom: '24px',
  },
  insightsTitle: {
    fontSize: '16px',
    fontWeight: 600,
    color: '#ffffff',
    margin: '0 0 12px 0',
  },
  insightsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  insightCard: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
    padding: '14px 16px',
    borderRadius: '12px',
    border: '1px solid',
  },
  insightIcon: {
    fontSize: '24px',
    flexShrink: 0,
  },
  insightContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  insightTitle: {
    fontSize: '14px',
    fontWeight: 600,
    color: '#ffffff',
  },
  insightDesc: {
    fontSize: '13px',
    color: 'rgba(255,255,255,0.6)',
    lineHeight: 1.4,
  },
  doneButton: {
    width: '100%',
    padding: '16px',
    background: 'linear-gradient(135deg, #1B7340 0%, #0d4a28 100%)',
    border: 'none',
    borderRadius: '12px',
    color: '#ffffff',
    fontSize: '16px',
    fontWeight: 700,
    cursor: 'pointer',
  },
  loading: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '300px',
    color: 'rgba(255,255,255,0.6)',
  },
  spinner: {
    width: '40px',
    height: '40px',
    border: '3px solid rgba(255,255,255,0.1)',
    borderTopColor: '#4ade80',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
    marginBottom: '16px',
  },
};

export default MarketValueTrends;
