// components/event/PendingRequests.jsx
import React from 'react';
import { View, Text, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import getApiBaseUrl from '../../config/apiConfig';

export default function PendingRequests({ 
  requests, 
  loading, 
  expanded, 
  hasMore, 
  onToggleExpand, 
  onViewDetails, 
  onApprove, 
  onReject 
}) {
  const apiUrl = getApiBaseUrl();
  
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };
  
  return (
    <View className="bg-white rounded-lg shadow-md p-4 mb-4">
      <Text className="text-lg font-semibold text-gray-800 mb-3">Join Requests</Text>
      
      {requests.length === 0 ? (
        <Text className="text-gray-500 italic text-center py-2">No pending requests</Text>
      ) : (
        <>
          {requests.map(request => (
            <View key={request.userId} className="flex-row justify-between items-center py-3 border-b border-gray-200">
              <View className="flex-row items-center">
                <Image 
                  source={{ uri: `${apiUrl}/Images/${request.userPicture || 'default_profile.png'}` }}
                  className="w-10 h-10 rounded-full"
                />
                <View className="ml-3">
                  <Text className="text-base text-gray-800">{request.fullName}</Text>
                  <Text className="text-xs text-gray-500">{formatDate(request.requestDate)}</Text>
                </View>
              </View>
              
              <View className="flex-row items-center">
                <TouchableOpacity 
                  className="px-3 py-1 border border-blue-500 rounded-full mr-2" 
                  onPress={() => onViewDetails(request.userId)}
                >
                  <Text className="text-blue-500">Details</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  className="p-1 mr-1" 
                  onPress={() => onApprove(request.userId)}
                >
                  <Ionicons name="checkmark-circle" size={24} color="#22C55E" />
                </TouchableOpacity>
                
                <TouchableOpacity 
                  className="p-1" 
                  onPress={() => onReject(request.userId)}
                >
                  <Ionicons name="close-circle" size={24} color="#EF4444" />
                </TouchableOpacity>
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
