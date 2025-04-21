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
    <Modal visible={visible} transparent animationType="fade">
      <BlurView intensity={80} tint="dark" style={{ flex: 1 }}>
        <View className="flex-1 justify-center items-center p-4">
          <View className="bg-white rounded-xl w-11/12 p-5">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-xl font-bold text-gray-800">
                {user.fullName}
              </Text>
              <TouchableOpacity onPress={onClose}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <View className="items-center mb-4">
              <Image
                source={{
                  uri: `${apiUrl}/Images/${
                    user.profileImage || "default_profile.png"
                  }`,
                }}
                className="w-20 h-20 rounded-full"
              />
            </View>

            <View className="space-y-3">
              {user.email && (
                <View className="flex-row">
                  <Text className="text-gray-600 w-24">Email:</Text>
                  <Text className="text-gray-800">{user.email}</Text>
                </View>
              )}

              {user.age && (
                <View className="flex-row">
                  <Text className="text-gray-600 w-24">Age:</Text>
                  <Text className="text-gray-800">{user.age}</Text>
                </View>
              )}

              {user.gender && (
                <View className="flex-row">
                  <Text className="text-gray-600 w-24">Gender:</Text>
                  <Text className="text-gray-800">
                    {user.gender === "M"
                      ? "Male"
                      : user.gender === "F"
                      ? "Female"
                      : user.gender}
                  </Text>
                </View>
              )}

              {user.cityName && (
                <View className="flex-row">
                  <Text className="text-gray-600 w-24">City:</Text>
                  <Text className="text-gray-800">{user.cityName}</Text>
                </View>
              )}

              {user.bio !== null && user.bio !== undefined && (
                <View>
                  <Text className="text-gray-600 mb-1">Bio:</Text>
                  <Text className="text-gray-800">
                    {user.bio.trim() === "" ? "N/A" : user.bio}
                  </Text>
                </View>
              )}
            </View>

            <TouchableOpacity
              className="bg-gray-200 py-2 rounded-lg mt-4"
              onPress={onClose}
            >
              <Text className="text-center font-medium">Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </BlurView>
    </Modal>
  );
}
