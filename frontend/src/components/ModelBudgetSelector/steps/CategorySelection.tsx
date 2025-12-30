import React from 'react';
import styles from '../../modelBudgetSelectorStyles';
import type { StepProps } from '../types';
import { toSlug } from '../constants';

const CategorySelection: React.FC<StepProps> = ({ 
  navigateTo, 
  vehicleCategories,
  resetJourney 
}) => {
  const handleCategorySelect = (categoryKey: string): void => {
    navigateTo(`modelBudget/model/${toSlug(categoryKey)}`);
  };

  return (
    <div style={styles.stepContainer}>
      <div style={styles.stepHeader}>
        <div style={styles.stepIcon}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M7 17m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0"/>
            <path d="M17 17m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0"/>
            <path d="M5 17h-2v-6l2-5h9l4 5h1a2 2 0 0 1 2 2v4h-2m-4 0h-6"/>
          </svg>
        </div>
        <h1 style={styles.stepTitle}>What type of vehicle are you looking for?</h1>
        <p style={styles.stepSubtitle}>Select a category to get started</p>
      </div>
      <div style={styles.categorySelectionCard}>
        <div style={styles.categoryGrid}>
          {Object.entries(vehicleCategories).map(([key, category]) => (
            <button key={key} style={styles.categoryCard} onClick={() => handleCategorySelect(key)}>
              {/* Image container with fallback to emoji */}
              {category.image ? (
                <div style={styles.categoryImageContainer as React.CSSProperties}>
                  <img 
                    src={category.image} 
                    alt={category.name}
                    style={styles.categoryImage as React.CSSProperties}
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                      const parent = (e.target as HTMLImageElement).parentElement;
                      if (parent) {
                        const fallback = parent.querySelector('[data-fallback]') as HTMLElement;
                        if (fallback) fallback.style.display = 'flex';
                      }
                    }}
                  />
                  <div 
                    data-fallback
                    style={{ 
                      ...styles.categoryImagePlaceholder as React.CSSProperties, 
                      display: 'none',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                    }}
                  >
                    <span style={styles.categoryFallbackIcon as React.CSSProperties}>{category.icon}</span>
                  </div>
                  <div style={styles.categoryImageOverlay as React.CSSProperties} />
                </div>
              ) : (
                <div style={styles.categoryImagePlaceholder as React.CSSProperties}>
                  <span style={styles.categoryFallbackIcon as React.CSSProperties}>{category.icon}</span>
                </div>
              )}
              {/* Text content below image */}
              <div style={styles.categoryContent as React.CSSProperties}>
                <div style={styles.categoryName}>{category.name}</div>
                <div style={styles.categoryCount}>{category.models.length} models</div>
              </div>
            </button>
          ))}
        </div>
      </div>
      
      {resetJourney && (
        <div style={styles.startOverContainer}>
          <button style={styles.startOverButton} onClick={resetJourney}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
            </svg>
            Start Over
          </button>
        </div>
      )}
    </div>
  );
};

export default CategorySelection;
