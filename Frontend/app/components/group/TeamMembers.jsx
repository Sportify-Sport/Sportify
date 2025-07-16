// components/group/TeamMembers.js
import React from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import getApiBaseUrl from '../../config/apiConfig';

const apiUrl = getApiBaseUrl();

export default function TeamMembers({
  members,
  displayCount,
  pageSize,
  hasMore,
  onToggle,
  isAdmin,
  currentUserId,
  onShowDetails,
  onRemove,
  events,
}) {
  return (
    <View className="bg-white p-4 rounded-xl shadow mb-4">
      <Text className="text-lg font-semibold text-gray-800 mb-2">Team Members</Text>
      {members.length === 0 ? (
        <Text className="text-gray-600">There are no team members in this group.</Text>
      ) : (
        members.slice(0, displayCount).map(m => (
          <View key={m.userId} className="flex-row justify-between items-center py-3 border-b border-gray-200">
            <View className="flex-row items-center">
              <View className="w-12 h-12 rounded-full bg-green-300 justify-center items-center mr-3">
                <Image
                  source={{ uri: `${apiUrl}/Images/${m.groupMemberImage}` }}
                  className="w-10 h-10 rounded-full"
                />
              </View>
              <View>
                <Text className="text-gray-800 text-base font-medium">{m.groupMemberName}</Text>
                <Text className="text-gray-500 text-sm">Since {m.joinYear}</Text>
              </View>
            </View>
            {isAdmin && m.userId !== currentUserId && (
              <View className="flex-row items-center" style={{ gap: 10 }}>
                <TouchableOpacity onPress={() => onShowDetails(m)}>
                  <Text className="text-blue-600 border border-blue-600 px-4 py-1 rounded-full">Details</Text>
                </TouchableOpacity>
                {!m.isAdmin ? (
                  <TouchableOpacity onPress={() => onRemove(m)}>
                    <Ionicons name="trash" size={20} color="#E53E3E" />
                  </TouchableOpacity>
                ) : (
                  <View className="w-5 h-5 bg-green-400 rounded-full" />
                )}
              </View>
            )}
          </View>
        ))
      )}
      {(displayCount > pageSize || hasMore) && (
        <TouchableOpacity onPress={onToggle} className="mt-2 py-2">
          <Text className="text-blue-600 text-center">
            {hasMore ? 'Show More' : (displayCount > pageSize ? 'Hide' : 'Show More')}
          </Text>
        </TouchableOpacity>
      )}

      <View className="mt-4">
        <Text className="text-lg font-semibold text-gray-800 mb-2">Upcoming Events</Text>
        {events.length === 0 ? (
          <Text className="text-gray-600">There are no upcoming events at the moment.</Text>
        ) : (
          events.map(ev => (
            <View key={ev.eventId} className="flex-row justify-between py-2">
              <Text className="text-gray-700 text-lg">{ev.eventName}</Text>
              <Text className="text-gray-700 text-lg">{new Date(ev.startDatetime).toLocaleDateString('en-CA')}</Text>
            </View>
          ))
        )}
      </View>
    </View>
  );
}