import { useApi } from "@/lib/api";
import { Product } from "@/types";
import { useQuery } from "@tanstack/react-query";

const useProducts = () => {
  const api = useApi();

  const result = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      // Ensure trailing slash for consistency
      const { data } = await api.get<Product[]>("/products/");
      return data;
    },
    // Κρατάμε τα δεδομένα “ζωντανά” ώστε νέα προϊόντα να εμφανίζονται χωρίς refresh
    staleTime: 0, // τα δεδομένα γίνονται αμέσως stale
    refetchOnWindowFocus: true, // όταν επανέρχεται το PWA στο προσκήνιο
    refetchOnReconnect: true,
    refetchInterval: 15 * 1000, // κάθε 15s ελέγχουμε για νέα προϊόντα
    refetchIntervalInBackground: false,
  });

  return result;
};

export default useProducts;
