import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import getApiBaseUrl from '../../config/apiConfig';
import styles from '../../../styles/ChangePassModalStyles';

export default function ChangePassModal({ visible, onClose }) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [responseMessage, setResponseMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [token, setToken] = useState(null);

  useEffect(() => {
    const fetchToken = async () => {
      const storedToken = await AsyncStorage.getItem('token');
      setToken(storedToken);
    };
    fetchToken();
  }, []);

  const handleConfirm = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      setResponseMessage('❌ Please fill in all fields.');
      setIsSuccess(false);
      return;
    }
    if (newPassword !== confirmPassword) {
      setResponseMessage('❌ New password and confirm password do not match.');
      setIsSuccess(false);
      return;
    }
    if (!token) {
      setResponseMessage('❌ User is not authenticated.');
      setIsSuccess(false);
      return;
    }

    setLoading(true);
    setResponseMessage('');
    setIsSuccess(false);

    try {
      const apiUrl = getApiBaseUrl();
      const response = await fetch(`${apiUrl}/api/Auth/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'accept': '*/*',
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      // Try to parse JSON safely:
      let data;
      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text();
      }

      if (response.ok && data.tokens) {
        // Success flow
        await AsyncStorage.multiSet([
          ['token', data.tokens.accessToken],
          ['refreshToken', data.tokens.refreshToken],
        ]);
        setResponseMessage('✅ Password changed successfully.');
        setIsSuccess(true);
        // Clear inputs
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');

        // Close modal after 3 seconds
        setTimeout(() => {
          onClose();
          setResponseMessage('');
          setIsSuccess(false);
        }, 3000);
      } else {
        // On error, if data is an object and has message, else fallback to string
        const errorMsg =
          typeof data === 'object' && data !== null
            ? data.message || JSON.stringify(data)
            : data;
        setResponseMessage(`❌ ${errorMsg}`);
        setIsSuccess(false);
      }
    } catch (err) {
      setResponseMessage(`❌ ${err.message}`);
      setIsSuccess(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Text style={styles.title}>Change Password</Text>

          <TextInput
            style={styles.input}
            placeholder="Current Password"
            secureTextEntry
            value={currentPassword}
            onChangeText={setCurrentPassword}
            editable={!isSuccess}
          />

          <TextInput
            style={styles.input}
            placeholder="New Password"
            secureTextEntry
            value={newPassword}
            onChangeText={setNewPassword}
            editable={!isSuccess}
          />

          <TextInput
            style={styles.input}
            placeholder="Confirm New Password"
            secureTextEntry
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            editable={!isSuccess}
          />

          {responseMessage ? (
            <Text
              style={[
                styles.response,
                { color: responseMessage.startsWith('✅') ? 'green' : 'red' },
              ]}
            >
              {responseMessage}
            </Text>
          ) : null}

          {!isSuccess && (
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.button, styles.cancel]}
                onPress={onClose}
                disabled={loading}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.confirm]}
                onPress={handleConfirm}
                disabled={loading}
              >
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Confirm</Text>}
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

