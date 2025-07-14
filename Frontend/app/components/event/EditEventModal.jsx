import React, { useState, useCallback, useEffect } from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import getApiBaseUrl from '../../config/apiConfig';
import { BlurView } from 'expo-blur';

export default function EditEventModal({ visible, event, onClose, onSave, token, onEventUpdated }) {
  const [imageFile, setImageFile] = useState(null);
  const [isFormChanged, setIsFormChanged] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [localEvent, setLocalEvent] = useState({ ...event });

  useEffect(() => {
    setLocalEvent({ ...event });
  }, [event]);

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
      let updatedEvent = { ...localEvent };

      // Update event details if changed
      if (isFormChanged) {
        const detailsResponse = await fetch(`${apiUrl}/api/Events/${event.eventId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ 
            eventName: localEvent.eventName, 
            description: localEvent.description,
            locationName: localEvent.locationName
          }),
        });

        if (!detailsResponse.ok) {
          const errorData = await detailsResponse.json();
          throw new Error(errorData.message || 'Failed to update event details');
        }
      }

      // Update image if changed
      if (imageFile) {
        const formDataImage = new FormData();
        formDataImage.append('eventImage', {
          uri: imageFile.uri,
          type: imageFile.mimeType,
          name: imageFile.uri.split('/').pop() || 'eventImage.jpg',
        });

        const imageResponse = await fetch(`${apiUrl}/api/Events/${event.eventId}/image`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          body: formDataImage,
        });

        if (!imageResponse.ok) {
          const errorData = await imageResponse.json();
          throw new Error(errorData.message || 'Failed to update event image');
        }

        // Attempt to get server-returned image URL
        const imageData = await imageResponse.json();
        updatedEvent.eventImage = imageData.data?.imageUrl || `${apiUrl}/Images/${imageFile.uri.split('/').pop()}?t=${Date.now()}`;
      }

      if (typeof onEventUpdated === 'function') {
        onEventUpdated(updatedEvent);
      }
      onSave();
      onClose();
    } catch (err) {
      setError({ message: err.message });
      Alert.alert('Error', err.message);
    } finally {
      setIsLoading(false);
    }
  }, [localEvent, imageFile, isFormChanged, token, onSave, onClose, onEventUpdated, event.eventId]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      statusBarTranslucent={true}
    >
      <BlurView
        intensity={20}
        tint="light"
        className="flex-1 justify-center items-center"
      >
        <View className="w-11/12 bg-white rounded-xl shadow-lg overflow-hidden">
          {/* Header */}
          <View className="bg-green-500 py-4 px-6">
            <Text className="text-xl font-bold text-white">Edit Event Details</Text>
          </View>
          
          {/* Content */}
          <View className="p-6">
            <Text className="text-base font-semibold mb-2 text-gray-800">Event Name</Text>
            <TextInput
              className="border border-gray-300 rounded-lg p-3 mb-4 text-gray-800"
              value={localEvent.eventName}
              onChangeText={t => {
                setLocalEvent(e => ({ ...e, eventName: t }));
                setIsFormChanged(true);
              }}
              placeholder="Event Name"
              placeholderTextColor="#9CA3AF"
            />
            
            <Text className="text-base font-semibold mb-2 text-gray-800">Description</Text>
            <TextInput
              className="border border-gray-300 rounded-lg p-3 mb-4 text-gray-800 h-24"
              value={localEvent.description}
              onChangeText={t => {
                setLocalEvent(e => ({ ...e, description: t }));
                setIsFormChanged(true);
              }}
              placeholder="Description"
              placeholderTextColor="#9CA3AF"
              multiline
            />
            
            <Text className="text-base font-semibold mb-2 text-gray-800">Location</Text>
            <TextInput
              className="border border-gray-300 rounded-lg p-3 mb-4 text-gray-800"
              value={localEvent.locationName}
              onChangeText={t => {
                setLocalEvent(e => ({ ...e, locationName: t }));
                setIsFormChanged(true);
              }}
              placeholder="Location Name"
              placeholderTextColor="#9CA3AF"
            />
            
            <Text className="text-base font-semibold mb-2 text-gray-800">Event Image</Text>
            <TouchableOpacity 
              className="border border-gray-300 rounded-lg p-3 mb-4 bg-gray-50 items-center"
              onPress={handleImageChange}
            >
              <Text className="text-gray-600">
                {imageFile ? 'Image Selected' : 'Select Image'}
              </Text>
            </TouchableOpacity>

            {error && (
              <Text className="text-red-500 mb-4 text-center">{error.message}</Text>
            )}

            <View className="flex-row justify-between mt-4">
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
                <Text className="text-white font-medium">
                  {isLoading ? 'Saving...' : 'Save Changes'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </BlurView>
    </Modal>
  );
}