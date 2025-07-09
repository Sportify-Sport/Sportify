import React from 'react';
import { View, Text } from 'react-native';

export default function ErrorState() {
  return (
    <View className="items-center justify-center p-4">
      <Text className="text-gray-500">Something went wrong.</Text>
    </View>
  );
}
