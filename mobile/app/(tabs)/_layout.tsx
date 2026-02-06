import { Redirect, Tabs } from "expo-router";
import { useAuth } from "@clerk/clerk-expo";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BlurView } from "expo-blur";
import { Platform, StyleSheet } from "react-native";
import HomeIcon from "@/assets/icons/HomeIcon.svg";
import CartIcon from "@/assets/icons/CartIcon.svg";
import ProfileIcon from "@/assets/icons/ProfileIcon.svg";

// Ύψος ζώνης εικονίδιο + λεζάντα (αρκετό ώστε να μην κόβονται ούτε τα γράμματα)
const TAB_BAR_CONTENT_HEIGHT = 76;
// Πλάτος απόστασης από τις άκρες — μικρότερο = πιο φαρδύ menu, χωράει "Κατάστημα"
const TAB_BAR_MARGIN_HORIZONTAL = 48;
// Ελάχιστη απόσταση από το κάτω χείλος (για κινητά χωρίς notch / web)
const MIN_BOTTOM_INSET = Platform.OS === "web" ? 12 : 0;

const TabsLayout = () => {
  const { isSignedIn, isLoaded } = useAuth();
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, MIN_BOTTOM_INSET);

  if (!isLoaded) return null; // for a better ux
  if (!isSignedIn) return <Redirect href={"/(auth)"} />;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#FFD700",
        tabBarInactiveTintColor: "#B3B3B3",
        tabBarStyle: {
          position: "absolute",
          backgroundColor: "transparent",
          borderTopWidth: 0,
          height: TAB_BAR_CONTENT_HEIGHT + bottomInset,
          paddingTop: 8,
          paddingBottom: bottomInset,
          marginHorizontal: TAB_BAR_MARGIN_HORIZONTAL,
          marginBottom: bottomInset,
          borderRadius: 28,
          overflow: "hidden",
        },
        tabBarShowLabel: true,
        tabBarBackground: () => (
          <BlurView
            intensity={80}
            tint="dark"
            style={StyleSheet.absoluteFill}
            // StyleSheet.absoluteFill is equal to this 👇
            // { position: "absolute", top: 0, right: 0, left: 0, bottom: 0 }
          />
        ),
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
          marginTop: 4,
          marginBottom: 2,
        },
        tabBarItemStyle: {
          paddingVertical: 6,
          minWidth: 72,
        },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Κατάστημα",
          tabBarIcon: ({ color, size }) => (
            <HomeIcon width={size} height={size} stroke={color} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          title: "Καλάθι",
          tabBarIcon: ({ color, size }) => (
            <CartIcon width={size} height={size} stroke={color} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Προφίλ",
          tabBarIcon: ({ color, size }) => (
            <ProfileIcon width={size} height={size} stroke={color} color={color} />
          ),
        }}
      />
    </Tabs>
  );
};

export default TabsLayout;
