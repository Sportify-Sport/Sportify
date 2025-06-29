import { Stack } from "expo-router";
import { StatusBar } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import "../global.css";
import { FilterProvider } from "./context/FilterContext";
import { AuthProvider } from "./context/AuthContext";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <FilterProvider>
          <SafeAreaView style={{ flex: 1, backgroundColor: "white" }} edges={["top"]}>
            {/* <StatusBar barStyle="light-content" backgroundColor="black" /> */}
            <StatusBar barStyle="dark-content" backgroundColor="white" />
            <Stack screenOptions={{ headerShown: false }} />
          </SafeAreaView>
        </FilterProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
