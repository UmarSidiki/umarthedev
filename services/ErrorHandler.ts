import { Alert } from 'react-native';

export enum ErrorType {
  NETWORK = 'NETWORK',
  WEBVIEW = 'WEBVIEW',
  CACHE = 'CACHE',
  STORAGE = 'STORAGE',
  UNKNOWN = 'UNKNOWN'
}

export interface AppError {
  type: ErrorType;
  message: string;
  originalError?: Error;
  timestamp: number;
  context?: string;
}

export interface WebViewError {
  domain: string;
  code: number;
  description: string;
  url?: string;
}

export interface CacheError extends Error {
  operation: 'read' | 'write' | 'delete' | 'clear';
  key?: string;
}

/**
 * Centralized error handling utilities
 * Provides consistent error handling across the app
 */
export class ErrorHandler {
  private static errorLog: AppError[] = [];
  private static readonly MAX_ERROR_LOG_SIZE = 100;

  /**
   * Handle network-related errors
   */
  static handleNetworkError(error: Error, context?: string): void {
    const appError: AppError = {
      type: ErrorType.NETWORK,
      message: this.getNetworkErrorMessage(error),
      originalError: error,
      timestamp: Date.now(),
      context
    };

    this.logError(appError);
    this.showUserFriendlyError(appError);
  }

  /**
   * Handle WebView-specific errors
   */
  static handleWebViewError(error: WebViewError, context?: string): void {
    const appError: AppError = {
      type: ErrorType.WEBVIEW,
      message: this.getWebViewErrorMessage(error),
      timestamp: Date.now(),
      context
    };

    this.logError(appError);
    this.showUserFriendlyError(appError);
  }

  /**
   * Handle cache-related errors
   */
  static handleCacheError(error: CacheError, context?: string): void {
    const appError: AppError = {
      type: ErrorType.CACHE,
      message: this.getCacheErrorMessage(error),
      originalError: error,
      timestamp: Date.now(),
      context
    };

    this.logError(appError);
    // Cache errors are usually non-critical, so we log but don't always show to user
    if (error.operation === 'read') {
      console.warn('Cache read error (non-critical):', appError.message);
    } else {
      this.showUserFriendlyError(appError);
    }
  }

  /**
   * Handle storage-related errors
   */
  static handleStorageError(error: Error, context?: string): void {
    const appError: AppError = {
      type: ErrorType.STORAGE,
      message: this.getStorageErrorMessage(error),
      originalError: error,
      timestamp: Date.now(),
      context
    };

    this.logError(appError);
    this.showUserFriendlyError(appError);
  }

  /**
   * Handle unknown/generic errors
   */
  static handleUnknownError(error: Error, context?: string): void {
    const appError: AppError = {
      type: ErrorType.UNKNOWN,
      message: error.message || 'An unexpected error occurred',
      originalError: error,
      timestamp: Date.now(),
      context
    };

    this.logError(appError);
    this.showUserFriendlyError(appError);
  }

  /**
   * Show error message to user
   */
  static showErrorMessage(message: string, title: string = 'Error'): void {
    Alert.alert(title, message, [{ text: 'OK' }]);
  }

  /**
   * Show retry dialog to user
   */
  static showRetryDialog(
    message: string,
    onRetry: () => void,
    title: string = 'Error'
  ): void {
    Alert.alert(
      title,
      message,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Retry', onPress: onRetry }
      ]
    );
  }

  /**
   * Get error log for debugging
   */
  static getErrorLog(): AppError[] {
    return [...this.errorLog];
  }

  /**
   * Clear error log
   */
  static clearErrorLog(): void {
    this.errorLog = [];
  }

  /**
   * Check if device is likely offline
   */
  static isLikelyOffline(error: Error): boolean {
    const message = error.message.toLowerCase();
    return message.includes('network') ||
           message.includes('offline') ||
           message.includes('connection') ||
           message.includes('timeout') ||
           message.includes('unreachable');
  }

  // Private helper methods

  private static logError(error: AppError): void {
    // Add to error log
    this.errorLog.push(error);
    
    // Maintain log size limit
    if (this.errorLog.length > this.MAX_ERROR_LOG_SIZE) {
      this.errorLog.shift();
    }

    // Console log for development
    console.error(`[${error.type}] ${error.message}`, {
      context: error.context,
      timestamp: new Date(error.timestamp).toISOString(),
      originalError: error.originalError
    });
  }

  private static showUserFriendlyError(error: AppError): void {
    let title = 'Error';
    let message = error.message;

    switch (error.type) {
      case ErrorType.NETWORK:
        title = 'Connection Error';
        message = this.isLikelyOffline(error.originalError!) 
          ? 'Please check your internet connection and try again.'
          : 'Unable to load content. Please try again.';
        break;
      
      case ErrorType.WEBVIEW:
        title = 'Loading Error';
        message = 'Unable to load the page. Please try again.';
        break;
      
      case ErrorType.CACHE:
        title = 'Cache Error';
        message = 'There was an issue with cached content. The app will continue to work normally.';
        break;
      
      case ErrorType.STORAGE:
        title = 'Storage Error';
        message = 'Unable to save data. Some features may not work as expected.';
        break;
    }

    this.showErrorMessage(message, title);
  }

  private static getNetworkErrorMessage(error: Error): string {
    if (this.isLikelyOffline(error)) {
      return 'Device appears to be offline';
    }
    return `Network error: ${error.message}`;
  }

  private static getWebViewErrorMessage(error: WebViewError): string {
    return `WebView error (${error.code}): ${error.description}`;
  }

  private static getCacheErrorMessage(error: CacheError): string {
    return `Cache ${error.operation} error: ${error.message}`;
  }

  private static getStorageErrorMessage(error: Error): string {
    return `Storage error: ${error.message}`;
  }
}