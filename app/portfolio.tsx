import { useFocusEffect } from "@react-navigation/native";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  BackHandler,
  Linking,
  Platform,
  StyleSheet,
  View,
} from "react-native";
import { WebView, WebViewNavigation } from "react-native-webview";
import { OfflinePage, WebViewPreloader } from "../components";
import { ErrorHandler, WebViewError } from "../services/ErrorHandler";
import { NetworkService } from "../services/NetworkService";

const PORTFOLIO_URL = "https://umar.is-a.dev/";
const PORTFOLIO_DOMAIN = "umar.is-a.dev";

// URL validation and security utilities
const isValidUrl = (url: string): boolean => {
  try {
    const urlObj = new URL(url);
    return urlObj.protocol === "https:" || urlObj.protocol === "http:";
  } catch {
    return false;
  }
};

const isPortfolioDomain = (url: string): boolean => {
  try {
    const urlObj = new URL(url);
    return (
      urlObj.hostname === PORTFOLIO_DOMAIN ||
      urlObj.hostname === `www.${PORTFOLIO_DOMAIN}`
    );
  } catch {
    return false;
  }
};

const isSafeExternalLink = (url: string): boolean => {
  if (!isValidUrl(url)) return false;

  try {
    const urlObj = new URL(url);
    // Block potentially dangerous protocols
    const dangerousProtocols = ["javascript:", "data:", "file:", "ftp:"];
    if (
      dangerousProtocols.some((protocol) =>
        url.toLowerCase().startsWith(protocol)
      )
    ) {
      return false;
    }

    // Allow common safe domains for external links
    const safeDomains = [
      "github.com",
      "linkedin.com",
      "twitter.com",
      "x.com",
      "instagram.com",
      "youtube.com",
      "medium.com",
      "dev.to",
      "stackoverflow.com",
    ];

    return safeDomains.some(
      (domain) =>
        urlObj.hostname === domain || urlObj.hostname.endsWith(`.${domain}`)
    );
  } catch {
    return false;
  }
};

export default function PortfolioScreen() {
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [canGoBack, setCanGoBack] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [webViewReady, setWebViewReady] = useState(false);
  const [preloaderReady, setPreloaderReady] = useState(false);
  const [hasLoadedInitially, setHasLoadedInitially] = useState(false);
  const webViewRef = useRef<WebView>(null);

  // Initialize preloader immediately and WebView after a short delay
  useEffect(() => {
    // Show preloader immediately
    setPreloaderReady(true);
    
    // Initialize WebView after preloader is ready
    const timer = setTimeout(() => {
      setWebViewReady(true);
    }, 300); // Increased delay to ensure preloader is fully visible

    return () => clearTimeout(timer);
  }, []);

  // Monitor network connectivity
  useEffect(() => {
    const checkInitialConnectivity = async () => {
      const online = await NetworkService.isOnline();
      setIsOnline(online);
    };

    checkInitialConnectivity();

    const unsubscribe = NetworkService.addNetworkListener(
      async (networkState) => {
        const online =
          networkState.isConnected &&
          networkState.isInternetReachable !== false;
        setIsOnline(online);
      }
    );

    return unsubscribe;
  }, []);

  // Handle Android hardware back button
  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        if (canGoBack && webViewRef.current) {
          webViewRef.current.goBack();
          return true; // Prevent default behavior
        }
        return false; // Allow default behavior (exit app)
      };

      if (Platform.OS === "android") {
        const subscription = BackHandler.addEventListener(
          "hardwareBackPress",
          onBackPress
        );
        return () => subscription.remove();
      }
    }, [canGoBack])
  );

  const handleLoadStart = () => {
    if (!hasLoadedInitially) {
      setLoadingProgress(0.1);
    }
  };

  const handleError = (syntheticEvent: any) => {
    const { nativeEvent } = syntheticEvent;
    const webViewError: WebViewError = {
      domain: nativeEvent.domain || "unknown",
      code: nativeEvent.code || -1,
      description: nativeEvent.description || "Unknown WebView error",
      url: nativeEvent.url || PORTFOLIO_URL,
    };

    ErrorHandler.handleWebViewError(webViewError, "Portfolio WebView");
    setIsInitialLoading(false);
  };

  const handleNavigationStateChange = (navState: WebViewNavigation) => {
    setCanGoBack(navState.canGoBack);
  };

  const handleShouldStartLoadWithRequest = useCallback((request: any) => {
    const { url } = request;

    // Always allow the initial portfolio URL
    if (url === PORTFOLIO_URL) {
      return true;
    }

    // Allow navigation within the portfolio domain
    if (isPortfolioDomain(url)) {
      return true;
    }

    // Handle external links
    if (isValidUrl(url)) {
      // Check if it's a safe external link
      if (isSafeExternalLink(url)) {
        // Show confirmation dialog for external links
        setTimeout(() => {
          Alert.alert(
            "External Link",
            `This will open ${url} in your default browser. Continue?`,
            [
              {
                text: "Cancel",
                style: "cancel",
              },
              {
                text: "Open",
                onPress: async () => {
                  try {
                    const supported = await Linking.canOpenURL(url);
                    if (supported) {
                      await Linking.openURL(url);
                    } else {
                      Alert.alert("Error", "Cannot open this link");
                    }
                  } catch (error) {
                    console.error("Error opening external link:", error);
                    Alert.alert("Error", "Failed to open link");
                  }
                },
              },
            ]
          );
        }, 0);
      } else {
        // Block potentially unsafe external links
        setTimeout(() => {
          Alert.alert(
            "Blocked Link",
            "This link has been blocked for security reasons.",
            [{ text: "OK" }]
          );
        }, 0);
      }
    }

    // Prevent navigation for external links (they're handled above)
    return false;
  }, []);

  // Simple load end handler
  const handleLoadEnd = useCallback(() => {
    setIsInitialLoading(false);
    setLoadingProgress(1);
    setHasLoadedInitially(true);
  }, []);

  // Handle loading progress for better UX
  const handleLoadProgress = useCallback((event: any) => {
    const progress = event.nativeEvent.progress;
    setLoadingProgress(progress);
  }, []);

  // Handle retry function for offline page
  const handleRetry = useCallback(async () => {
    const online = await NetworkService.isOnline();
    if (online) {
      setIsOnline(true);
      if (webViewRef.current) {
        webViewRef.current.reload();
      }
    }
  }, []);

  return (
    <View style={styles.container}>
      {/* Show offline page when offline */}
      {!isOnline ? (
        <OfflinePage onRetry={handleRetry} />
      ) : (
        <>
          {/* Preloader */}
          {preloaderReady && (
            <WebViewPreloader
              isVisible={isInitialLoading}
              loadingText="Loading Portfolio..."
              progressValue={loadingProgress}
            />
          )}

          {/* WebView */}
          {webViewReady && (
            <WebView
              ref={webViewRef}
              source={{ uri: PORTFOLIO_URL }}
              style={styles.webview}
              onLoadStart={handleLoadStart}
              onLoadProgress={handleLoadProgress}
              onLoadEnd={handleLoadEnd}
              onError={handleError}
              onNavigationStateChange={handleNavigationStateChange}
              onShouldStartLoadWithRequest={handleShouldStartLoadWithRequest}
              // WebView configuration for optimal performance and functionality
              javaScriptEnabled={true}
              domStorageEnabled={true}
              startInLoadingState={false} // Disable built-in loading state to prevent default preloader flash
              scalesPageToFit={true}
              allowsBackForwardNavigationGestures={Platform.OS === "ios"}
              bounces={false} // Disable bounces to prevent conflicts with scrolling
              scrollEnabled={true} // Enable WebView scrolling
              // Caching configuration
              cacheEnabled={true}
              incognito={false}
              // Security and compatibility
              mixedContentMode="compatibility"
              allowsInlineMediaPlayback={true}
              mediaPlaybackRequiresUserAction={false}
              // Performance optimizations
              renderToHardwareTextureAndroid={true}
              removeClippedSubviews={true}
              // User agent (optional - can help with mobile optimization)
              userAgent="Mozilla/5.0 (Mobile; rv:42.0) Gecko/42.0 Firefox/42.0"
            />
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9f4e6", // Match the consistent background
  },
  webview: {
    flex: 1,
  },
});
