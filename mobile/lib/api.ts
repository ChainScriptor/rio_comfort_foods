import { useAuth } from "@clerk/clerk-expo";
import axios from "axios";
import { useEffect } from "react";
import * as SecureStore from "expo-secure-store";

export function getExpoApiBaseUrl(): string {
  const raw = process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, "") || "https://www.comfortfoods.store/api";
  return raw.endsWith("/api") ? raw : `${raw}/api`;
}

const BASE_URL = getExpoApiBaseUrl();

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000,
});

export const useApi = () => {
  const { getToken, isSignedIn } = useAuth();

  useEffect(() => {
    const interceptor = api.interceptors.request.use(async (config) => {
      let token: string | null = null;
      try {
        if (isSignedIn) {
          token = await getToken();
        }
      } catch (error) {
        console.log("Clerk token error");
      }

      if (!token) {
        try {
          const jwtToken = await SecureStore.getItemAsync("auth_token");
          if (jwtToken) {
            token = jwtToken;
          }
        } catch (error) {
          console.log("JWT token error");
        }
      }

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    return () => {
      api.interceptors.request.eject(interceptor);
    };
  }, [getToken, isSignedIn]);

  return api;
};

export default api;