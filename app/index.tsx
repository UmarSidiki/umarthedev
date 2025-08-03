import { router } from "expo-router";
import { useEffect } from "react";
import { ErrorHandler } from "../services/ErrorHandler";
import { StorageService } from "../services/StorageService";

export default function Index() {
  useEffect(() => {
    checkFirstTimeUserAndNavigate();
  }, []);

  const checkFirstTimeUserAndNavigate = async () => {
    try {
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
    }
  };
  return null;
}
