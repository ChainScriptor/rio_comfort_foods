import SafeScreen from "@/components/SafeScreen";
import { useAuth, useUser } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState, useEffect } from "react";
import {
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Alert,
  ActivityIndicator,
  Image,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useApi } from "@/lib/api";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useProfile } from "@/hooks/useProfile";

export default function EditProfileScreen() {
  const { user } = useUser();
  const { getToken } = useAuth();
  const api = useApi();
  const queryClient = useQueryClient();
  const { data: profileData } = useProfile();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    // Use profile data from backend if available, otherwise fallback to Clerk user
    if (profileData) {
      setFirstName(profileData.firstName || "");
      setLastName(profileData.lastName || "");
      setImageUri(profileData.imageUrl || null);
    } else if (user) {
      setFirstName(user.firstName || "");
      setLastName(user.lastName || "");
      setImageUri(user.imageUrl || null);
    }
  }, [user, profileData]);

  const pickImage = async () => {
    try {
      // Request permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Δικαίωμα Απαιτείται",
          "Χρειάζεται άδεια για πρόσβαση στις φωτογραφίες σας."
        );
        return;
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'images',
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setImageUri(result.assets[0].uri);
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Σφάλμα", "Δεν ήταν δυνατή η επιλογή εικόνας");
    }
  };

  const uploadImageToBackend = async (uri: string): Promise<string> => {
    try {
      const formData = new FormData();
      const filename = uri.split("/").pop() || "profile.jpg";
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : "image/jpeg";

      formData.append("image", {
        uri,
        name: filename,
        type,
      } as any);

      const token = await getToken();
      const baseURL = api.defaults.baseURL || "http://192.168.1.13:3000/api";
      const response = await fetch(`${baseURL}/users/profile/image`, {
        method: "POST",
        body: formData,
        headers: {
          Authorization: `Bearer ${token}`,
          // Don't set Content-Type, let fetch set it with boundary
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to upload image");
      }

      const data = await response.json();
      return data.imageUrl;
    } catch (error) {
      console.error("Error uploading image:", error);
      throw error;
    }
  };

  const updateProfileMutation = useMutation({
    mutationFn: async (data: { firstName: string; lastName: string; imageUrl?: string }) => {
      const response = await api.put("/users/profile", data);
      return response.data;
    },
    onSuccess: async (data) => {
      // Update Clerk user name only (imageUrl is stored in backend, not in Clerk)
      if (user) {
        try {
          await user.update({
            firstName: firstName.trim(),
            lastName: lastName.trim(),
          });
          console.log("Clerk user updated, reloading...");
          // Reload user to get the latest data
          await user.reload();
          console.log("Clerk user reloaded");
        } catch (error) {
          console.error("Error updating Clerk user:", error);
          // Don't fail the whole operation if Clerk update fails
        }
      }

      // Invalidate queries to refresh the profile screen
      queryClient.invalidateQueries({ queryKey: ["user"] });
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      
      Alert.alert("Επιτυχία", "Το προφίλ ενημερώθηκε επιτυχώς");
      router.back();
    },
    onError: (error: any) => {
      console.error("Error updating profile:", error);
      Alert.alert(
        "Σφάλμα",
        error?.response?.data?.error || "Δεν ήταν δυνατή η ενημέρωση του προφίλ"
      );
    },
  });

  const handleSave = async () => {
    if (!firstName.trim() || !lastName.trim()) {
      Alert.alert("Σφάλμα", "Παρακαλώ συμπληρώστε όνομα και επώνυμο");
      return;
    }

    setIsUploading(true);
    try {
      let finalImageUrl = imageUri;

      // If image is a local URI, upload it first
      if (imageUri && !imageUri.startsWith("http")) {
        console.log("Uploading local image:", imageUri);
        finalImageUrl = await uploadImageToBackend(imageUri);
        console.log("Image uploaded, URL:", finalImageUrl);
        // Update local state with the uploaded URL
        setImageUri(finalImageUrl);
      }

      console.log("Sending profile update with imageUrl:", finalImageUrl);
      updateProfileMutation.mutate({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        ...(finalImageUrl && { imageUrl: finalImageUrl }),
      });
      setIsUploading(false);
    } catch (error: any) {
      console.error("Error saving profile:", error);
      Alert.alert("Σφάλμα", error?.message || "Δεν ήταν δυνατή η αποθήκευση της εικόνας");
      setIsUploading(false);
    }
  };

  return (
    <SafeScreen>
      {/* HEADER */}
      <View className="px-6 pb-5 border-b border-surface flex-row items-center">
        <TouchableOpacity onPress={() => router.back()} className="mr-4">
          <Ionicons name="arrow-back" size={28} color="#fff" />
        </TouchableOpacity>
        <Text className="text-text-primary text-2xl font-bold">Επεξεργασία Προφίλ</Text>
      </View>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 80 }}
      >
        <View className="px-6 pt-6">
          {/* PROFILE IMAGE */}
          <View className="items-center mb-6">
            <TouchableOpacity
              onPress={pickImage}
              activeOpacity={0.7}
              className="relative"
            >
              {imageUri ? (
                <Image
                  source={{ uri: imageUri }}
                  style={{ width: 120, height: 120, borderRadius: 60 }}
                />
              ) : (
                <View className="bg-surface rounded-full w-30 h-30 items-center justify-center">
                  <Ionicons name="person" size={60} color="#666" />
                </View>
              )}
              <View className="absolute bottom-0 right-0 bg-primary rounded-full w-10 h-10 items-center justify-center border-4 border-background">
                <Ionicons name="camera" size={20} color="#121212" />
              </View>
            </TouchableOpacity>
            <Text className="text-text-secondary text-sm mt-2">
              Πατήστε για αλλαγή φωτογραφίας
            </Text>
          </View>

          {/* FIRST NAME */}
          <View className="mb-4">
            <Text className="text-text-primary font-semibold text-base mb-2">Όνομα</Text>
            <TextInput
              className="bg-surface rounded-xl px-4 py-4 text-text-primary text-base"
              placeholder="Όνομα"
              placeholderTextColor="#666"
              value={firstName}
              onChangeText={setFirstName}
            />
          </View>

          {/* LAST NAME */}
          <View className="mb-6">
            <Text className="text-text-primary font-semibold text-base mb-2">Επώνυμο</Text>
            <TextInput
              className="bg-surface rounded-xl px-4 py-4 text-text-primary text-base"
              placeholder="Επώνυμο"
              placeholderTextColor="#666"
              value={lastName}
              onChangeText={setLastName}
            />
          </View>

          {/* EMAIL (READ ONLY) */}
          <View className="mb-6">
            <Text className="text-text-primary font-semibold text-base mb-2">Email</Text>
            <View className="bg-surface/50 rounded-xl px-4 py-4">
              <Text className="text-text-secondary text-base">
                {user?.emailAddresses?.[0]?.emailAddress || "Χωρίς email"}
              </Text>
            </View>
            <Text className="text-text-secondary text-xs mt-1">
              Το email δεν μπορεί να αλλάξει
            </Text>
          </View>

          {/* SAVE BUTTON */}
          <TouchableOpacity
            className="bg-primary rounded-2xl py-4 flex-row items-center justify-center mt-4"
            activeOpacity={0.8}
            onPress={handleSave}
            disabled={isUploading || updateProfileMutation.isPending}
          >
            {isUploading || updateProfileMutation.isPending ? (
              <ActivityIndicator size="small" color="#121212" />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={24} color="#121212" />
                <Text className="text-background font-bold text-lg ml-2">Αποθήκευση</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeScreen>
  );
}
