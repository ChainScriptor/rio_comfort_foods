import useSocialAuth from "@/hooks/useSocialAuth";
import { View, Text, Image, ImageBackground, TouchableOpacity, ActivityIndicator } from "react-native";

const AuthScreen = () => {
  const { loadingStrategy, handleSocialAuth } = useSocialAuth();

  return (
    <ImageBackground
      source={require("../../assets/images/comfort.png")}
      className="flex-1"
      resizeMode="cover"
      style={{ width: "100%", height: "100%" }}
    >
      <View className="px-8 flex-1 justify-end items-center pb-20">
        <View className="gap-2 w-full">
        {/* GOOGLE SIGN IN BTN */}
        <TouchableOpacity
          className="flex-row items-center justify-center bg-white border border-gray-300 rounded-full px-6 py-2"
          onPress={() => handleSocialAuth("oauth_google")}
          disabled={loadingStrategy !== null}
          style={{
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.1,
            elevation: 2, // this is for android
          }}
        >
          {loadingStrategy === "oauth_google" ? (
            <ActivityIndicator size={"small"} color={"#4285f4"} />
          ) : (
            <View className="flex-row items-center justify-center">
              <Image
                source={require("../../assets/images/google.png")}
                className="size-10 mr-3"
                resizeMode="contain"
              />
              <Text className="text-black font-medium text-base">Συνέχεια με Google</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* APPLE SIGN IN BTN */}
        <TouchableOpacity
          className="flex-row items-center justify-center bg-white border border-gray-300 rounded-full px-6 py-3"
          onPress={() => handleSocialAuth("oauth_apple")}
          disabled={loadingStrategy !== null}
          style={{
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.1,
            elevation: 2, // this is for android
          }}
        >
          {loadingStrategy === "oauth_apple" ? (
            <ActivityIndicator size={"small"} color={"#4285f4"} />
          ) : (
            <View className="flex-row items-center justify-center">
              <Image
                source={require("../../assets/images/apple.png")}
                className="size-8 mr-3"
                resizeMode="contain"
              />
              <Text className="text-black font-medium text-base">Συνέχεια με Apple</Text>
            </View>
          )}
        </TouchableOpacity>
        </View>

        <Text className="text-center text-white text-xs leading-4 mt-6 px-2" style={{ textShadowColor: 'rgba(0, 0, 0, 0.75)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3 }}>
          Με την εγγραφή, συμφωνείτε με τους <Text className="text-blue-300" style={{ textShadowColor: 'rgba(0, 0, 0, 0.75)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3 }}>Όρους</Text>
          {" μας, την "}
          <Text className="text-blue-300" style={{ textShadowColor: 'rgba(0, 0, 0, 0.75)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3 }}>Πολιτική Απορρήτου</Text>
          {" και τη "}
          <Text className="text-blue-300" style={{ textShadowColor: 'rgba(0, 0, 0, 0.75)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3 }}>Χρήση Cookies</Text>
        </Text>
      </View>
    </ImageBackground>
  );
};

export default AuthScreen;
