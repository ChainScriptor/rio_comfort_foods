import { View, Text, TouchableOpacity } from "react-native";
import ArrowBackIcon from "@/assets/icons/ArrowBackIcon.svg";
import { router } from "expo-router";

export default function AddressesHeader() {
  return (
    <View className="px-6 pb-5 border-b border-surface flex-row items-center">
      <TouchableOpacity onPress={() => router.back()} className="mr-4">
        <ArrowBackIcon width={28} height={28} stroke="#FFFFFF" color="#FFFFFF" />
      </TouchableOpacity>
      <Text className="text-text-primary text-2xl font-bold">Οι Διευθύνσεις Μου</Text>
    </View>
  );
}
