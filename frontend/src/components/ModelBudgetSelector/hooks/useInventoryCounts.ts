import { useState, useEffect } from 'react';
import api from '../../api';
import { BASE_CATEGORIES, modelMatches } from '../../../types/vehicleCategories';
import type { Vehicle, VehicleCategories } from '../../../types';

// Inventory count by model name
type InventoryByModel = Record<string, number>;

export interface UseInventoryCountsResult {
  inventoryByModel: InventoryByModel;
  vehicleCategories: VehicleCategories;
  loading: boolean;
  error: string | null;
}

const INVENTORY_TIMEOUT_MS = 5000;

export const useInventoryCounts = (): UseInventoryCountsResult => {
  const [inventoryByModel, setInventoryByModel] = useState<InventoryByModel>({});
  const [vehicleCategories, setVehicleCategories] = useState<VehicleCategories>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

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

        // Build vehicleCategories from BASE_CATEGORIES and inventory counts
        const categories: VehicleCategories = {};
        Object.entries(BASE_CATEGORIES).forEach(([key, category]) => {
          const categoryCount = category.modelNames.reduce(
            (sum, modelName) => sum + (counts[modelName] || 0),
            0
          );
          
          // Only include categories with inventory (or all if no inventory data)
          if (categoryCount > 0 || Object.keys(counts).length === 0) {
            categories[key] = {
              name: category.name,
              icon: category.icon,
              image: category.image,
              count: categoryCount,
              models: category.modelNames.map((modelName) => ({
                name: modelName,
                image: `/images/models/${modelName.toLowerCase().replace(/\s+/g, '-')}.webp`,
                cabOptions: category.cabOptions?.[modelName] || null,
                towingCapacity: category.towingCapacity?.[modelName] || null,
              })),
            };
          }
        });

        setVehicleCategories(categories);
        setError(null);
      } catch (err) {
        // Log warning but don't block UI - allow component to render with empty inventory
        console.warn('Failed to load inventory counts:', err);
        setInventoryByModel({});
        
        // Still build categories from BASE_CATEGORIES even on error
        const categories: VehicleCategories = {};
        Object.entries(BASE_CATEGORIES).forEach(([key, category]) => {
          categories[key] = {
            name: category.name,
            icon: category.icon,
            image: category.image,
            count: 0,
            models: category.modelNames.map((modelName) => ({
              name: modelName,
              image: `/images/models/${modelName.toLowerCase().replace(/\s+/g, '-')}.webp`,
              cabOptions: category.cabOptions?.[modelName] || null,
              towingCapacity: category.towingCapacity?.[modelName] || null,
            })),
          };
        });
        setVehicleCategories(categories);
        
        // Don't set error for timeout - just show empty counts
        if (err instanceof Error && err.message === 'Inventory load timeout') {
          setError(null);
        } else {
          setError('Failed to load inventory');
        }
      } finally {
        // Always set loading to false so UI can render
        setLoading(false);
      }
    };

    loadInventoryCounts();
  }, []);

  return { inventoryByModel, vehicleCategories, loading, error };
};

export default useInventoryCounts;
