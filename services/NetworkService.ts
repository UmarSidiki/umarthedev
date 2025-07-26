import NetInfo from '@react-native-community/netinfo';

export interface NetworkState {
  isConnected: boolean;
  isInternetReachable: boolean | null;
  type: string;
}

/**
 * Service for managing network connectivity detection
 */
export class NetworkService {
  private static listeners: ((state: NetworkState) => void)[] = [];

  /**
   * Get current network state
   */
  static async getNetworkState(): Promise<NetworkState> {
    try {
      const state = await NetInfo.fetch();
      return {
        isConnected: state.isConnected ?? false,
        isInternetReachable: state.isInternetReachable,
        type: state.type
      };
    } catch (error) {
      console.error('Error getting network state:', error);
      return {
        isConnected: false,
        isInternetReachable: false,
        type: 'unknown'
      };
    }
  }

  /**
   * Check if device is online
   */
  static async isOnline(): Promise<boolean> {
    const state = await this.getNetworkState();
    return state.isConnected && (state.isInternetReachable !== false);
  }

  /**
   * Subscribe to network state changes
   */
  static addNetworkListener(callback: (state: NetworkState) => void): () => void {
    this.listeners.push(callback);

    const unsubscribe = NetInfo.addEventListener(state => {
      const networkState: NetworkState = {
        isConnected: state.isConnected ?? false,
        isInternetReachable: state.isInternetReachable,
        type: state.type
      };
      callback(networkState);
    });

    return () => {
      const index = this.listeners.indexOf(callback);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
      unsubscribe();
    };
  }

  /**
   * Remove all network listeners
   */
  static removeAllListeners(): void {
    this.listeners = [];
  }
}