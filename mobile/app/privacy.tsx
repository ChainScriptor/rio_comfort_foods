import SafeScreen from "@/components/SafeScreen";
import ArrowBackIcon from "@/assets/icons/ArrowBackIcon.svg";
import LanguageIcon from "@/assets/icons/LanguageIcon.svg";
import InfoCircleIcon from "@/assets/icons/InfoCircleIcon.svg";
import DocumentTextIcon from "@/assets/icons/DocumentTextIcon.svg";
import ServerIcon from "@/assets/icons/ServerIcon.svg";
import TrashIcon from "@/assets/icons/TrashIcon.svg";
import MailIcon from "@/assets/icons/MailIcon.svg";
import RefreshIcon from "@/assets/icons/RefreshIcon.svg";
import { router } from "expo-router";
import { useState } from "react";
import { ScrollView, Text, TouchableOpacity, View, Linking } from "react-native";

export default function PrivacyPolicyScreen() {
  const [language, setLanguage] = useState<"el" | "en">("el");

  const content = {
    el: {
      title: "Πολιτική Απορρήτου",
      purpose: {
        title: "Σκοπός",
        text: "Η εφαρμογή Comfort Foods είναι μια B2B (Business-to-Business) πλατφόρμα που επιτρέπει σε επιχειρήσεις να κάνουν παραγγελίες χονδρικής προϊόντων.",
      },
      data: {
        title: "Δεδομένα που Συλλέγουμε",
        items: [
          "Ονοματεπώνυμο: Συλλέγεται μέσω του Clerk για την ταυτοποίηση χρηστών",
          "Email: Συλλέγεται μέσω του Clerk για επικοινωνία και ενημερώσεις",
          "Διευθύνσεις Καταστημάτων: Οι χρήστες μπορούν να προσθέσουν και να διαχειριστούν διευθύνσεις παραλαβής",
          "Ιστορικό Παραγγελιών: Αποθηκεύουμε το ιστορικό των παραγγελιών για λόγους λογιστικής και παρακολούθησης",
        ],
      },
      services: {
        title: "Υπηρεσίες Τρίτων",
        items: [
          "Clerk: Χρησιμοποιούμε το Clerk για την ταυτοποίηση και διαχείριση χρηστών. Το Clerk συλλέγει και επεξεργάζεται τα στοιχεία ταυτοποίησης σύμφωνα με τη δική του πολιτική απορρήτου.",
          "MongoDB: Χρησιμοποιούμε τη MongoDB για την αποθήκευση των δεδομένων σας. Τα δεδομένα είναι ασφαλή και κρυπτογραφημένα.",
          "Cloudinary: Χρησιμοποιούμε το Cloudinary για την αποθήκευση και διαχείριση εικόνων προϊόντων. Οι εικόνες είναι δημόσια προσβάσιμες.",
        ],
      },
      deletion: {
        title: "Διαγραφή Δεδομένων",
        text: "Εάν επιθυμείτε να διαγράψετε τα δεδομένα σας, μπορείτε να επικοινωνήσετε μαζί μας στο:",
        email: "cryptictiger39@gmail.com",
        note: "Θα επεξεργαστούμε το αίτημά σας εντός 30 ημερών.",
      },
      updates: {
        title: "Ενημερώσεις",
        text: "Αυτή η πολιτική απορρήτου μπορεί να ενημερωθεί κατά καιρούς. Θα σας ενημερώσουμε για οποιεσδήποτε σημαντικές αλλαγές.",
      },
      contact: {
        title: "Επικοινωνία",
        text: "Για οποιεσδήποτε ερωτήσεις σχετικά με αυτή την πολιτική απορρήτου, επικοινωνήστε μαζί μας στο:",
      },
    },
    en: {
      title: "Privacy Policy",
      purpose: {
        title: "Purpose",
        text: "The Comfort Foods application is a B2B (Business-to-Business) platform that allows businesses to place wholesale product orders.",
      },
      data: {
        title: "Data We Collect",
        items: [
          "Full Name: Collected through Clerk for user identification",
          "Email: Collected through Clerk for communication and updates",
          "Store Addresses: Users can add and manage delivery addresses",
          "Order History: We store order history for accounting and tracking purposes",
        ],
      },
      services: {
        title: "Third-Party Services",
        items: [
          "Clerk: We use Clerk for user authentication and management. Clerk collects and processes identification data according to its own privacy policy.",
          "MongoDB: We use MongoDB to store your data. Data is secure and encrypted.",
          "Cloudinary: We use Cloudinary for storing and managing product images. Images are publicly accessible.",
        ],
      },
      deletion: {
        title: "Data Deletion",
        text: "If you wish to delete your data, you can contact us at:",
        email: "cryptictiger39@gmail.com",
        note: "We will process your request within 30 days.",
      },
      updates: {
        title: "Updates",
        text: "This privacy policy may be updated from time to time. We will notify you of any significant changes.",
      },
      contact: {
        title: "Contact",
        text: "For any questions regarding this privacy policy, please contact us at:",
      },
    },
  };

  const currentContent = content[language];

  const handleEmailPress = (email: string) => {
    Linking.openURL(`mailto:${email}`);
  };

  return (
    <SafeScreen>
      {/* HEADER */}
      <View className="px-6 pb-5 border-b border-surface flex-row items-center justify-between">
        <View className="flex-row items-center flex-1">
          <TouchableOpacity onPress={() => router.back()} className="mr-4">
            <ArrowBackIcon width={28} height={28} stroke="#fff" color="#fff" />
          </TouchableOpacity>
          <Text className="text-text-primary text-2xl font-bold">{currentContent.title}</Text>
        </View>
        
        {/* LANGUAGE TOGGLE */}
        <TouchableOpacity
          onPress={() => setLanguage(language === "el" ? "en" : "el")}
          className="bg-surface rounded-full px-4 py-2 flex-row items-center"
        >
          <LanguageIcon width={18} height={18} stroke="#FFD700" color="#FFD700" />
          <Text className="text-primary font-semibold ml-2">{language === "el" ? "EN" : "EL"}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        <View className="px-6 pt-6">
          {/* PURPOSE SECTION */}
          <View className="mb-6">
            <View className="flex-row items-center mb-3">
              <View className="bg-primary/20 rounded-full w-10 h-10 items-center justify-center mr-3">
                <InfoCircleIcon width={20} height={20} stroke="#FFD700" color="#FFD700" />
              </View>
              <Text className="text-text-primary text-xl font-bold">{currentContent.purpose.title}</Text>
            </View>
            <View className="bg-surface rounded-2xl p-4">
              <Text className="text-text-secondary text-base leading-6">{currentContent.purpose.text}</Text>
            </View>
          </View>

          {/* DATA COLLECTION SECTION */}
          <View className="mb-6">
            <View className="flex-row items-center mb-3">
              <View className="bg-primary/20 rounded-full w-10 h-10 items-center justify-center mr-3">
                <DocumentTextIcon width={20} height={20} stroke="#FFD700" color="#FFD700" />
              </View>
              <Text className="text-text-primary text-xl font-bold">{currentContent.data.title}</Text>
            </View>
            <View className="bg-surface rounded-2xl p-4">
              {currentContent.data.items.map((item, index) => (
                <View key={index} className="flex-row mb-3 last:mb-0">
                  <Text className="text-primary mr-2">•</Text>
                  <Text className="text-text-secondary text-base leading-6 flex-1">{item}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* THIRD-PARTY SERVICES SECTION */}
          <View className="mb-6">
            <View className="flex-row items-center mb-3">
              <View className="bg-primary/20 rounded-full w-10 h-10 items-center justify-center mr-3">
                <ServerIcon width={20} height={20} stroke="#FFD700" color="#FFD700" />
              </View>
              <Text className="text-text-primary text-xl font-bold">{currentContent.services.title}</Text>
            </View>
            <View className="bg-surface rounded-2xl p-4">
              {currentContent.services.items.map((item, index) => (
                <View key={index} className="mb-4 last:mb-0">
                  <Text className="text-text-secondary text-base leading-6">{item}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* DATA DELETION SECTION */}
          <View className="mb-6">
            <View className="flex-row items-center mb-3">
              <View className="bg-primary/20 rounded-full w-10 h-10 items-center justify-center mr-3">
                <TrashIcon width={20} height={20} stroke="#FFD700" color="#FFD700" />
              </View>
              <Text className="text-text-primary text-xl font-bold">{currentContent.deletion.title}</Text>
            </View>
            <View className="bg-surface rounded-2xl p-4">
              <Text className="text-text-secondary text-base leading-6 mb-3">
                {currentContent.deletion.text}
              </Text>
              <TouchableOpacity
                onPress={() => handleEmailPress(currentContent.deletion.email)}
                className="bg-primary/20 rounded-xl p-3 mb-3"
              >
                <View className="flex-row items-center">
                  <MailIcon width={20} height={20} stroke="#FFD700" color="#FFD700" />
                  <Text className="text-primary font-semibold ml-2">{currentContent.deletion.email}</Text>
                </View>
              </TouchableOpacity>
              <Text className="text-text-secondary text-sm italic">{currentContent.deletion.note}</Text>
            </View>
          </View>

          {/* UPDATES SECTION */}
          <View className="mb-6">
            <View className="flex-row items-center mb-3">
              <View className="bg-primary/20 rounded-full w-10 h-10 items-center justify-center mr-3">
                <RefreshIcon width={20} height={20} stroke="#FFD700" color="#FFD700" />
              </View>
              <Text className="text-text-primary text-xl font-bold">{currentContent.updates.title}</Text>
            </View>
            <View className="bg-surface rounded-2xl p-4">
              <Text className="text-text-secondary text-base leading-6">{currentContent.updates.text}</Text>
            </View>
          </View>

          {/* CONTACT SECTION */}
          <View className="mb-6">
            <View className="flex-row items-center mb-3">
              <View className="bg-primary/20 rounded-full w-10 h-10 items-center justify-center mr-3">
                <MailIcon width={20} height={20} stroke="#FFD700" color="#FFD700" />
              </View>
              <Text className="text-text-primary text-xl font-bold">{currentContent.contact.title}</Text>
            </View>
            <View className="bg-surface rounded-2xl p-4">
              <Text className="text-text-secondary text-base leading-6 mb-3">
                {currentContent.contact.text}
              </Text>
              <TouchableOpacity
                onPress={() => handleEmailPress(currentContent.deletion.email)}
                className="bg-primary/20 rounded-xl p-3"
              >
                <View className="flex-row items-center">
                  <MailIcon width={20} height={20} stroke="#FFD700" color="#FFD700" />
                  <Text className="text-primary font-semibold ml-2">{currentContent.deletion.email}</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>

          {/* LAST UPDATED */}
          <View className="bg-surface/50 rounded-2xl p-4 mt-4">
            <Text className="text-text-secondary text-sm text-center">
              {language === "el" 
                ? "Τελευταία ενημέρωση: Ιανουάριος 2025"
                : "Last updated: January 2025"}
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeScreen>
  );
}
