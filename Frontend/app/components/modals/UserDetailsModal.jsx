// components/modals/UserDetailsModal.jsx
import React from "react";
import { View, Text, Image, Modal, TouchableOpacity } from "react-native";
import { BlurView } from "expo-blur";
import { Ionicons } from "@expo/vector-icons";
import getApiBaseUrl from "../../config/apiConfig";

export default function UserDetailsModal({ user, visible, onClose }) {
  const apiUrl = getApiBaseUrl();

  if (!visible || !user) return null;

  return (
<Modal visible={visible} animationType="slide" transparent>
        <BlurView
          intensity={100}
          tint="light"
          style={{ position: 'absolute', top: 0, left: 0, bottom: 0, right: 0 }}
        />
        <View className="flex-1 justify-center items-center">
          <View className="bg-white w-11/12 p-6 rounded-2xl shadow-lg">
            {user && (
              <>
                <View className="flex-row items-center mb-4 space-x-4">
                  <Image
                    source={{ uri: `${apiUrl}/Images/${user.profileImage}`}}
                    className="w-12 h-12 rounded-full"
                  />
                  <Text className="text-2xl font-bold text-gray-800">{user.fullName}</Text>
                </View>
                <View className="space-y-2">
                  <Text className="text-gray-700"><Text className="font-semibold">Email:</Text> {user.email}</Text>
                  <Text className="text-gray-700"><Text className="font-semibold">City:</Text> {user.cityName}</Text>
                  <Text className="text-gray-700"><Text className="font-semibold">Bio:</Text> {user.bio}</Text>
                  <Text className="text-gray-700"><Text className="font-semibold">Gender:</Text> {user.gender}</Text>
                </View>
              </>
            )}
            <TouchableOpacity
              className="mt-6 bg-gray-100 py-2 px-6 rounded-full self-end shadow-sm"
              onPress={onClose}
            >
              <Text className="text-gray-700 font-medium">Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
  );
}
