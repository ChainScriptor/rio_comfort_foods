import { useEffect } from "react";
import { View, Text, ActivityIndicator } from "react-native";
import { useAuth, useSignUp } from "@clerk/clerk-expo";
import { useRouter, useLocalSearchParams } from "expo-router";
import { ImageBackground } from "react-native";

/**
 * Sign-up screen that handles invitation acceptance redirects
 * 
 * When a user accepts an invitation via email, Clerk redirects them to this screen.
 * The web page redirects to mobile://sign-up?__clerk_ticket=XXX
 * This screen handles the ticket and completes the sign-up flow.
 */
export default function SignUpScreen() {
  const { isSignedIn, isLoaded } = useAuth();
  const { signUp, setActive } = useSignUp();
  const router = useRouter();
  const params = useLocalSearchParams();

  useEffect(() => {
    if (!isLoaded) return;

    // If user is already signed in (completed invitation acceptance), redirect to main app
    if (isSignedIn) {
      router.replace("/(tabs)");
      return;
    }

    // Handle invitation ticket if present
    const ticket = params.__clerk_ticket as string | undefined;
    
    if (ticket && signUp) {
      // User came from invitation link, complete sign-up with ticket
      handleInvitationTicket(ticket);
    } else {
      // No ticket, redirect to regular auth screen
      router.replace("/(auth)");
    }
  }, [isLoaded, isSignedIn, signUp, setActive, router, params]);

  const handleInvitationTicket = async (ticket: string) => {
    if (!signUp) return;

    try {
      // Create sign-up with the invitation ticket
      const result = await signUp.create({
        strategy: "ticket",
        ticket: ticket,
      });

      // If sign-up is complete, set the session and redirect
      if (result.status === "complete" && setActive) {
        await setActive({ session: result.createdSessionId });
        router.replace("/(tabs)");
      } else {
        // Sign-up needs more steps (e.g., email verification)
        // Redirect to auth screen to complete the flow
        router.replace("/(auth)");
      }
    } catch (error: any) {
      console.error("Error accepting invitation:", error);
      // On error, redirect to auth screen
      router.replace("/(auth)");
    }
  };

  return (
    <ImageBackground
      source={require("../../assets/images/comfort.png")}
      className="flex-1"
      resizeMode="cover"
      style={{ width: "100%", height: "100%" }}
    >
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" color="#FFD700" />
        <Text className="text-white text-lg mt-4" style={{ textShadowColor: 'rgba(0, 0, 0, 0.75)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3 }}>
          Επεξεργασία πρόσκλησης...
        </Text>
      </View>
    </ImageBackground>
  );
}
