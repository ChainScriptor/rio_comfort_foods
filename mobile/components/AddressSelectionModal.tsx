import { useAddresses } from "@/hooks/useAddressess";
import { Address } from "@/types";
import CloseIcon from "@/assets/icons/CloseIcon.svg";
import CheckmarkIcon from "@/assets/icons/CheckmarkIcon.svg";
import CalendarIcon from "@/assets/icons/CalendarIcon.svg";
import ChevronForwardIcon from "@/assets/icons/ChevronForwardIcon.svg";
import ArrowForwardIcon from "@/assets/icons/ArrowForwardIcon.svg";
import { useState } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  TextInput,
  Platform,
  Keyboard,
  Alert,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";

interface AddressSelectionModalProps {
  visible: boolean;
  onClose: () => void;
  onProceed: (address: Address, deliveryDate?: Date, comments?: string) => void;
  isProcessing: boolean;
}

const AddressSelectionModal = ({
  visible,
  onClose,
  onProceed,
  isProcessing,
}: AddressSelectionModalProps) => {
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const { addresses, isLoading: addressesLoading } = useAddresses();
  
  // Check if current time is after 7:00 AM
  const isAfter7AM = () => {
    const now = new Date();
    return now.getHours() >= 7;
  };

  // Calculate tomorrow's date as default
  const getTomorrow = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(12, 0, 0, 0); // Set to noon
    return tomorrow;
  };

  // Get minimum date for picker (tomorrow if after 7 AM, today otherwise)
  const getMinimumDate = () => {
    if (isAfter7AM()) {
      // After 7 AM, minimum date is tomorrow
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      return tomorrow;
    } else {
      // Before 7 AM, minimum date is today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return today;
    }
  };

  // Get default delivery date (tomorrow if after 7 AM, today otherwise)
  const getDefaultDeliveryDate = () => {
    if (isAfter7AM()) {
      return getTomorrow();
    } else {
      const today = new Date();
      today.setHours(12, 0, 0, 0); // Set to noon
      return today;
    }
  };
  
  const [deliveryDate, setDeliveryDate] = useState<Date>(getDefaultDeliveryDate());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [comments, setComments] = useState("");

  // Reset when modal closes
  const handleClose = () => {
    setSelectedAddress(null);
    setDeliveryDate(getTomorrow());
    setComments("");
    setShowDatePicker(false);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View className="flex-1 bg-black/50">
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => {
            Keyboard.dismiss();
            handleClose();
          }}
          className="flex-1"
        />
        {/* Use a plain View here so that taps inside TextInput (comments)
            are not intercepted by TouchableWithoutFeedback, which was
            preventing typing on web. */}
        <View className="bg-background rounded-t-3xl" style={{ height: "85%", maxHeight: 700 }}>
          {/* Modal Header */}
          <View className="flex-row items-center justify-between p-6 border-b border-surface">
            <Text className="text-text-primary text-2xl font-bold">Επιλογή Διεύθυνσης</Text>
            <TouchableOpacity onPress={handleClose} className="bg-surface rounded-full p-2">
              <CloseIcon width={24} height={24} stroke="#FFFFFF" color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* ADDRESSES LIST */}
          <ScrollView 
            className="flex-1" 
            contentContainerStyle={{ padding: 24, paddingBottom: 16 }}
            showsVerticalScrollIndicator={true}
            nestedScrollEnabled={true}
            keyboardShouldPersistTaps="handled"
          >
            {addressesLoading ? (
              <View className="py-8">
                <ActivityIndicator size="large" color="#FFD700" />
              </View>
            ) : (
              <View className="gap-4">
                {addresses?.map((address: Address) => (
                  <TouchableOpacity
                    key={address._id}
                    className={`bg-surface rounded-3xl p-6 border-2 ${
                      selectedAddress?._id === address._id
                        ? "border-primary"
                        : "border-background-lighter"
                    }`}
                    activeOpacity={0.7}
                    onPress={() => {
                      setSelectedAddress(address);
                      // Reset delivery date and comments when selecting new address
                      setDeliveryDate(getDefaultDeliveryDate());
                      setComments("");
                    }}
                  >
                    <View className="flex-row items-start justify-between">
                      <View className="flex-1">
                        <View className="flex-row items-center mb-3">
                          <Text className="text-primary font-bold text-lg mr-2">
                            {address.storeLocation}
                          </Text>
                          {address.isDefault && (
                            <View className="bg-primary/20 rounded-full px-3 py-1">
                              <Text className="text-primary text-sm font-semibold">Προεπιλογή</Text>
                            </View>
                          )}
                        </View>
                        <Text className="text-text-primary font-semibold text-lg mb-2">
                          {address.fullName}
                        </Text>
                        <Text className="text-text-secondary text-base leading-6 mb-1">
                          {address.streetAddress}
                        </Text>
                        <Text className="text-text-secondary text-base mb-2">
                          {address.city}, {address.state} {address.zipCode}
                        </Text>
                        <Text className="text-text-secondary text-base">{address.phoneNumber}</Text>
                      </View>
                      {selectedAddress?._id === address._id && (
                        <View className="bg-primary rounded-full p-2 ml-3">
                          <CheckmarkIcon width={24} height={24} stroke="#121212" color="#121212" />
                        </View>
                      )}
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </ScrollView>

          {/* DELIVERY DATE & COMMENTS SECTION */}
          {selectedAddress && (
            <View className="px-6 py-4 border-t border-surface">
              {/* Delivery Date */}
              <View className="mb-4">
                <Text className="text-text-primary font-bold text-base mb-2">
                  Ημερομηνία Παραλαβής
                </Text>
                <TouchableOpacity
                  className="bg-surface rounded-2xl p-4 flex-row items-center justify-between"
                  activeOpacity={0.7}
                  onPress={() => setShowDatePicker(true)}
                >
                  <View className="flex-row items-center">
                    <CalendarIcon width={20} height={20} stroke="#FFD700" color="#FFD700" />
                    <Text className="text-text-primary font-semibold ml-3">
                      {deliveryDate.toLocaleDateString("el-GR", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </Text>
                  </View>
                  <ChevronForwardIcon width={20} height={20} stroke="#666" color="#666" />
                </TouchableOpacity>
                
                {showDatePicker && Platform.OS !== "web" && (
                  <DateTimePicker
                    value={deliveryDate}
                    mode="date"
                    display={Platform.OS === "ios" ? "spinner" : "default"}
                    minimumDate={getMinimumDate()}
                    onChange={(event, selectedDate) => {
                      if (Platform.OS === "android") {
                        setShowDatePicker(false);
                      }
                      if (selectedDate) {
                        setDeliveryDate(selectedDate);
                      }
                    }}
                  />
                )}
                {showDatePicker && Platform.OS === "web" && (
                  <View className="mt-2">
                    <input
                      type="date"
                      value={deliveryDate.toISOString().split("T")[0]}
                      min={getMinimumDate().toISOString().split("T")[0]}
                      onChange={(e) => {
                        if (e.target.value) {
                          setDeliveryDate(new Date(e.target.value));
                          setShowDatePicker(false);
                        }
                      }}
                      style={{
                        width: "100%",
                        padding: "12px",
                        borderRadius: "16px",
                        backgroundColor: "#1E1E1E",
                        color: "#FFFFFF",
                        border: "none",
                      }}
                    />
                  </View>
                )}
              </View>

              {/* Comments */}
              <View className="mb-4">
                <Text className="text-text-primary font-bold text-base mb-2">
                  Σχόλια (Προαιρετικό)
                </Text>
                <TextInput
                  className="bg-surface rounded-2xl p-4 text-text-primary min-h-[100px]"
                  placeholder="Προσθέστε σχόλια για την παραγγελία σας..."
                  placeholderTextColor="#666"
                  multiline
                  numberOfLines={4}
                  value={comments}
                  onChangeText={setComments}
                  textAlignVertical="top"
                  blurOnSubmit={true}
                />
              </View>
            </View>
          )}

          <View className="p-6 border-t border-surface">
            <TouchableOpacity
              className="bg-primary rounded-2xl py-5"
              activeOpacity={0.9}
              onPress={() => {
                if (!selectedAddress) return;

                const storeLocation = selectedAddress.storeLocation?.toString().trim();
                if (!storeLocation) {
                  Alert.alert(
                    "Ελλιπής διεύθυνση",
                    "Παρακαλώ επιλέξτε \"Περιοχή Καταστήματος\" για τη διεύθυνσή σας πριν ολοκληρώσετε την παραγγελία."
                  );
                  return;
                }

                onProceed(
                  { ...selectedAddress, storeLocation } as Address,
                  deliveryDate,
                  comments.trim() || undefined
                );
              }}
              disabled={!selectedAddress || isProcessing}
            >
              <View className="flex-row items-center justify-center">
                {isProcessing ? (
                  <ActivityIndicator size="small" color="#121212" />
                ) : (
                  <>
                    <Text className="text-background font-bold text-lg mr-2">
                      Ολοκλήρωση Παραγγελίας
                    </Text>
                    <ArrowForwardIcon width={20} height={20} stroke="#121212" color="#121212" />
                  </>
                )}
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default AddressSelectionModal;
