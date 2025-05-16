import { Stack } from "expo-router";
import { StatusBar } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import "../global.css";
import { FilterProvider } from "./context/FilterContext";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <FilterProvider>
        <SafeAreaView style={{ flex: 1, backgroundColor: "white" }}>
          {/* 
          <Stack>
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen
              name="notifications"
              options={{ title: "Notifications", headerShown: false }}
            />
          </Stack> 
          */}
          {/* <StatusBar barStyle="light-content" backgroundColor="black" /> */}
          <StatusBar barStyle="dark-content" backgroundColor="white" />
          <Stack screenOptions={{ headerShown: false }} />
        </SafeAreaView>
      </FilterProvider>
    </SafeAreaProvider>
  );
}

