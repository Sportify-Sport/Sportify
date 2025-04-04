// import { Stack } from "expo-router";

// export default function RootLayout() {
//   return <Stack />;
// }

import { Stack } from "expo-router";
import { StatusBar } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import "../global.css";
// import { AuthProvider } from "./context/AuthContext";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
        <SafeAreaView style={{ flex: 1, backgroundColor: "black" }}>
          <StatusBar style="light" />
          <Stack screenOptions={{ headerShown: false }} />
        </SafeAreaView>
    </SafeAreaProvider>
  );
}
