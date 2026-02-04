import { useAuth } from "@clerk/clerk-expo";
import axios from "axios";
import { useEffect } from "react";
import * as SecureStore from "expo-secure-store";

// Production API URL
const API_URL = "https://riocomfortfoodsapi-yelm3.sevalla.app/api";

// For local development (uncomment to use)
// For physical device: use your computer's local IP
// For simulator/emulator: use "http://localhost:3000/api"
// const API_URL = "http://192.168.1.13:3000/api";

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000, // 30 seconds timeout
});

export const useApi = () => {
  const { getToken, isSignedIn } = useAuth();

  useEffect(() => {
    const interceptor = api.interceptors.request.use(async (config) => {
      // Try to get Clerk token first (for social auth users)
      let token: string | null = null;
      
      try {
        if (isSignedIn) {
          token = await getToken();
        }
      } catch (error) {
        // If Clerk token fails, try JWT token
        console.log("Clerk token not available, trying JWT token");
      }

      // If no Clerk token, try to get JWT token from SecureStore (for username/password login)
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

    // cleanup: remove interceptor when component unmounts
    return () => {
      api.interceptors.request.eject(interceptor);
    };
  }, [getToken, isSignedIn]);

  return api;
};

// on every single req, we would like have an auth token so that our backend knows that we're authenticated
// we're including the auth token under the auth headers
