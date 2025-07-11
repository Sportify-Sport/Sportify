import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'expo-router';

export default function NotificationsScreen() {
  const { token, NotificationService } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (token) {
      loadNotifications();
    }
  }, [token]);

  const loadNotifications = async () => {
    try {
      if (!token) return;

      const result = await NotificationService.getNotificationHistory(token);
      
      if (result.success) {
        setNotifications(result.notifications || []);
      } else {
        Alert.alert('Error', 'Failed to load notifications');
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
      Alert.alert('Error', 'Failed to load notifications');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadNotifications();
  };

  const markAsRead = async (notificationId) => {
    try {
      const result = await NotificationService.markNotificationAsRead(notificationId, token);
      
      if (result.success) {
        setNotifications(prev => 
          prev.map(notif => 
            notif.NotificationId === notificationId 
              ? { ...notif, IsRead: true, ReadAt: new Date().toISOString() }
              : notif
          )
        );
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleNotificationPress = (notification) => {
    if (!notification.IsRead) {
      markAsRead(notification.NotificationId);
    }
    
    // Parse notification data
    let data = {};
    try {
      data = notification.NotificationData ? JSON.parse(notification.NotificationData) : {};
    } catch (error) {
      console.error('Error parsing notification data:', error);
    }
    
    // Handle navigation based on notification type
    switch (notification.NotificationType) {
      case 'admin_message':
        if (notification.RelatedEntityType === 'Event' && notification.RelatedEntityId) {
          router.push(`/events/${notification.RelatedEntityId}`);
        } else if (notification.RelatedEntityType === 'Group' && notification.RelatedEntityId) {
          router.push(`/groups/${notification.RelatedEntityId}`);
        }
        break;
      
      case 'event_created':
      case 'event_admin_assigned':
      case 'event_deleted':
      case 'join_request_response':
        if (notification.RelatedEntityId) {
          router.push(`/events/${notification.RelatedEntityId}`);
        }
        break;
      
      case 'group_created':
      case 'group_admin_assigned':
      case 'group_deleted':
      case 'group_join_approved':
      case 'group_join_rejected':
        if (notification.RelatedEntityId) {
          router.push(`/groups/${notification.RelatedEntityId}`);
        }
        break;
      
      default:
        console.log('Unknown notification type:', notification.NotificationType);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'admin_message': return 'megaphone';
      case 'event_created': return 'calendar';
      case 'event_deleted': return 'calendar-outline';
      case 'event_admin_assigned': return 'shield-checkmark';
      case 'group_created': return 'people';
      case 'group_deleted': return 'people-outline';
      case 'group_admin_assigned': return 'shield-checkmark';
      case 'join_request_response': return 'checkmark-circle';
      case 'group_join_approved': return 'checkmark-circle';
      case 'group_join_rejected': return 'close-circle';
      case 'removed_from_event': return 'exit';
      case 'removed_from_group': return 'exit';
      default: return 'notifications';
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'admin_message': return '#FF6B6B';
      case 'event_created': return '#4ECDC4';
      case 'event_deleted': return '#E74C3C';
      case 'group_created': return '#45B7D1';
      case 'group_deleted': return '#E74C3C';
      case 'join_request_response': return '#96CEB4';
      case 'group_join_approved': return '#96CEB4';
      case 'group_join_rejected': return '#FF6B6B';
      default: return '#BDC3C7';
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return 'Today';
    if (diffDays === 2) return 'Yesterday';
    if (diffDays <= 7) return `${diffDays - 1} days ago`;
    return date.toLocaleDateString();
  };

  const renderNotification = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.notificationItem,
        !item.IsRead && styles.unreadNotification
      ]}
      onPress={() => handleNotificationPress(item)}
    >
      <View style={styles.notificationIcon}>
        <Ionicons 
          name={getNotificationIcon(item.NotificationType)} 
          size={24} 
          color={getNotificationColor(item.NotificationType)} 
        />
      </View>
      
      <View style={styles.notificationContent}>
        <Text style={[
          styles.notificationTitle,
          !item.IsRead && styles.unreadText
        ]}>
          {item.Title}
        </Text>
        <Text style={styles.notificationBody} numberOfLines={2}>
          {item.Body}
        </Text>
        <Text style={styles.notificationTime}>
          {formatDate(item.SentAt)}
        </Text>
      </View>
      
      {!item.IsRead && <View style={styles.unreadIndicator} />}
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#3CCF4E" />
        <Text style={styles.loadingText}>Loading notifications...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Notifications</Text>
        {notifications.some(n => !n.IsRead) && (
          <TouchableOpacity 
            style={styles.markAllButton}
            onPress={async () => {
              for (const notif of notifications.filter(n => !n.IsRead)) {
                await markAsRead(notif.NotificationId);
              }
            }}
          >
            <Text style={styles.markAllText}>Mark all read</Text>
          </TouchableOpacity>
        )}
      </View>
      
      <FlatList
        data={notifications}
        renderItem={renderNotification}
        keyExtractor={(item) => item.NotificationId.toString()}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.centerContainer}>
            <Ionicons name="notifications-off" size={64} color="#BDC3C7" />
            <Text style={styles.emptyText}>No notifications yet</Text>
            <Text style={styles.emptySubtext}>
              You'll see notifications about events and groups here
            </Text>
          </View>
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={notifications.length === 0 ? styles.emptyContainer : null}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  markAllButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#3CCF4E',
    borderRadius: 12,
  },
  markAllText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 4,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  unreadNotification: {
    backgroundColor: '#F8F9FF',
    borderLeftWidth: 4,
    borderLeftColor: '#3CCF4E',
  },
  notificationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  unreadText: {
    fontWeight: 'bold',
  },
  notificationBody: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 8,
  },
  notificationTime: {
    fontSize: 12,
    color: '#999',
  },
  unreadIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#3CCF4E',
    marginLeft: 8,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyContainer: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
});
