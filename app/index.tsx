import { router } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { ErrorHandler } from "../services/ErrorHandler";
import { StorageService } from "../services/StorageService";

export default function Index() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkFirstTimeUserAndNavigate();
  }, []);

  const checkFirstTimeUserAndNavigate = async () => {
    try {
      setIsLoading(true);
      
      // Check if user is first-time user using StorageService
      const isFirstTime = await StorageService.isFirstTimeUser();
      
      // Navigate based on first-time user status
      if (isFirstTime) {
        router.replace("/start");
      } else {
        router.replace("/portfolio");
      }
    } catch (error) {
      // Handle error appropriately with ErrorHandler
      ErrorHandler.handleStorageError(
        error as Error, 
        "Failed to check first-time user status during app initialization"
      );
      
      // Default to start screen on error for safety
      router.replace("/start");
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading state while checking AsyncStorage
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
});
