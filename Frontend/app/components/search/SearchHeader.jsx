import React from "react";
import { View, Text, TextInput, TouchableOpacity, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "expo-router";

export const SearchHeader = ({ search, setSearch, type, filters, router, searchInputRef, handleTextChange }) => {
  const navigation = useNavigation();

  const handleCancel = () => {
    if (navigation.canGoBack()) {
      router.back();
    } else {
      router.replace('/tabs/explore');
    }
  };

  return (
    <View className="flex-row items-center justify-between mb-4">
      <View className="flex-1 flex-row items-center bg-white p-3 rounded-full shadow-sm">
        <Ionicons name="search" size={20} color="gray" className="ml-2" />
        <TextInput
          ref={searchInputRef}
          className="flex-1 ml-2 text-base text-gray-900 text-left"
          placeholder={`Search for ${type === "group" ? "a group" : "an event"}...`}
          placeholderTextColor="#6B7280"
          value={search}
          onChangeText={handleTextChange}
          returnKeyType="search"
          autoFocus={true}
          textAlign="left"
          textAlignVertical="center"
          editable={true}
          {...(Platform.OS === "web" ? { autoComplete: "off" } : {})}
          style={Platform.OS === "web" ? { outline: "none" } : {}}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch("")}>
            <Ionicons name="close-circle" size={20} color="gray" className="mr-2" />
          </TouchableOpacity>
        )}
        <TouchableOpacity
          onPress={() =>
            router.push({
              pathname: "/screens/SearchFilter",
              params: { type: type || "event" },
            })
          }
          className="p-1"
        >
          <Ionicons
            name="options-outline"
            size={24}
            color={Object.keys(filters).some((key) => filters[key] != null && key !== "resetSearch") ? "#10B981" : "gray"}
          />
        </TouchableOpacity>
      </View>
      <TouchableOpacity onPress={handleCancel} className="ml-2">
        <Text className="text-base text-green-500 font-medium">Cancel</Text>
      </TouchableOpacity>
    </View>
  );
};