import SafeScreen from "@/components/SafeScreen";
import { Icon, type IconName } from "@/components/Icon";
import ArrowBackIcon from "@/assets/icons/ArrowBackIcon.svg";
import ChevronForwardIcon from "@/assets/icons/ChevronForwardIcon.svg";
import TrashIcon from "@/assets/icons/TrashIcon.svg";
import InfoCircleIcon from "@/assets/icons/InfoCircleIcon.svg";
import { router } from "expo-router";
import { useState } from "react";
import { ScrollView, Switch, Text, TouchableOpacity, View } from "react-native";

type SecurityOption = {
  id: string;
  icon: string;
  title: string;
  description: string;
  type: "navigation" | "toggle";
  value?: boolean;
};

function PrivacyAndSecurityScreen() {
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [marketingEmails, setMarketingEmails] = useState(false);
  const [shareData, setShareData] = useState(false);

  const securitySettings: SecurityOption[] = [
    {
      id: "password",
      icon: "lock-closed-outline",
      title: "Αλλαγή Κωδικού",
      description: "Ενημέρωση του κωδικού πρόσβασης του λογαριασμού σας",
      type: "navigation",
    },
    {
      id: "two-factor",
      icon: "shield-checkmark-outline",
      title: "Διπλή Επαλήθευση",
      description: "Προσθήκη επιπλέον επιπέδου ασφάλειας",
      type: "toggle",
      value: twoFactorEnabled,
    },
  ];

  const privacySettings: SecurityOption[] = [
    {
      id: "push",
      icon: "notifications-outline",
      title: "Push Ειδοποιήσεις",
      description: "Λήψη push ειδοποιήσεων",
      type: "toggle",
      value: pushNotifications,
    },
    {
      id: "email",
      icon: "mail-outline",
      title: "Email Ειδοποιήσεις",
      description: "Λήψη ενημερώσεων παραγγελιών μέσω email",
      type: "toggle",
      value: emailNotifications,
    },
    {
      id: "marketing",
      icon: "megaphone-outline",
      title: "Marketing Emails",
      description: "Λήψη προωθητικών emails",
      type: "toggle",
      value: marketingEmails,
    },
    {
      id: "data",
      icon: "analytics-outline",
      title: "Κοινοποίηση Δεδομένων Χρήσης",
      description: "Βοηθήστε μας να βελτιώσουμε την εφαρμογή",
      type: "toggle",
      value: shareData,
    },
  ];

  const accountSettings = [
    {
      id: "activity",
      icon: "time-outline",
      title: "Δραστηριότητα Λογαριασμού",
      description: "Προβολή πρόσφατης δραστηριότητας σύνδεσης",
    },
    {
      id: "devices",
      icon: "phone-portrait-outline",
      title: "Συνδεδεμένες Συσκευές",
      description: "Διαχείριση συσκευών με πρόσβαση",
    },
    {
      id: "data-download",
      icon: "download-outline",
      title: "Λήψη Δεδομένων σας",
      description: "Λάβετε ένα αντίγραφο των δεδομένων σας",
    },
  ];

  const handleToggle = (id: string, value: boolean) => {
    switch (id) {
      case "two-factor":
        setTwoFactorEnabled(value);
        break;
      case "push":
        setPushNotifications(value);
        break;
      case "email":
        setEmailNotifications(value);
        break;
      case "marketing":
        setMarketingEmails(value);
        break;
      case "data":
        setShareData(value);
        break;
    }
  };

  return (
    <SafeScreen>
      {/* HEADER */}
      <View className="px-6 pb-5 border-b border-surface flex-row items-center">
        <TouchableOpacity onPress={() => router.back()} className="mr-4">
          <ArrowBackIcon width={28} height={28} stroke="#fff" color="#fff" />
        </TouchableOpacity>
        <Text className="text-text-primary text-2xl font-bold">Απόρρητο & Ασφάλεια</Text>
      </View>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 80 }}
      >
        {/* SECURITY SETTING */}
        <View className="px-6 pt-6">
          <Text className="text-text-primary text-lg font-bold mb-4">Ασφάλεια</Text>

          {securitySettings.map((setting) => (
            <TouchableOpacity
              key={setting.id}
              className="bg-surface rounded-2xl p-4 mb-3"
              activeOpacity={setting.type === "toggle" ? 1 : 0.7}
            >
              <View className="flex-row items-center">
                <View className="bg-primary/20 rounded-full w-12 h-12 items-center justify-center mr-4">
                  <Icon name={setting.icon as IconName} size={24} color="#FFD700" />
                </View>

                <View className="flex-1">
                  <Text className="text-text-primary font-bold text-base mb-1">
                    {setting.title}
                  </Text>
                  <Text className="text-text-secondary text-sm">{setting.description}</Text>
                </View>

                {setting.type === "toggle" ? (
                  <Switch
                    value={setting.value}
                    onValueChange={(value) => handleToggle(setting.id, value)}
                    thumbColor="#FFFFFF"
                    trackColor={{ false: "#2A2A2A", true: "#FFD700" }}
                  />
                ) : (
                  <ChevronForwardIcon width={20} height={20} stroke="#666" color="#666" />
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Privacy Section */}
        <View className="px-6 pt-4">
          <Text className="text-text-primary text-lg font-bold mb-4">Απόρρητο</Text>

          {privacySettings.map((setting) => (
            <View key={setting.id}>
              <View className="bg-surface rounded-2xl p-4 mb-3">
                <View className="flex-row items-center">
                  <View className="bg-primary/20 rounded-full w-12 h-12 items-center justify-center mr-4">
                    <Icon name={setting.icon as IconName} size={24} color="#FFD700" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-text-primary font-bold text-base mb-1">
                      {setting.title}
                    </Text>
                    <Text className="text-text-secondary text-sm">{setting.description}</Text>
                  </View>
                  <Switch
                    value={setting.value}
                    onValueChange={(value) => handleToggle(setting.id, value)}
                    trackColor={{ false: "#2A2A2A", true: "#FFD700" }}
                    thumbColor="#FFFFFF"
                  />
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* ACCOUNT SECTION */}
        <View className="px-6 pt-4">
          <Text className="text-text-primary text-lg font-bold mb-4">Λογαριασμός</Text>

          {accountSettings.map((setting) => (
            <TouchableOpacity
              key={setting.id}
              className="bg-surface rounded-2xl p-4 mb-3"
              activeOpacity={0.7}
            >
              <View className="flex-row items-center">
                <View className="bg-primary/20 rounded-full w-12 h-12 items-center justify-center mr-4">
                  <Icon name={setting.icon as IconName} size={24} color="#FFD700" />
                </View>
                <View className="flex-1">
                  <Text className="text-text-primary font-bold text-base mb-1">
                    {setting.title}
                  </Text>
                  <Text className="text-text-secondary text-sm">{setting.description}</Text>
                </View>
                <ChevronForwardIcon width={20} height={20} stroke="#666" color="#666" />
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* DELETE ACC BTN */}
        <View className="px-6 pt-4">
          <TouchableOpacity
            className="bg-surface rounded-2xl p-5 flex-row items-center justify-between border-2 border-red-500/20"
            activeOpacity={0.7}
          >
            <View className="flex-row items-center">
              <View className="bg-red-500/20 rounded-full w-12 h-12 items-center justify-center mr-4">
                <TrashIcon width={24} height={24} stroke="#EF4444" color="#EF4444" />
              </View>
              <View>
                <Text className="text-red-500 font-bold text-base mb-1">Διαγραφή Λογαριασμού</Text>
                <Text className="text-text-secondary text-sm">Οριστική διαγραφή του λογαριασμού σας</Text>
              </View>
            </View>
            <ChevronForwardIcon width={20} height={20} stroke="#EF4444" color="#EF4444" />
          </TouchableOpacity>
        </View>

        {/* INFO ALERT */}
        <View className="px-6 pt-6 pb-4">
          <View className="bg-primary/10 rounded-2xl p-4 flex-row">
            <InfoCircleIcon width={24} height={24} stroke="#FFD700" color="#FFD700" />
            <Text className="text-text-secondary text-sm ml-3 flex-1">
              Παίρνουμε το απόρρητό σας σοβαρά. Τα δεδομένα σας είναι κρυπτογραφημένα και αποθηκευμένα με ασφάλεια. Μπορείτε να διαχειριστείτε τις ρυθμίσεις απορρήτου σας ανά πάσα στιγμή.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeScreen>
  );
}

export default PrivacyAndSecurityScreen;
