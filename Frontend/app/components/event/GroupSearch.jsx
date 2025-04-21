// components/event/GroupSearch.jsx
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, FlatList, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import getApiBaseUrl from '../../config/apiConfig';
import useAlertNotification from '../../hooks/useAlertNotification';

export default function GroupSearch({ event, token, sportsMap, onAddGroup }) {
  const router = useRouter();
  const apiUrl = getApiBaseUrl();
  const [searchText, setSearchText] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const abortControllerRef = useRef(null);
  const { alert, showAlert, hideAlert } = useAlertNotification();
  
  useEffect(() => {
    // Clean up abort controller on unmount
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);
  
  // Debounced search when text changes
  useEffect(() => {
    if (searchText.length < 1) {
      setResults([]);
      return;
    }
    
    const timer = setTimeout(() => {
      searchGroups(searchText);
    }, 300);
    
    return () => clearTimeout(timer);
  }, [searchText]);
  
  const searchGroups = async (query) => {
    // Cancel any ongoing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // Create new abort controller for this request
    const abortController = new AbortController();
    abortControllerRef.current = abortController;
    
    try {
      setLoading(true);
      
      // Build search URL with event requirements as filters
      let url = `${apiUrl}/api/Search?type=Group&name=${encodeURIComponent(query)}&sportId=${event.sportId}&minAge=${event.minAge}`;
      
      // Only add gender filter if event gender is not Mixed
      if (event.gender && event.gender !== 'Mixed') {
        url += `&gender=${encodeURIComponent(event.gender)}`;
      }
      
      url += '&page=1&pageSize=5';
      
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
        signal: abortController.signal
      });
      
      if (!response.ok) {
        throw new Error('Search failed');
      }
      
      const data = await response.json();
      
      if (data.success) {
        setResults(data.data || []);
      } else {
        setResults([]);
      }
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Search error:', error);
        setResults([]);
      }
    } finally {
      setLoading(false);
    }
  };
  
  const handleAddGroup = async (groupId) => {
    try {
      const response = await fetch(`${apiUrl}/api/EventTeams/team-events/${event.eventId}/groups/${groupId}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const result = await response.json();
      if (result.success) {
        // Call the refresh function from parent to update the groups list
        onAddGroup();
        // Clear search results after adding
        setSearchText('');
        setResults([]);
        showAlert(result.message || 'Successfully added the group', 'success');
      }
      return result;
    } catch (error) {
      showAlert(result.message || 'Failed to add group');
      return { success: false, message: 'Network error while adding group' };
    }
  };
  
  return (
    <View className="bg-white rounded-lg shadow-md p-4 mb-4">
      <Text className="text-lg font-semibold text-gray-800 mb-3">Search Groups</Text>
      
      <View className="flex-row items-center border border-gray-300 rounded-lg px-3 py-2 mb-3">
        <Ionicons name="search" size={20} color="#9CA3AF" />
        <TextInput
          className="flex-1 ml-2 text-base"
          placeholder="Search groups..."
          value={searchText}
          onChangeText={setSearchText}
        />
        {loading && <ActivityIndicator size="small" color="#65DA84" />}
      </View>
      
      {results.length > 0 && (
        <View>
          {results.map(group => (
            <View key={group.groupId} className="flex-row justify-between items-center py-3 border-b border-gray-200">
              <TouchableOpacity 
                className="flex-row items-center flex-1"
                onPress={() => token && router.push({ pathname: "../screens/GroupDetails", params: { groupId: group.groupId } })}
              >
                <Image 
                  source={{ uri: `${apiUrl}/Images/${group.groupImage || 'default_group.png'}` }}
                  className="w-10 h-10 rounded-full"
                />
                <View className="ml-3">
                  <Text className="text-base text-gray-800">{group.groupName}</Text>
                  <Text className="text-xs text-gray-500">
                    {sportsMap[group.sportId] || `Sport ${group.sportId}`} • {group.gender || 'Mixed'}
                  </Text>
                </View>
              </TouchableOpacity>
              
              <TouchableOpacity 
                className="bg-[#65DA84] px-3 py-1 rounded-full"
                onPress={() => handleAddGroup(group.groupId)}
              >
                <Text className="text-white text-sm font-medium">Add</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}
      
      {searchText.length > 0 && !loading && results.length === 0 && (
        <Text className="text-center text-gray-500 py-2">No matching groups found</Text>
      )}
    </View>
  );
}
