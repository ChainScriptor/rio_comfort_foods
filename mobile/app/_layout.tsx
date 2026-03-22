import { Stack } from "expo-router";
import "../global.css";
import { MutationCache, QueryCache, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ClerkProvider } from "@clerk/clerk-expo";
import { tokenCache } from "@clerk/clerk-expo/token-cache";
import * as Sentry from "@sentry/react-native";
import { View, Text, Platform, TouchableOpacity } from "react-native";
import { useState, useEffect } from "react";

// Prevent expo-font's 6000ms timeout (FontFaceObserver on web) from crashing the app.
if (typeof window !== "undefined") {
  window.addEventListener("unhandledrejection", (event) => {
    const msg = String(event.reason?.message ?? "");
    if (msg.includes("timeout exceeded")) {
      event.preventDefault();
      event.stopPropagation();
      console.warn("[expo-font] Font load timed out, using fallback fonts:", msg);
    }
    if (msg.includes("failed_to_load_clerk") || msg.includes("ClerkRuntimeError")) {
      event.preventDefault();
      event.stopPropagation();
      window.dispatchEvent(new CustomEvent("clerk-load-error", { detail: event.reason }));
    }
  });
}

// Clerk publishable key — only from process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY (inlined by Expo at build)
const clerkPublishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY?.trim() ?? "";

if (!clerkPublishableKey) {
  console.error("Missing EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY environment variable");
}

Sentry.init({
  dsn: "https://fb6731b90610cc08333e6c16ffac5724@o4509813037137920.ingest.de.sentry.io/4510451611205712",

  // Adds more context data to events (IP address, cookies, user, etc.)
  // For more information, visit: https://docs.sentry.io/platforms/react-native/data-management/data-collected/
  sendDefaultPii: true,

  // Enable Logs
  enableLogs: true,

  // Configure Session Replay
  replaysSessionSampleRate: 1.0,
  replaysOnErrorSampleRate: 1,
  integrations: [Sentry.mobileReplayIntegration()],

  // uncomment the line below to enable Spotlight (https://spotlightjs.com)
  // spotlight: __DEV__,
});

const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error: any, query) => {
      Sentry.captureException(error, {
        tags: {
          type: "react-query-error",
          queryKey: query.queryKey[0]?.toString() || "unknon",
        },
        extra: {
          errorMessage: error.message,
          statusCode: error.response?.status,
          queryKey: query.queryKey,
        },
      });
    },
  }),
  mutationCache: new MutationCache({
    onError: (error: any) => {
      // global error handler for all mutations
      Sentry.captureException(error, {
        tags: { type: "react-query-mutation-error" },
        extra: {
          errorMessage: error.message,
          statusCode: error.response?.status,
        },
      });
    },
  }),
});

function ClerkLoadErrorFallback({ onRetry }: { onRetry: () => void }) {
  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 24, backgroundColor: "#121212" }}>
      <Text style={{ color: "#fff", fontSize: 18, fontWeight: "bold", marginBottom: 12, textAlign: "center" }}>
        Δεν φορτώθηκε το Clerk
      </Text>
      <Text style={{ color: "#999", fontSize: 14, textAlign: "center", marginBottom: 8 }}>
        Ελέγξτε σύνδεση στο internet, απενεργοποιήστε ad blocker και δοκιμάστε ξανά.
      </Text>
      <Text style={{ color: "#666", fontSize: 12, textAlign: "center", marginBottom: 24 }}>
        Σφάλμα: failed_to_load_clerk_js_timeout
      </Text>
      <TouchableOpacity
        onPress={onRetry}
        style={{ backgroundColor: "#FFD700", paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 }}
      >
        <Text style={{ color: "#121212", fontWeight: "bold" }}>Ξαναφόρτωση</Text>
      </TouchableOpacity>
    </View>
  );
}

export default Sentry.wrap(function RootLayout() {
  const [clerkLoadError, setClerkLoadError] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handler = () => setClerkLoadError(true);
    window.addEventListener("clerk-load-error", handler);
    return () => window.removeEventListener("clerk-load-error", handler);
  }, []);

  const handleClerkRetry = () => {
    setClerkLoadError(false);
    if (typeof window !== "undefined") window.location.reload();
  };

  if (!clerkPublishableKey) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 20, backgroundColor: "#000" }}>
        <Text style={{ color: "#ef4444", fontSize: 18, fontWeight: "bold", marginBottom: 10, textAlign: "center" }}>
          Σφάλμα Ρύθμισης
        </Text>
        <Text style={{ color: "#fff", fontSize: 14, textAlign: "center" }}>
          Το EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY δεν έχει οριστεί.
        </Text>
        <Text style={{ color: "#888", fontSize: 12, textAlign: "center", marginTop: 10 }}>
          Παρακαλώ ελέγξτε το .env file.
        </Text>
      </View>
    );
  }

  if (clerkLoadError) {
    return <ClerkLoadErrorFallback onRetry={handleClerkRetry} />;
  }

  const content = (
    <Stack screenOptions={{ headerShown: false }} />
  );

  return (
    <ClerkProvider publishableKey={clerkPublishableKey} tokenCache={tokenCache}>
      <QueryClientProvider client={queryClient}>
        {Platform.OS === "web" ? (
          <View
            style={{
              flex: 1,
              width: "100%",
              backgroundColor: "#121212",
            }}
          >
            {content}
          </View>
        ) : (
          content
        )}
      </QueryClientProvider>
    </ClerkProvider>
  );
});
