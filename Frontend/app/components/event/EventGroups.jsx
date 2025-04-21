// components/event/EventGroups.jsx
import React from 'react';
import { View, Text, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import getApiBaseUrl from '../../config/apiConfig';

export default function EventGroups({ 
  groups, 
  loading, 
  expanded, 
  hasMore, 
  onToggleExpand, 
  onRemoveGroup, 
  isAdmin,
  token
}) {
  const router = useRouter();
  const apiUrl = getApiBaseUrl();
  
  return (
    <View className="bg-white rounded-lg shadow-md p-4 mb-4">
      <Text className="text-lg font-semibold text-gray-800 mb-3">Event Groups</Text>
      
      {groups.length === 0 ? (
        <Text className="text-gray-500 italic text-center py-2">No groups in this event</Text>
      ) : (
        <>
          {groups.map(group => (
            <View key={group.groupId} className="flex-row justify-between items-center py-3 border-b border-gray-200">
              <TouchableOpacity 
                className="flex-row items-center flex-1" 
                onPress={() => token && router.push({ pathname: "../screens/GroupDetails", params: { groupId: group.groupId } })}
              >
                <Image 
                  source={{ uri: `${apiUrl}/Images/${group.groupImage || 'default_group.png'}` }}
                  className="w-12 h-12 rounded-full"
                />
                <Text className="ml-3 text-base text-gray-800">{group.groupName}</Text>
              </TouchableOpacity>
              
              {isAdmin && (
                <TouchableOpacity 
                  className="p-1" 
                  onPress={() => onRemoveGroup(group.groupId, group.groupName)}
                >
                  <Ionicons name="trash-outline" size={20} color="#EF4444" />
                </TouchableOpacity>
              )}
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
