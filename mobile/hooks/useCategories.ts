import { useApi } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";

export interface Category {
  _id: string;
  name: string;
  icon?: string;
  image?: string;
  order?: number;
}

const useCategories = () => {
  const api = useApi();

  const result = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      try {
        const { data } = await api.get<Category[]>("/products/categories");
        return data;
      } catch (error: any) {
        console.error("❌ Error fetching categories:", error);
        console.error("Response:", error?.response?.data);
        console.error("Status:", error?.response?.status);
        throw error;
      }
    },
    // Θέλουμε η σειρά/λίστα κατηγοριών να ανανεώνεται αυτόματα όταν αλλάζει ο admin
    staleTime: 0, // αμέσως stale
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    refetchInterval: 15 * 1000, // κάθε 15s για αλλαγές σε σειρά/νέες κατηγορίες
    refetchIntervalInBackground: false,
    retry: 2,
  });

  return result;
};

export default useCategories;

