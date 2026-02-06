import { useSSO } from "@clerk/clerk-expo";
import { useEffect, useState } from "react";
import { Alert, Platform } from "react-native";
import * as WebBrowser from "expo-web-browser";
import * as AuthSession from "expo-auth-session";

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
  const { startSSOFlow } = useSSO();

  const handleSocialAuth = async (strategy: "oauth_google" | "oauth_apple") => {
    setLoadingStrategy(strategy);

    try {
      // Use an explicit redirect URL so that:
      // - On web/PWA it redirects back to https://<domain>/sso-callback
      // - On native it uses the custom app scheme (see app.json "scheme")
      const redirectUrl = AuthSession.makeRedirectUri({
        scheme: Platform.OS === "web" ? undefined : "mobile",
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
