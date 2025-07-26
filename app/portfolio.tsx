import { useFocusEffect } from "@react-navigation/native";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  BackHandler,
  Linking,
  Platform,
  StyleSheet,
  Text,
  View
} from "react-native";
import { WebView, WebViewNavigation } from "react-native-webview";
import { CacheManager } from "../services/CacheManager";
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
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [canGoBack, setCanGoBack] = useState(false);
  const [canGoForward, setCanGoForward] = useState(false);
  const [currentUrl, setCurrentUrl] = useState(PORTFOLIO_URL);
  const [isOnline, setIsOnline] = useState(true);
  const [showOfflineMessage, setShowOfflineMessage] = useState(false);
  const [webViewSource, setWebViewSource] = useState({ uri: PORTFOLIO_URL });
  const webViewRef = useRef<WebView>(null);

  // Handle offline loading by serving cached content
  const handleOfflineLoad = useCallback(async () => {
    try {
      const cachedContent = await CacheManager.getCachedResource(PORTFOLIO_URL);
      if (cachedContent) {
        // Create a data URI with the cached content
        const dataUri = `data:text/html;charset=utf-8,${encodeURIComponent(
          cachedContent
        )}`;
        setWebViewSource({ uri: dataUri });
        setShowOfflineMessage(true);
      } else {
        setShowOfflineMessage(true);
      }
    } catch (error) {
      console.error("Error loading cached content:", error);
      setShowOfflineMessage(true);
    }
  }, []);

  // Monitor network connectivity
  useEffect(() => {
    const checkInitialConnectivity = async () => {
      const online = await NetworkService.isOnline();
      setIsOnline(online);

      // If offline on initial load, try to load from cache
      if (!online) {
        await handleOfflineLoad();
      }
    };

    checkInitialConnectivity();

    const unsubscribe = NetworkService.addNetworkListener(
      async (networkState) => {
        const online =
          networkState.isConnected &&
          networkState.isInternetReachable !== false;
        const wasOnline = isOnline;
        setIsOnline(online);

        if (!online && wasOnline) {
          // Just went offline
          setShowOfflineMessage(true);
        } else if (online && !wasOnline) {
          // Just came back online
          setShowOfflineMessage(false);
          setWebViewSource({ uri: PORTFOLIO_URL });
        }
      }
    );

    return unsubscribe;
  }, [isOnline, handleOfflineLoad]);

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
    // Removed loading state for Next.js app compatibility
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
    setRefreshing(false);
  };

  const handleNavigationStateChange = (navState: WebViewNavigation) => {
    setCanGoBack(navState.canGoBack);
    setCanGoForward(navState.canGoForward);
    setCurrentUrl(navState.url);
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

  // Enhanced load end handler with caching
  const handleLoadEndWithCaching = useCallback(
    async (syntheticEvent: any) => {
      const { nativeEvent } = syntheticEvent;
      setRefreshing(false);

      // Cache the loaded page if online
      if (
        isOnline &&
        nativeEvent.url &&
        nativeEvent.url.includes("umar.is-a.dev")
      ) {
        try {
          // Inject JavaScript to get page content for caching
          const injectedJS = `
          (function() {
            try {
              const content = document.documentElement.outerHTML;
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'pageContent',
                url: window.location.href,
                content: content
              }));
            } catch (error) {
              console.error('Error getting page content:', error);
            }
          })();
        `;

          if (webViewRef.current) {
            webViewRef.current.injectJavaScript(injectedJS);
          }
        } catch (error) {
          console.error("Error injecting caching script:", error);
        }
      }
    },
    [isOnline]
  );

  // Handle messages from WebView (including page content for caching)
  const handleMessage = useCallback(
    async (event: any) => {
      try {
        const data = JSON.parse(event.nativeEvent.data);

        if (data.type === "pageContent" && isOnline) {
          // Cache the page content
          await CacheManager.cacheResource(data.url, data.content, "text/html");
        }
      } catch (error) {
        console.error("Error handling WebView message:", error);
      }
    },
    [isOnline]
  );

  // Enhanced refresh handler with cache fallback
  const handleRefreshWithCache = useCallback(async () => {
    setRefreshing(true);

    if (!isOnline) {
      // Try to load from cache when offline
      await handleOfflineLoad();
      setRefreshing(false);
    } else {
      // Normal refresh when online - reset to original URL
      setWebViewSource({ uri: PORTFOLIO_URL });
      if (webViewRef.current) {
        webViewRef.current.reload();
      }
    }
  }, [isOnline, handleOfflineLoad]);

  return (
    <View style={styles.container}>
      {/* Offline message */}
      {showOfflineMessage && (
        <View style={styles.offlineContainer}>
          <Text style={styles.offlineText}>
            You&apos;re offline. Showing cached content when available.
          </Text>
        </View>
      )}

      {/* WebView without pull-to-refresh wrapper */}
      <WebView
        ref={webViewRef}
        source={webViewSource}
        style={styles.webview}
        onLoadStart={handleLoadStart}
        onLoadEnd={handleLoadEndWithCaching}
        onError={handleError}
        onNavigationStateChange={handleNavigationStateChange}
        onShouldStartLoadWithRequest={handleShouldStartLoadWithRequest}
        onMessage={handleMessage}
        // WebView configuration for optimal performance and functionality
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={false} // We handle loading state manually
        scalesPageToFit={true}
        allowsBackForwardNavigationGestures={Platform.OS === "ios"}
        bounces={true} // Enable bounces for natural scrolling feel
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },

  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    flex: 1,
  },
  webview: {
    flex: 1,
  },
  offlineContainer: {
    position: "absolute",
    top: Platform.OS === "ios" ? 44 : 0, // Position below status bar only
    left: 0,
    right: 0,
    backgroundColor: "#FF9500",
    paddingVertical: 8,
    paddingHorizontal: 16,
    zIndex: 2,
  },
  offlineText: {
    color: "#FFFFFF",
    fontSize: 14,
    textAlign: "center",
    fontWeight: "500",
  },
});
