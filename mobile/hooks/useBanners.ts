import { useQuery } from "@tanstack/react-query";
import axios from "axios";

export interface Banner {
  _id: string;
  imageUrl: string;
  linkUrl?: string;
  order: number;
}

// Public endpoint - no auth required
const API_URL = "https://riocomfortfoods-production.up.railway.app/api";

const useBanners = () => {
  const result = useQuery({
    queryKey: ["banners"],
    queryFn: async () => {
      try {
        const { data } = await axios.get<Banner[]>(`${API_URL}/products/banners`);
        return data || [];
      } catch (error) {
        // Silently fail - if there's an error, just return empty array
        // This way the app won't break if backend is down or banners endpoint fails
        console.warn("Failed to fetch banners:", error);
        return [];
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1, // Only retry once
    retryOnMount: false, // Don't retry on mount if it failed
  });

  return result;
};

export default useBanners;
