import React from "react";
import { TouchableOpacity, Text } from "react-native";

export const SuggestionItem = ({ item, onPress }) => (
  <TouchableOpacity
    className="flex-row items-center bg-white p-3 border-b border-gray-200"
    onPress={() => onPress(item)}
  >
    <Text className="text-base text-gray-900">{item.title || item.name}</Text>
  </TouchableOpacity>
);