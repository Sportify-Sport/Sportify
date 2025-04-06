// import React, { useState, useEffect } from "react";
// import {
//   View,
//   Text,
//   TextInput,
//   FlatList,
//   Image,
//   TouchableOpacity,
//   ActivityIndicator,
// } from "react-native";
// import { Ionicons } from "@expo/vector-icons";
// import { useRouter } from "expo-router";
// import { fetchItems } from "../context/mockData";

// export default function ExploreScreen() {
//   const router = useRouter();
//   const [items, setItems] = useState([]);
//   const [type, setType] = useState("event"); // Default to events
//   const [page, setPage] = useState(1);
//   const [loading, setLoading] = useState(false);
//   const [hasMore, setHasMore] = useState(true);

//   const limit = 5; // 5 items per fetch

//   const loadItems = async (reset = false) => {
//     if (loading || !hasMore) return;

//     setLoading(true);
//     try {
//       const currentPage = reset ? 1 : page;
//       const response = await fetchItems(type, currentPage, limit);
//       setItems((prev) => (reset ? response.items : [...prev, ...response.items]));
//       setPage(currentPage + 1);
//       setHasMore(response.hasMore);
//     } catch (error) {
//       console.error("Error fetching items:", error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     // Reset items and page when type changes
//     setItems([]);
//     setPage(1);
//     setHasMore(true);
//     loadItems(true);
//   }, [type]);

//   const renderItem = ({ item }) => (
//     <TouchableOpacity className="flex-row items-center bg-green-100 p-3 mt-2 rounded-xl">
//       <Image source={{ uri: item.image }} className="w-10 h-10 rounded-full" />
//       <View className="ml-3 flex-1">
//         <Text className="text-base font-bold text-gray-900">{item.title || item.name}</Text>
//         {item.date ? <Text className="text-sm text-gray-500">{item.date}</Text> : null}
//         <Text className="text-sm text-gray-700">{item.location}</Text>
//       </View>
//     </TouchableOpacity>
//   );

//   const renderFooter = () => {
//     if (!loading) return null;
//     return (
//       <View className="py-4">
//         <ActivityIndicator size="large" color="#10B981" />
//       </View>
//     );
//   };

//   return (
//     <View className="flex-1 bg-gray-100 p-4">
//       {/* Search Input */}
//       {/* <TouchableOpacity
//         onPress={() => router.push("/screens/Search")}
//         className="flex-row items-center bg-white p-3 rounded-full mb-4 shadow-sm"
//       >
//         <Ionicons name="search" size={20} color="gray" className="ml-2" />
//         <TextInput
//           className="flex-1 ml-2 text-base text-gray-900"
//           placeholder="Search for an event or group..."
//           placeholderTextColor="#6B7280"
//           editable={false} // Make it non-editable, just for navigation
//         />
//       </TouchableOpacity> */}

//       <TouchableOpacity
//         onPress={() => router.push({ pathname: "/screens/SearchFilter", params: { type } })}
//         className="flex-row items-center bg-white p-3 rounded-full mb-4 shadow-sm"
//       >
//         <Ionicons name="search" size={20} color="gray" className="ml-2" />
//         <TextInput
//           className="flex-1 ml-2 text-base text-gray-900"
//           placeholder="Search for an event or group..."
//           placeholderTextColor="#6B7280"
//           editable={false}
//         />
//       </TouchableOpacity>

//       {/* Toggle Button */}
//       <View className="flex-row justify-center mb-4">
//         <TouchableOpacity
//           className={`py-2 px-4 rounded-l-lg ${
//             type === "event" ? "bg-green-500" : "bg-gray-300"
//           }`}
//           onPress={() => setType("event")}
//         >
//           <Text className={`text-lg font-bold ${type === "event" ? "text-white" : "text-gray-700"}`}>
//             Events
//           </Text>
//         </TouchableOpacity>
//         <TouchableOpacity
//           className={`py-2 px-4 rounded-r-lg ${
//             type === "group" ? "bg-green-500" : "bg-gray-300"
//           }`}
//           onPress={() => setType("group")}
//         >
//           <Text className={`text-lg font-bold ${type === "group" ? "text-white" : "text-gray-700"}`}>
//             Groups
//           </Text>
//         </TouchableOpacity>
//       </View>

//       {/* Infinite Scroll List */}
//       <FlatList
//         data={items}
//         keyExtractor={(item) => item.id + item.type}
//         renderItem={renderItem}
//         onEndReached={() => loadItems()}
//         onEndReachedThreshold={0.5}
//         ListFooterComponent={renderFooter}
//       />
//     </View>
//   );
// }




import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { fetchItems } from "../context/mockData";

export default function ExploreScreen() {
  const router = useRouter();
  const [items, setItems] = useState([]);
  const [type, setType] = useState("event");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const limit = 8;

  const loadItems = async (reset = false) => {
    if (loading || !hasMore) return;

    setLoading(true);
    try {
      const currentPage = reset ? 1 : page;
      const response = await fetchItems(type, currentPage, limit);
      setItems((prev) => (reset ? response.items : [...prev, ...response.items]));
      setPage(currentPage + 1);
      setHasMore(response.hasMore);
    } catch (error) {
      console.error("Error fetching items:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setItems([]);
    setPage(1);
    setHasMore(true);
    loadItems(true);
  }, [type]);

  const renderItem = ({ item }) => (
    <TouchableOpacity className="flex-row items-center bg-green-100 p-3 mt-2 rounded-xl">
      <Image source={{ uri: item.image }} className="w-10 h-10 rounded-full" />
      <View className="ml-3 flex-1">
        <Text className="text-base font-bold text-gray-900">{item.title || item.name}</Text>
        {item.date ? <Text className="text-sm text-gray-500">{item.date}</Text> : null}
        <Text className="text-sm text-gray-700">{item.location}</Text>
      </View>
    </TouchableOpacity>
  );

  const renderFooter = () => {
    if (!loading) return null;
    return (
      <View className="py-4">
        <ActivityIndicator size="large" color="#10B981" />
      </View>
    );
  };

  return (
    <View className="flex-1 bg-gray-100 p-4">
      <TouchableOpacity
        onPress={() =>
          router.push({
            pathname: "/screens/Search",
            params: { type }, // Pass the type to SearchScreen
          })
        }
        className="flex-row items-center bg-white p-3 rounded-full mb-4 shadow-sm"
      >
        <Ionicons name="search" size={20} color="gray" className="ml-2" />
        <TextInput
          className="flex-1 ml-2 text-base text-gray-900"
          placeholder="Search for an event or group..."
          placeholderTextColor="#6B7280"
          editable={false}
        />
      </TouchableOpacity>

      <View className="flex-row justify-center mb-4">
        <TouchableOpacity
          className={`py-2 px-4 rounded-l-lg ${
            type === "event" ? "bg-green-500" : "bg-gray-300"
          }`}
          onPress={() => setType("event")}
        >
          <Text className={`text-lg font-bold ${type === "event" ? "text-white" : "text-gray-700"}`}>
            Events
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          className={`py-2 px-4 rounded-r-lg ${
            type === "group" ? "bg-green-500" : "bg-gray-300"
          }`}
          onPress={() => setType("group")}
        >
          <Text className={`text-lg font-bold ${type === "group" ? "text-white" : "text-gray-700"}`}>
            Groups
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={items}
        keyExtractor={(item) => item.id + item.type}
        renderItem={renderItem}
        onEndReached={() => loadItems()}
        onEndReachedThreshold={0.5}
        ListFooterComponent={renderFooter}
      />
    </View>
  );
}