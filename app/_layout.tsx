import { Stack } from "expo-router";
import "../global.css";
import { MutationCache, QueryCache, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ClerkProvider } from "@clerk/clerk-expo";
import { tokenCache } from "@clerk/clerk-expo/token-cache";
import * as Sentry from "@sentry/react-native";
import { View, Text, Platform } from "react-native";

// Prevent expo-font's 6000ms timeout (FontFaceObserver on web) from crashing the app.
// Fonts will fall back to system; the app continues to run.
if (typeof window !== "undefined") {
  window.addEventListener("unhandledrejection", (event) => {
    const msg = event.reason?.message ?? "";
    if (typeof msg === "string" && msg.includes("timeout exceeded")) {
      event.preventDefault();
      event.stopPropagation();
      console.warn("[expo-font] Font load timed out, using fallback fonts:", msg);
    }
  });
}

// Get Clerk publishable key from environment variables
const CLERK_PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;

if (!CLERK_PUBLISHABLE_KEY) {
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

export default Sentry.wrap(function RootLayout() {
  if (!CLERK_PUBLISHABLE_KEY) {
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

  const content = (
    <Stack screenOptions={{ headerShown: false }} />
  );

  return (
    <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY} tokenCache={tokenCache}>
      <QueryClientProvider client={queryClient}>
        {Platform.OS === "web" ? (
          <View
            style={{
              flex: 1,
              maxWidth: 500,
              width: "100%",
              alignSelf: "center",
              backgroundColor: "#121212",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 12,
              borderLeftWidth: 1,
              borderRightWidth: 1,
              borderColor: "rgba(255,255,255,0.06)",
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
