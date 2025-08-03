import React from "react";
import {
    Dimensions,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

const { width } = Dimensions.get("window");

interface OfflinePageProps {
  onRetry: () => void;
}

export default function OfflinePage({ onRetry }: OfflinePageProps) {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* Icon Container - Updated to match the logo design */}
        <View style={styles.iconContainer}>
          <View style={styles.iconBox}>
            <Text style={styles.iconText}>📡</Text>
          </View>
        </View>

        {/* Main Title */}
        <Text style={styles.title}>No Internet Connection</Text>

        {/* Description */}
        <Text style={styles.description}>
          Please check your internet connection and try again. Make sure you&apos;re
          connected to Wi-Fi or mobile data.
        </Text>

        {/* Tips */}
        <View style={styles.tipsContainer}>
          <Text style={styles.tipsTitle}>Quick fixes:</Text>
          <Text style={styles.tipItem}>• Check your Wi-Fi connection</Text>
          <Text style={styles.tipItem}>• Turn on mobile data</Text>
          <Text style={styles.tipItem}>• Restart your network settings</Text>
          <Text style={styles.tipItem}>• Move to an area with better signal</Text>
        </View>

        {/* Retry Button */}
        <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9f4e6", // Match the start screen background
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 30,
  },
  content: {
    alignItems: "center",
    maxWidth: width * 0.85,
  },
  iconContainer: {
    marginBottom: 30,
  },
  iconBox: {
    width: 80, // Match logo size
    height: 80,
    borderRadius: 40,
    backgroundColor: "#f4a261", // Match brand color
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#f4a261", // Match shadow
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  iconText: {
    fontSize: 32, // Adjusted size
    color: "#ffffff", // White for better contrast
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1a202c", // Match text color from other screens
    textAlign: "center",
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    color: "#4a5568", // Match description color from start screen
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 30,
  },
  tipsContainer: {
    alignSelf: "stretch",
    backgroundColor: "#ffffff", // Clean white background
    padding: 20,
    borderRadius: 12,
    marginBottom: 30,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1a202c", // Match primary text color
    marginBottom: 12,
  },
  tipItem: {
    fontSize: 14,
    color: "#4a5568", // Match secondary text color
    marginBottom: 8,
    lineHeight: 20,
  },
  retryButton: {
    backgroundColor: "#f4a261", // Match brand color
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 25, // Match button radius from start screen
    shadowColor: "#f4a261",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6, // Match elevation from start screen
  },
  retryButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
});
