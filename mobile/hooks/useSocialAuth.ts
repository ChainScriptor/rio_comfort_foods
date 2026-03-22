import { useSignIn, useSSO } from "@clerk/clerk-expo";
import { useEffect, useState } from "react";
import { Alert, Platform } from "react-native";
import * as WebBrowser from "expo-web-browser";
import * as AuthSession from "expo-auth-session";

// Base URL for PWA (Clerk OAuth redirect flow). Override with EXPO_PUBLIC_APP_URL if needed.
const PWA_BASE_URL =
  typeof process !== "undefined" && process.env?.EXPO_PUBLIC_APP_URL
    ? process.env.EXPO_PUBLIC_APP_URL.replace(/\/$/, "")
    : "https://www.comfortfoods.store";

// Handle any pending authentication sessions (needed for web/PWA + native)
WebBrowser.maybeCompleteAuthSession();

// Preload browser on Android for smoother auth experience
function useWarmUpBrowser() {
  useEffect(() => {
    if (Platform.OS !== "android") return;

    WebBrowser.warmUpAsync();
    return () => {
      WebBrowser.coolDownAsync();
    };
  }, []);
}

function useSocialAuth() {
  useWarmUpBrowser();
  const [loadingStrategy, setLoadingStrategy] = useState<string | null>(null);
  const { signIn, isLoaded: isSignInLoaded } = useSignIn();
  const { startSSOFlow } = useSSO();

  const handleSocialAuth = async (strategy: "oauth_google" | "oauth_apple") => {
    setLoadingStrategy(strategy);

    try {
      // Web/PWA: full-page redirect (no popup) — avoids mobile popup blockers
      if (Platform.OS === "web") {
        if (!isSignInLoaded || !signIn) {
          setLoadingStrategy(null);
          return;
        }
        await signIn.authenticateWithRedirect({
          strategy,
          redirectUrl: `${PWA_BASE_URL}/sso-callback`,
          redirectUrlComplete: `${PWA_BASE_URL}/`,
        });
        // Page will redirect; loading state will unmount
        return;
      }

      // Native (iOS/Android): in-app browser flow
      const redirectUrl = AuthSession.makeRedirectUri({
        scheme: "mobile",
        path: "sso-callback",
      });

      const { createdSessionId, setActive } = await startSSOFlow({
        strategy,
        redirectUrl,
      });

      if (createdSessionId && setActive) {
        await setActive({ session: createdSessionId });
      }
    } catch (error) {
      console.error("💥 Error in social auth:", JSON.stringify(error, null, 2));
      const provider = strategy === "oauth_google" ? "Google" : "Apple";
      Alert.alert("Error", `Failed to sign in with ${provider}. Please try again.`);
    } finally {
      setLoadingStrategy(null);
    }
  };

  return { loadingStrategy, handleSocialAuth };
}

export default useSocialAuth;
