// import { Stack } from "expo-router";

// export default function RootLayout() {
//   return <Stack />;
// }

// import { Stack } from "expo-router";
// import { StatusBar } from "react-native";
// import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
// import "../global.css";
// // import { AuthProvider } from "./context/AuthContext";

// export default function RootLayout() {
//   return (
//     <SafeAreaProvider>
//         <SafeAreaView style={{ flex: 1, backgroundColor: "black" }}>
//           <StatusBar style="light" />
//           <Stack screenOptions={{ headerShown: false }} />
//         </SafeAreaView>
//     </SafeAreaProvider>
//   );
// }
import { Stack } from "expo-router";
import { StatusBar } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import "../global.css";
import { AuthProvider } from "./context/AuthContext";
import { FilterProvider } from "./context/FilterContext"; // Import FilterProvider

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <FilterProvider> {/* Wrap with FilterProvider */}
        <SafeAreaView style={{ flex: 1, backgroundColor: "black" }}>
          {/* Optional: Add individual screens if needed */}
          {/* 
          <Stack>
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen
              name="notifications"
              options={{ title: "Notifications", headerShown: false }}
            />
          </Stack> 
          */}
          <StatusBar style="light" />
          <Stack screenOptions={{ headerShown: false }} />
        </SafeAreaView>
      </FilterProvider>
    </SafeAreaProvider>
  );
}
