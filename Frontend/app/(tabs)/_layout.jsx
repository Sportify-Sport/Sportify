// import { useEffect } from "react";
// import { View, ActivityIndicator } from "react-native";
// import { Tabs, useRouter } from "expo-router";
// import { Ionicons } from "@expo/vector-icons";
// import { COLORS } from "@/constants/theme";
// import { useAuth } from "../context/AuthContext";

// export default function TabLayout() {
//   const { isLoading, isAuthenticated, isGuest } = useAuth();
//   const router = useRouter();

//   useEffect(() => {
//     if (!isLoading && !isAuthenticated && !isGuest) {
//       router.replace('/screens/Login');
//     }
//   }, [isLoading, isAuthenticated, isGuest]);

//   if (isLoading) {
//     return (
//       <View className="flex-1 justify-center items-center">
//         <ActivityIndicator size="large" color="#3CCF4E" />
//       </View>
//     );
//   }

//   return (
//     <Tabs
//       screenOptions={{
//         tabBarShowLabel: false,
//         headerShown: false,
//       }}
//     >
//       <Tabs.Screen
//         name="index"
//         options={{
//           tabBarIcon: ({ size, color }) => (
//             <Ionicons name="home" size={size} color={color} />
//           ),
//         }}
//       />
//       <Tabs.Screen
//         name="explore"
//         options={{
//           tabBarIcon: ({ size, color }) => (
//             <Ionicons name="search" size={size} color={color} />
//           ),
//         }}
//       />
//       <Tabs.Screen
//         name="notifications"
//         options={{
//           tabBarIcon: ({ color, size }) => (
//             <Ionicons name="notifications" size={size} color={color} />
//           ),
//         }}
//       />
//       <Tabs.Screen
//         name="profile"
//         options={{
//           tabBarIcon: ({ color, size }) => (
//             <Ionicons name="person-circle" size={size} color={color} />
//           ),
//         }}
//       />
//     </Tabs>
//   );
// }




import { useEffect } from "react";
import { View, ActivityIndicator } from "react-native";
import { Tabs, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "@/constants/theme";
import { useAuth } from "../context/AuthContext";

export default function TabLayout() {
  const { isLoading, isAuthenticated, isGuest } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated && !isGuest) {
      router.replace('/screens/Login');
    }
  }, [isLoading, isAuthenticated, isGuest]);

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" color="#3CCF4E" />
      </View>
    );
  }

  return (
    <Tabs
      screenOptions={{
        tabBarShowLabel: false,
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ size, color }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          tabBarIcon: ({ size, color }) => (
            <Ionicons name="search" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="notifications" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-circle" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
// // 🔍 Search & Navigation:
// // search 🔎 / search-outline 🔍 / filter 🎛️

// // 🏠 Home Page / Feed:
// // home 🏠 / home-outline 🏡 / newspaper 📰

// // 👤 Profile & User:
// // person 👤 / person-outline 👥 / person-circle 🧑‍🦱 / person-circle-outline 👨‍🦰

// // 💬 Chat & Messaging:
// // chatbubble 💬 / chatbubble-outline 💭 / chatbubbles 🗨️

// // ❤️ Favorites / Likes:
// // heart ❤️ / heart-outline 🤍 / star ⭐ / star-outline ☆

// // ⚙️ Settings & Options:
// // settings ⚙️ / cog ⚙️ / options 🔧

// // 📩 Notifications & Alerts:
// // notifications 🔔 / notifications-outline 🔕 / alert-circle ❗ / information-circle ℹ️

// // 📂 File Management & Documents:
// // document 📄 / document-text 📜 / folder 📂

// // 🎮 Entertainment & Media:
// // play-circle ▶️ / musical-notes 🎵 / film 🎬

// // 💳 Payments & Shopping:
// // card 💳 / cart 🛒 / pricetag 🏷️

// // notifications 🔔 / notifications-outline 🔕 / notifications-off 🚫🔔 / notifications-off-outline 🔕 / alert ⚠️ / alert-circle ❗
// // chatbubble 💬 / chatbubble-outline 💬 / mail 📩 / alert-outline ⚠️ / information-circle ℹ️ / heart ❤️ / heart-outline 🤍

// // Search:
// // search 🔍 / search-outline 🔎 / ios-search 🔍 / md-search 🔍 / search-circle 🔍⭕ / search-sharp 🔍

// // Home Page/Feed:
// // home 🏠 / home-outline 🏡 / ios-home 🏠 / md-home 🏠 / home-sharp 🏡 / home-outline-sharp 🏠

// // Profile:
// // person 👤 / person-outline 👥 / ios-person 👤 / md-person 👤 / person-sharp 👤 / person-circle 👤🔵

// // Chat:
// // chatbubbles 💬💬 / chatbubbles-outline 💬🔳 / chatbox 🗨️ / chatbox-outline 🗨️🔳 / message 📩 / ios-chatbubbles 💬




// // Todo? show user image as profile page icon
// {/* <Tabs.Screen 
//         name="profile"
//         options={{
//           tabBarIcon: ({ color, size }) => (
//             <Image
//               source={{ uri: 'https://url.com/profile.jpg' }} 
//               style={{
//                 width: size, 
//                 height: size, 
//                 borderRadius: size / 2,
//                 borderWidth: 1,
//                 borderColor: color
//               }}
//             />
//           )
//         }}
//       />
//     </Tabs> */}
