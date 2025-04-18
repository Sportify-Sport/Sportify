import React from "react";
import { View, Text, Image } from "react-native";
import { useLocalSearchParams } from "expo-router";

export default function ItemDetailsScreen() {
  const { item } = useLocalSearchParams();
  const parsedItem = JSON.parse(item);

  return (
    <View className="flex-1 bg-gray-100 p-4">
      <Image source={{ uri: parsedItem.image }} className="w-full h-48 rounded-lg" />
      <Text className="text-2xl font-bold mt-4">{parsedItem.title || parsedItem.name}</Text>
      {parsedItem.date ? <Text className="text-lg text-gray-500 mt-2">{parsedItem.date}</Text> : null}
      <Text className="text-lg text-gray-700 mt-2">{parsedItem.location}</Text>
      <Text className="text-lg text-gray-700 mt-2">Sport: {parsedItem.sport}</Text>
      <Text className="text-lg text-gray-700 mt-2">Gender: {parsedItem.gender}</Text>
    </View>
  );
}