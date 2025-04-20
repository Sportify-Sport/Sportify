import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';

export default function Header({ token, profileName }) {
  const router = useRouter();
  
  return (
    <View className="flex-row justify-between items-center mb-4">
      <Text className="text-2xl font-bold">
        Welcome, {token ? profileName : 'guest'}!
      </Text>
      {!token && (
        <TouchableOpacity
          className="bg-[#65DA84] px-4 py-2 rounded-full"
          onPress={() => router.push('/screens/Login')}
        >
          <Text className="text-white">Login</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
