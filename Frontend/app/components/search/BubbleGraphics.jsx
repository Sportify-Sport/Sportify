import React from "react";
import { View, Text } from "react-native";

export const BubbleGraphics = () => (
  <View className="relative h-32 w-full mb-4">
    {/* Blue cloud-like circle, moved right using left-1/2 and offset */}
    <View className="absolute h-24 w-24 rounded-full bg-green-400 left-20 -translate-x-8 top-4" />
    {/* Additional cloud circles with blue palette */}
    <View className="absolute h-28 w-28 rounded-full bg-green-400 left-28 top-1" />
    <View className="absolute h-24 w-28 rounded-r-full rounded-l-3xl bg-green-400 left-40 top-14" />
    <View className="absolute h-28 w-28 rounded-l-full rounded-r-3xl bg-green-400 left-2 top-10" />
    {/* Centered text bubble */}
    <View className="absolute h-28 w-40 rounded-full bg-green-400 top-10 left-12 flex items-center justify-center">
        <Text className="text-lg font-bold text-green-900 text-center px-4">
          Find Your Favorite Event{"\n"}OR Group
        </Text>
    </View>
    {/* Smaller decorative circles */}
    <View className="absolute h-10 w-10 rounded-full bg-green-400 right-1/4 top-10 opacity-90 shadow-lg" />
    <View className="absolute h-6 w-6 rounded-full bg-green-400 right-4 top-4 opacity-90 shadow-lg" />
    <View className="absolute h-20 w-20 rounded-full bg-green-400 right-3 top-20 opacity-90 shadow-lg" />
  </View>
);
