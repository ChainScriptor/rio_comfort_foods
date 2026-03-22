import { ClerkLoaded, useAuth } from "@clerk/clerk-expo";
import { AuthenticateWithRedirectCallback } from "@clerk/clerk-react";
import { useRouter } from "expo-router";
import { useEffect, useRef } from "react";
import { View, Text, ActivityIndicator, Platform } from "react-native";

const BG = "#121212";
const ACCENT = "#FFD700";
const TEXT_PRIMARY = "#ffffff";
const TEXT_MUTED = "#9ca3af";

/** Safe to render on web static builds where the export can be missing. */
const RedirectCallbackComponent =
  typeof AuthenticateWithRedirectCallback === "function"
    ? AuthenticateWithRedirectCallback
    : null;

/**
 * SSO callback after OAuth / social redirect (κυρίως Web PWA).
 */
export default function SSOCallbackScreen() {
  const { isSignedIn, isLoaded } = useAuth();
  const router = useRouter();
  const hasRedirected = useRef(false);

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;
    if (hasRedirected.current) return;
    hasRedirected.current = true;

    if (Platform.OS === "web" && typeof window !== "undefined") {
      window.location.replace("/");
      return;
    }

    router.replace("/(tabs)" as never);
  }, [isLoaded, isSignedIn, router]);

  if (Platform.OS === "web") {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: BG,
          paddingHorizontal: 24,
        }}
      >
        <ClerkLoaded>
          {RedirectCallbackComponent ? <RedirectCallbackComponent /> : null}
          <ActivityIndicator size="large" color={ACCENT} style={{ marginTop: 24 }} />
          <Text
            style={{
              color: TEXT_PRIMARY,
              marginTop: 16,
              fontSize: 16,
              fontWeight: "600",
              textAlign: "center",
            }}
          >
            Ολοκλήρωση σύνδεσης...
          </Text>
          <Text
            style={{
              color: TEXT_MUTED,
              marginTop: 8,
              fontSize: 13,
              textAlign: "center",
            }}
          >
            Παρακαλώ περιμένετε
          </Text>
        </ClerkLoaded>
      </View>
    );
  }

  return null;
}
