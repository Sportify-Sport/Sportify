import React from 'react';
import { View, Text, Image, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';

export default function NotificationDetails() {
  const router = useRouter();
  const { notification } = useLocalSearchParams();
  const item = notification ? JSON.parse(notification) : null;

  if (!item) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <Text className="text-gray-500">No notification data.</Text>
      </View>
    );
  }

  const date = new Date(item.timestamp).toLocaleString();

  return (
    <View className="flex-1 bg-white">
      {/* Header */}
      <View className="flex-row items-center p-4 border-b border-gray-200">
        <TouchableOpacity onPress={() => router.back()} className="p-2">
          <Text className="text-2xl text-gray-700">‹</Text>
        </TouchableOpacity>
        <Text className="text-xl font-semibold ml-2 text-gray-800">Notification Details</Text>
      </View>

      {/* Content */}
      <ScrollView className="p-4">
        <View className="flex-row items-center mb-4">
          <Image source={{ uri: item.senderImage }} className="w-14 h-14 rounded-full" />
          <View className="ml-3">
            <Text className="text-lg font-medium text-gray-900">{item.senderName}</Text>
            <Text className="text-sm text-gray-500">{date}</Text>
          </View>
        </View>

        <Text className="text-base text-gray-800 leading-relaxed">{item.message}</Text>
      </ScrollView>
    </View>
  );
}

