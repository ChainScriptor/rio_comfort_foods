import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { getExpoApiBaseUrl } from "@/lib/api";

export interface Banner {
  _id: string;
  imageUrl: string;
  linkUrl?: string;
  order: number;
}

const useBanners = () => {
  const result = useQuery({
    queryKey: ["banners"],
    queryFn: async () => {
      try {
        const apiBase = getExpoApiBaseUrl();
        const { data } = await axios.get<Banner[]>(`${apiBase}/products/banners`);
        return data || [];
      } catch (error) {
        // Silently fail - if there's an error, just return empty array
        // This way the app won't break if backend is down or banners endpoint fails
        console.warn("Failed to fetch banners:", error);
        return [];
      }
    },
    // Θέλουμε τα banners να ανανεώνονται χωρίς χειροκίνητο refresh
    staleTime: 0, // τα δεδομένα γίνονται αμέσως stale
    refetchOnWindowFocus: true, // όταν επανέρχεται το PWA στο προσκήνιο
    refetchOnReconnect: true,
    refetchInterval: 15 * 1000, // κάθε 15s ελέγχουμε για νέες αλλαγές
    refetchIntervalInBackground: false,
    retry: 1, // Only retry once
    retryOnMount: false, // Don't retry on mount if it failed
  });

  return result;
};

export default useBanners;
