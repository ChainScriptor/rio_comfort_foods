import SafeScreen from "@/components/SafeScreen";
import { useAddresses } from "@/hooks/useAddressess";
import useCart from "@/hooks/useCart";
import { useApi } from "@/lib/api";
import { getOptimizedUrl } from "@/lib/utils";
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useState } from "react";
import { Address } from "@/types";
import MinusIcon from "@/assets/icons/MinusIcon.svg";
import PlusIcon from "@/assets/icons/PlusIcon.svg";
import TrashIcon from "@/assets/icons/TrashIcon.svg";
import CartIcon from "@/assets/icons/CartIcon.svg";
import ArrowForwardIcon from "@/assets/icons/ArrowForwardIcon.svg";
import AlertCircleIcon from "@/assets/icons/AlertCircleIcon.svg";
import { Image } from "expo-image";
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

  const handleQuantityChange = (productId: string, currentQuantity: number, change: number, selectedUnit?: string) => {
    const newQuantity = currentQuantity + change;
    if (newQuantity < 1) return;
    updateQuantity({ productId, quantity: newQuantity, selectedUnit });
  };

  const handleRemoveItem = (productId: string, productName: string, selectedUnit?: string) => {
    console.log("Button Clicked!");
    const doRemove = () =>
      removeFromCart(
        { productId: String(productId), selectedUnit },
        {
          onError: (error: any) => {
            const msg =
              error?.response?.data?.error ||
              error?.message ||
              "Δεν ήταν δυνατή η αφαίρεση του προϊόντος.";
            if (Platform.OS === "web") {
              window.alert(msg);
            } else {
              Alert.alert("Σφάλμα", msg);
            }
          },
        }
      );
    if (Platform.OS === "web") {
      const confirmed = window.confirm(`Αφαίρεση ${productName} από το καλάθι;`);
      if (confirmed) doRemove();
    } else {
      Alert.alert("Αφαίρεση Προϊόντος", `Αφαίρεση ${productName} από το καλάθι;`, [
        { text: "Ακύρωση", style: "cancel" },
        { text: "Αφαίρεση", style: "destructive", onPress: doRemove },
      ]);
    }
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

  const handleProceedWithOrder = async (
    selectedAddress: Address,
    deliveryDate?: Date,
    comments?: string
  ) => {
    // Extra safety: make sure storeLocation is present before sending to backend
    const storeLocation = selectedAddress.storeLocation?.toString().trim();
    if (!storeLocation) {
      Alert.alert(
        "Ελλιπής διεύθυνση",
        "Η επιλεγμένη διεύθυνση δεν έχει \"Περιοχή Καταστήματος\". Επεξεργαστείτε τη διεύθυνση και συμπληρώστε την πριν συνεχίσετε."
      );
      return;
    }

    setAddressModalVisible(false);

    // log checkout initiated
    Sentry.logger.info("Checkout initiated", {
      itemCount: cartItemCount,
      total: total.toFixed(2),
      city: selectedAddress.city,
    });

    try {
      setOrderLoading(true);

      // Prepare order items from cart (filter out items with null products)
      const orderItems = cartItems
        .filter((item) => item.product != null)
        .map((item) => ({
          product: item.product!._id,
          name: item.product!.name,
          price: item.product!.price ?? 0,
          quantity: item.quantity,
          image: item.product!.images[0],
          selectedUnit: item.selectedUnit || undefined,
        }));

      // Create order directly without payment and verify server response
      const response = await api.post("/orders", {
        orderItems,
        shippingAddress: {
          storeLocation,
          fullName: selectedAddress.fullName,
          streetAddress: selectedAddress.streetAddress,
          city: selectedAddress.city,
          state: selectedAddress.state,
          zipCode: selectedAddress.zipCode,
          phoneNumber: selectedAddress.phoneNumber,
        },
        totalPrice: total,
        deliveryDate: deliveryDate ? deliveryDate.toISOString() : undefined,
        comments: comments || undefined,
      });

      // Extra safety: make sure backend actually created/returned an order
      if (!response?.data?.order?._id) {
        throw new Error("Η παραγγελία δεν επιβεβαιώθηκε από τον διακομιστή. Δοκιμάστε ξανά.");
      }

      Sentry.logger.info("Order created successfully", {
        total: total.toFixed(2),
        itemCount: cartItems.length,
      });

      if (Platform.OS === "web") {
        window.alert("Επιτυχής παραγγελία! Η παραγγελία σας ολοκληρώθηκε. Ο διαχειριστής θα την επεξεργαστεί σύντομα.");
      } else {
        Alert.alert("Επιτυχία", "Η παραγγελία σας ολοκληρώθηκε! Ο διαχειριστής θα την επεξεργαστεί σύντομα.", [
          { text: "Εντάξει", onPress: () => {} },
        ]);
      }
      clearCart();
    } catch (error: any) {
      Sentry.logger.error("Order creation failed", {
        error: error instanceof Error ? error.message : "Unknown error",
        cartTotal: total,
        itemCount: cartItems.length,
        serverError: error?.response?.data,
      });

      const baseMessage = error.response?.data?.error || "Αποτυχία δημιουργίας παραγγελίας";
      const missingFields: string[] | undefined = error.response?.data?.missingFields;
      const detailedMessage =
        missingFields && missingFields.length > 0
          ? `${baseMessage} (λείπουν: ${missingFields.join(", ")})`
          : baseMessage;

      Alert.alert("Σφάλμα", detailedMessage);
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
          {cartItems
            .filter((item) => item.product != null)
            .map((item, index) => (
              <View key={item._id} className="bg-surface rounded-3xl overflow-hidden ">
                <View className="p-4 flex-row">
                  {/* product image */}
                  <View className="relative">
                    <Image
                      source={getOptimizedUrl(item.product!.images[0]) ?? item.product!.images[0]}
                      className="bg-background-lighter"
                      contentFit="cover"
                      cachePolicy="disk"
                      transition={300}
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
                        {item.product!.name}
                      </Text>
                      {item.selectedUnit && (
                        <Text className="text-text-secondary text-sm mt-1">
                          {item.selectedUnit}
                        </Text>
                      )}
                      {item.product!.showPrice !== false && item.product!.price && (
                        <View className="flex-row items-center mt-2">
                          <Text className="text-primary font-bold text-2xl">
                            ${(item.product!.price * item.quantity).toFixed(2)}
                          </Text>
                          <Text className="text-text-secondary text-sm ml-2">
                            ${item.product!.price.toFixed(2)} το καθένα
                          </Text>
                        </View>
                      )}
                    </View>

                    <View className="flex-row items-center mt-3">
                      <TouchableOpacity
                        className="bg-background-lighter rounded-full w-9 h-9 items-center justify-center"
                        activeOpacity={0.7}
                        onPress={() => handleQuantityChange(item.product!._id, item.quantity, -1, item.selectedUnit)}
                        disabled={isUpdating}
                      >
                        {isUpdating ? (
                          <ActivityIndicator size="small" color="#FFFFFF" />
                        ) : (
                          <MinusIcon width={18} height={18} stroke="#FFFFFF" color="#FFFFFF" />
                        )}
                      </TouchableOpacity>

                      <View className="mx-4 min-w-[32px] items-center">
                        <Text className="text-text-primary font-bold text-lg">{item.quantity}</Text>
                      </View>

                      <TouchableOpacity
                        className="bg-primary rounded-full w-9 h-9 items-center justify-center"
                        activeOpacity={0.7}
                        onPress={() => handleQuantityChange(item.product!._id, item.quantity, 1, item.selectedUnit)}
                        disabled={isUpdating}
                      >
                        {isUpdating ? (
                          <ActivityIndicator size="small" color="#121212" />
                        ) : (
                          <PlusIcon width={18} height={18} stroke="#121212" color="#121212" />
                        )}
                      </TouchableOpacity>

                      <TouchableOpacity
                        className="ml-auto bg-red-500/10 rounded-full w-9 h-9 items-center justify-center min-w-[36px] min-h-[36px]"
                        style={{ zIndex: 50 }}
                        activeOpacity={0.7}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        onPress={() =>
                          handleRemoveItem(
                            String(item.product!._id),
                            item.product!.name,
                            item.selectedUnit
                          )
                        }
                        disabled={isRemoving}
                        accessibilityRole="button"
                        accessibilityLabel="Αφαίρεση από καλάθι"
                      >
                        <View pointerEvents="none">
                          <TrashIcon width={18} height={18} stroke="#EF4444" color="#EF4444" />
                        </View>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </View>
            ))}
        </View>
      </ScrollView>

      <View
        className="absolute bottom-0 left-0 right-0 bg-background/95 backdrop-blur-xl border-t
       border-surface pt-4 pb-32 px-6"
      >
        {/* Quick Stats */}
        <View className="flex-row items-center justify-center mb-4">
          <View className="flex-row items-center">
            <CartIcon width={20} height={20} stroke="#FFD700" color="#FFD700" />
            <Text className="text-text-primary font-bold text-xl ml-2">
              {cartItemCount} {cartItemCount === 1 ? "προϊόν" : "προϊόντα"}
            </Text>
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
                <ArrowForwardIcon width={20} height={20} stroke="#121212" color="#121212" />
              </>
            )}
          </View>
        </TouchableOpacity>
      </View>

      <AddressSelectionModal
        visible={addressModalVisible}
        onClose={() => setAddressModalVisible(false)}
        onProceed={(address, deliveryDate, comments) => handleProceedWithOrder(address, deliveryDate, comments)}
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
      <AlertCircleIcon width={64} height={64} stroke="#FF6B6B" color="#FF6B6B" />
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
        <CartIcon width={80} height={80} stroke="#666" color="#666" />
        <Text className="text-text-primary font-semibold text-xl mt-4">Το καλάθι σας είναι άδειο</Text>
        <Text className="text-text-secondary text-center mt-2">
          Προσθέστε προϊόντα για να ξεκινήσετε
        </Text>
      </View>
    </View>
  );
}
