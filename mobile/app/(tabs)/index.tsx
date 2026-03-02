import ProductsGrid from "@/components/ProductsGrid";
import SafeScreen from "@/components/SafeScreen";
import useProducts from "@/hooks/useProducts";
import useCategories from "@/hooks/useCategories";
import useBanners from "@/hooks/useBanners";
import { getOptimizedUrl, normalizeText } from "@/lib/utils";

import SearchIcon from "@/assets/icons/SearchIcon.svg";
import OptionsIcon from "@/assets/icons/OptionsIcon.svg";
import { Icon } from "@/components/Icon";
import { Image } from "expo-image";
import { useMemo, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Linking } from "react-native";

const ShopScreen = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Όλα");

  const { data: products, isLoading, isError } = useProducts();
  const { data: categories = [], isLoading: categoriesLoading, isError: categoriesError, error: categoriesErrorDetails } = useCategories();
  const { data: banners = [] } = useBanners();

  // Build categories list with "All" option, sorted by order
  const displayCategories = useMemo(() => {
    const allOption = { name: "Όλα", icon: "grid-outline" as const };
    // Sort categories by order field (ascending), then by creation date if order is the same
    const sortedCategories = [...categories].sort((a, b) => {
      const orderA = a.order ?? 999; // Categories without order go to the end
      const orderB = b.order ?? 999;
      return orderA - orderB;
    });
    const categoryOptions = sortedCategories.map((cat) => ({
      name: cat.name,
      icon: cat.icon,
      image: cat.image,
    }));
    return [allOption, ...categoryOptions];
  }, [categories]);

  const filteredProducts = useMemo(() => {
    if (!products) return [];

    // Αν υπάρχει αναζήτηση, αγνοούμε την επιλεγμένη κατηγορία
    // και ψάχνουμε σε ΟΛΑ τα προϊόντα, με case- & accent-insensitive σύγκριση.
    const query = searchQuery.trim();
    if (query) {
      const normalizedQuery = normalizeText(query);
      return products.filter((product) => {
        const name = normalizeText(product.name || "");
        const category = normalizeText(product.category || "");
        return (
          name.includes(normalizedQuery) ||
          category.includes(normalizedQuery)
        );
      });
    }

    // Χωρίς αναζήτηση, φιλτράρουμε μόνο βάσει κατηγορίας.
    if (selectedCategory !== "Όλα") {
      return products.filter((product) => product.category === selectedCategory);
    }

    return products;
  }, [products, selectedCategory, searchQuery]);

  return (
    <SafeScreen>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* HEADER */}
        <View className="px-6 pb-4 pt-6">
          <View className="flex-row items-center justify-between mb-6">
            <View>
              <Text className="text-text-primary text-3xl font-bold tracking-tight">Κατάστημα</Text>
              <Text className="text-text-secondary text-sm mt-1">Περιήγηση σε όλα τα προϊόντα</Text>
            </View>

            <TouchableOpacity className="bg-surface/50 p-3 rounded-full" activeOpacity={0.7}>
              <OptionsIcon width={22} height={22} stroke="#fff" color="#fff" />
            </TouchableOpacity>
          </View>

          {/* SEARCH BAR */}
          <View className="bg-surface flex-row items-center px-5 py-4 rounded-2xl">
            <SearchIcon width={22} height={22} stroke="#666" color="#666" />
            <TextInput
              placeholder="Αναζήτηση προϊόντων"
              placeholderTextColor={"#666"}
              className="flex-1 ml-3 text-base text-text-primary"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          {/* BANNER */}
          {banners.length > 0 && (
            <View className="mt-4">
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingRight: 24 }}
                pagingEnabled={false}
                snapToInterval={0}
              >
                {banners.map((banner) => (
                  <TouchableOpacity
                    key={banner._id}
                    className="mr-3 rounded-2xl overflow-hidden bg-background"
                    activeOpacity={banner.linkUrl ? 0.7 : 1}
                    onPress={() => {
                      if (banner.linkUrl) {
                        Linking.openURL(banner.linkUrl);
                      }
                    }}
                    disabled={!banner.linkUrl}
                  >
                    <Image
                      source={getOptimizedUrl(banner.imageUrl) ?? banner.imageUrl}
                      style={{ width: 320, height: 160, backgroundColor: "#121212" }}
                      contentFit="cover"
                      cachePolicy="disk"
                      transition={300}
                    />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
        </View>

        {/* CATEGORY FILTER */}
        <View className="mb-6">
          {categoriesLoading ? (
            <View className="px-6 py-4 items-center">
              <ActivityIndicator size="small" color="#FFD700" />
            </View>
          ) : categoriesError ? (
            <View className="px-6 py-4 items-center">
              <Text className="text-text-secondary text-sm mb-2">
                Αποτυχία φόρτωσης κατηγοριών
              </Text>
              {categoriesErrorDetails?.response?.status === 500 && (
                <Text className="text-text-tertiary text-xs text-center">
                  Σφάλμα διακομιστή. Παρακαλώ δοκιμάστε ξανά αργότερα.
                </Text>
              )}
            </View>
          ) : displayCategories.length === 1 ? (
            <View className="px-6 py-4 items-center">
              <Text className="text-text-secondary text-sm">
                Δεν υπάρχουν διαθέσιμες κατηγορίες
              </Text>
            </View>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 20 }}
            >
              {displayCategories.map((category) => {
                const isSelected = selectedCategory === category.name;
                const isAllOption = category.name === "Όλα";
                return (
                  <TouchableOpacity
                    key={category.name}
                    onPress={() => setSelectedCategory(category.name)}
                    className={`mr-3 rounded-2xl size-20 overflow-hidden items-center justify-center relative border-2 ${
                      isSelected ? "border-primary" : "border-transparent"
                    } ${
                      isAllOption 
                        ? (isSelected ? "bg-primary" : "bg-surface")
                        : (!category.image ? (isSelected ? "bg-primary" : "bg-surface") : "")
                    }`}
                  >
                    {category.image && !isAllOption ? (
                      <>
                        <Image
                          source={getOptimizedUrl(category.image) ?? category.image}
                          className="absolute inset-0 w-full h-full"
                          contentFit="cover"
                          cachePolicy="disk"
                          transition={300}
                        />
                        {category.icon && (
                          <Text className="text-3xl relative z-10">{category.icon}</Text>
                        )}
                      </>
                    ) : isAllOption && category.icon ? (
                      <Icon
                        name={category.icon as "grid-outline"}
                        size={36}
                        color={isSelected ? "#121212" : "#fff"}
                      />
                    ) : category.icon ? (
                      <Text className="text-3xl">{category.icon}</Text>
                    ) : null}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}
        </View>

        <View className="px-6 mb-6">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-text-primary text-lg font-bold">Προϊόντα</Text>
            <Text className="text-text-secondary text-sm">{filteredProducts.length} {filteredProducts.length === 1 ? "προϊόν" : "προϊόντα"}</Text>
          </View>

          {/* PRODUCTS GRID */}
          <ProductsGrid products={filteredProducts} isLoading={isLoading} isError={isError} />
        </View>
      </ScrollView>
    </SafeScreen>
  );
};

export default ShopScreen;
