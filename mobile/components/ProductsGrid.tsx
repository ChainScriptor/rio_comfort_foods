import useCart from "@/hooks/useCart";
import useWishlist from "@/hooks/useWishlist";
import { getOptimizedUrl } from "@/lib/utils";
import { Product } from "@/types";
import SearchIcon from "@/assets/icons/SearchIcon.svg";
import HeartIcon from "@/assets/icons/HeartIcon.svg";
import HeartFilledIcon from "@/assets/icons/HeartFilledIcon.svg";
import PlusIcon from "@/assets/icons/PlusIcon.svg";
import AlertCircleIcon from "@/assets/icons/AlertCircleIcon.svg";
import { Image } from "expo-image";
import { router } from "expo-router";
import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  useWindowDimensions,
  Platform,
} from "react-native";
import { FlashList } from "@shopify/flash-list";

const PADDING = 24;
const GAP_MOBILE = 16;
const GAP_WEB = 24;

interface ProductsGridProps {
  isLoading: boolean;
  isError: boolean;
  products: Product[];
}

interface ProductGridItemProps {
  product: Product;
  onAddToCart: (product: Product) => void;
  onToggleWishlist: (productId: string) => void;
  isInWishlist: (productId: string) => boolean;
  isAddingToCart: boolean;
  isAddingToWishlist: boolean;
  isRemovingFromWishlist: boolean;
  itemWidth: number;
  imageHeight: number;
  isWeb: boolean;
}

const ProductGridItem = React.memo(function ProductGridItem({
  product,
  onAddToCart,
  onToggleWishlist,
  isInWishlist,
  isAddingToCart,
  isAddingToWishlist,
  isRemovingFromWishlist,
  itemWidth,
  imageHeight,
  isWeb,
}: ProductGridItemProps) {
  return (
    <TouchableOpacity
      className="bg-surface rounded-3xl overflow-hidden"
      style={{ width: itemWidth }}
      activeOpacity={0.8}
      onPress={() => router.push(`/product/${product._id}`)}
    >
      <View className="relative" style={{ width: "100%" }}>
        <Image
          source={getOptimizedUrl(product.images[0]) ?? product.images[0]}
          style={{ width: "100%", height: imageHeight }}
          className="bg-background-lighter"
          contentFit="cover"
          cachePolicy="disk"
          transition={300}
        />

        <TouchableOpacity
          className={`absolute top-3 right-3 backdrop-blur-xl p-2 rounded-full ${
            isInWishlist(product._id) ? "bg-red-500/30" : "bg-black/30"
          }`}
          activeOpacity={0.7}
          onPress={() => onToggleWishlist(product._id)}
          disabled={isAddingToWishlist || isRemovingFromWishlist}
        >
          {isAddingToWishlist || isRemovingFromWishlist ? (
            <ActivityIndicator size="small" color={isInWishlist(product._id) ? "#FF6B6B" : "#FFFFFF"} />
          ) : isInWishlist(product._id) ? (
            <HeartFilledIcon width={isWeb ? 20 : 18} height={isWeb ? 20 : 18} color="#FF6B6B" fill="#FF6B6B" />
          ) : (
            <HeartIcon width={isWeb ? 20 : 18} height={isWeb ? 20 : 18} stroke="#FFFFFF" color="#FFFFFF" />
          )}
        </TouchableOpacity>
      </View>

      <View className={`p-3 ${isWeb ? "p-4" : ""}`}>
        <Text className={`text-text-secondary mb-1 ${isWeb ? "text-sm" : "text-xs"}`}>{product.category}</Text>
        <Text
          className={`text-text-primary font-bold mb-2 ${isWeb ? "text-lg" : "text-base"}`}
          numberOfLines={2}
        >
          {product.name}
        </Text>

        <View className="flex-row items-center justify-between">
          {product.showPrice !== false && product.price && (
            <Text className={`text-primary font-bold ${isWeb ? "text-lg" : "text-base"}`}>
              ${product.price.toFixed(2)}
            </Text>
          )}

          <TouchableOpacity
            className={`bg-primary rounded-full items-center justify-center ${isWeb ? "w-10 h-10" : "w-8 h-8"}`}
            activeOpacity={0.7}
            onPress={() => onAddToCart(product)}
            disabled={isAddingToCart}
          >
            {isAddingToCart ? (
              <ActivityIndicator size="small" color="#121212" />
            ) : (
              <PlusIcon width={isWeb ? 20 : 18} height={isWeb ? 20 : 18} stroke="#121212" color="#121212" />
            )}
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
});

const ProductsGrid = ({ products, isLoading, isError }: ProductsGridProps) => {
  const { width: windowWidth } = useWindowDimensions();
  const isWeb = Platform.OS === "web";
  const gap = isWeb ? GAP_WEB : GAP_MOBILE;

  // Υπολογίζουμε το πλάτος περιεχομένου αφαιρώντας τα οριζόντια padding (`px-6`)
  // από το parent container στο `ShopScreen`.
  const contentWidth = windowWidth - PADDING * 2;

  // Κινητό (native + web): 2 προϊόντα ανά σειρά.
  // Desktop web (μεγάλη οθόνη): 4 προϊόντα ανά σειρά.
  let cols = 2;
  if (isWeb && windowWidth >= 1024) {
    cols = 4;
  }

  const itemWidth = (contentWidth - gap * (cols - 1)) / cols;
  const imageHeight = isWeb ? Math.round(itemWidth * 0.85) : 176;

  const { isInWishlist, toggleWishlist, isAddingToWishlist, isRemovingFromWishlist } =
    useWishlist();

  const { isAddingToCart, addToCart } = useCart();

  const handleAddToCart = (product: Product) => {
    if (product.unitOptions && product.unitOptions.length > 0) {
      router.push(`/product/${product._id}`);
      return;
    }
    addToCart(
      { productId: product._id, quantity: 1, selectedUnit: undefined },
      {
        onError: (error: any) => {
          Alert.alert("Error", error?.response?.data?.error || "Failed to add to cart");
        },
      }
    );
  };

  const renderProduct = ({ item: product, index }: { item: Product; index: number }) => {
    const isLastInRow = (index % cols) === cols - 1;
    return (
      <View
        style={{
          width: itemWidth,
          marginRight: isLastInRow ? 0 : gap,
          marginBottom: gap,
        }}
      >
        <ProductGridItem
          product={product}
          onAddToCart={handleAddToCart}
          onToggleWishlist={toggleWishlist}
          isInWishlist={isInWishlist}
          isAddingToCart={isAddingToCart}
          isAddingToWishlist={isAddingToWishlist}
          isRemovingFromWishlist={isRemovingFromWishlist}
          itemWidth={itemWidth}
          imageHeight={imageHeight}
          isWeb={isWeb}
        />
      </View>
    );
  };

  if (isLoading) {
    return (
      <View className="py-20 items-center justify-center">
        <ActivityIndicator size="large" color="#FFD700" />
        <Text className="text-text-secondary mt-4">Loading products...</Text>
      </View>
    );
  }

  if (isError) {
    return (
      <View className="py-20 items-center justify-center">
        <AlertCircleIcon width={48} height={48} stroke="#FF6B6B" color="#FF6B6B" />
        <Text className="text-text-primary font-semibold mt-4">Failed to load products</Text>
        <Text className="text-text-secondary text-sm mt-2">Please try again later</Text>
      </View>
    );
  }

  const estimatedRowHeight = imageHeight + 140;

  // On web (PWA & desktop) χρησιμοποιούμε απλό View grid ώστε τα scroll gestures
  // να περνάνε στο εξωτερικό ScrollView. Οι στήλες προσαρμόζονται ανάλογα
  // με το πλάτος της οθόνης, αλλά σε στενά πλάτη (κινητό) παραμένουν 2.
  if (isWeb) {
    return (
      <View style={{ flexDirection: "row", flexWrap: "wrap", paddingBottom: 24 }}>
        {products.map((product, index) => {
          const isLastInRow = (index % cols) === cols - 1;
          return (
            <View
              key={product._id}
              style={{
                width: itemWidth,
                marginRight: isLastInRow ? 0 : gap,
                marginBottom: gap,
              }}
            >
              <ProductGridItem
                product={product}
                onAddToCart={handleAddToCart}
                onToggleWishlist={toggleWishlist}
                isInWishlist={isInWishlist}
                isAddingToCart={isAddingToCart}
                isAddingToWishlist={isAddingToWishlist}
                isRemovingFromWishlist={isRemovingFromWishlist}
                itemWidth={itemWidth}
                imageHeight={imageHeight}
                isWeb={isWeb}
              />
            </View>
          );
        })}
        {products.length === 0 && <NoProductsFound />}
      </View>
    );
  }

  return (
    <FlashList
      data={products}
      renderItem={renderProduct}
      keyExtractor={(item) => item._id}
      numColumns={cols}
      estimatedItemSize={estimatedRowHeight}
      contentContainerStyle={{ paddingBottom: 24 }}
      showsVerticalScrollIndicator={false}
      scrollEnabled={false}
      ListEmptyComponent={NoProductsFound}
    />
  );
};

export default ProductsGrid;

function NoProductsFound() {
  return (
    <View className="py-20 items-center justify-center">
      <SearchIcon width={48} height={48} stroke="#666" color="#666" />
      <Text className="text-text-primary font-semibold mt-4">No products found</Text>
      <Text className="text-text-secondary text-sm mt-2">Try adjusting your filters</Text>
    </View>
  );
}
