import React, { useEffect, useState } from "react";
import { View, Text, Image } from "react-native";
import { useLocalSearchParams } from "expo-router";
import getApiBaseUrl from "../config/apiConfig";

// Mock event data (replace with real API fetch)
const mockEvents = {
  "1": {
    id: "1",
    name: "LionHeart vs TigerHeart",
    date: "15/3/2025 To 16/3/2025",
    location: "Haifa",
    image: "https://example.com/football.png",
    sport: "football",
    gender: "male",
  },
  "2": {
    id: "2",
    name: "LionHeart Match",
    date: "",
    location: "Haifa",
    image: "https://example.com/lionheart.png",
    sport: "football",
    gender: "male",
  },
  "3": {
    id: "3",
    name: "Elite Running Marathon",
    date: "15/3/2025 To 16/3/2025",
    location: "Haifa",
    image: "https://example.com/marathon.png",
    sport: "running",
    gender: "both",
  },
};

export default function EventDetailScreen() {
  const { eventId } = useLocalSearchParams();
  const [event, setEvent] = useState(null);

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const baseUrl = getApiBaseUrl();
        const response = await fetch(`${baseUrl}/api/events/${eventId}`);
        const eventData = mockEvents[eventId]; // Replace with response.json() in real API
        setEvent(eventData);
      } catch (error) {
        console.error("Error fetching event:", error);
      }
    };

    fetchEvent();
  }, [eventId]);

  if (!event) {
    return (
      <View className="flex-1 justify-center items-center">
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 p-4 bg-gray-100">
      <Image
        source={{ uri: event.image }}
        className="w-full h-48 rounded-lg"
      />
      <Text className="text-2xl font-bold mt-4">{event.name}</Text>
      {event.date ? (
        <Text className="text-lg text-gray-600 mt-2">{event.date}</Text>
      ) : null}
      <Text className="text-lg text-gray-600 mt-2">{event.location}</Text>
      <Text className="text-lg text-gray-600 mt-2">Sport: {event.sport}</Text>
      <Text className="text-lg text-gray-600 mt-2">Gender: {event.gender}</Text>
    </View>
  );
}