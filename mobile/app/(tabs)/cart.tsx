import SafeScreen from "@/components/SafeScreen";
import { useAddresses } from "@/hooks/useAddressess";
import useCart from "@/hooks/useCart";
import { useApi } from "@/lib/api";
import { ActivityIndicator, Alert, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useState } from "react";
import { Address } from "@/types";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import OrderSummary from "@/components/OrderSummary";
import AddressSelectionModal from "@/components/AddressSelectionModal";

import * as Sentry from "@sentry/react-native";

const CartScreen = () => {
  const api = useApi();
  const {
    cart,
    cartItemCount,
    cartTotal,
    clearCart,
    isError,
    isLoading,
    isRemoving,
    isUpdating,
    removeFromCart,
    updateQuantity,
  } = useCart();
  const { addresses } = useAddresses();

  const [orderLoading, setOrderLoading] = useState(false);
  const [addressModalVisible, setAddressModalVisible] = useState(false);

  const cartItems = cart?.items || [];
  const subtotal = cartTotal;
  const shipping = 10.0; // $10 shipping fee
  const tax = subtotal * 0.08; // 8% tax
  const total = subtotal + shipping + tax;

  const handleQuantityChange = (productId: string, currentQuantity: number, change: number) => {
    const newQuantity = currentQuantity + change;
    if (newQuantity < 1) return;
    updateQuantity({ productId, quantity: newQuantity });
  };

  const handleRemoveItem = (productId: string, productName: string) => {
    Alert.alert("Αφαίρεση Προϊόντος", `Αφαίρεση ${productName} από το καλάθι;`, [
      { text: "Ακύρωση", style: "cancel" },
      {
        text: "Αφαίρεση",
        style: "destructive",
        onPress: () => removeFromCart(productId),
      },
    ]);
  };

  const handleCheckout = () => {
    if (cartItems.length === 0) return;

    // check if user has addresses
    if (!addresses || addresses.length === 0) {
      Alert.alert(
        "Χωρίς Διεύθυνση",
        "Παρακαλώ προσθέστε μια διεύθυνση αποστολής στο προφίλ σας πριν από την ολοκλήρωση της παραγγελίας.",
        [{ text: "Εντάξει" }]
      );
      return;
    }

    // show address selection modal
    setAddressModalVisible(true);
  };

  const handleProceedWithOrder = async (selectedAddress: Address) => {
    setAddressModalVisible(false);

    // log checkout initiated
    Sentry.logger.info("Checkout initiated", {
      itemCount: cartItemCount,
      total: total.toFixed(2),
      city: selectedAddress.city,
    });

    try {
      setOrderLoading(true);

      // Prepare order items from cart
      const orderItems = cartItems.map((item) => ({
        product: item.product._id,
        name: item.product.name,
        price: item.product.price,
        quantity: item.quantity,
        image: item.product.images[0],
      }));

      // Create order directly without payment
      await api.post("/orders", {
        orderItems,
        shippingAddress: {
          fullName: selectedAddress.fullName,
          streetAddress: selectedAddress.streetAddress,
          city: selectedAddress.city,
          state: selectedAddress.state,
          zipCode: selectedAddress.zipCode,
          phoneNumber: selectedAddress.phoneNumber,
        },
        totalPrice: total,
      });

      Sentry.logger.info("Order created successfully", {
        total: total.toFixed(2),
        itemCount: cartItems.length,
      });

      Alert.alert("Επιτυχία", "Η παραγγελία σας ολοκληρώθηκε! Ο διαχειριστής θα την επεξεργαστεί σύντομα.", [
        { text: "Εντάξει", onPress: () => {} },
      ]);
      clearCart();
    } catch (error: any) {
      Sentry.logger.error("Order creation failed", {
        error: error instanceof Error ? error.message : "Unknown error",
        cartTotal: total,
        itemCount: cartItems.length,
      });

      const errorMessage = error.response?.data?.error || "Αποτυχία δημιουργίας παραγγελίας";
      Alert.alert("Σφάλμα", errorMessage);
    } finally {
      setOrderLoading(false);
    }
  };

  if (isLoading) return <LoadingUI />;
  if (isError) return <ErrorUI />;
  if (cartItems.length === 0) return <EmptyUI />;

  return (
    <SafeScreen>
      <Text className="px-6 pb-5 text-text-primary text-3xl font-bold tracking-tight">Καλάθι</Text>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 240 }}
      >
        <View className="px-6 gap-2">
          {cartItems.map((item, index) => (
            <View key={item._id} className="bg-surface rounded-3xl overflow-hidden ">
              <View className="p-4 flex-row">
                {/* product image */}
                <View className="relative">
                  <Image
                    source={item.product.images[0]}
                    className="bg-background-lighter"
                    contentFit="cover"
                    style={{ width: 112, height: 112, borderRadius: 16 }}
                  />
                  <View className="absolute top-2 right-2 bg-primary rounded-full px-2 py-0.5">
                    <Text className="text-background text-xs font-bold">×{item.quantity}</Text>
                  </View>
                </View>

                <View className="flex-1 ml-4 justify-between">
                  <View>
                    <Text
                      className="text-text-primary font-bold text-lg leading-tight"
                      numberOfLines={2}
                    >
                      {item.product.name}
                    </Text>
                    {item.selectedUnit && (
                      <Text className="text-text-secondary text-sm mt-1">
                        {item.selectedUnit}
                      </Text>
                    )}
                    <View className="flex-row items-center mt-2">
                      <Text className="text-primary font-bold text-2xl">
                        ${(item.product.price * item.quantity).toFixed(2)}
                      </Text>
                      <Text className="text-text-secondary text-sm ml-2">
                        ${item.product.price.toFixed(2)} το καθένα
                      </Text>
                    </View>
                  </View>

                  <View className="flex-row items-center mt-3">
                    <TouchableOpacity
                      className="bg-background-lighter rounded-full w-9 h-9 items-center justify-center"
                      activeOpacity={0.7}
                      onPress={() => handleQuantityChange(item.product._id, item.quantity, -1)}
                      disabled={isUpdating}
                    >
                      {isUpdating ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                        <Ionicons name="remove" size={18} color="#FFFFFF" />
                      )}
                    </TouchableOpacity>

                    <View className="mx-4 min-w-[32px] items-center">
                      <Text className="text-text-primary font-bold text-lg">{item.quantity}</Text>
                    </View>

                    <TouchableOpacity
                      className="bg-primary rounded-full w-9 h-9 items-center justify-center"
                      activeOpacity={0.7}
                      onPress={() => handleQuantityChange(item.product._id, item.quantity, 1)}
                      disabled={isUpdating}
                    >
                      {isUpdating ? (
                        <ActivityIndicator size="small" color="#121212" />
                      ) : (
                        <Ionicons name="add" size={18} color="#121212" />
                      )}
                    </TouchableOpacity>

                    <TouchableOpacity
                      className="ml-auto bg-red-500/10 rounded-full w-9 h-9 items-center justify-center"
                      activeOpacity={0.7}
                      onPress={() => handleRemoveItem(item.product._id, item.product.name)}
                      disabled={isRemoving}
                    >
                      <Ionicons name="trash-outline" size={18} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>
          ))}
        </View>

        <OrderSummary subtotal={subtotal} shipping={shipping} tax={tax} total={total} />
      </ScrollView>

      <View
        className="absolute bottom-0 left-0 right-0 bg-background/95 backdrop-blur-xl border-t
       border-surface pt-4 pb-32 px-6"
      >
        {/* Quick Stats */}
        <View className="flex-row items-center justify-between mb-4">
          <View className="flex-row items-center">
            <Ionicons name="cart" size={20} color="#FFD700" />
            <Text className="text-text-secondary ml-2">
              {cartItemCount} {cartItemCount === 1 ? "προϊόν" : "προϊόντα"}
            </Text>
          </View>
          <View className="flex-row items-center">
            <Text className="text-text-primary font-bold text-xl">${total.toFixed(2)}</Text>
          </View>
        </View>

        {/* Checkout Button */}
        <TouchableOpacity
          className="bg-primary rounded-2xl overflow-hidden"
          activeOpacity={0.9}
          onPress={handleCheckout}
          disabled={orderLoading}
        >
          <View className="py-5 flex-row items-center justify-center">
            {orderLoading ? (
              <ActivityIndicator size="small" color="#121212" />
            ) : (
              <>
                <Text className="text-background font-bold text-lg mr-2">Ολοκλήρωση Παραγγελίας</Text>
                <Ionicons name="arrow-forward" size={20} color="#121212" />
              </>
            )}
          </View>
        </TouchableOpacity>
      </View>

      <AddressSelectionModal
        visible={addressModalVisible}
        onClose={() => setAddressModalVisible(false)}
        onProceed={handleProceedWithOrder}
        isProcessing={orderLoading}
      />
    </SafeScreen>
  );
};

export default CartScreen;

function LoadingUI() {
  return (
    <View className="flex-1 bg-background items-center justify-center">
      <ActivityIndicator size="large" color="#FFD700" />
      <Text className="text-text-secondary mt-4">Φόρτωση καλαθιού...</Text>
    </View>
  );
}

function ErrorUI() {
  return (
    <View className="flex-1 bg-background items-center justify-center px-6">
      <Ionicons name="alert-circle-outline" size={64} color="#FF6B6B" />
      <Text className="text-text-primary font-semibold text-xl mt-4">Αποτυχία φόρτωσης καλαθιού</Text>
      <Text className="text-text-secondary text-center mt-2">
        Παρακαλώ ελέγξτε τη σύνδεσή σας και δοκιμάστε ξανά
      </Text>
    </View>
  );
}

function EmptyUI() {
  return (
    <View className="flex-1 bg-background">
      <View className="px-6 pt-16 pb-5">
        <Text className="text-text-primary text-3xl font-bold tracking-tight">Καλάθι</Text>
      </View>
      <View className="flex-1 items-center justify-center px-6">
        <Ionicons name="cart-outline" size={80} color="#666" />
        <Text className="text-text-primary font-semibold text-xl mt-4">Το καλάθι σας είναι άδειο</Text>
        <Text className="text-text-secondary text-center mt-2">
          Προσθέστε προϊόντα για να ξεκινήσετε
        </Text>
      </View>
    </View>
  );
}
