import ProductsGrid from "@/components/ProductsGrid";
import SafeScreen from "@/components/SafeScreen";
import useProducts from "@/hooks/useProducts";
import useCategories from "@/hooks/useCategories";

import { Ionicons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, TextInput, Image, ActivityIndicator } from "react-native";

const ShopScreen = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Όλα");

  const { data: products, isLoading, isError } = useProducts();
  const { data: categories = [], isLoading: categoriesLoading, isError: categoriesError, error: categoriesErrorDetails } = useCategories();

  // Debug logging
  if (categories.length > 0) {
    console.log("✅ Categories in ShopScreen:", categories);
  }
  if (categoriesError) {
    console.error("❌ Categories error in ShopScreen:", categoriesErrorDetails);
    console.error("Error response:", categoriesErrorDetails?.response?.data);
    console.error("Error status:", categoriesErrorDetails?.response?.status);
  }

  // Build categories list with "All" option
  const displayCategories = useMemo(() => {
    const allOption = { name: "Όλα", icon: "grid-outline" as const };
    const categoryOptions = categories.map((cat) => ({
      name: cat.name,
      icon: cat.icon,
      image: cat.image,
    }));
    return [allOption, ...categoryOptions];
  }, [categories]);

  const filteredProducts = useMemo(() => {
    if (!products) return [];

    let filtered = products;

    // filtering by category
    if (selectedCategory !== "Όλα") {
      filtered = filtered.filter((product) => product.category === selectedCategory);
    }

    // filtering by searh query
    if (searchQuery.trim()) {
      filtered = filtered.filter((product) =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return filtered;
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
              <Ionicons name="options-outline" size={22} color={"#fff"} />
            </TouchableOpacity>
          </View>

          {/* SEARCH BAR */}
          <View className="bg-surface flex-row items-center px-5 py-4 rounded-2xl">
            <Ionicons color={"#666"} size={22} name="search" />
            <TextInput
              placeholder="Αναζήτηση προϊόντων"
              placeholderTextColor={"#666"}
              className="flex-1 ml-3 text-base text-text-primary"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
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
                          source={{ uri: category.image }} 
                          className="absolute inset-0 w-full h-full"
                          resizeMode="cover"
                        />
                        {category.icon && (
                          <Text className="text-3xl relative z-10">{category.icon}</Text>
                        )}
                      </>
                    ) : isAllOption && category.icon ? (
                      <Ionicons
                        name={category.icon}
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
