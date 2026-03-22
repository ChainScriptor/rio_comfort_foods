import { useCallback, useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  Platform,
  ImageBackground,
} from "react-native";
import { useAuth, useSignUp } from "@clerk/clerk-expo";
import { useRouter, useLocalSearchParams } from "expo-router";

function firstParam(
  raw: string | string[] | undefined
): string | undefined {
  if (typeof raw === "string" && raw.length > 0) return raw;
  if (Array.isArray(raw) && raw[0]) return raw[0];
  return undefined;
}

/** Clerk προσθέτει `__clerk_ticket` στο redirectUrl μετά το κλικ στο email πρόσκλησης. */
function readWebInvitationTicketFromLocation(): string | undefined {
  if (typeof window === "undefined") return undefined;
  try {
    const q = new URLSearchParams(window.location.search);
    return (
      q.get("__clerk_ticket") ||
      q.get("__clerk_invitation_ticket") ||
      undefined
    );
  } catch {
    return undefined;
  }
}

/**
 * Αποδοχή πρόσκλησης (Native Invitations API): το Clerk στέλνει τον χρήστη στο /sign-up?__clerk_ticket=...
 */
export default function SignUpScreen() {
  const { isSignedIn, isLoaded: authLoaded } = useAuth();
  const { signUp, setActive, isLoaded: signUpLoaded } = useSignUp();
  const router = useRouter();
  const params = useLocalSearchParams();

  const [webTicket, setWebTicket] = useState<string | undefined>(undefined);
  /** Στο web περιμένουμε ένα tick ώστε να διαβάσουμε το `?__clerk_ticket=` από το location (PWA / static export). */
  const [webQueryReady, setWebQueryReady] = useState(() => Platform.OS !== "web");

  const ticketFromRouter = firstParam(
    params.__clerk_ticket as string | string[] | undefined
  );
  const invitationTicket = ticketFromRouter || webTicket;

  const processedTicketRef = useRef<string | null>(null);

  useEffect(() => {
    if (Platform.OS !== "web") return;
    const t = readWebInvitationTicketFromLocation();
    if (t) setWebTicket(t);
    setWebQueryReady(true);
  }, []);

  const completeInvitation = useCallback(
    async (ticket: string) => {
      if (!signUp || !setActive) return;

      try {
        const result = await signUp.create({
          strategy: "ticket",
          ticket,
        });

        if (result.status === "complete" && result.createdSessionId) {
          await setActive({ session: result.createdSessionId });
          if (Platform.OS === "web" && typeof window !== "undefined") {
            window.history.replaceState({}, "", "/sign-up");
            router.replace("/(tabs)" as never);
          } else {
            router.replace("/(tabs)" as never);
          }
          return;
        }

        console.warn("[sign-up] Invitation sign-up not complete:", result.status);
        router.replace("/(auth)" as never);
      } catch (error: unknown) {
        console.error("[sign-up] Error accepting invitation:", error);
        router.replace("/(auth)" as never);
      }
    },
    [signUp, setActive, router]
  );

  useEffect(() => {
    if (!authLoaded) return;

    if (isSignedIn) {
      router.replace("/(tabs)" as never);
      return;
    }

    if (!webQueryReady) return;

    if (!invitationTicket) {
      router.replace("/(auth)" as never);
      return;
    }

    if (!signUpLoaded || !signUp) return;

    if (processedTicketRef.current === invitationTicket) return;
    processedTicketRef.current = invitationTicket;

    void completeInvitation(invitationTicket);
  }, [
    authLoaded,
    isSignedIn,
    webQueryReady,
    invitationTicket,
    signUpLoaded,
    signUp,
    router,
    completeInvitation,
  ]);

  return (
    <ImageBackground
      source={require("../../assets/images/comfort.png")}
      className="flex-1"
      resizeMode="cover"
      style={{ width: "100%", height: "100%" }}
    >
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" color="#FFD700" />
        <Text
          className="text-white text-lg mt-4"
          style={{
            textShadowColor: "rgba(0, 0, 0, 0.75)",
            textShadowOffset: { width: 0, height: 1 },
            textShadowRadius: 3,
          }}
        >
          Επεξεργασία πρόσκλησης...
        </Text>
      </View>
    </ImageBackground>
  );
}
