import { useState, useEffect } from 'react';
import api from '../../api';
import { BASE_CATEGORIES, modelMatches } from '../../../types/vehicleCategories';
import type { Vehicle } from '../../../types';

// Inventory count by model name
type InventoryByModel = Record<string, number>;

interface UseInventoryCountsResult {
  inventoryByModel: InventoryByModel;
  loadingInventory: boolean;
}

const INVENTORY_TIMEOUT_MS = 5000;

export const useInventoryCounts = (): UseInventoryCountsResult => {
  const [inventoryByModel, setInventoryByModel] = useState<InventoryByModel>({});
  const [loadingInventory, setLoadingInventory] = useState<boolean>(true);

  useEffect(() => {
    const loadInventoryCounts = async (): Promise<void> => {
      try {
        // Create a timeout promise that rejects after 5 seconds
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Inventory load timeout')), INVENTORY_TIMEOUT_MS)
        );

        // Race the API call against the timeout
        const data = await Promise.race([
          api.getInventory({}),
          timeoutPromise
        ]);

        const vehicles: Vehicle[] = Array.isArray(data)
          ? data
          : (data as { vehicles?: Vehicle[] }).vehicles || [];

        const counts: InventoryByModel = {};
        vehicles.forEach((vehicle: Vehicle) => {
          const model = (vehicle.model || '').trim();
          if (model) {
            Object.values(BASE_CATEGORIES).forEach((category) => {
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
        // Log warning but don't block UI - allow component to render with empty inventory
        console.warn('Failed to load inventory counts:', err);
        setInventoryByModel({});
      } finally {
        // Always set loading to false so UI can render
        setLoadingInventory(false);
      }
    };

    loadInventoryCounts();
  }, []);

  return { inventoryByModel, loadingInventory };
};

export default useInventoryCounts;
