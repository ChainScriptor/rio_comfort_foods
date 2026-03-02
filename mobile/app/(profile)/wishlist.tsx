import SafeScreen from "@/components/SafeScreen";
import useCart from "@/hooks/useCart";
import useWishlist from "@/hooks/useWishlist";
import { getOptimizedUrl } from "@/lib/utils";
import SearchIcon from "@/assets/icons/SearchIcon.svg";
import HeartIcon from "@/assets/icons/HeartIcon.svg";
import ArrowBackIcon from "@/assets/icons/ArrowBackIcon.svg";
import CloseIcon from "@/assets/icons/CloseIcon.svg";
import TrashIcon from "@/assets/icons/TrashIcon.svg";
import AlertCircleIcon from "@/assets/icons/AlertCircleIcon.svg";
import { Image } from "expo-image";
import { router } from "expo-router";
import { useState, useMemo } from "react";
import { ActivityIndicator, Alert, ScrollView, Text, TouchableOpacity, View, TextInput, Platform } from "react-native";

function WishlistScreen() {
  const { wishlist, isLoading, isError, removeFromWishlist, isRemovingFromWishlist } =
    useWishlist();

  const { addToCart, isAddingToCart } = useCart();
  
  const [searchQuery, setSearchQuery] = useState("");

  // Filter wishlist based on search query
  const filteredWishlist = useMemo(() => {
    if (!wishlist) return [];
    if (!searchQuery.trim()) return wishlist;
    
    return wishlist.filter((item) =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [wishlist, searchQuery]);

  const handleRemoveFromWishlist = (productId: string, productName: string) => {
    // Στο web (PWA) το React Native Alert δεν υποστηρίζει πολλαπλά buttons,
    // οπότε κάνουμε απευθείας confirm μέσω window.confirm.
    if (Platform.OS === "web") {
      // eslint-disable-next-line no-alert
      const confirmed = window.confirm(
        `Αφαίρεση ${productName} από τη λίστα επιθυμιών;`
      );
      if (!confirmed) return;
      removeFromWishlist(productId);
      return;
    }

    // Native (iOS / Android): κλασικό Alert με δύο επιλογές
    Alert.alert(
      "Αφαίρεση από λίστα επιθυμιών",
      `Αφαίρεση ${productName} από τη λίστα επιθυμιών`,
      [
        { text: "Ακύρωση", style: "cancel" },
        {
          text: "Αφαίρεση",
          style: "destructive",
          onPress: () => removeFromWishlist(productId),
        },
      ]
    );
  };

  const handleAddToCart = (productId: string, productName: string, selectedUnit?: string) => {
    addToCart(
      { 
        productId, 
        quantity: 1,
        selectedUnit: selectedUnit || undefined,
      },
      {
        onError: (error: any) => {
          Alert.alert("Σφάλμα", error?.response?.data?.error || "Αποτυχία προσθήκης στο καλάθι");
        },
      }
    );
  };

  if (isLoading) return <LoadingUI />;
  if (isError) return <ErrorUI />;

  return (
    <SafeScreen>
      {/* HEADER */}
      <View className="px-6 pb-5 border-b border-surface flex-row items-center">
        <TouchableOpacity onPress={() => router.back()} className="mr-4">
          <ArrowBackIcon width={28} height={28} stroke="#FFFFFF" color="#FFFFFF" />
        </TouchableOpacity>
        <Text className="text-text-primary text-2xl font-bold">Λίστα Επιθυμιών</Text>
        <Text className="text-text-secondary text-sm ml-auto">
          {wishlist.length} {wishlist.length === 1 ? "προϊόν" : "προϊόντα"}
        </Text>
      </View>

      {/* SEARCH BAR */}
      {wishlist.length > 0 && (
        <View className="px-6 pt-4 pb-2">
          <View className="bg-surface flex-row items-center px-5 py-4 rounded-2xl">
            <SearchIcon width={22} height={22} stroke="#666" color="#666" />
            <TextInput
              placeholder="Αναζήτηση στη λίστα επιθυμιών"
              placeholderTextColor={"#666"}
              className="flex-1 ml-3 text-base text-text-primary"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                onPress={() => setSearchQuery("")}
                className="ml-2"
                activeOpacity={0.7}
              >
                <CloseIcon width={20} height={20} stroke="#666" color="#666" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}

      {wishlist.length === 0 ? (
        <View className="flex-1 items-center justify-center px-6">
          <HeartIcon width={80} height={80} stroke="#666" color="#666" />
          <Text className="text-text-primary font-semibold text-xl mt-4">
            Η λίστα επιθυμιών σας είναι άδεια
          </Text>
          <Text className="text-text-secondary text-center mt-2">
            Ξεκινήστε να προσθέτετε προϊόντα που αγαπάτε!
          </Text>
          <TouchableOpacity
            className="bg-primary rounded-2xl px-8 py-4 mt-6"
            activeOpacity={0.8}
            onPress={() => router.push("/(tabs)")}
          >
            <Text className="text-background font-bold text-base">Περιήγηση Προϊόντων</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
        >
          {filteredWishlist.length === 0 && searchQuery.trim() ? (
            <View className="py-20 items-center justify-center px-6">
              <SearchIcon width={64} height={64} stroke="#666" color="#666" />
              <Text className="text-text-primary font-semibold text-xl mt-4">
                Δεν βρέθηκαν προϊόντα
              </Text>
              <Text className="text-text-secondary text-center mt-2">
                Δοκίμαστε να αλλάξετε τους όρους αναζήτησης
              </Text>
            </View>
          ) : (
            <View className="px-6 py-4">
              {filteredWishlist.map((item) => (
              <TouchableOpacity
                key={item._id}
                className="bg-surface rounded-3xl overflow-hidden mb-3"
                activeOpacity={0.8}
                // onPress={() => router.push(`/product/${item._id}`)}
              >
                <View className="flex-row p-4">
                  <Image
                    source={getOptimizedUrl(item.images[0]) ?? item.images[0]}
                    className="rounded-2xl bg-background-lighter"
                    contentFit="cover"
                    cachePolicy="disk"
                    transition={300}
                    style={{ width: 96, height: 96, borderRadius: 8 }}
                  />

                  <View className="flex-1 ml-4">
                    <Text className="text-text-primary font-bold text-base mb-2" numberOfLines={2}>
                      {item.name}
                    </Text>
                    {item.showPrice !== false && item.price != null && (
                      <Text className="text-primary font-bold text-xl mb-2">
                        ${item.price.toFixed(2)}
                      </Text>
                    )}
                  </View>

                  <TouchableOpacity
                    className="self-start bg-red-500/20 p-2 rounded-full"
                    activeOpacity={0.7}
                    onPress={() => handleRemoveFromWishlist(item._id, item.name)}
                    disabled={isRemovingFromWishlist}
                  >
                    <TrashIcon width={20} height={20} stroke="#EF4444" color="#EF4444" />
                  </TouchableOpacity>
                </View>
                <View className="px-4 pb-4">
                  <TouchableOpacity
                    className="bg-primary rounded-xl py-3 items-center"
                    activeOpacity={0.8}
                    onPress={() => handleAddToCart(item._id, item.name, undefined)}
                    disabled={isAddingToCart}
                  >
                    {isAddingToCart ? (
                      <ActivityIndicator size="small" color="#121212" />
                    ) : (
                      <Text className="text-background font-bold">Προσθήκη στο Καλάθι</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
              ))}
            </View>
          )}
        </ScrollView>
      )}
    </SafeScreen>
  );
}
export default WishlistScreen;

function LoadingUI() {
  return (
    <SafeScreen>
      <View className="px-6 pb-5 border-b border-surface flex-row items-center">
        <TouchableOpacity onPress={() => router.back()} className="mr-4">
          <ArrowBackIcon width={28} height={28} stroke="#FFFFFF" color="#FFFFFF" />
        </TouchableOpacity>
        <Text className="text-text-primary text-2xl font-bold">Λίστα Επιθυμιών</Text>
      </View>
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color="#FFD700" />
        <Text className="text-text-secondary mt-4">Φόρτωση λίστας επιθυμιών...</Text>
      </View>
    </SafeScreen>
  );
}

function ErrorUI() {
  return (
    <SafeScreen>
      <View className="px-6 pb-5 border-b border-surface flex-row items-center">
        <TouchableOpacity onPress={() => router.back()} className="mr-4">
          <ArrowBackIcon width={28} height={28} stroke="#fff" color="#fff" />
        </TouchableOpacity>
        <Text className="text-text-primary text-2xl font-bold">Λίστα Επιθυμιών</Text>
      </View>
      <View className="flex-1 items-center justify-center px-6">
        <AlertCircleIcon width={64} height={64} stroke="#FF6B6B" color="#FF6B6B" />
        <Text className="text-text-primary font-semibold text-xl mt-4">
          Αποτυχία φόρτωσης λίστας επιθυμιών
        </Text>
        <Text className="text-text-secondary text-center mt-2">
          Παρακαλώ ελέγξτε τη σύνδεσή σας και δοκιμάστε ξανά
        </Text>
      </View>
    </SafeScreen>
  );
}
