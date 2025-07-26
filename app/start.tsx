import { router } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
    Animated,
    Dimensions,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { StorageService } from "../services";

const { height } = Dimensions.get("window");

export default function StartScreen() {
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(50));
  const [buttonScale] = useState(new Animated.Value(0.8));

  const startAnimations = useCallback(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start(() => {
      Animated.spring(buttonScale, {
        toValue: 1,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }).start();
    });
  }, [fadeAnim, slideAnim, buttonScale]);

  useEffect(() => {
    startAnimations();
  }, [startAnimations]);

  const handleGetStarted = async () => {
    try {
      await StorageService.setFirstTimeUser(false);
      router.replace("/portfolio");
    } catch (error) {
      console.error("Error setting first-time user flag:", error);
      router.replace("/portfolio");
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f9f4e6" />
      <View style={styles.backgroundGradient} />
      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <View style={styles.heroSection}>
          <View style={styles.logoContainer}>
            <Text style={styles.logoText}>U</Text>
          </View>
          <Text style={styles.japaneseText}>こんにちは</Text>
          <Text style={styles.welcomeText}>Welcome to</Text>
          <Text style={styles.nameText}>Umar&apos;s Portfolio</Text>
          <Text style={styles.subtitleText}>
            Full-Stack Developer & Creative Problem Solver
          </Text>
        </View>
        <View style={styles.descriptionSection}>
          <Text style={styles.descriptionText}>
            Discover my journey in web development, explore my projects, and
            learn about the technologies I’m passionate about.
          </Text>
        </View>
        <Animated.View
          style={[
            styles.buttonContainer,
            {
              transform: [{ scale: buttonScale }],
            },
          ]}
        >
          <TouchableOpacity
            style={styles.getStartedButton}
            onPress={handleGetStarted}
            activeOpacity={0.8}
          >
            <Text style={styles.buttonText}>View My Projects</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.downloadButton}
            onPress={() => console.log("Download Resume")}
          >
            <Text style={styles.downloadText}>Download Resume</Text>
          </TouchableOpacity>
        </Animated.View>
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Tap to explore my work and connect with me
          </Text>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9f4e6",
  },
  backgroundGradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#f9f4e6",
    opacity: 0.9,
  },
  content: {
    flex: 1,
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 30,
    paddingTop: height * 0.1,
    paddingBottom: 50,
  },
  heroSection: {
    alignItems: "center",
    marginTop: height * 0.05,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#f4a261",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    shadowColor: "#f4a261",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  logoText: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#ffffff",
  },
  japaneseText: {
    fontSize: 28,
    color: "#f4a261",
    fontWeight: "bold",
    marginBottom: 8,
    textAlign: "center",
  },
  welcomeText: {
    fontSize: 18,
    color: "#6b7280",
    marginBottom: 8,
    textAlign: "center",
  },
  nameText: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#1a202c",
    marginBottom: 12,
    textAlign: "center",
  },
  subtitleText: {
    fontSize: 16,
    color: "#f4a261",
    textAlign: "center",
    fontWeight: "500",
  },
  descriptionSection: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  descriptionText: {
    fontSize: 16,
    color: "#4a5568",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 20,
  },
  buttonContainer: {
    marginBottom: 30,
  },
  getStartedButton: {
    backgroundColor: "#f4a261",
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
    alignItems: "center",
    shadowColor: "#f4a261",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    marginBottom: 10,
  },
  downloadButton: {
    backgroundColor: "#ffffff",
    paddingVertical: 10,
    paddingHorizontal: 30,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: "#f4a261",
    alignItems: "center",
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "600",
  },
  downloadText: {
    color: "#f4a261",
    fontSize: 16,
    fontWeight: "500",
  },
  footer: {
    alignItems: "center",
  },
  footerText: {
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
  },
});