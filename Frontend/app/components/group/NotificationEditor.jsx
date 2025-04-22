// components/group/NotificationEditor.js
import React from 'react';
import { View, TextInput, TouchableOpacity, Text } from 'react-native';

export default function NotificationEditor({ message, onChange, onSend, onEdit }) {
  return (
    <View className="bg-white p-4 rounded-xl shadow mb-6">
      <TextInput
        className="border border-gray-300 rounded-lg p-3 mb-3"
        placeholder="Type notification message..."
        value={message}
        onChangeText={onChange}
        multiline
      />
      <View className="flex-row space-x-3">
        <TouchableOpacity
          className={`flex-1 py-3 rounded-full ${message.trim() ? 'bg-green-500' : 'bg-gray-300'}`}
          onPress={onSend}
          disabled={!message.trim()}
        >
          <Text className="text-white text-center font-bold">Send Notification</Text>
        </TouchableOpacity>
        <TouchableOpacity className="flex-1 py-3 rounded-full bg-blue-500" onPress={onEdit}>
          <Text className="text-white text-center font-bold">Edit Group</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
