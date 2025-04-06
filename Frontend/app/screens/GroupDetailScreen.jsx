import React, { useEffect, useState } from "react";
import { View, Text } from "react-native";
import { useLocalSearchParams } from "expo-router";
import getApiBaseUrl from "../config/apiConfig";

// Mock group data (replace with real API fetch)
const mockGroups = {
  g1: {
    id: "g1",
    name: "Haifa Football Club",
    location: "Haifa",
    sport: "football",
    gender: "male",
  },
  g2: {
    id: "g2",
    name: "Tel Aviv Runners",
    location: "Tel Aviv",
    sport: "running",
    gender: "both",
  },
  g3: {
    id: "g3",
    name: "Jerusalem Tennis League",
    location: "Jerusalem",
    sport: "tennis",
    gender: "female",
  },
};

export default function GroupDetailScreen() {
  const { groupId } = useLocalSearchParams();
  const [group, setGroup] = useState(null);

  useEffect(() => {
    const fetchGroup = async () => {
      try {
        const baseUrl = getApiBaseUrl();
        const response = await fetch(`${baseUrl}/api/groups/${groupId}`);
        const groupData = mockGroups[groupId]; // Replace with response.json() in real API
        setGroup(groupData);
      } catch (error) {
        console.error("Error fetching group:", error);
      }
    };

    fetchGroup();
  }, [groupId]);

  if (!group) {
    return (
      <View className="flex-1 justify-center items-center">
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 p-4 bg-gray-100">
      <Text className="text-2xl font-bold mt-4">{group.name}</Text>
      <Text className="text-lg text-gray-600 mt-2">{group.location}</Text>
      <Text className="text-lg text-gray-600 mt-2">Sport: {group.sport}</Text>
      <Text className="text-lg text-gray-600 mt-2">Gender: {group.gender}</Text>
    </View>
  );
}