import RatingModal from "@/components/RatingModal";
import SafeScreen from "@/components/SafeScreen";
import { useOrders } from "@/hooks/useOrders";
import { useReviews } from "@/hooks/useReviews";
import useCart from "@/hooks/useCart";
import { capitalizeFirstLetter, formatDate, getStatusColor } from "@/lib/utils";
import { Order, OrderItem } from "@/types";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Alert, ScrollView, Text, TouchableOpacity, View, Modal } from "react-native";

function OrdersScreen() {
  const { data: orders, isLoading, isError } = useOrders();
  const { createReviewAsync, isCreatingReview } = useReviews();
  const { addToCart, clearCart, isAddingToCart } = useCart();

  const [showRatingModal, setShowRatingModal] = useState(false);
  const [showReorderModal, setShowReorderModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [productRatings, setProductRatings] = useState<{ [key: string]: number }>({});
  const [reorderItems, setReorderItems] = useState<Array<{ item: OrderItem; quantity: number }>>([]);

  const handleOpenRating = (order: Order) => {
    setShowRatingModal(true);
    setSelectedOrder(order);

    // init ratings for all product to 0 - resettin the state for each product
    const initialRatings: { [key: string]: number } = {};
    order.orderItems.forEach((item) => {
      if (item.product && item.product._id) {
        const productId = item.product._id;
        initialRatings[productId] = 0;
      }
    });
    setProductRatings(initialRatings);
  };

  const handleSubmitRating = async () => {
    if (!selectedOrder) return;

    // check if all products have been rated
    const allRated = Object.values(productRatings).every((rating) => rating > 0);
    if (!allRated) {
      Alert.alert("Σφάλμα", "Παρακαλώ αξιολογήστε όλα τα προϊόντα");
      return;
    }

    try {
      await Promise.all(
        selectedOrder.orderItems
          .filter((item) => item.product && item.product._id)
          .map((item) => {
            const productId = item.product!._id;
            createReviewAsync({
              productId: productId,
              orderId: selectedOrder._id,
              rating: productRatings[productId],
            });
          })
      );

      Alert.alert("Επιτυχία", "Ευχαριστούμε για την αξιολόγηση όλων των προϊόντων!");
      setShowRatingModal(false);
      setSelectedOrder(null);
      setProductRatings({});
    } catch (error: any) {
      Alert.alert("Σφάλμα", error?.response?.data?.error || "Αποτυχία υποβολής αξιολόγησης");
    }
  };

  const handleReorder = (order: Order) => {
    setSelectedOrder(order);
    // Initialize reorder items with original quantities
    const items = order.orderItems.map((item) => ({
      item,
      quantity: item.quantity,
    }));
    setReorderItems(items);
    setShowReorderModal(true);
  };

  const handleUpdateQuantity = (index: number, change: number) => {
    setReorderItems((prev) => {
      const updated = [...prev];
      const newQuantity = updated[index].quantity + change;
      if (newQuantity < 0) return prev; // Don't allow negative
      updated[index].quantity = newQuantity;
      return updated;
    });
  };

  const handleRemoveItem = (index: number) => {
    Alert.alert(
      "Αφαίρεση Προϊόντος",
      "Είστε σίγουροι ότι θέλετε να αφαιρέσετε αυτό το προϊόν;",
      [
        { text: "Ακύρωση", style: "cancel" },
        {
          text: "Αφαίρεση",
          style: "destructive",
          onPress: () => {
            setReorderItems((prev) => prev.filter((_, i) => i !== index));
          },
        },
      ]
    );
  };

  const handleAddToCart = async () => {
    if (!selectedOrder) return;

    // Filter out items with quantity 0
    const itemsToAdd = reorderItems.filter((reorderItem) => reorderItem.quantity > 0);

    if (itemsToAdd.length === 0) {
      Alert.alert("Σφάλμα", "Παρακαλώ προσθέστε τουλάχιστον ένα προϊόν");
      return;
    }

    try {
      // Clear cart first (wait for it to complete)
      await new Promise<void>((resolve) => {
        clearCart(undefined, {
          onSuccess: () => resolve(),
          onError: () => resolve(), // Continue even if clear fails
        });
      });

      // Add all items to cart sequentially
      for (const reorderItem of itemsToAdd) {
        const item = reorderItem.item;
        if (item.product && item.product._id) {
          await new Promise<void>((resolve) => {
            addToCart(
              {
                productId: item.product!._id,
                quantity: reorderItem.quantity,
                selectedUnit: item.selectedUnit || undefined,
              },
              {
                onSuccess: () => resolve(),
                onError: (error: any) => {
                  console.error("Error adding item to cart:", error);
                  resolve(); // Continue even if one fails
                },
              }
            );
          });
          // Small delay to avoid race conditions
          await new Promise((resolve) => setTimeout(resolve, 100));
        }
      }

      Alert.alert("Επιτυχία", "Η παραγγελία προστέθηκε στο καλάθι!", [
        {
          text: "Εντάξει",
          onPress: () => {
            setShowReorderModal(false);
            router.push("/(tabs)/cart");
          },
        },
      ]);
    } catch (error: any) {
      console.error("Error in handleAddToCart:", error);
      Alert.alert("Σφάλμα", error?.response?.data?.error || "Αποτυχία προσθήκης στο καλάθι");
    }
  };

  return (
    <SafeScreen>
      {/* Header */}
      <View className="px-6 pb-5 border-b border-surface flex-row items-center">
        <TouchableOpacity onPress={() => router.back()} className="mr-4">
          <Ionicons name="arrow-back" size={28} color="#FFFFFF" />
        </TouchableOpacity>
        <Text className="text-text-primary text-2xl font-bold">Οι Παραγγελίες Μου</Text>
      </View>

      {isLoading ? (
        <LoadingUI />
      ) : isError ? (
        <ErrorUI />
      ) : !orders || orders.length === 0 ? (
        <EmptyUI />
      ) : (
        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
        >
          <View className="px-6 py-4">
            {orders.map((order) => {
              const totalItems = order.orderItems.reduce((sum, item) => sum + item.quantity, 0);
              const firstImage = order.orderItems[0]?.image || "";

              return (
                <View key={order._id} className="bg-surface rounded-3xl p-5 mb-4">
                  <View className="flex-row mb-4">
                    <View className="relative">
                      <Image
                        source={firstImage}
                        style={{ height: 80, width: 80, borderRadius: 8 }}
                        contentFit="cover"
                      />

                      {/* BADGE FOR MORE ITEMS */}
                      {order.orderItems.length > 1 && (
                        <View className="absolute -bottom-1 -right-1 bg-primary rounded-full size-7 items-center justify-center">
                          <Text className="text-background text-xs font-bold">
                            +{order.orderItems.length - 1}
                          </Text>
                        </View>
                      )}
                    </View>

                    <View className="flex-1 ml-4">
                      <Text className="text-text-primary font-bold text-base mb-1">
                        Παραγγελία #{order._id.slice(-8).toUpperCase()}
                      </Text>
                      <Text className="text-text-secondary text-sm mb-2">
                        {formatDate(order.createdAt)}
                      </Text>
                      <View
                        className="self-start px-3 py-1.5 rounded-full"
                        style={{ backgroundColor: getStatusColor(order.status) + "20" }}
                      >
                        <Text
                          className="text-xs font-bold"
                          style={{ color: getStatusColor(order.status) }}
                        >
                          {capitalizeFirstLetter(order.status)}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* ORDER ITEMS SUMMARY */}
                  {order.orderItems.map((item, index) => (
                    <Text
                      key={item._id}
                      className="text-text-secondary text-sm flex-1"
                      numberOfLines={1}
                    >
                      {item.name} × {item.quantity}
                    </Text>
                  ))}

                  <View className="border-t border-background-lighter pt-3">
                    <Text className="text-text-secondary text-xs mb-3">{totalItems} {totalItems === 1 ? "προϊόν" : "προϊόντα"}</Text>
                    
                    <View className="flex-row gap-2">
                      <TouchableOpacity
                        className="flex-1 bg-primary px-4 py-3 rounded-xl flex-row items-center justify-center"
                        activeOpacity={0.7}
                        onPress={() => handleReorder(order)}
                      >
                        <Ionicons name="refresh" size={18} color="#121212" />
                        <Text className="text-background font-bold text-sm ml-2">
                          Επαναποστολή
                        </Text>
                      </TouchableOpacity>

                      {order.hasReviewed ? (
                        <View className="bg-primary/20 px-4 py-3 rounded-xl flex-row items-center">
                          <Ionicons name="checkmark-circle" size={18} color="#FFD700" />
                          <Text className="text-primary font-bold text-sm ml-2">Αξιολογημένο</Text>
                        </View>
                      ) : (
                        <TouchableOpacity
                          className="bg-primary/20 px-4 py-3 rounded-xl flex-row items-center"
                          activeOpacity={0.7}
                          onPress={() => handleOpenRating(order)}
                        >
                          <Ionicons name="star" size={18} color="#FFD700" />
                          <Text className="text-primary font-bold text-sm ml-2">
                            Αξιολόγηση
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        </ScrollView>
      )}

      <RatingModal
        visible={showRatingModal}
        onClose={() => setShowRatingModal(false)}
        order={selectedOrder}
        productRatings={productRatings}
        onSubmit={handleSubmitRating}
        isSubmitting={isCreatingReview}
        onRatingChange={(productId, rating) =>
          setProductRatings((prev) => ({ ...prev, [productId]: rating }))
        }
      />

      {/* Reorder Modal */}
      <Modal
        visible={showReorderModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowReorderModal(false)}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-background rounded-t-3xl max-h-[90%]">
            <View className="px-6 pt-6 pb-4 border-b border-surface flex-row items-center justify-between">
              <Text className="text-text-primary text-2xl font-bold">Διαχείριση Παραγγελίας</Text>
              <TouchableOpacity
                onPress={() => setShowReorderModal(false)}
                className="p-2"
              >
                <Ionicons name="close" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            <ScrollView
              className="flex-1"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 100 }}
            >
              <View className="px-6 py-4">
                {reorderItems.length === 0 ? (
                  <View className="py-20 items-center">
                    <Ionicons name="cart-outline" size={64} color="#666" />
                    <Text className="text-text-primary font-semibold text-lg mt-4">
                      Δεν υπάρχουν προϊόντα
                    </Text>
                    <Text className="text-text-secondary text-center mt-2">
                      Όλα τα προϊόντα έχουν αφαιρεθεί
                    </Text>
                  </View>
                ) : (
                  reorderItems.map((reorderItem, index) => {
                    const item = reorderItem.item;
                    return (
                      <View
                        key={item._id || index}
                        className="bg-surface rounded-2xl p-4 mb-3"
                      >
                        <View className="flex-row">
                          <Image
                            source={item.image}
                            style={{ width: 80, height: 80, borderRadius: 8 }}
                            contentFit="cover"
                          />
                          <View className="flex-1 ml-4">
                            <Text className="text-text-primary font-bold text-base mb-1">
                              {item.name}
                            </Text>
                            {item.selectedUnit && (
                              <Text className="text-text-secondary text-sm mb-2">
                                {item.selectedUnit}
                              </Text>
                            )}

                            <View className="flex-row items-center mt-2">
                              <TouchableOpacity
                                className="bg-background-lighter rounded-full w-8 h-8 items-center justify-center"
                                onPress={() => handleUpdateQuantity(index, -1)}
                                activeOpacity={0.7}
                              >
                                <Ionicons name="remove" size={16} color="#FFFFFF" />
                              </TouchableOpacity>

                              <Text className="text-text-primary font-bold text-lg mx-4 min-w-[32px] text-center">
                                {reorderItem.quantity}
                              </Text>

                              <TouchableOpacity
                                className="bg-primary rounded-full w-8 h-8 items-center justify-center"
                                onPress={() => handleUpdateQuantity(index, 1)}
                                activeOpacity={0.7}
                              >
                                <Ionicons name="add" size={16} color="#121212" />
                              </TouchableOpacity>

                              <TouchableOpacity
                                className="ml-auto bg-red-500/10 rounded-full w-8 h-8 items-center justify-center"
                                onPress={() => handleRemoveItem(index)}
                                activeOpacity={0.7}
                              >
                                <Ionicons name="trash-outline" size={16} color="#EF4444" />
                              </TouchableOpacity>
                            </View>
                          </View>
                        </View>
                      </View>
                    );
                  })
                )}
              </View>
            </ScrollView>

            <View className="px-6 py-4 border-t border-surface">
              <TouchableOpacity
                className="bg-primary rounded-2xl py-4 flex-row items-center justify-center"
                activeOpacity={0.8}
                onPress={handleAddToCart}
                disabled={isAddingToCart || reorderItems.length === 0}
              >
                {isAddingToCart ? (
                  <ActivityIndicator size="small" color="#121212" />
                ) : (
                  <>
                    <Ionicons name="cart" size={20} color="#121212" />
                    <Text className="text-background font-bold text-lg ml-2">
                      Προσθήκη στο Καλάθι
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeScreen>
  );
}
export default OrdersScreen;

function LoadingUI() {
  return (
    <View className="flex-1 items-center justify-center">
      <ActivityIndicator size="large" color="#FFD700" />
      <Text className="text-text-secondary mt-4">Φόρτωση παραγγελιών...</Text>
    </View>
  );
}

function ErrorUI() {
  return (
    <View className="flex-1 items-center justify-center px-6">
      <Ionicons name="alert-circle-outline" size={64} color="#FF6B6B" />
      <Text className="text-text-primary font-semibold text-xl mt-4">Αποτυχία φόρτωσης παραγγελιών</Text>
      <Text className="text-text-secondary text-center mt-2">
        Παρακαλώ ελέγξτε τη σύνδεσή σας και δοκιμάστε ξανά
      </Text>
    </View>
  );
}

function EmptyUI() {
  return (
    <View className="flex-1 items-center justify-center px-6">
      <Ionicons name="receipt-outline" size={80} color="#666" />
      <Text className="text-text-primary font-semibold text-xl mt-4">Δεν υπάρχουν παραγγελίες ακόμα</Text>
      <Text className="text-text-secondary text-center mt-2">
        Το ιστορικό των παραγγελιών σας θα εμφανιστεί εδώ
      </Text>
    </View>
  );
}
