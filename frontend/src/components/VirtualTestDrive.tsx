import React, { useState, useEffect, CSSProperties } from 'react';
import type { Vehicle, KioskComponentProps } from '../types';
import { getVehicleImageUrl, getColorGradient } from '../utils/vehicleHelpers';

// Video category type
type VideoCategory = 'walkaround' | 'interior' | 'features' | 'driving' | 'comparison';

interface VideoConfig {
  category: VideoCategory;
  label: string;
  icon: JSX.Element;
  searchSuffix: string;
  description: string;
}

// Video categories configuration
const VIDEO_CATEGORIES: VideoConfig[] = [
  {
    category: 'walkaround',
    label: '360° Walkaround',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        <path d="M2 12h20" />
      </svg>
    ),
    searchSuffix: 'walkaround exterior tour',
    description: 'Full exterior tour showing every angle',
  },
  {
    category: 'interior',
    label: 'Interior Tour',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <path d="M3 9h18" />
        <path d="M9 21V9" />
      </svg>
    ),
    searchSuffix: 'interior review tour cabin',
    description: 'Detailed cabin walkthrough and features',
  },
  {
    category: 'features',
    label: 'Tech & Features',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="2" y="3" width="20" height="14" rx="2" />
        <path d="M8 21h8" />
        <path d="M12 17v4" />
      </svg>
    ),
    searchSuffix: 'features technology infotainment safety',
    description: 'Technology, safety & convenience features',
  },
  {
    category: 'driving',
    label: 'Test Drive',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10" />
        <polygon points="10,8 16,12 10,16" fill="currentColor" />
      </svg>
    ),
    searchSuffix: 'test drive POV driving review',
    description: 'Real driving footage and performance',
  },
  {
    category: 'comparison',
    label: 'vs Competition',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M18 20V10" />
        <path d="M12 20V4" />
        <path d="M6 20v-6" />
      </svg>
    ),
    searchSuffix: 'comparison vs review',
    description: 'How it stacks up against competitors',
  },
];

// Curated channel IDs for high-quality automotive content
// These channels consistently produce professional vehicle content
const TRUSTED_CHANNELS = [
  'Chevrolet',           // Official Chevrolet channel
  'TheStraightPipes',    // Popular Canadian reviewers
  'SavageGeese',         // Detailed technical reviews
  'CarandDriver',        // Car and Driver magazine
  'MotorTrend',          // MotorTrend channel
  'KBB',                 // Kelley Blue Book
  'Edmunds',             // Edmunds reviews
  'AlexOnAutos',         // Detailed reviews
];

// Model-specific video mappings for Chevrolet lineup
// These are curated search terms that work well for each model
const MODEL_VIDEO_HINTS: Record<string, { keywords: string[]; competitors: string[] }> = {
  'equinox': {
    keywords: ['compact SUV', 'crossover', 'family SUV'],
    competitors: ['Honda CR-V', 'Toyota RAV4', 'Ford Escape'],
  },
  'blazer': {
    keywords: ['midsize SUV', 'sporty SUV', 'two-row SUV'],
    competitors: ['Ford Edge', 'Hyundai Santa Fe', 'Nissan Murano'],
  },
  'traverse': {
    keywords: ['three-row SUV', 'family SUV', 'large SUV'],
    competitors: ['Honda Pilot', 'Toyota Highlander', 'Ford Explorer'],
  },
  'tahoe': {
    keywords: ['full-size SUV', 'truck-based SUV', 'V8 SUV'],
    competitors: ['Ford Expedition', 'Toyota Sequoia', 'Nissan Armada'],
  },
  'suburban': {
    keywords: ['full-size SUV', 'extended SUV', 'largest SUV'],
    competitors: ['Ford Expedition MAX', 'Cadillac Escalade ESV'],
  },
  'silverado': {
    keywords: ['full-size truck', 'pickup truck', 'half-ton truck'],
    competitors: ['Ford F-150', 'Ram 1500', 'Toyota Tundra'],
  },
  'colorado': {
    keywords: ['midsize truck', 'compact truck', 'off-road truck'],
    competitors: ['Ford Ranger', 'Toyota Tacoma', 'Jeep Gladiator'],
  },
  'trax': {
    keywords: ['subcompact SUV', 'entry SUV', 'small crossover'],
    competitors: ['Honda HR-V', 'Toyota Corolla Cross', 'Hyundai Kona'],
  },
  'trailblazer': {
    keywords: ['small SUV', 'subcompact crossover', 'affordable SUV'],
    competitors: ['Hyundai Kona', 'Kia Seltos', 'Mazda CX-30'],
  },
  'bolt': {
    keywords: ['electric vehicle', 'EV', 'electric car'],
    competitors: ['Nissan Leaf', 'Hyundai Kona Electric', 'Kia Niro EV'],
  },
  'malibu': {
    keywords: ['midsize sedan', 'family sedan'],
    competitors: ['Honda Accord', 'Toyota Camry', 'Hyundai Sonata'],
  },
  'camaro': {
    keywords: ['sports car', 'muscle car', 'pony car'],
    competitors: ['Ford Mustang', 'Dodge Challenger'],
  },
  'corvette': {
    keywords: ['sports car', 'supercar', 'mid-engine'],
    competitors: ['Porsche 911', 'Nissan GT-R', 'Audi R8'],
  },
};

// Generate YouTube search URL for embedding
const generateYouTubeSearchUrl = (vehicle: Vehicle, category: VideoConfig): string => {
  const year = vehicle.year || new Date().getFullYear();
  const make = vehicle.make || 'Chevrolet';
  const model = vehicle.model || '';
  
  // Build search query
  const searchQuery = `${year} ${make} ${model} ${category.searchSuffix}`;
  
  // Encode for URL
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(searchQuery)}`;
};

// Generate YouTube embed URL with search
const generateYouTubeEmbedSearch = (vehicle: Vehicle, category: VideoConfig): string => {
  const year = vehicle.year || new Date().getFullYear();
  const make = vehicle.make || 'Chevrolet';
  const model = vehicle.model || '';
  
  // Build search query optimized for finding good content
  let searchQuery = `${year} ${make} ${model} ${category.searchSuffix}`;
  
  // For comparison category, add competitor info
  if (category.category === 'comparison') {
    const modelKey = model.toLowerCase().replace(/\s+/g, '').split(' ')[0];
    const hints = MODEL_VIDEO_HINTS[modelKey];
    if (hints && hints.competitors.length > 0) {
      searchQuery = `${year} ${make} ${model} vs ${hints.competitors[0]}`;
    }
  }
  
  // YouTube's embed with listType=search
  // Note: This requires using YouTube's iframe API or playlist approach
  return `https://www.youtube.com/embed?listType=search&list=${encodeURIComponent(searchQuery)}`;
};

// Format price
const formatPrice = (price: number | undefined): string => {
  if (!price) return 'N/A';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
};

const VirtualTestDrive: React.FC<KioskComponentProps> = ({
  navigateTo,
  updateCustomerData,
  customerData,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<VideoCategory>('walkaround');
  const [isLoading, setIsLoading] = useState(true);
  const [videoError, setVideoError] = useState(false);

  // Get vehicle from customerData
  const vehicle: Vehicle = customerData?.selectedVehicle || {
    stockNumber: 'DEMO001',
    year: 2025,
    make: 'Chevrolet',
    model: 'Equinox',
    trim: 'RS AWD',
    exteriorColor: 'Radiant Red',
    msrp: 34000,
  };

  const year = vehicle.year || new Date().getFullYear();
  const make = vehicle.make || 'Chevrolet';
  const model = vehicle.model || '';
  const trim = vehicle.trim || '';
  const exteriorColor = vehicle.exteriorColor || vehicle.exterior_color || '';
  const price = vehicle.price || vehicle.salePrice || vehicle.sale_price || vehicle.msrp || 0;
  const stockNumber = vehicle.stockNumber || vehicle.stock_number || '';
  
  // Get current category config
  const currentCategory = VIDEO_CATEGORIES.find(c => c.category === selectedCategory) || VIDEO_CATEGORIES[0];
  
  // Generate search query for current selection
  const searchQuery = `${year} ${make} ${model} ${currentCategory.searchSuffix}`;
  
  // For comparison, customize the query
  const getSearchQuery = (): string => {
    if (selectedCategory === 'comparison') {
      const modelKey = model.toLowerCase().replace(/\s+/g, '').split(' ')[0];
      const hints = MODEL_VIDEO_HINTS[modelKey];
      if (hints && hints.competitors.length > 0) {
        return `${year} ${make} ${model} vs ${hints.competitors[0]} comparison`;
      }
    }
    return `${year} ${make} ${model} ${currentCategory.searchSuffix}`;
  };

  // Handle category change
  const handleCategoryChange = (category: VideoCategory) => {
    setIsLoading(true);
    setVideoError(false);
    setSelectedCategory(category);
  };

  // Handle video load
  const handleVideoLoad = () => {
    setIsLoading(false);
  };

  // Handle video error
  const handleVideoError = () => {
    setIsLoading(false);
    setVideoError(true);
  };

  // Get model hints for display
  const modelKey = model.toLowerCase().replace(/\s+/g, '').split(' ')[0];
  const modelHints = MODEL_VIDEO_HINTS[modelKey];

  // Vehicle image
  const imageUrl = getVehicleImageUrl(vehicle);
  const gradient = getColorGradient(exteriorColor);

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <button style={styles.backBtn} onClick={() => navigateTo('vehicleDetail')}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Back to Details
        </button>
        <div style={styles.headerCenter}>
          <h1 style={styles.title}>Virtual Experience</h1>
          <p style={styles.subtitle}>{year} {make} {model} {trim}</p>
        </div>
        <div style={styles.headerRight}>
          <span style={styles.price}>{formatPrice(price)}</span>
          <span style={styles.stockNum}>Stock #{stockNumber}</span>
        </div>
      </div>

      {/* Main Content */}
      <div style={styles.mainContent}>
        {/* Video Player Section */}
        <div style={styles.videoSection}>
          {/* Category Tabs */}
          <div style={styles.categoryTabs}>
            {VIDEO_CATEGORIES.map((cat) => (
              <button
                key={cat.category}
                style={{
                  ...styles.categoryTab,
                  ...(selectedCategory === cat.category ? styles.categoryTabActive : {}),
                }}
                onClick={() => handleCategoryChange(cat.category)}
              >
                <span style={styles.categoryIcon}>{cat.icon}</span>
                <span style={styles.categoryLabel}>{cat.label}</span>
              </button>
            ))}
          </div>

          {/* Video Container */}
          <div style={styles.videoContainer}>
            {isLoading && (
              <div style={styles.loadingOverlay}>
                <div style={styles.spinner} />
                <span style={styles.loadingText}>Loading {currentCategory.label}...</span>
              </div>
            )}
            
            {videoError ? (
              <div style={styles.errorState}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 8v4M12 16h.01" />
                </svg>
                <h3 style={styles.errorTitle}>Video Unavailable</h3>
                <p style={styles.errorText}>
                  We couldn't load videos for this selection. Try another category or search YouTube directly.
                </p>
                <a
                  href={`https://www.youtube.com/results?search_query=${encodeURIComponent(getSearchQuery())}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={styles.searchYouTubeBtn}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                  </svg>
                  Search on YouTube
                </a>
              </div>
            ) : (
              <iframe
                style={{
                  ...styles.videoIframe,
                  opacity: isLoading ? 0 : 1,
                }}
                src={`https://www.youtube.com/embed?listType=search&list=${encodeURIComponent(getSearchQuery())}`}
                title={`${currentCategory.label} - ${year} ${make} ${model}`}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                onLoad={handleVideoLoad}
                onError={handleVideoError}
              />
            )}
          </div>

          {/* Video Description */}
          <div style={styles.videoDescription}>
            <div style={styles.descriptionIcon}>{currentCategory.icon}</div>
            <div style={styles.descriptionContent}>
              <h3 style={styles.descriptionTitle}>{currentCategory.label}</h3>
              <p style={styles.descriptionText}>{currentCategory.description}</p>
            </div>
            <a
              href={`https://www.youtube.com/results?search_query=${encodeURIComponent(getSearchQuery())}`}
              target="_blank"
              rel="noopener noreferrer"
              style={styles.moreVideosLink}
            >
              More Videos
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3" />
              </svg>
            </a>
          </div>
        </div>

        {/* Sidebar */}
        <div style={styles.sidebar}>
          {/* Vehicle Card */}
          <div style={styles.vehicleCard}>
            <div style={{ ...styles.vehicleImage, background: gradient }}>
              {imageUrl ? (
                <img src={imageUrl} alt={`${year} ${model}`} style={styles.vehicleImg} />
              ) : (
                <span style={styles.vehicleInitial}>{model.charAt(0)}</span>
              )}
            </div>
            <div style={styles.vehicleInfo}>
              <h3 style={styles.vehicleName}>{year} {make} {model}</h3>
              <p style={styles.vehicleTrim}>{trim}</p>
              <p style={styles.vehicleColor}>{exteriorColor}</p>
            </div>
          </div>

          {/* Quick Facts */}
          {modelHints && (
            <div style={styles.quickFacts}>
              <h4 style={styles.quickFactsTitle}>Vehicle Category</h4>
              <div style={styles.factTags}>
                {modelHints.keywords.map((keyword, idx) => (
                  <span key={idx} style={styles.factTag}>{keyword}</span>
                ))}
              </div>
              
              <h4 style={styles.quickFactsTitle}>Top Competitors</h4>
              <div style={styles.competitorsList}>
                {modelHints.competitors.map((competitor, idx) => (
                  <div key={idx} style={styles.competitorItem}>
                    <span style={styles.competitorNum}>{idx + 1}</span>
                    <span style={styles.competitorName}>{competitor}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Suggested Searches */}
          <div style={styles.suggestedSearches}>
            <h4 style={styles.suggestedTitle}>Popular Searches</h4>
            <div style={styles.searchLinks}>
              <a
                href={`https://www.youtube.com/results?search_query=${encodeURIComponent(`${year} ${make} ${model} owner review`)}`}
                target="_blank"
                rel="noopener noreferrer"
                style={styles.searchLink}
              >
                Owner Reviews
              </a>
              <a
                href={`https://www.youtube.com/results?search_query=${encodeURIComponent(`${year} ${make} ${model} problems issues`)}`}
                target="_blank"
                rel="noopener noreferrer"
                style={styles.searchLink}
              >
                Known Issues
              </a>
              <a
                href={`https://www.youtube.com/results?search_query=${encodeURIComponent(`${year} ${make} ${model} off road trail`)}`}
                target="_blank"
                rel="noopener noreferrer"
                style={styles.searchLink}
              >
                Off-Road Capability
              </a>
              <a
                href={`https://www.youtube.com/results?search_query=${encodeURIComponent(`${year} ${make} ${model} towing hauling`)}`}
                target="_blank"
                rel="noopener noreferrer"
                style={styles.searchLink}
              >
                Towing & Hauling
              </a>
            </div>
          </div>

          {/* CTA Buttons */}
          <div style={styles.ctaSection}>
            <button style={styles.primaryCta} onClick={() => navigateTo('vehicleDetail')}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
              See It In Person
            </button>
            <button style={styles.secondaryCta} onClick={() => navigateTo('vehicleComparison')}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="7" height="7" />
                <rect x="14" y="3" width="7" height="7" />
                <rect x="14" y="14" width="7" height="7" />
                <rect x="3" y="14" width="7" height="7" />
              </svg>
              Compare Vehicles
            </button>
          </div>
        </div>
      </div>

      {/* Footer Tips */}
      <div style={styles.footer}>
        <div style={styles.footerTip}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 16v-4M12 8h.01" />
          </svg>
          <span>Videos are sourced from YouTube and may include content from various automotive reviewers</span>
        </div>
        <div style={styles.footerTip}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
          <span>Have questions? A sales consultant is available to help you right here in the showroom</span>
        </div>
      </div>

      {/* CSS for animations */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

const styles: Record<string, CSSProperties> = {
  container: {
    minHeight: '100vh',
    background: '#0a0a0a',
    color: '#fff',
    display: 'flex',
    flexDirection: 'column',
  },

  // Header
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px 32px',
    background: '#1a1a1a',
    borderBottom: '1px solid rgba(255,255,255,0.1)',
  },
  backBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 16px',
    background: 'rgba(255,255,255,0.1)',
    border: '1px solid rgba(255,255,255,0.2)',
    borderRadius: '8px',
    color: '#fff',
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer',
  },
  headerCenter: {
    textAlign: 'center',
  },
  title: {
    fontSize: '24px',
    fontWeight: 700,
    color: '#fff',
    margin: 0,
  },
  subtitle: {
    fontSize: '14px',
    color: 'rgba(255,255,255,0.6)',
    margin: '4px 0 0 0',
  },
  headerRight: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: '4px',
  },
  price: {
    fontSize: '20px',
    fontWeight: 700,
    color: '#4ade80',
  },
  stockNum: {
    fontSize: '12px',
    color: 'rgba(255,255,255,0.5)',
  },

  // Main Content
  mainContent: {
    flex: 1,
    display: 'grid',
    gridTemplateColumns: '1fr 320px',
    gap: '24px',
    padding: '24px 32px',
  },

  // Video Section
  videoSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  categoryTabs: {
    display: 'flex',
    gap: '8px',
    overflowX: 'auto',
    paddingBottom: '8px',
  },
  categoryTab: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '12px 20px',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '10px',
    color: 'rgba(255,255,255,0.7)',
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    whiteSpace: 'nowrap',
  },
  categoryTabActive: {
    background: 'rgba(27,115,64,0.2)',
    border: '1px solid #1B7340',
    color: '#4ade80',
  },
  categoryIcon: {
    display: 'flex',
    alignItems: 'center',
  },
  categoryLabel: {
    fontSize: '14px',
  },

  // Video Container
  videoContainer: {
    position: 'relative',
    width: '100%',
    paddingTop: '56.25%', // 16:9 aspect ratio
    background: '#000',
    borderRadius: '16px',
    overflow: 'hidden',
  },
  videoIframe: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    border: 'none',
    transition: 'opacity 0.3s ease',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '16px',
    background: 'rgba(0,0,0,0.8)',
    zIndex: 10,
  },
  spinner: {
    width: '48px',
    height: '48px',
    borderWidth: '3px',
    borderStyle: 'solid',
    borderColor: 'rgba(255,255,255,0.1)',
    borderTopColor: '#1B7340',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  loadingText: {
    fontSize: '14px',
    color: 'rgba(255,255,255,0.6)',
  },
  errorState: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '16px',
    background: '#1a1a1a',
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    padding: '24px',
  },
  errorTitle: {
    fontSize: '18px',
    fontWeight: 600,
    color: '#fff',
    margin: 0,
  },
  errorText: {
    fontSize: '14px',
    margin: 0,
    maxWidth: '300px',
  },
  searchYouTubeBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '12px 24px',
    background: '#ff0000',
    border: 'none',
    borderRadius: '8px',
    color: '#fff',
    fontSize: '14px',
    fontWeight: 600,
    textDecoration: 'none',
    cursor: 'pointer',
  },

  // Video Description
  videoDescription: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    padding: '16px 20px',
    background: 'rgba(255,255,255,0.03)',
    borderRadius: '12px',
    border: '1px solid rgba(255,255,255,0.05)',
  },
  descriptionIcon: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '48px',
    height: '48px',
    background: 'rgba(27,115,64,0.2)',
    borderRadius: '12px',
    color: '#4ade80',
    flexShrink: 0,
  },
  descriptionContent: {
    flex: 1,
  },
  descriptionTitle: {
    fontSize: '16px',
    fontWeight: 600,
    color: '#fff',
    margin: '0 0 4px 0',
  },
  descriptionText: {
    fontSize: '13px',
    color: 'rgba(255,255,255,0.6)',
    margin: 0,
  },
  moreVideosLink: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '10px 16px',
    background: 'rgba(255,255,255,0.1)',
    borderRadius: '8px',
    color: '#fff',
    fontSize: '13px',
    fontWeight: 500,
    textDecoration: 'none',
    whiteSpace: 'nowrap',
  },

  // Sidebar
  sidebar: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  vehicleCard: {
    padding: '16px',
    background: 'rgba(255,255,255,0.03)',
    borderRadius: '16px',
    border: '1px solid rgba(255,255,255,0.05)',
  },
  vehicleImage: {
    height: '140px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '12px',
    overflow: 'hidden',
  },
  vehicleImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  vehicleInitial: {
    fontSize: '48px',
    fontWeight: 800,
    color: 'rgba(255,255,255,0.2)',
  },
  vehicleInfo: {
    textAlign: 'center',
  },
  vehicleName: {
    fontSize: '16px',
    fontWeight: 700,
    color: '#fff',
    margin: 0,
  },
  vehicleTrim: {
    fontSize: '13px',
    color: 'rgba(255,255,255,0.7)',
    margin: '4px 0 0 0',
  },
  vehicleColor: {
    fontSize: '12px',
    color: 'rgba(255,255,255,0.5)',
    margin: '4px 0 0 0',
  },

  // Quick Facts
  quickFacts: {
    padding: '16px',
    background: 'rgba(255,255,255,0.03)',
    borderRadius: '16px',
    border: '1px solid rgba(255,255,255,0.05)',
  },
  quickFactsTitle: {
    fontSize: '12px',
    fontWeight: 600,
    color: 'rgba(255,255,255,0.5)',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    margin: '0 0 8px 0',
  },
  factTags: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '6px',
    marginBottom: '16px',
  },
  factTag: {
    padding: '4px 10px',
    background: 'rgba(27,115,64,0.15)',
    borderRadius: '6px',
    fontSize: '11px',
    fontWeight: 500,
    color: '#4ade80',
  },
  competitorsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  competitorItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  competitorNum: {
    width: '20px',
    height: '20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(255,255,255,0.1)',
    borderRadius: '4px',
    fontSize: '11px',
    fontWeight: 600,
    color: 'rgba(255,255,255,0.6)',
  },
  competitorName: {
    fontSize: '13px',
    color: 'rgba(255,255,255,0.8)',
  },

  // Suggested Searches
  suggestedSearches: {
    padding: '16px',
    background: 'rgba(255,255,255,0.03)',
    borderRadius: '16px',
    border: '1px solid rgba(255,255,255,0.05)',
  },
  suggestedTitle: {
    fontSize: '12px',
    fontWeight: 600,
    color: 'rgba(255,255,255,0.5)',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    margin: '0 0 12px 0',
  },
  searchLinks: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  searchLink: {
    display: 'block',
    padding: '10px 12px',
    background: 'rgba(255,255,255,0.05)',
    borderRadius: '8px',
    color: 'rgba(255,255,255,0.8)',
    fontSize: '13px',
    fontWeight: 500,
    textDecoration: 'none',
    transition: 'background 0.2s ease',
  },

  // CTA Section
  ctaSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    marginTop: 'auto',
  },
  primaryCta: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    padding: '16px 20px',
    background: 'linear-gradient(135deg, #1B7340 0%, #0d4a28 100%)',
    border: 'none',
    borderRadius: '12px',
    color: '#fff',
    fontSize: '15px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  secondaryCta: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    padding: '14px 20px',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.2)',
    borderRadius: '12px',
    color: '#fff',
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer',
  },

  // Footer
  footer: {
    display: 'flex',
    justifyContent: 'center',
    gap: '32px',
    padding: '16px 32px',
    background: 'rgba(255,255,255,0.02)',
    borderTop: '1px solid rgba(255,255,255,0.05)',
  },
  footerTip: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '12px',
    color: 'rgba(255,255,255,0.4)',
  },
};

export default VirtualTestDrive;
