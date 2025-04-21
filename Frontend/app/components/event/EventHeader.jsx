// components/event/EventHeader.jsx
import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import getApiBaseUrl from '../../config/apiConfig';

export default function EventHeader({ event }) {
  const router = useRouter();
  const apiUrl = getApiBaseUrl();
  
  if (!event) return null;
  
  return (
    <View className="mb-4">
      <View className="flex-row justify-between items-center mb-4">
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={28} color="#333" />
        </TouchableOpacity>
        <View className="flex-1 items-center">
          <Text className="text-2xl font-bold text-gray-900">{event.eventName}</Text>
        </View>
        <Image
          source={{ uri: `${apiUrl}/Images/${event.eventImage || 'default_event.png'}` }}
          className="w-12 h-12 rounded-full"
        />
      </View>
    </View>
  );
}
