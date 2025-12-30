import { useState, useEffect, useMemo } from 'react';
import api from '../../api';
import { BASE_CATEGORIES, modelMatches } from '../../../types/vehicleCategories';
import type { Vehicle, VehicleCategories, AvailableModel } from '../../../types';
import type { InventoryByModel } from '../types';

interface UseInventoryCountsResult {
  inventoryByModel: InventoryByModel;
  vehicleCategories: VehicleCategories;
  loading: boolean;
  error: string | null;
}

export const useInventoryCounts = (): UseInventoryCountsResult => {
  const [inventoryByModel, setInventoryByModel] = useState<InventoryByModel>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadInventoryCounts = async (): Promise<void> => {
      try {
        const data = await api.getInventory({});
        const vehicles: Vehicle[] = Array.isArray(data) 
          ? data 
          : (data as { vehicles?: Vehicle[] }).vehicles || [];
        
        const counts: InventoryByModel = {};
        vehicles.forEach((vehicle: Vehicle) => {
          const model = (vehicle.model || '').trim();
          if (model) {
            Object.values(BASE_CATEGORIES).forEach(category => {
              category.modelNames.forEach((categoryModel: string) => {
                if (modelMatches(model, categoryModel)) {
                  counts[categoryModel] = (counts[categoryModel] || 0) + 1;
                }
              });
            });
          }
        });
        
        setInventoryByModel(counts);
      } catch (err) {
        console.error('Error loading inventory counts:', err);
        setError('Failed to load inventory');
      } finally {
        setLoading(false);
      }
    };
    
    loadInventoryCounts();
  }, []);

  // Build dynamic categories based on actual inventory
  const vehicleCategories: VehicleCategories = useMemo(() => {
    return Object.entries(BASE_CATEGORIES).reduce(
      (acc: VehicleCategories, [key, category]) => {
        const availableModels: AvailableModel[] = category.modelNames
          .filter((modelName: string) => (inventoryByModel[modelName] || 0) > 0)
          .map((modelName: string) => ({
            name: modelName,
            count: inventoryByModel[modelName] || 0,
            cabOptions: category.cabOptions?.[modelName],
          }));
        
        if (availableModels.length > 0) {
          acc[key] = {
            name: category.name,
            icon: category.icon,
            image: category.image,
            models: availableModels,
          };
        }
        
        return acc;
      }, 
      {} as VehicleCategories
    );
  }, [inventoryByModel]);

  return {
    inventoryByModel,
    vehicleCategories,
    loading,
    error,
  };
};

export default useInventoryCounts;
