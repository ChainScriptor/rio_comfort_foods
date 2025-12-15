import SafeScreen from "@/components/SafeScreen";
import useCart from "@/hooks/useCart";
import useWishlist from "@/hooks/useWishlist";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router } from "expo-router";
import { ActivityIndicator, Alert, ScrollView, Text, TouchableOpacity, View } from "react-native";

function WishlistScreen() {
  const { wishlist, isLoading, isError, removeFromWishlist, isRemovingFromWishlist } =
    useWishlist();

  const { addToCart, isAddingToCart } = useCart();

  const handleRemoveFromWishlist = (productId: string, productName: string) => {
    Alert.alert("Αφαίρεση από λίστα επιθυμιών", `Αφαίρεση ${productName} από τη λίστα επιθυμιών`, [
      { text: "Ακύρωση", style: "cancel" },
      {
        text: "Αφαίρεση",
        style: "destructive",

        onPress: () => removeFromWishlist(productId),
      },
    ]);
  };

  const handleAddToCart = (productId: string, productName: string) => {
    addToCart(
      { productId, quantity: 1 },
      {
        onSuccess: () => Alert.alert("Επιτυχία", `${productName} προστέθηκε στο καλάθι!`),
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
          <Ionicons name="arrow-back" size={28} color="#FFFFFF" />
        </TouchableOpacity>
        <Text className="text-text-primary text-2xl font-bold">Λίστα Επιθυμιών</Text>
        <Text className="text-text-secondary text-sm ml-auto">
          {wishlist.length} {wishlist.length === 1 ? "προϊόν" : "προϊόντα"}
        </Text>
      </View>

      {wishlist.length === 0 ? (
        <View className="flex-1 items-center justify-center px-6">
          <Ionicons name="heart-outline" size={80} color="#666" />
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
          <View className="px-6 py-4">
            {wishlist.map((item) => (
              <TouchableOpacity
                key={item._id}
                className="bg-surface rounded-3xl overflow-hidden mb-3"
                activeOpacity={0.8}
                // onPress={() => router.push(`/product/${item._id}`)}
              >
                <View className="flex-row p-4">
                  <Image
                    source={item.images[0]}
                    className="rounded-2xl bg-background-lighter"
                    style={{ width: 96, height: 96, borderRadius: 8 }}
                  />

                  <View className="flex-1 ml-4">
                    <Text className="text-text-primary font-bold text-base mb-2" numberOfLines={2}>
                      {item.name}
                    </Text>
                    <Text className="text-primary font-bold text-xl mb-2">
                      ${item.price.toFixed(2)}
                    </Text>

                    {item.stock > 0 ? (
                      <View className="flex-row items-center">
                        <View className="w-2 h-2 bg-primary rounded-full mr-2" />
                        <Text className="text-primary text-sm font-semibold">
                          {item.stock} σε απόθεμα
                        </Text>
                      </View>
                    ) : (
                      <View className="flex-row items-center">
                        <View className="w-2 h-2 bg-red-500 rounded-full mr-2" />
                        <Text className="text-red-500 text-sm font-semibold">Εκτός Αποθέματος</Text>
                      </View>
                    )}
                  </View>

                  <TouchableOpacity
                    className="self-start bg-red-500/20 p-2 rounded-full"
                    activeOpacity={0.7}
                    onPress={() => handleRemoveFromWishlist(item._id, item.name)}
                    disabled={isRemovingFromWishlist}
                  >
                    <Ionicons name="trash-outline" size={20} color="#EF4444" />
                  </TouchableOpacity>
                </View>
                {item.stock > 0 && (
                  <View className="px-4 pb-4">
                    <TouchableOpacity
                      className="bg-primary rounded-xl py-3 items-center"
                      activeOpacity={0.8}
                      onPress={() => handleAddToCart(item._id, item.name)}
                      disabled={isAddingToCart}
                    >
                      {isAddingToCart ? (
                        <ActivityIndicator size="small" color="#121212" />
                      ) : (
                        <Text className="text-background font-bold">Προσθήκη στο Καλάθι</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
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
          <Ionicons name="arrow-back" size={28} color="#FFFFFF" />
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
          <Ionicons name="arrow-back" size={28} color="#fff" />
        </TouchableOpacity>
        <Text className="text-text-primary text-2xl font-bold">Λίστα Επιθυμιών</Text>
      </View>
      <View className="flex-1 items-center justify-center px-6">
        <Ionicons name="alert-circle-outline" size={64} color="#FF6B6B" />
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
