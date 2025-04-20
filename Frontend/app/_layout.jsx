// import { Stack } from "expo-router";
// import { StatusBar } from "react-native";
// import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
// import "../global.css";
// import { FilterProvider } from "./context/FilterContext";

// export default function RootLayout() {
//   return (
//     <SafeAreaProvider>
//       <FilterProvider>
//         <SafeAreaView style={{ flex: 1, backgroundColor: "black" }} edges={[]}>
//           <Stack
//             screenOptions={{
//               headerShown: true,          // ← show a header
//               headerTitle: "",            // ← but render no text
//               headerStyle: {
//                 height: 20,               // ← only 20px tall
//                 backgroundColor: "black", // ← match your background
//                 shadowColor: "transparent", // remove bottom shadow
//                 elevation: 0,
//               },
//             }}
//           >
//             <Stack.Screen name="index" />
//             <Stack.Screen name="notifications" />
//           </Stack>

//           <StatusBar hidden />
//         </SafeAreaView>
//       </FilterProvider>
//     </SafeAreaProvider>
//   );
// }

import { Stack } from "expo-router";
import { StatusBar } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import "../global.css";
// import { AuthProvider } from "./context/AuthContext";
import { FilterProvider } from "./context/FilterContext"; // Import FilterProvider

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <FilterProvider>
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

