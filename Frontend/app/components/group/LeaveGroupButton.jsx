// components/group/LeaveGroupButton.js
import React from 'react';
import { View, TouchableOpacity, Text } from 'react-native';

export default function LeaveGroupButton({ onLeave }) {
  return (
    <View className="items-center mb-8">
      <TouchableOpacity className="bg-red-500 py-3 px-8 rounded-full shadow" onPress={onLeave}>
        <Text className="text-white text-center font-bold">Leave Group</Text>
      </TouchableOpacity>
    </View>
  );
}
