import { useQuery } from "@tanstack/react-query";
import { useApi } from "@/lib/api";

export const useProfile = () => {
  const api = useApi();

  return useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const { data } = await api.get("/users/profile");
      return data.user;
    },
  });
};
