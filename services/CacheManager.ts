import { StorageService } from './StorageService';

export interface CacheEntry {
  url: string;
  data: string;
  timestamp: number;
  expiresAt: number;
  contentType: string;
  size: number;
}

/**
 * Cache Manager for web resource caching
 * Implements cache expiration and size limit management
 */
export class CacheManager {
  private static readonly CACHE_INDEX_KEY = 'cache_index';
  private static readonly MAX_CACHE_SIZE = 50 * 1024 * 1024; // 50MB
  private static readonly DEFAULT_EXPIRATION = 60 * 60 * 1000; // 1 hour
  private static readonly STATIC_RESOURCE_EXPIRATION = 24 * 60 * 60 * 1000; // 24 hours

  /**
   * Cache a resource with automatic expiration
   */
  static async cacheResource(
    url: string, 
    data: string, 
    contentType: string = 'text/html'
  ): Promise<void> {
    try {
      const now = Date.now();
      const expiration = this.getExpirationTime(contentType);
      
      const entry: CacheEntry = {
        url,
        data,
        timestamp: now,
        expiresAt: now + expiration,
        contentType,
        size: data.length
      };

      // Store the cache entry
      await StorageService.setCacheData(this.getCacheKey(url), entry);
      
      // Update cache index
      await this.updateCacheIndex(url, entry.size);
      
      // Check and enforce cache size limits
      await this.enforceCacheSizeLimit();
    } catch (error) {
      console.error('Error caching resource:', error);
      throw error;
    }
  }

  /**
   * Retrieve cached resource if not expired
   */
  static async getCachedResource(url: string): Promise<string | null> {
    try {
      const entry: CacheEntry | null = await StorageService.getCacheData(this.getCacheKey(url));
      
      if (!entry) {
        return null;
      }

      // Check if cache entry has expired
      if (Date.now() > entry.expiresAt) {
        await this.removeCachedResource(url);
        return null;
      }

      return entry.data;
    } catch (error) {
      console.error('Error getting cached resource:', error);
      return null;
    }
  }

  /**
   * Remove a specific cached resource
   */
  static async removeCachedResource(url: string): Promise<void> {
    try {
      const entry: CacheEntry | null = await StorageService.getCacheData(this.getCacheKey(url));
      
      if (entry) {
        await StorageService.removeCacheData(this.getCacheKey(url));
        await this.removeFromCacheIndex(url, entry.size);
      }
    } catch (error) {
      console.error('Error removing cached resource:', error);
      throw error;
    }
  }

  /**
   * Clear all cached resources
   */
  static async clearCache(): Promise<void> {
    try {
      await StorageService.clearAllCacheData();
      await StorageService.removeCacheData(this.CACHE_INDEX_KEY);
    } catch (error) {
      console.error('Error clearing cache:', error);
      throw error;
    }
  }

  /**
   * Get current cache size in bytes
   */
  static async getCacheSize(): Promise<number> {
    try {
      const index = await this.getCacheIndex();
      return index.totalSize;
    } catch (error) {
      console.error('Error getting cache size:', error);
      return 0;
    }
  }

  /**
   * Get cache statistics
   */
  static async getCacheStats(): Promise<{
    totalSize: number;
    entryCount: number;
    oldestEntry: number;
    newestEntry: number;
  }> {
    try {
      const index = await this.getCacheIndex();
      return {
        totalSize: index.totalSize,
        entryCount: index.entries.length,
        oldestEntry: Math.min(...index.entries.map(e => e.timestamp)),
        newestEntry: Math.max(...index.entries.map(e => e.timestamp))
      };
    } catch (error) {
      console.error('Error getting cache stats:', error);
      return {
        totalSize: 0,
        entryCount: 0,
        oldestEntry: 0,
        newestEntry: 0
      };
    }
  }

  /**
   * Check if a resource is cached and not expired
   */
  static async isCached(url: string): Promise<boolean> {
    const cachedData = await this.getCachedResource(url);
    return cachedData !== null;
  }

  // Private helper methods

  private static getCacheKey(url: string): string {
    return `resource_${this.hashUrl(url)}`;
  }

  private static hashUrl(url: string): string {
    // Simple hash function for URL
    let hash = 0;
    for (let i = 0; i < url.length; i++) {
      const char = url.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString();
  }

  private static getExpirationTime(contentType: string): number {
    // Static resources get longer cache time
    if (contentType.includes('css') || 
        contentType.includes('javascript') || 
        contentType.includes('image/')) {
      return this.STATIC_RESOURCE_EXPIRATION;
    }
    
    return this.DEFAULT_EXPIRATION;
  }

  private static async getCacheIndex(): Promise<{
    totalSize: number;
    entries: Array<{ url: string; size: number; timestamp: number }>;
  }> {
    const index = await StorageService.getCacheData(this.CACHE_INDEX_KEY);
    return index || { totalSize: 0, entries: [] };
  }

  private static async updateCacheIndex(url: string, size: number): Promise<void> {
    const index = await this.getCacheIndex();
    
    // Remove existing entry if it exists
    const existingIndex = index.entries.findIndex(entry => entry.url === url);
    if (existingIndex !== -1) {
      index.totalSize -= index.entries[existingIndex].size;
      index.entries.splice(existingIndex, 1);
    }

    // Add new entry
    index.entries.push({
      url,
      size,
      timestamp: Date.now()
    });
    index.totalSize += size;

    await StorageService.setCacheData(this.CACHE_INDEX_KEY, index);
  }

  private static async removeFromCacheIndex(url: string, size: number): Promise<void> {
    const index = await this.getCacheIndex();
    const entryIndex = index.entries.findIndex(entry => entry.url === url);
    
    if (entryIndex !== -1) {
      index.entries.splice(entryIndex, 1);
      index.totalSize -= size;
      await StorageService.setCacheData(this.CACHE_INDEX_KEY, index);
    }
  }

  private static async enforceCacheSizeLimit(): Promise<void> {
    const index = await this.getCacheIndex();
    
    if (index.totalSize <= this.MAX_CACHE_SIZE) {
      return;
    }

    // Sort entries by timestamp (oldest first) for LRU eviction
    index.entries.sort((a, b) => a.timestamp - b.timestamp);

    // Remove oldest entries until under size limit
    while (index.totalSize > this.MAX_CACHE_SIZE && index.entries.length > 0) {
      const oldestEntry = index.entries.shift()!;
      await StorageService.removeCacheData(this.getCacheKey(oldestEntry.url));
      index.totalSize -= oldestEntry.size;
    }

    await StorageService.setCacheData(this.CACHE_INDEX_KEY, index);
  }
}