import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useApi } from "@/lib/api";
import { Product } from "@/types";
import { useState, useCallback } from "react";
import { Alert } from "react-native";

const useWishlist = () => {
  const api = useApi();
  const queryClient = useQueryClient();
  const [pendingAdditions, setPendingAdditions] = useState<Set<string>>(new Set());
  const [pendingRemovals, setPendingRemovals] = useState<Set<string>>(new Set());

  const {
    data: wishlist,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["wishlist"],
    queryFn: async () => {
      const { data } = await api.get<{ wishlist: Product[] }>("/users/wishlist");
      return data.wishlist;
    },
    // Enable refetch on window focus to keep data fresh
    refetchOnWindowFocus: true,
  });

  const addToWishlistMutation = useMutation({
    mutationFn: async (productId: string) => {
      const { data } = await api.post<{ wishlist: string[] }>("/users/wishlist", { productId });
      return data.wishlist;
    },
    onMutate: async (productId: string) => {
      // Immediately mark as pending addition for instant UI update
      setPendingAdditions((prev) => new Set(prev).add(productId));
      setPendingRemovals((prev) => {
        const next = new Set(prev);
        next.delete(productId);
        return next;
      });

      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["wishlist"] });

      // Snapshot the previous value
      const previousWishlist = queryClient.getQueryData<Product[]>(["wishlist"]);

      // Try to get the product from products cache
      const productsCache = queryClient.getQueryData<Product[]>(["products"]);
      const product = productsCache?.find((p) => p._id === productId);

      // Optimistically add the product to wishlist
      queryClient.setQueryData<Product[]>(["wishlist"], (old = []) => {
        // If product is already in wishlist, don't add it again
        if (old.some((p) => p._id === productId)) {
          return old;
        }
        // If we have the product object, add it, otherwise add a placeholder
        if (product) {
          return [...old, product];
        } else {
          // Create a minimal placeholder product
          return [...old, { _id: productId } as Product];
        }
      });

      return { previousWishlist };
    },
    onError: (err, productId, context) => {
      Alert.alert(
        "Σφάλμα",
        "Δεν ήταν δυνατή η προσθήκη του προϊόντος στη λίστα επιθυμιών. Προσπαθήστε ξανά."
      );
      // Remove from pending additions on error
      setPendingAdditions((prev) => {
        const next = new Set(prev);
        next.delete(productId);
        return next;
      });
      // Rollback to the previous value on error
      if (context?.previousWishlist) {
        queryClient.setQueryData(["wishlist"], context.previousWishlist);
      }
    },
    onSuccess: (data, productId) => {
      // Remove from pending additions on success
      setPendingAdditions((prev) => {
        const next = new Set(prev);
        next.delete(productId);
        return next;
      });
      // Refetch to get the actual data from server
      queryClient.invalidateQueries({ queryKey: ["wishlist"] });
      // Also refresh products so τα εικονίδια καρδιάς συγχρονίζονται παντού
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });

  const removeFromWishlistMutation = useMutation({
    mutationFn: async (productId: string) => {
      const { data } = await api.delete<{ wishlist: string[] }>(`/users/wishlist/${productId}`);
      return data.wishlist;
    },
    onMutate: async (productId: string) => {
      // Immediately mark as pending removal for instant UI update
      setPendingRemovals((prev) => new Set(prev).add(productId));
      setPendingAdditions((prev) => {
        const next = new Set(prev);
        next.delete(productId);
        return next;
      });

      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["wishlist"] });

      // Snapshot the previous value
      const previousWishlist = queryClient.getQueryData<Product[]>(["wishlist"]);

      // Optimistically remove the product
      queryClient.setQueryData<Product[]>(["wishlist"], (old = []) => {
        return old.filter((p) => p._id !== productId);
      });

      return { previousWishlist };
    },
    onError: (err, productId, context) => {
      Alert.alert(
        "Σφάλμα",
        "Δεν ήταν δυνατή η αφαίρεση του προϊόντος από τη λίστα επιθυμιών. Προσπαθήστε ξανά."
      );
      // Remove from pending removals on error
      setPendingRemovals((prev) => {
        const next = new Set(prev);
        next.delete(productId);
        return next;
      });
      // Rollback to the previous value on error
      if (context?.previousWishlist) {
        queryClient.setQueryData(["wishlist"], context.previousWishlist);
      }
    },
    onSuccess: (data, productId) => {
      // Remove from pending removals on success
      setPendingRemovals((prev) => {
        const next = new Set(prev);
        next.delete(productId);
        return next;
      });
      queryClient.invalidateQueries({ queryKey: ["wishlist"] });
      // Ενημέρωσε και τα products ώστε να φύγει αυτόματα η καρδιά από την αρχική
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });

  const isInWishlist = useCallback((productId: string) => {
    // Check pending state first for instant UI updates
    if (pendingAdditions.has(productId)) {
      return true;
    }
    if (pendingRemovals.has(productId)) {
      return false;
    }
    // Then check the actual wishlist data
    return wishlist?.some((product) => product._id === productId) ?? false;
  }, [wishlist, pendingAdditions, pendingRemovals]);

  const toggleWishlist = (productId: string) => {
    if (isInWishlist(productId)) {
      removeFromWishlistMutation.mutate(productId);
    } else {
      addToWishlistMutation.mutate(productId);
    }
  };

  return {
    wishlist: wishlist || [],
    isLoading,
    isError,
    wishlistCount: wishlist?.length || 0,
    isInWishlist,
    toggleWishlist,
    addToWishlist: addToWishlistMutation.mutate,
    removeFromWishlist: removeFromWishlistMutation.mutate,
    isAddingToWishlist: addToWishlistMutation.isPending,
    isRemovingFromWishlist: removeFromWishlistMutation.isPending,
  };
};

export default useWishlist;
