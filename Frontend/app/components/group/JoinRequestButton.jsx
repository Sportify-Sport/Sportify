import React from 'react';
import { TouchableOpacity, Text } from 'react-native';

export default function JoinRequestButton({
  isLoggedIn,
  isMember,
  isAdmin,
  hasPending,
  onRequest,
  onCancel,
  isEmailVerified,
}) {
  if (!isLoggedIn || isMember || isAdmin) return null;

  if (!isEmailVerified) {
    return (
      <TouchableOpacity
        style={{ marginBottom: 70, opacity: 0.5 }}
        className="bg-gray-400 py-3 rounded-full"
        disabled
      >
        <Text className="text-white text-center font-bold">Verify your email to join group</Text>
      </TouchableOpacity>
    );
  }

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
