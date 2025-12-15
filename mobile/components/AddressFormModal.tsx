import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Switch,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import SafeScreen from "./SafeScreen";
import { Ionicons } from "@expo/vector-icons";

interface AddressFormData {
  label: string;
  fullName: string;
  streetAddress: string;
  city: string;
  state: string;
  zipCode: string;
  phoneNumber: string;
  isDefault: boolean;
}

interface AddressFormModalProps {
  visible: boolean;
  isEditing: boolean;
  addressForm: AddressFormData;
  isAddingAddress: boolean;
  isUpdatingAddress: boolean;
  onClose: () => void;
  onSave: () => void;
  onFormChange: (form: AddressFormData) => void;
}

const AddressFormModal = ({
  addressForm,
  isAddingAddress,
  isEditing,
  isUpdatingAddress,
  onClose,
  onFormChange,
  onSave,
  visible,
}: AddressFormModalProps) => {
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <SafeScreen>
          {/* HEADER */}
          <View className="px-6 py-5 border-b border-surface flex-row items-center justify-between">
            <Text className="text-text-primary text-2xl font-bold">
              {isEditing ? "Επεξεργασία Διεύθυνσης" : "Προσθήκη Νέας Διεύθυνσης"}
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={28} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          <ScrollView
            className="flex-1"
            contentContainerStyle={{ paddingBottom: 50 }}
            showsVerticalScrollIndicator={false}
          >
            <View className="p-6">
              {/* LABEL INPUT */}
              <View className="mb-5">
                <Text className="text-text-primary font-semibold mb-2">Ετικέτα</Text>
                <TextInput
                  className="bg-surface text-text-primary p-4 rounded-2xl text-base"
                  placeholder="π.χ., Σπίτι, Εργασία, Γραφείο"
                  placeholderTextColor="#666"
                  value={addressForm.label}
                  onChangeText={(text) => onFormChange({ ...addressForm, label: text })}
                />
              </View>

              {/* NAME INPUT */}
              <View className="mb-5">
                <Text className="text-text-primary font-semibold mb-2">Πλήρες Όνομα</Text>
                <TextInput
                  className="bg-surface text-text-primary px-4 py-4 rounded-2xl text-base"
                  placeholder="Εισάγετε το πλήρες όνομά σας"
                  placeholderTextColor="#666"
                  value={addressForm.fullName}
                  onChangeText={(text) => onFormChange({ ...addressForm, fullName: text })}
                />
              </View>

              {/* Address Input */}
              <View className="mb-5">
                <Text className="text-text-primary font-semibold mb-2">Οδός</Text>
                <TextInput
                  className="bg-surface text-text-primary px-4 py-4 rounded-2xl text-base"
                  placeholder="Οδός, αριθμός, όροφος"
                  placeholderTextColor="#666"
                  value={addressForm.streetAddress}
                  onChangeText={(text) => onFormChange({ ...addressForm, streetAddress: text })}
                  multiline
                />
              </View>

              {/* City Input */}
              <View className="mb-5">
                <Text className="text-text-primary font-semibold mb-2">Πόλη</Text>
                <TextInput
                  className="bg-surface text-text-primary px-4 py-4 rounded-2xl text-base"
                  placeholder="π.χ., Αθήνα"
                  placeholderTextColor="#666"
                  value={addressForm.city}
                  onChangeText={(text) => onFormChange({ ...addressForm, city: text })}
                />
              </View>

              {/* State Input */}
              <View className="mb-5">
                <Text className="text-text-primary font-semibold mb-2">Νομός</Text>
                <TextInput
                  className="bg-surface text-text-primary px-4 py-4 rounded-2xl text-base"
                  placeholder="π.χ., Αττική"
                  placeholderTextColor="#666"
                  value={addressForm.state}
                  onChangeText={(text) => onFormChange({ ...addressForm, state: text })}
                />
              </View>

              {/* ZIP Code Input */}
              <View className="mb-5">
                <Text className="text-text-primary font-semibold mb-2">Ταχυδρομικός Κώδικας</Text>
                <TextInput
                  className="bg-surface text-text-primary px-4 py-4 rounded-2xl text-base"
                  placeholder="π.χ., 10431"
                  placeholderTextColor="#666"
                  value={addressForm.zipCode}
                  onChangeText={(text) => onFormChange({ ...addressForm, zipCode: text })}
                  keyboardType="numeric"
                />
              </View>

              {/* Phone Input */}
              <View className="mb-5">
                <Text className="text-text-primary font-semibold mb-2">Τηλέφωνο</Text>
                <TextInput
                  className="bg-surface text-text-primary px-4 py-4 rounded-2xl text-base"
                  placeholder="π.χ., 2101234567"
                  placeholderTextColor="#666"
                  value={addressForm.phoneNumber}
                  onChangeText={(text) => onFormChange({ ...addressForm, phoneNumber: text })}
                  keyboardType="phone-pad"
                />
              </View>

              {/* Default Address Toggle */}
              <View className="bg-surface rounded-2xl p-4 flex-row items-center justify-between mb-6">
                <Text className="text-text-primary font-semibold">Ορισμός ως προεπιλεγμένη διεύθυνση</Text>
                <Switch
                  value={addressForm.isDefault}
                  onValueChange={(value) => onFormChange({ ...addressForm, isDefault: value })}
                  thumbColor="white"
                />
              </View>

              {/* Save Button */}
              <TouchableOpacity
                className="bg-primary rounded-2xl py-5 items-center"
                activeOpacity={0.8}
                onPress={onSave}
                disabled={isAddingAddress || isUpdatingAddress}
              >
                {isAddingAddress || isUpdatingAddress ? (
                  <ActivityIndicator size="small" color="#121212" />
                ) : (
                  <Text className="text-background font-bold text-lg">
                    {isEditing ? "Αποθήκευση Αλλαγών" : "Προσθήκη Διεύθυνσης"}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </SafeScreen>
      </KeyboardAvoidingView>
    </Modal>
  );
};

export default AddressFormModal;
