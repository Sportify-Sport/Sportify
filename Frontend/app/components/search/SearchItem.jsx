import React, { useState, useEffect } from "react";
import { TouchableOpacity, Image, View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import getApiBaseUrl from "../../config/apiConfig";
import AsyncStorage from '@react-native-async-storage/async-storage';

const apiUrl = getApiBaseUrl();

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

export const SearchItem = ({ item, onPress }) => {
  const [sportsMap, setSportsMap] = useState({});

  useEffect(() => {
    const loadSportMap = async () => {
      try {
        const jsonValue = await AsyncStorage.getItem('sportsMap');
        if (jsonValue != null) {
          const parsed = JSON.parse(jsonValue);
          setSportsMap(parsed);
        } else {
          console.warn('No sportMap found in storage');
        }
      } catch (e) {
        console.error('Error loading sportMap from AsyncStorage', e);
      }
    };

    loadSportMap();
  }, []);

  return (
    <TouchableOpacity
      className="flex-row items-center bg-green-100 p-3 mt-2 rounded-xl"
      onPress={() => onPress(item)}
    >
      <View className="w-20 h-20 rounded-full bg-green-50 border-2 border-green-300 overflow-hidden">
        {item.image ? (
          <Image
            source={{
              uri: `${apiUrl}/Images/${item.groupId ? item.groupImage : item.profileImage
                }`,
            }}
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
            {sportsMap[item.sportId] ||
              (item.sportId === 1
                ? 'Football'
                : item.sportId === 2
                  ? 'Basketball'
                  : item.sportId === 3
                    ? 'Marathon'
                    : `Sport ID: ${item.sportId}`)}
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
};

export default {};
