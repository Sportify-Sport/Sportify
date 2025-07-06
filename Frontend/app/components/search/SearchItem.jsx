import React from "react";
import { TouchableOpacity, Image, View, Text } from "react-native";

export const SearchItem = ({ item, onPress }) => (
  <TouchableOpacity
    className="flex-row items-center bg-green-100 p-3 mt-2 rounded-xl"
    onPress={() => onPress(item)}
  >
    <Image source={{ uri: item.image }} className="w-10 h-10 rounded-full" />
    <View className="ml-3 flex-1">
      <Text className="text-base font-bold text-gray-900">{item.title || item.name}</Text>
      {item.date ? <Text className="text-sm text-gray-500">{item.date}</Text> : null}
      <Text className="text-sm text-gray-700">{item.location}</Text>
    </View>
  </TouchableOpacity>
);