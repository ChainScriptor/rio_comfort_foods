import { useApi } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";

export interface Category {
  _id: string;
  name: string;
  icon?: string;
  image?: string;
}

const useCategories = () => {
  const api = useApi();

  const result = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      try {
        const { data } = await api.get<Category[]>("/products/categories");
        console.log("📦 Categories loaded:", data);
        return data;
      } catch (error: any) {
        console.error("❌ Error fetching categories:", error);
        console.error("Response:", error?.response?.data);
        console.error("Status:", error?.response?.status);
        throw error;
      }
    },
    retry: 2,
  });

  return result;
};

export default useCategories;

