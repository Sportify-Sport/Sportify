// components/group/Header.js
import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import getApiBaseUrl from '../../config/apiConfig';

export default function Header({ groupName, groupImage }) {
  const router = useRouter();
  const apiUrl = getApiBaseUrl();

  return (
    <View className="flex-row items-center justify-between mb-4">
      <TouchableOpacity onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={28} color="#65DA84" />
      </TouchableOpacity>
      <Text className="text-3xl font-extrabold text-gray-900 flex-1 text-center">
        {groupName}
      </Text>
      <View className="flex-row items-center space-x-3">
        <Image
          source={{ uri: `${apiUrl}/Images/${groupImage}` }}
          style={{ width: 48, height: 48, borderRadius: 24 }}
        />
      </View>
    </View>
  );
}
