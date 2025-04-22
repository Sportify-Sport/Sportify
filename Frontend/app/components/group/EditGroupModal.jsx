// components/group/EditGroupModal.js
import React from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity } from 'react-native';

export default function EditGroupModal({ visible, group, setGroup, onClose, onSave }) {
  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View className="flex-1 justify-center items-center bg-black bg-opacity-50">
        <View className="bg-white w-11/12 p-6 rounded-xl shadow-lg">
          <Text className="text-xl font-bold mb-4 text-gray-800">Edit Group Details</Text>
          <TextInput
            className="border border-gray-300 rounded-lg p-3 mb-3"
            value={group.groupName}
            onChangeText={t => setGroup(g => ({ ...g, groupName: t }))}
            placeholder="Group Name"
          />
          <TextInput
            className="border border-gray-300 rounded-lg p-3 mb-3"
            value={group.description}
            onChangeText={t => setGroup(g => ({ ...g, description: t }))}
            placeholder="Description"
            multiline
          />
          <TextInput
            className="border border-gray-300 rounded-lg p-3 mb-3"
            value={`${group.maxMembers}`}
            onChangeText={t => setGroup(g => ({ ...g, maxMembers: parseInt(t, 10) || 0 }))}
            placeholder="Max Members"
            keyboardType="numeric"
          />
          <TextInput
            className="border border-gray-300 rounded-lg p-3 mb-3"
            value={`${group.minAge}`}
            onChangeText={t => setGroup(g => ({ ...g, minAge: parseInt(t, 10) || 0 }))}
            placeholder="Min Age"
            keyboardType="numeric"
          />
          <View className="flex-row justify-end space-x-3">
            <TouchableOpacity className="bg-gray-200 py-2 px-4 rounded-full" onPress={onClose}>
              <Text className="text-gray-800">Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity className="bg-blue-500 py-2 px-4 rounded-full" onPress={onSave}>
              <Text className="text-white">Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
