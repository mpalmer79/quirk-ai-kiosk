import React from 'react';
import styles from '../../modelBudgetSelectorStyles';
import type { StepProps } from '../types';
import type { AvailableModel } from '../../../types';
import { CAB_IMAGES, toSlug } from '../constants';

interface CabSelectionProps extends StepProps {
  modelSlug: string;
}

const CabSelection: React.FC<CabSelectionProps> = ({ 
  navigateTo, 
  vehicleCategories,
  modelSlug,
}) => {
  // Find the model across all categories
  let foundModel: AvailableModel | null = null;
  let foundCategoryKey: string | null = null;
  
  for (const [categoryKey, category] of Object.entries(vehicleCategories)) {
    const model = category.models.find(m => toSlug(m.name) === modelSlug);
    if (model) {
      foundModel = model;
      foundCategoryKey = categoryKey;
      break;
    }
  }

  // If model not found or no cab options, redirect
  if (!foundModel || !foundModel.cabOptions) {
    setTimeout(() => navigateTo('modelBudget/category'), 0);
    return null;
  }

  const getCabDescription = (cab: string): string => {
    if (cab.includes('Regular')) return '2-door, 3 passengers';
    if (cab.includes('Double')) return '4-door, 5-6 passengers';
    if (cab.includes('Crew')) return '4-door, 5-6 passengers, most room';
    if (cab.includes('Extended')) return '4-door, 5 passengers';
    return '';
  };

  const handleCabSelect = (cab: string): void => {
    navigateTo(`modelBudget/color/${modelSlug}/${toSlug(cab)}`);
  };

  const handleBack = (): void => {
    if (foundCategoryKey) {
      navigateTo(`modelBudget/model/${toSlug(foundCategoryKey)}`);
    } else {
      navigateTo('modelBudget/category');
    }
  };

  return (
    <div style={styles.stepContainer}>
      <button style={styles.backButton} onClick={handleBack}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M19 12H5M12 19l-7-7 7-7"/>
        </svg>
        Back
      </button>
      <div style={styles.stepHeader}>
        <h1 style={styles.stepTitle}>What cab configuration?</h1>
        <p style={styles.stepSubtitle}>Select the cab style that fits your needs</p>
      </div>
      <div style={styles.categorySelectionCard}>
        <div style={styles.cabGrid}>
          {foundModel.cabOptions.map((cab) => {
            const cabImageKey = `${foundModel!.name}-${cab}`;
            const cabImage = CAB_IMAGES[cabImageKey];
            
            return (
              <button key={cab} style={styles.modelCard} onClick={() => handleCabSelect(cab)}>
                {/* Image container with fallback to icon */}
                {cabImage ? (
                  <div style={styles.categoryImageContainer as React.CSSProperties}>
                    <img 
                      src={cabImage} 
                      alt={cab}
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
                      <span style={styles.cabIcon}>🚗</span>
                    </div>
                    <div style={styles.categoryImageOverlay as React.CSSProperties} />
                  </div>
                ) : (
                  <div style={styles.categoryImagePlaceholder as React.CSSProperties}>
                    <span style={styles.cabIcon}>🚗</span>
                  </div>
                )}
                {/* Text content below image */}
                <div style={styles.categoryContent as React.CSSProperties}>
                  <span style={styles.modelName}>{cab}</span>
                  <span style={styles.modelConfig}>{getCabDescription(cab)}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default CabSelection;
