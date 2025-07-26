import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Service for managing AsyncStorage operations
 * Handles first-time user flag management and cache data storage
 */
export class StorageService {
  private static readonly FIRST_TIME_USER_KEY = 'isFirstTimeUser';
  private static readonly CACHE_PREFIX = 'cache_';

  /**
   * Set the first-time user flag
   */
  static async setFirstTimeUser(value: boolean): Promise<void> {
    try {
      await AsyncStorage.setItem(this.FIRST_TIME_USER_KEY, JSON.stringify(value));
    } catch (error) {
      console.error('Error setting first time user flag:', error);
      throw error;
    }
  }

  /**
   * Check if user is a first-time user
   * Returns true if first time, false if returning user
   */
  static async isFirstTimeUser(): Promise<boolean> {
    try {
      const value = await AsyncStorage.getItem(this.FIRST_TIME_USER_KEY);
      if (value === null) {
        // If no value exists, this is a first-time user
        return true;
      }
      return JSON.parse(value);
    } catch (error) {
      console.error('Error checking first time user status:', error);
      // Default to first-time user on error for safety
      return true;
    }
  }

  /**
   * Store cache data with a prefixed key
   */
  static async setCacheData(key: string, data: any): Promise<void> {
    try {
      const prefixedKey = this.CACHE_PREFIX + key;
      await AsyncStorage.setItem(prefixedKey, JSON.stringify(data));
    } catch (error) {
      console.error('Error setting cache data:', error);
      throw error;
    }
  }

  /**
   * Retrieve cache data by key
   */
  static async getCacheData(key: string): Promise<any> {
    try {
      const prefixedKey = this.CACHE_PREFIX + key;
      const value = await AsyncStorage.getItem(prefixedKey);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('Error getting cache data:', error);
      return null;
    }
  }

  /**
   * Remove cache data by key
   */
  static async removeCacheData(key: string): Promise<void> {
    try {
      const prefixedKey = this.CACHE_PREFIX + key;
      await AsyncStorage.removeItem(prefixedKey);
    } catch (error) {
      console.error('Error removing cache data:', error);
      throw error;
    }
  }

  /**
   * Clear all cache data
   */
  static async clearAllCacheData(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith(this.CACHE_PREFIX));
      await AsyncStorage.multiRemove(cacheKeys);
    } catch (error) {
      console.error('Error clearing cache data:', error);
      throw error;
    }
  }

  /**
   * Get the size of all stored data (approximate)
   */
  static async getStorageSize(): Promise<number> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const items = await AsyncStorage.multiGet(keys);
      let totalSize = 0;
      
      items.forEach(([key, value]) => {
        if (value) {
          totalSize += key.length + value.length;
        }
      });
      
      return totalSize;
    } catch (error) {
      console.error('Error calculating storage size:', error);
      return 0;
    }
  }
}