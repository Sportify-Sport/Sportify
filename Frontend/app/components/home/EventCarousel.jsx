import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Image, FlatList, TouchableOpacity, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');
const SLIDE_INTERVAL = 3000;

export default function EventCarousel({ events, apiUrl, message }) {
  const router = useRouter();
  const slideRef = useRef(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  // carousel controls
  const goPrev = () => {
    if (events.length === 0) return;
    const prevIndex = (currentIndex - 1 + events.length) % events.length;
    setCurrentIndex(prevIndex);
    slideRef.current?.scrollToIndex({ index: prevIndex, animated: true });
  };

  const goNext = () => {
    if (events.length === 0) return;
    const nextIndex = (currentIndex + 1) % events.length;
    setCurrentIndex(nextIndex);
    slideRef.current?.scrollToIndex({ index: nextIndex, animated: true });
  };

  useEffect(() => {
    console.log('EventCarousel message prop:', message);
  }, [message]);

  useEffect(() => {
    const interval = setInterval(goNext, SLIDE_INTERVAL);
    return () => clearInterval(interval);
  }, [currentIndex, events.length]);

  const renderSlide = ({ item }) => (
    <TouchableOpacity
      onPress={() =>
        router.push({
          pathname: '../screens/EventDetails',
          params: { eventId: item.eventId },
        })
      }
    >
      <View style={{ width }} className="w-full">
        <Image
          source={{ uri: `${apiUrl}/Images/${item.profileImage}` }}
          className="w-full h-48 rounded-lg"
        />
        <View className="absolute bottom-2 left-2 bg-black bg-opacity-50 px-2 py-1 rounded">
          <Text className="text-white">{item.eventName}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View className="mb-6">
      <Text className="text-xl font-semibold mb-2">Event Recommendations</Text>
      {message ? (
        <Text className="text-base text-gray-700 mb-2">{message}</Text>
      ) : (
        <Text className="text-base text-gray-500 mb-2">No recommendation message available</Text>
      )}
      <View className="relative">
        <FlatList
          data={events}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          renderItem={renderSlide}
          keyExtractor={(item) => String(item.eventId)}
          ref={slideRef}
        />
        <TouchableOpacity onPress={goPrev} className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 p-2 rounded-full">
          <Text className="text-white text-xl">‹</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={goNext} className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 p-2 rounded-full">
          <Text className="text-white text-xl">›</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
