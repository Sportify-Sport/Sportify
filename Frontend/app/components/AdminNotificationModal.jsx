import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { BlurView } from 'expo-blur';

export default function AdminNotificationModal({
  visible,
  onClose,
  eventId = null,
  groupId = null,
  requiresTeams = false,
  isPublic = true
}) {
  const { token, NotificationService } = useAuth();
  const [message, setMessage] = useState('');
  const [recipients, setRecipients] = useState(
    requiresTeams && !isPublic ? 'groups' : 'all' // Default to groups if requiresTeams and not public
  );
  const [sending, setSending] = useState(false);


  // Determine which recipient options to show based on event type
  const showAllOption = true; // Always show 'All' option except when requiresTeams && !isPublic
  const showPlayersOption = !requiresTeams && isPublic;
  const showGroupsOption = requiresTeams;

  const sendNotification = async () => {
    if (!message.trim()) {
      Alert.alert('Error', 'Please enter a message');
      return;
    }

    setSending(true);

    try {
      const result = await NotificationService.sendAdminNotification(
        message,
        eventId,
        groupId,
        recipients,
        token
      );

      if (result.success) {
        Alert.alert(
          'Success',
          `Notification sent to ${result.sentCount} recipient${result.sentCount !== 1 ? 's' : ''}`,
          [{ text: 'OK', onPress: onClose }]
        );
        setMessage('');
      } else {
        Alert.alert('Error', result.message || 'Failed to send notification');
      }
    } catch (error) {
      Alert.alert('Error', 'Network error. Please try again.');
    } finally {
      setSending(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      statusBarTranslucent
    >
      <BlurView
        intensity={100}
        tint="light"
        className="flex-1 justify-center items-center"
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="w-11/12"
        >
          <View className="bg-white rounded-2xl p-5 shadow-lg min-h-[400px]">
            <View className="flex-row justify-between items-center mb-5">
              <Text className="text-xl font-bold text-gray-800">Send Notification</Text>
              <TouchableOpacity onPress={onClose}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <Text className="text-base font-semibold text-gray-800 mb-2">Message</Text>
            <TextInput
              className="border border-gray-400 rounded-lg p-3 text-base min-h-[100px] text-align-top"
              value={message}
              onChangeText={setMessage}
              placeholder="Enter your message..."
              placeholderTextColor="#9ca2adff"
              multiline
              numberOfLines={4}
              maxLength={1000}
            />
            <Text className="text-xs text-gray-600 text-right mt-1 mb-4">
              {message.length}/1000
            </Text>

            {eventId && (
              <>
                <Text className="text-base font-semibold text-gray-800 mb-2">Recipients</Text>
                <View className="flex-row gap-2 mb-5">
                  {showAllOption && !(requiresTeams && !isPublic) && (
                    <TouchableOpacity
                      className={`flex-1 p-3 border rounded-lg items-center ${recipients === 'all' ? 'border-green-500 bg-green-50' : 'border-gray-200'}`}
                      onPress={() => setRecipients('all')}
                    >
                      <Text className={`text-sm ${recipients === 'all' ? 'text-green-500 font-semibold' : 'text-gray-600'}`}>
                        All Participants
                      </Text>
                    </TouchableOpacity>
                  )}
                  {showPlayersOption && (
                    <TouchableOpacity
                      className={`flex-1 p-3 border rounded-lg items-center ${recipients === 'players' ? 'border-green-500 bg-green-50' : 'border-gray-200'}`}
                      onPress={() => setRecipients('players')}
                    >
                      <Text className={`text-sm ${recipients === 'players' ? 'text-green-500 font-semibold' : 'text-gray-600'}`}>
                        Players Only
                      </Text>
                    </TouchableOpacity>
                  )}
                  {showGroupsOption && (
                    <TouchableOpacity
                      className={`flex-1 p-3 border rounded-lg items-center ${recipients === 'groups' ? 'border-green-500 bg-green-50' : 'border-gray-200'}`}
                      onPress={() => setRecipients('groups')}
                    >
                      <Text className={`text-sm ${recipients === 'groups' ? 'text-green-500 font-semibold' : 'text-gray-600'}`}>
                        Groups Only
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </>
            )}

            <TouchableOpacity
              className={`p-4 rounded-lg items-center ${sending ? 'bg-gray-400' : 'bg-green-500'}`}
              onPress={sendNotification}
              disabled={sending}
            >
              <Text className="text-white text-base font-semibold">
                {sending ? 'Sending...' : 'Send Notification'}
              </Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </BlurView>
    </Modal>
  );
}