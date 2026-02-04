import { AuthenticateWithRedirectCallback } from "@clerk/clerk-react";
import { useAuth } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import { useEffect } from "react";
import { View, Text, ActivityIndicator, Platform } from "react-native";

/**
 * SSO callback route for Clerk OAuth (Google, Apple, etc.).
 * Handles the redirect after the user signs in with a provider on Web.
 * On native, startSSOFlow typically doesn't redirect to this URL; this is mainly for web.
 */
export default function SSOCallbackScreen() {
  const { isSignedIn, isLoaded } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoaded) return;
    if (isSignedIn) {
      router.replace("/(tabs)" as any);
    }
  }, [isLoaded, isSignedIn, router]);

  // Only run the redirect callback on web (OAuth redirect flow)
  if (Platform.OS === "web") {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#121212" }}>
        <AuthenticateWithRedirectCallback />
        <ActivityIndicator size="large" color="#FFD700" style={{ marginTop: 24 }} />
        <Text style={{ color: "#fff", marginTop: 12 }}>Ολοκλήρωση σύνδεσης...</Text>
      </View>
    );
  }

  // On native, if we land here by mistake, redirect to auth
  return null;
}
