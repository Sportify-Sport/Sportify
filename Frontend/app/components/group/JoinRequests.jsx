// components/group/JoinRequests.js
import React from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import getApiBaseUrl from '../../config/apiConfig';

const apiUrl = getApiBaseUrl();

export default function JoinRequests({
  requests,
  displayCount,
  pageSize,
  hasMore,
  onToggle,
  onDetails,
  onAccept,
  onReject,
}) {
  return (
    <View className="bg-white p-4 rounded-xl shadow mb-4">
      <Text className="text-lg font-semibold text-gray-800 mb-2">Join Requests</Text>
      {requests.length === 0 ? (
        <Text className="text-gray-600">There are no pending join requests.</Text>
      ) : (
        requests.slice(0, displayCount).map(r => (
          <View key={r.requestId} className="flex-row justify-between items-center py-2">
            <View className="w-12 h-12 rounded-full bg-green-300 justify-center items-center">
              <Image source={{ uri: `${apiUrl}/Images/${r.userPicture}` }} className="w-10 h-10 rounded-full" />
            </View>
            <View className="flex-1 ml-3">
              <Text className="text-gray-700 text-lg">{r.fullName}</Text>
              <Text className="text-gray-500 text-sm">{new Date(r.requestDate).toLocaleDateString('en-CA')}</Text>
            </View>
            <TouchableOpacity onPress={() => onDetails(r)}>
              <Text className="text-blue-600 border border-blue-600 px-4 py-1 rounded-full">Details</Text>
            </TouchableOpacity>
            <View className="flex-row space-x-3 ml-3">
              <TouchableOpacity onPress={() => onAccept(r)}>
                <Ionicons name="checkmark-circle" size={24} color="#38A169" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => onReject(r)}>
                <Ionicons name="close-circle" size={24} color="#E53E3E" />
              </TouchableOpacity>
            </View>
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
    </View>
  );
}
