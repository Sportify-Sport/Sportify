// components/group/JoinRequestButton.js
import React from 'react';
import { TouchableOpacity, Text } from 'react-native';

export default function JoinRequestButton({ isLoggedIn, isMember, isAdmin, hasPending, onRequest, onCancel }) {
  if (!isLoggedIn || isMember || isAdmin) return null;

  return hasPending ? (
    <TouchableOpacity style={{ marginBottom: 70 }} className="bg-red-500 py-3 rounded-full" onPress={onCancel}>
      <Text className="text-white text-center font-bold">Cancel request</Text>
    </TouchableOpacity>
  ) : (
    <TouchableOpacity style={{ marginBottom: 70 }} className="bg-green-500 py-3 rounded-full" onPress={onRequest}>
      <Text className="text-white text-center font-bold">Request to Join</Text>
    </TouchableOpacity>
  );
}
