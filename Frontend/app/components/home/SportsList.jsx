import React from 'react';
import { View, Text, Image, FlatList } from 'react-native';

export default function SportsList({ sports, apiUrl }) {
  const renderSport = ({ item }) => (
    <View className="items-center mx-2">
      <Image
        source={{ uri: `${apiUrl}/Images/${item.sportImage}` }}
        className="w-16 h-16 rounded-full"
      />
      <Text className="mt-1 text-sm text-gray-700">{item.sportName}</Text>
    </View>
  );

  return (
    <View className="mb-6">
      <Text className="text-xl font-semibold mb-2">Sports</Text>
      <FlatList
        data={sports}
        horizontal
        showsHorizontalScrollIndicator={false}
        renderItem={renderSport}
        keyExtractor={(item) => String(item.sportId)}
      />
    </View>
  );
}
