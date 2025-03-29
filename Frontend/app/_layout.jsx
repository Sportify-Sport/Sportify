// import { Stack } from "expo-router";

// export default function RootLayout() {
//   return <Stack />;
// }

import { Stack } from "expo-router";
import { StatusBar } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import "../global.css";
import { AuthProvider } from "./context/AuthContext";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
       <AuthProvider>
        <SafeAreaView style={{ flex: 1, backgroundColor: "black" }}>
          {/* <Stack>
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen
            name="notifications"
            options={{ title: "Notifications", headerShown: false }}
          />
        </Stack> */}
          <StatusBar style="light" />
          <Stack screenOptions={{ headerShown: false }} />
        </SafeAreaView>
       </AuthProvider>
    </SafeAreaProvider>
  );
}
