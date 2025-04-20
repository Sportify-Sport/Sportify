import React from 'react';
import { View, Text, Image, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';

export default function MyEventsList({ events, token, sportsMap, apiUrl }) {
  const router = useRouter();

  const renderMyEvent = (item) => (
    <TouchableOpacity
      key={item.eventId}
      onPress={() => token && router.push({ pathname: "../screens/EventDetails", params: { eventId: item.eventId } })}
      disabled={!token}
    >
      <View className={`flex-row items-center rounded-lg shadow px-4 py-2 m-1 ${token ? 'bg-white' : 'bg-gray-100'}`}>
        <Image source={{ uri: `${apiUrl}/Images/${item.eventImage}` }} className="w-12 h-12 rounded" />
        <View className="ml-3">
          <Text className={`${token ? 'font-semibold text-black' : 'text-gray-500'}`}>{item.eventName}</Text>
          <Text className="text-gray-500 text-sm">{new Date(item.startDatetime).toLocaleDateString()}</Text>
          <Text className="text-gray-500 text-sm">{sportsMap[item.sportId] || 'Unknown Sport'}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View className="mb-6">
      <TouchableOpacity
        className="flex-row items-center mb-2"
        onPress={() => token && router.push('../screens/MyEvents')}
        disabled={!token}
      >
        <Text className={`text-xl font-semibold ${token ? '' : 'text-gray-400'}`}>My Events</Text>
        <Text className={`${token ? 'text-[#65DA84]' : 'text-gray-400'} ml-1`}>››</Text>
      </TouchableOpacity>
      <View className="h-40">
        <ScrollView
          nestedScrollEnabled
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingVertical: 8 }}
        >
          {token ? (
            events.length > 0 ? (
              events.map(renderMyEvent)
            ) : (
              <View className="justify-center items-center py-8">
                <Text className="text-gray-500">You have no events</Text>
              </View>
            )
          ) : (
            <View className="justify-center items-center py-8">
              <Text className="text-gray-500">Sign in to see your events</Text>
            </View>
          )}
        </ScrollView>
      </View>
    </View>
  );
}
