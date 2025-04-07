import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, Image, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';

// Dummy initial data generator
const generateNotifications = (startId, count) => {
  const now = Date.now();
  return Array.from({ length: count }).map((_, i) => {
    const id = startId + i;
    const daysAgo = Math.floor(Math.random() * 30) + 1;
    return {
      id: String(id),
      senderImage: `https://cdn-icons-png.flaticon.com/512/455/455665.png`,
      senderName: id % 2 === 0 ? `Event ${id}` : `Group ${id}`,
      timestamp: now - daysAgo * 24 * 60 * 60 * 1000,
      message: `This is a sample notification message number ${id}. It might be quite long to demonstrate truncation in the list view.`, 
      read: Math.random() < 0.5,
    };
  });
};

export default function Notifications() {
  const router = useRouter();
  const [notifications, setNotifications] = useState(() => generateNotifications(1, 10));
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);

  const loadMore = useCallback(() => {
    if (loadingMore) return;
    setLoadingMore(true);
    // simulate network
    setTimeout(() => {
      const next = generateNotifications(page * 10 + 1, 10);
      setNotifications((prev) => [...prev, ...next]);
      setPage((p) => p + 1);
      setLoadingMore(false);
    }, 1000);
  }, [loadingMore, page]);

  const renderItem = ({ item }) => {
    const daysOld = Math.floor((Date.now() - item.timestamp) / (1000 * 60 * 60 * 24));
    return (
      <TouchableOpacity
        className="bg-white rounded-lg p-4 m-2 shadow"
        onPress={() => router.push({ pathname: '../screens/NotificationDetails', params: { notification: JSON.stringify(item) } })}
      >
        <View className="flex-row items-center">
          <Image source={{ uri: item.senderImage }} className="w-10 h-10 rounded-full" />
          <View className="flex-1 ml-3">
            <View className="flex-row justify-between">
              <Text className="text-base font-medium">{item.senderName}</Text>
              <Text className="text-sm text-gray-500">{daysOld}d</Text>
            </View>
            <View className="flex-row items-center mt-1">
              <Text
                numberOfLines={2}
                ellipsizeMode="tail"
                className={`${item.read ? 'text-gray-700' : 'text-black font-semibold'}`}
              >
                {item.message}
              </Text>
              {!item.read && <View className="w-2 h-2 bg-green-500 rounded-full ml-2" />}
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View className="flex-1 bg-gray-100">
      <Text className="text-2xl font-bold p-4">Notifications</Text>
      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={() => loadingMore ? <ActivityIndicator size="small" color="#65DA84" className="my-4" /> : null}
      />
    </View>
  );
}
