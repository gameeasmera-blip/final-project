import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "react-native-reanimated";
import AuthProvider, { useAuth } from "../context/authProvider"; // 1. useAuth import godhameera

// Protected screens logic (yoo fayyadamuu barbaadde)
const ProtectedScreens = () => {
  const { session } = useAuth();

  if (!session) {
    return (
      <Stack>
        <Stack.Screen
          name="Signin"
          options={{ title: "Sign-In", headerShown: false }}
        />

        <Stack.Screen
          name="signUp"
          options={{ title: "Sign-Up", headerShown: false }}
        />
      </Stack>
    );
  }

  return (
    <Stack>
      <Stack.Screen
        name="Signin"
        options={{ title: "Sign-In", headerShown: false }}
      />
      <Stack.Screen
        name="signUp"
        options={{ title: "Sign-Up", headerShown: false }}
      />
      <Stack.Screen
        name="index"
        options={{ title: "Home", headerShown: false }}
      />
      <Stack.Screen
        name="save"
        options={{ title: "Saved Items", headerShown: false }}
      />
      <Stack.Screen
        name="details/[id]"
        options={{ title: "Details", headerShown: false }}
      />
      <Stack.Screen
        name="propertyForm"
        options={{ title: "Property Form", headerShown: false }}
      />

      <Stack.Screen
        name="profile"
        options={{ title: "Profile", headerShown: false }}
      />
      <Stack.Screen
        name="notifications"
        options={{ title: "notifications", headerShown: false }}
      />
      <Stack.Screen
        name="contact"
        options={{ title: "Contact", headerShown: false }}
      />
    </Stack>
  );
};

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar style="auto" hidden={false} />

      <AuthProvider>
        <ProtectedScreens />
      </AuthProvider>
    </GestureHandlerRootView>
  );
}
