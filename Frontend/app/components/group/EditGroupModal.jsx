import React, { useState, useCallback, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import getApiBaseUrl from '../../config/apiConfig';
import { BlurView } from 'expo-blur';

export default function EditGroupModal({ visible, group, setGroup, onClose, onSave, onGroupUpdated }) {
  const [imageFile, setImageFile] = useState(null);
  const [isFormChanged, setIsFormChanged] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [token, setToken] = useState(null);

  // Get token from AsyncStorage
  useEffect(() => {
    const getToken = async () => {
      const storedToken = await AsyncStorage.getItem('token');
      setToken(storedToken);
    };
    getToken();
  }, []);

  const handleImageChange = useCallback(async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert('Permission required', 'Permission to access camera roll is required!');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 1,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        const validTypes = ['image/png', 'image/jpeg', 'image/webp'];

        if (!validTypes.includes(file.mimeType)) {
          setError({ message: 'Invalid file type. Please upload PNG, JPG, or WebP.' });
          setImageFile(null);
          return;
        }

        setImageFile(file);
        setIsFormChanged(true);
        setError(null);
      }
    } catch (err) {
      setError({ message: 'Failed to select image. Please try again.' });
    }
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!isFormChanged && !imageFile) {
      onClose();
      return;
    }

    if (!token) {
      Alert.alert('Error', 'No authentication token found. Please log in again.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const apiUrl = getApiBaseUrl();
      let updatedGroup = { ...group };

      // Update group details if changed
      if (isFormChanged) {
        const detailsResponse = await fetch(`${apiUrl}/api/Groups/${group.groupId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            groupName: group.groupName,
            description: group.description,
          }),
        });

        if (!detailsResponse.ok) {
          const errorData = await detailsResponse.json();
          throw new Error(errorData.message || 'Failed to update group details');
        }
      }

      // Update image if changed
      if (imageFile) {
        const formDataImage = new FormData();
        formDataImage.append('groupImage', {
          uri: imageFile.uri,
          type: imageFile.mimeType,
          name: imageFile.uri.split('/').pop() || 'groupImage.jpg',
        });

        const imageResponse = await fetch(`${apiUrl}/api/Groups/${group.groupId}/image`, {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formDataImage,
        });

        if (!imageResponse.ok) {
          const errorData = await imageResponse.json();
          throw new Error(errorData.message || 'Failed to update group image');
        }

        const imageData = await imageResponse.json();
        const newImageUrl =
          imageData.data?.imageUrl || `${apiUrl}/Images/${imageFile.uri.split('/').pop()}?t=${Date.now()}`;
        updatedGroup.groupImage = newImageUrl;
      }

      if (typeof onGroupUpdated === 'function') {
        onGroupUpdated(updatedGroup);
      }
      setGroup(updatedGroup);
      onSave();
      onClose();
    } catch (err) {
      setError({ message: err.message });
      Alert.alert('Error', err.message);
    } finally {
      setIsLoading(false);
    }
  }, [group, imageFile, isFormChanged, token, onSave, onClose, setGroup, onGroupUpdated]);

  return (
    <Modal visible={visible} animationType="slide" transparent statusBarTranslucent>
      <BlurView
        intensity={100}
        tint="light"
        style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 10 }}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
          style={{ width: '100%', maxWidth: '100%' }}
        >
          <View
            style={{
              backgroundColor: 'white',
              borderRadius: 20,
              maxHeight: '100%',
              overflow: 'hidden',
            }}
          >
            {/* Header */}
            <View className="bg-green-500 py-4 px-6">
              <Text className="text-xl font-bold text-white">Edit Group Details</Text>
            </View>

            {/* Scrollable content */}
            <ScrollView
              contentContainerStyle={{ padding: 24 }}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {/* Content */}
              <Text className="text-base font-semibold mb-2 text-gray-800">Group Name</Text>
              <TextInput
                className="border border-gray-300 rounded-lg p-3 mb-4 text-gray-800"
                value={group.groupName}
                onChangeText={(t) => {
                  setGroup((g) => ({ ...g, groupName: t }));
                  setIsFormChanged(true);
                }}
                placeholder="Group Name"
                placeholderTextColor="#9CA3AF"
              />

              <Text className="text-base font-semibold mb-2 text-gray-800">Description</Text>
              <TextInput
                className="border border-gray-300 rounded-lg p-3 mb-4 text-gray-800 h-24"
                value={group.description}
                onChangeText={(t) => {
                  setGroup((g) => ({ ...g, description: t }));
                  setIsFormChanged(true);
                }}
                placeholder="Description"
                placeholderTextColor="#9CA3AF"
                multiline
              />

              <Text className="text-base font-semibold mb-2 text-gray-800">Group Image</Text>
              <TouchableOpacity
                className="border border-gray-300 rounded-lg p-3 mb-4 bg-gray-50 items-center"
                onPress={handleImageChange}
              >
                <Text className="text-gray-600">{imageFile ? 'Image Selected' : 'Select Image'}</Text>
              </TouchableOpacity>

              {error && <Text className="text-red-500 mb-4 text-center">{error.message}</Text>}

              {/* Footer Buttons */}
              <View className="flex-row justify-between mt-2">
                <TouchableOpacity
                  className="bg-gray-200 py-3 px-6 rounded-lg flex-1 mr-2 items-center"
                  onPress={onClose}
                  disabled={isLoading}
                >
                  <Text className="text-gray-800 font-medium">Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className="bg-green-500 py-3 px-6 rounded-lg flex-1 ml-2 items-center"
                  onPress={handleSubmit}
                  disabled={isLoading}
                >
                  <Text className="text-white font-medium">{isLoading ? 'Saving...' : 'Save Changes'}</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </BlurView>
    </Modal>
  );
}
