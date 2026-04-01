import { useAuth } from "@clerk/clerk-expo";
import axios from "axios";
import { useEffect } from "react";
import * as SecureStore from "expo-secure-store";

/** * Επιστρέφει τη βασική διεύθυνση του API.
 * Χρησιμοποιεί την EXPO_PUBLIC_API_URL αν υπάρχει, αλλιώς το production URL με www.
 */
export function getExpoApiBaseUrl(): string {
  const raw = process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, "") || "https://www.comfortfoods.store/api";
  
  // Διασφαλίζουμε ότι το URL τελειώνει σε /api
  return raw.endsWith("/api") ? raw : `${raw}/api`;
}

// Μία και μοναδική δήλωση του BASE_URL
const BASE_URL = getExpoApiBaseUrl();

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000, // 30 δευτερόλεπτα timeout
});

export const useApi = () => {
  const { getToken, isSignedIn } = useAuth();

  useEffect(() => {
    const interceptor = api.interceptors.request.use(async (config) => {
      let token: string | null = null;
      
      try {
        // 1. Προσπάθεια λήψης Clerk Token (για social login)
        if (isSignedIn) {
          token = await getToken();
        }
      } catch (error) {
        console.log("Clerk token not available, trying JWT token");
      }

      // 2. Αν δεν υπάρχει Clerk token, έλεγχος στο SecureStore (για email/password login)
      if (!token) {
        try {
          const jwtToken = await SecureStore.getItemAsync("auth_token");
          if (jwtToken) {
            token = jwtToken;
          }
        } catch (error) {
          console.log("JWT token not available");
        }
      }

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      return config;
    });

    // Καθαρισμός interceptor κατά το unmount
    return () => {
      api.interceptors.request.eject(interceptor);
    };
  }, [getToken, isSignedIn]);

  return api;
};

export default api;