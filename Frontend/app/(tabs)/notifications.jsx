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
  const [pageNumber, setPageNumber] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (token) {
      loadNotifications(1, true);
    }
  }, [token]);

  const loadNotifications = async (page = 1, reset = false) => {
    try {
      if (!token) return;

      if (page === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      const result = await NotificationService.getNotificationHistory(token, page, 20);

      if (result.success) {
        if (reset) {
          setNotifications(result.notifications || []);
        } else {
          setNotifications(prev => [...prev, ...(result.notifications || [])]);
        }
        setHasMore(result.pagination?.hasMore || false);
        setTotalCount(result.pagination?.totalCount || 0);
        setUnreadCount(result.unreadCount || 0);
        setPageNumber(page);
      } else {
        Alert.alert('Error', 'Failed to load notifications');
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
      Alert.alert('Error', 'Failed to load notifications');
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadNotifications(1, true);
  };

  const loadMore = () => {
    if (!loadingMore && hasMore) {
      loadNotifications(pageNumber + 1, false);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      const result = await NotificationService.markNotificationAsRead(notificationId, token);

      if (result.success) {
        setNotifications(prev =>
          prev.map(notif =>
            notif.notificationId === notificationId
              ? { ...notif, isRead: true, readAt: new Date().toISOString() }
              : notif
          )
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const deleteNotification = async (notificationId) => {
    Alert.alert(
      'Delete Notification',
      'Are you sure you want to delete this notification?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const result = await NotificationService.deleteNotification(notificationId, token);
              if (result.success) {
                setNotifications(prev => prev.filter(n => n.notificationId !== notificationId));
                setTotalCount(prev => Math.max(0, prev - 1));
                
                // Update unread count if deleted notification was unread
                const notification = notifications.find(n => n.notificationId === notificationId);
                if (notification && !notification.isRead) {
                  setUnreadCount(prev => Math.max(0, prev - 1));
                }
              } else {
                Alert.alert('Error', 'Failed to delete notification');
              }
            } catch (error) {
              console.error('Error deleting notification:', error);
              Alert.alert('Error', 'Failed to delete notification');
            }
          },
        },
      ]
    );
  };

  const handleNotificationPress = (notification) => {
    if (!notification.isRead) {
      markAsRead(notification.notificationId);
    }

    router.push({
      pathname: '../screens/NotificationDetails',
      params: {
        notification: JSON.stringify(notification),
      },
    });
  };

  const getNotificationIcon = (notification) => {
    let type = notification.notificationType;

    // If notificationType is empty, try to parse from notificationData
    if (!type && notification.notificationData) {
      try {
        const data = JSON.parse(notification.notificationData);
        type = data.type || type;
      } catch (e) { }
    }

    switch (type) {
      case 'admin_message': return 'megaphone';
      case 'event_created': return 'calendar';
      case 'event_deleted': return 'calendar-outline';
      case 'event_admin_assigned': return 'shield-checkmark';
      case 'group_created': return 'people';
      case 'group_deleted': return 'people-outline';
      case 'group_admin_assigned': return 'shield-checkmark';
      case 'join_request_response': return 'checkmark-circle';
      case 'join_request_approved': return 'checkmark-circle';
      case 'group_join_approved': return 'checkmark-circle';
      case 'group_join_rejected': return 'close-circle';
      case 'removed_from_event': return 'exit';
      case 'removed_from_group': return 'exit';
      default: return 'notifications';
    }
  };

  const getNotificationColor = (notification) => {
    let type = notification.notificationType;

    // If notificationType is empty, try to parse from notificationData
    if (!type && notification.notificationData) {
      try {
        const data = JSON.parse(notification.notificationData);
        type = data.type || type;
      } catch (e) { }
    }

    switch (type) {
      case 'admin_message': return '#FF6B6B';
      case 'event_created': return '#4ECDC4';
      case 'event_deleted': return '#E74C3C';
      case 'group_created': return '#45B7D1';
      case 'group_deleted': return '#E74C3C';
      case 'join_request_response': return '#96CEB4';
      case 'join_request_approved': return '#96CEB4';
      case 'group_join_approved': return '#96CEB4';
      case 'group_join_rejected': return '#FF6B6B';
      case 'removed_from_event': return '#E74C3C';
      case 'removed_from_group': return '#E74C3C';
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
        !item.isRead && styles.unreadNotification
      ]}
      onPress={() => handleNotificationPress(item)}
      onLongPress={() => deleteNotification(item.notificationId)}
    >
      <View style={styles.notificationIcon}>
        <Ionicons
          name={getNotificationIcon(item)}
          size={24}
          color={getNotificationColor(item)}
        />
      </View>

      <View style={styles.notificationContent}>
        <Text style={[
          styles.notificationTitle,
          !item.isRead && styles.unreadText
        ]}>
          {item.title}
        </Text>
        <Text style={styles.notificationBody} numberOfLines={2}>
          {item.body}
        </Text>
        <Text style={styles.notificationTime}>
          {formatDate(item.sentAt)}
        </Text>
      </View>

      {!item.isRead && <View style={styles.unreadIndicator} />}
    </TouchableOpacity>
  );

  const markAllAsRead = async () => {
    try {
      const unreadNotifications = notifications.filter(n => !n.isRead);

      for (const notif of unreadNotifications) {
        await markAsRead(notif.notificationId);
      }

      Alert.alert('Success', 'All notifications marked as read');
    } catch (error) {
      console.error('Error marking all as read:', error);
      Alert.alert('Error', 'Failed to mark all as read');
    }
  };

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
        <View>
          <Text style={styles.title}>Notifications</Text>
          {totalCount > 0 && (
            <Text style={styles.subtitle}>
              {totalCount} total • {unreadCount} unread
            </Text>
          )}
        </View>
        <View style={styles.headerRight}>
          {unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadBadgeText}>{unreadCount}</Text>
            </View>
          )}
          {notifications.some(n => !n.isRead) && (
            <TouchableOpacity
              style={styles.markAllButton}
              onPress={markAllAsRead}
            >
              <Text style={styles.markAllText}>Mark all read</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <FlatList
        data={notifications}
        renderItem={renderNotification}
        keyExtractor={(item) => item.notificationId.toString()}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          loadingMore ? (
            <View style={styles.loadingMore}>
              <ActivityIndicator size="small" color="#3CCF4E" />
            </View>
          ) : null
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
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  unreadBadge: {
    backgroundColor: '#FF6B6B',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    minWidth: 24,
    alignItems: 'center',
  },
  unreadBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
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
  loadingMore: {
    paddingVertical: 20,
    alignItems: 'center',
  },
});
