// components/event/EventMembers.jsx
import React from 'react';
import { View, Text, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import getApiBaseUrl from '../../config/apiConfig';

export default function EventMembers({ 
  members, 
  loading, 
  expanded, 
  hasMore, 
  onToggleExpand, 
  onViewDetails, 
  onRemoveMember 
}) {
  const apiUrl = getApiBaseUrl();
  
  return (
    <View className="bg-white rounded-lg shadow-md p-4 mb-4">
      <Text className="text-lg font-semibold text-gray-800 mb-3">Event Members</Text>
      
      {members.length === 0 ? (
        <Text className="text-gray-500 italic text-center py-2">No members yet</Text>
      ) : (
        <>
          {members.map(member => (
            <View key={member.userId} className="flex-row justify-between items-center py-3 border-b border-gray-200">
              <View className="flex-row items-center">
                <Image 
                  source={{ uri: `${apiUrl}/Images/${member.image || 'default_profile.png'}` }}
                  className="w-10 h-10 rounded-full"
                />
                <View className="ml-3">
                  <Text className="text-base text-gray-800">{member.fullName}</Text>
                  {member.isAdmin && (
                    <Text className="text-xs text-blue-600 font-medium">Admin</Text>
                  )}
                </View>
              </View>
              
              <View className="flex-row items-center">
                <TouchableOpacity 
                  className="px-3 py-1 border border-blue-500 rounded-full" 
                  onPress={() => onViewDetails(member.userId)}
                >
                  <Text className="text-blue-500">Details</Text>
                </TouchableOpacity>
                
                {!member.isAdmin && (
                  <TouchableOpacity 
                    className="ml-3 p-1" 
                    onPress={() => onRemoveMember(member.userId)}
                  >
                    <Ionicons name="trash-outline" size={20} color="#EF4444" />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))}
          
          {loading && (
            <View className="py-4 items-center">
              <ActivityIndicator color="#65DA84" />
            </View>
          )}
          
          {(hasMore || expanded) && !loading && (
            <TouchableOpacity 
              className="mt-3 py-2"
              onPress={onToggleExpand}
            >
              <Text className="text-blue-500 text-center">
                {hasMore ? "Show More" : "Hide"}
              </Text>
            </TouchableOpacity>
          )}
        </>
      )}
    </View>
  );
}
