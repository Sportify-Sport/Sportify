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

export default function AdminNotificationModal({ 
  visible, 
  onClose, 
  eventId = null, 
  groupId = null 
}) {
  const { token, NotificationService } = useAuth();
  const [message, setMessage] = useState('');
  const [recipients, setRecipients] = useState('all');
  const [sending, setSending] = useState(false);

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
      transparent={true}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.title}>Send Notification</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>Message</Text>
          <TextInput
            style={styles.input}
            value={message}
            onChangeText={setMessage}
            placeholder="Enter your message..."
            multiline
            numberOfLines={4}
            maxLength={1000}
          />
          <Text style={styles.charCount}>{message.length}/1000</Text>

          {eventId && (
            <>
              <Text style={styles.label}>Recipients</Text>
              <View style={styles.recipientOptions}>
                <TouchableOpacity
                  style={[
                    styles.recipientOption,
                    recipients === 'all' && styles.selectedOption
                  ]}
                  onPress={() => setRecipients('all')}
                >
                  <Text style={[
                    styles.optionText,
                    recipients === 'all' && styles.selectedText
                  ]}>All Participants</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[
                    styles.recipientOption,
                    recipients === 'players' && styles.selectedOption
                  ]}
                  onPress={() => setRecipients('players')}
                >
                  <Text style={[
                    styles.optionText,
                    recipients === 'players' && styles.selectedText
                  ]}>Players Only</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[
                    styles.recipientOption,
                    recipients === 'groups' && styles.selectedOption
                  ]}
                  onPress={() => setRecipients('groups')}
                >
                  <Text style={[
                    styles.optionText,
                    recipients === 'groups' && styles.selectedText
                  ]}>Groups Only</Text>
                </TouchableOpacity>
              </View>
            </>
          )}

          <TouchableOpacity
            style={[styles.sendButton, sending && styles.disabledButton]}
            onPress={sendNotification}
            disabled={sending}
          >
            <Text style={styles.sendButtonText}>
              {sending ? 'Sending...' : 'Send Notification'}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    minHeight: 400,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: 12,
    color: '#666',
    textAlign: 'right',
    marginTop: 4,
    marginBottom: 16,
  },
  recipientOptions: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  recipientOption: {
    flex: 1,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    alignItems: 'center',
  },
  selectedOption: {
    borderColor: '#3CCF4E',
    backgroundColor: '#F0FFF4',
  },
  optionText: {
    fontSize: 14,
    color: '#666',
  },
  selectedText: {
    color: '#3CCF4E',
    fontWeight: '600',
  },
  sendButton: {
    backgroundColor: '#3CCF4E',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#C0C0C0',
  },
  sendButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
