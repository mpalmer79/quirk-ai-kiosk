import React, { useState, useEffect, ChangeEvent } from 'react';
import styles from '../../modelBudgetSelectorStyles';
import type { StepProps, ColorChoices } from '../types';
import type { AvailableModel, GMColor } from '../../../types';
import GM_COLORS from '../../../types/gmColors';
import { toSlug } from '../constants';

interface ColorSelectionProps extends StepProps {
  modelSlug: string;
  cabSlug?: string;
}

const ColorSelection: React.FC<ColorSelectionProps> = ({ 
  state,
  updateState,
  navigateTo, 
  vehicleCategories,
  inventoryByModel,
  modelSlug,
  cabSlug,
}) => {
  const [colorChoices, setColorChoices] = useState<ColorChoices>(state.colorChoices);
  
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

  // MOVED: useEffect MUST be called before any early returns
  // Sync local state with parent state
  useEffect(() => {
    if (foundModel) {
      updateState({ 
        selectedModel: foundModel,
        selectedCab: cabSlug ? cabSlug.split('-').map(word => 
          word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ') : null,
      });
    }
  }, [foundModel, cabSlug, updateState]);

  // If model not found, redirect (AFTER all hooks)
  if (!foundModel) {
    setTimeout(() => navigateTo('modelBudget/category'), 0);
    return null;
  }

  const inventoryCount = inventoryByModel[foundModel.name] || 0;
  const colors: GMColor[] = GM_COLORS[foundModel.name] || GM_COLORS['Equinox'];
  const availableForSecond = colors.filter(c => c.name !== colorChoices.first);

  const handleColorChange = (choice: keyof ColorChoices, value: string): void => {
    const newChoices = { ...colorChoices, [choice]: value };
    setColorChoices(newChoices);
    updateState({ colorChoices: newChoices });
  };

  const handleContinue = (): void => {
    updateState({ colorChoices });
    const basePath = cabSlug 
      ? `modelBudget/budget/${modelSlug}/${cabSlug}`
      : `modelBudget/budget/${modelSlug}`;
    navigateTo(basePath);
  };

  const handleBack = (): void => {
    if (foundModel?.cabOptions && foundModel.cabOptions.length > 0) {
      navigateTo(`modelBudget/cab/${modelSlug}`);
    } else if (foundCategoryKey) {
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
        <h1 style={styles.stepTitle}>Color Preferences</h1>
        <p style={styles.stepSubtitle}>
          {inventoryCount > 0 && `We have ${inventoryCount} ${foundModel.name} vehicles in stock`}
        </p>
      </div>
      <div style={styles.formSection}>
        <p style={styles.formIntro}>Select up to 2 GM colors for {foundModel.name} in order of preference:</p>
        <div style={styles.colorSelects}>
          <div style={styles.colorSelectGroup}>
            <label style={styles.inputLabel}>First Choice</label>
            <select 
              style={styles.selectInput} 
              value={colorChoices.first} 
              onChange={(e: ChangeEvent<HTMLSelectElement>) => handleColorChange('first', e.target.value)}
            >
              <option value="">Select a color...</option>
              {colors.map((color) => (
                <option key={color.code} value={color.name}>
                  {color.name} {color.premium && `(+$${color.price})`}
                </option>
              ))}
            </select>
            {colorChoices.first && (
              <div style={styles.colorPreview}>
                <div style={{...styles.colorSwatch, backgroundColor: colors.find(c => c.name === colorChoices.first)?.hex || '#666'}} />
                <span>{colorChoices.first}</span>
              </div>
            )}
          </div>
          <div style={styles.colorSelectGroup}>
            <label style={styles.inputLabel}>Second Choice</label>
            <select 
              style={{...styles.selectInput, opacity: colorChoices.first ? 1 : 0.5}} 
              value={colorChoices.second} 
              onChange={(e: ChangeEvent<HTMLSelectElement>) => handleColorChange('second', e.target.value)} 
              disabled={!colorChoices.first}
            >
              <option value="">Select a color...</option>
              {availableForSecond.map((color) => (
                <option key={color.code} value={color.name}>
                  {color.name} {color.premium && `(+$${color.price})`}
                </option>
              ))}
            </select>
            {colorChoices.second && (
              <div style={styles.colorPreview}>
                <div style={{...styles.colorSwatch, backgroundColor: colors.find(c => c.name === colorChoices.second)?.hex || '#666'}} />
                <span>{colorChoices.second}</span>
              </div>
            )}
          </div>
        </div>
        <button style={styles.continueButton} onClick={handleContinue}>
          Continue to Budget
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M5 12h14M12 5l7 7-7 7"/>
          </svg>
        </button>
      </div>
    </div>
  );
};

export default ColorSelection;
