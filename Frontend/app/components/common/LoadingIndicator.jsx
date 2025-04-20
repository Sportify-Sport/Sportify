import React from 'react';
import { View, ActivityIndicator } from 'react-native';

export default function LoadingIndicator() {
  return (
    <View className="flex-1 justify-center items-center">
      <ActivityIndicator size="large" color="#65DA84" />
    </View>
  );
}
