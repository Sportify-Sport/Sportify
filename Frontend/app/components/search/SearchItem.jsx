import React from "react";
import { TouchableOpacity, Image, View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";


const sportsMap = {
  1: "Football",
  2: "Basketball",
  3: "Running",
};

const getSportIcon = (sportId) => {
  switch (sportId) {
    case 1:
      return "football-outline";
    case 2:
      return "basketball-outline";
    case 3:
      return "accessibility-outline";
    default:
      return "fitness-outline";
  }
};
export const SearchItem = ({ item, onPress }) => (
  <TouchableOpacity
    className="flex-row items-center bg-green-100 p-3 mt-2 rounded-xl"
    onPress={() => onPress(item)}
  >
    <View className="w-20 h-20 rounded-full bg-green-50 border-2 border-green-300 overflow-hidden">
      {item.image ? (
        <Image
          source={{ uri: item.image }}
          className="w-full h-full"
          resizeMode="cover"
          onError={() => console.log("Image failed to load")}
        />
      ) : (
        <View className="flex-1 justify-center items-center bg-green-200">
          <Ionicons
            name={item.type === "event" ? "calendar" : "people"}
            size={28}
            color="#065f46"
          />
        </View>
      )}
    </View>

    <View className="ml-4 flex-1">
      <Text className="text-lg font-bold text-gray-900" numberOfLines={1}>
        {item.title || item.name}
      </Text>
      <View className="flex-row items-center mt-1">
        <Ionicons name="location-outline" size={16} color="#4b5563" />
        <Text className="text-sm text-gray-700 ml-1">
          {item.location || "Unknown location"}
        </Text>
      </View>
      <View className="flex-row items-center mt-1">
        <Ionicons name={getSportIcon(item.sportId)} size={16} color="#4b5563" />
        <Text className="text-sm text-gray-700 ml-1">
          {sportsMap[item.sportId] || `Sport ID: ${item.sportId}`}
        </Text>
      </View>
      {item.type === "event" && item.startDatetime && (
        <View className="flex-row items-center mt-1">
          <Ionicons name="time-outline" size={16} color="#4b5563" />
          <Text className="text-sm text-gray-700 ml-1">
            {new Date(item.startDatetime).toLocaleDateString()}{" "}
            {new Date(item.startDatetime).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </Text>
        </View>
      )}
    </View>
  </TouchableOpacity>
);