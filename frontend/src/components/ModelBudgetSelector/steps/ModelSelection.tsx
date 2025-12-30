import React from 'react';
import styles from '../../modelBudgetSelectorStyles';
import type { StepProps } from '../types';
import type { AvailableModel } from '../../../types';
import { MODEL_IMAGES, toSlug } from '../constants';

interface ModelSelectionProps extends StepProps {
  categoryKey: string;
}

const ModelSelection: React.FC<ModelSelectionProps> = ({ 
  navigateTo, 
  vehicleCategories,
  categoryKey,
}) => {
  const category = vehicleCategories[categoryKey];
  
  // If category not found, redirect to category selection
  if (!category) {
    // Use setTimeout to avoid rendering issues
    setTimeout(() => navigateTo('modelBudget/category'), 0);
    return null;
  }

  const handleModelSelect = (model: AvailableModel): void => {
    if (model.cabOptions && model.cabOptions.length > 0) {
      navigateTo(`modelBudget/cab/${toSlug(model.name)}`);
    } else {
      navigateTo(`modelBudget/color/${toSlug(model.name)}`);
    }
  };

  const handleBack = (): void => {
    navigateTo('modelBudget/category');
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
        <h1 style={styles.stepTitle}>Which model interests you?</h1>
        <p style={styles.stepSubtitle}>Select a model to see available options</p>
      </div>
      <div style={styles.categorySelectionCard}>
        <div style={styles.modelGrid}>
          {category.models.map((model) => {
            const modelImage = MODEL_IMAGES[model.name];
            return (
              <button key={model.name} style={styles.modelCard} onClick={() => handleModelSelect(model)}>
                {/* Image container with fallback to initial */}
                {modelImage ? (
                  <div style={styles.categoryImageContainer as React.CSSProperties}>
                    <img 
                      src={modelImage} 
                      alt={model.name}
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
                      <div style={styles.modelInitial}>{model.name.charAt(0)}</div>
                    </div>
                    <div style={styles.categoryImageOverlay as React.CSSProperties} />
                  </div>
                ) : (
                  <div style={styles.categoryImagePlaceholder as React.CSSProperties}>
                    <div style={styles.modelInitial}>{model.name.charAt(0)}</div>
                  </div>
                )}
                {/* Text content below image */}
                <div style={styles.categoryContent as React.CSSProperties}>
                  <span style={styles.modelName}>{model.name}</span>
                  <span style={styles.modelCount}>{model.count} in stock</span>
                  {model.cabOptions && <span style={styles.modelConfig}>{model.cabOptions.length} configurations</span>}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ModelSelection;
