import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ActivityIndicator,
  Animated,
  ScrollView,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Swipeable } from 'react-native-gesture-handler';
import { useAuth } from '../context/AuthContext';
import { useRouter, useFocusEffect } from 'expo-router'; // Added useFocusEffect
import { StyleSheet } from 'react-native'; // Added for styles

export default function NotificationsScreen() {
  const { token, NotificationService, unreadCount, setUnreadCount, isGuest, logout } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [pageNumber, setPageNumber] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [name, setName] = useState('Loading...');
  const [email, setEmail] = useState('');

  const router = useRouter();

  // Initial load when component mounts with valid token
  useEffect(() => {
    if (isGuest) {
      setName("Guest User");
      setEmail("guest@example.com");
      return;
    }
    if (token) {
      loadNotifications(1, true);
    }

  }, [token, isGuest]);

  // Fetch new notifications when screen is focused
  useFocusEffect(
    React.useCallback(() => {
      if (token && !isGuest) {
        loadNotifications(1, true); // Reset and fetch latest notifications
      }
    }, [token, isGuest])
  );

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

  const deleteNotification = async (notificationId) => {
    try {
      const result = await NotificationService.deleteNotification(notificationId, token);
      if (result.success) {
        setNotifications(prev => prev.filter(n => n.notificationId !== notificationId));
        setTotalCount(prev => Math.max(0, prev - 1));
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
      } else {
        Alert.alert('Error', 'Failed to mark notification as read');
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
      Alert.alert('Error', 'Failed to mark notification as read');
    }
  };

  const handleNotificationPress = async (notification) => {
    if (!notification.isRead) {
      await markAsRead(notification.notificationId);
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
      case 'event_admin_assigned': return '#96CEB4';
      case 'group_created': return '#45B7D1';
      case 'group_deleted': return '#E74C3C';
      case 'group_admin_assigned': return '#96CEB4';
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

  const handleLogout = () => {
    if (isGuest) {
      Alert.alert(
        "Exit Guest Mode",
        "Are you sure you want to exit guest mode?",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Exit", style: "destructive", onPress: () => router.replace('../screens/Login') }
        ]
      );
      return;
    }

    Alert.alert(
      "Confirm Logout",
      "Are you sure you want to log out?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Logout",
          style: "destructive",
          onPress: async () => {
            await logout();
            router.replace('../screens/Login');
          }
        }
      ]
    );
  };

  if (isGuest) {
    return (
      <ScrollView contentContainerStyle={styles.guestContainer}>
        <View style={styles.GuestImageWrapper}>
          <Image source={{ uri: 'https://via.placeholder.com/150' }} style={styles.profileImage} />
        </View>

        <Text style={styles.name}>Guest User</Text>

        <View style={[styles.infoContainer, { marginTop: 20 }]}>
          <Text style={styles.label}>🚀 Ready to join?</Text>
          <Text style={styles.infoText}>
            Sign up to create your profile, join events, and connect with other sports enthusiasts!
          </Text>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => router.push('../screens/Signup')}
          >
            <Ionicons name="person-add" size={20} color="#fff" />
            <Text style={styles.editButtonText}>Sign Up</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
          >
            <Ionicons name="log-out-outline" size={20} color="#fff" />
            <Text style={styles.logoutButtonText}>Exit</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  const renderRightActions = (progress, dragX, notificationId) => {
    const trans = dragX.interpolate({
      inputRange: [-80, 0],
      outputRange: [0, 80],
      extrapolate: 'clamp',
    });
    return (
      <View className="justify-center mx-4 my-1">
        <Animated.View
          style={{
            transform: [{ translateX: trans }],
            backgroundColor: '#FF6B6B',
            width: 80,
            height: '100%',
            borderRadius: 8,
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <TouchableOpacity
            className="justify-center items-center w-full h-full"
            onPress={() => deleteNotification(notificationId)}
          >
            <Ionicons name="trash" size={24} color="#fff" />
            <Text className="text-white text-xs mt-1">Delete</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    );
  };

  const renderNotification = ({ item }) => (
    <Swipeable
      renderRightActions={(progress, dragX) => renderRightActions(progress, dragX, item.notificationId)}
      overshootRight={false}
      rightThreshold={40}
    >
      <TouchableOpacity
        className={`flex-row items-center bg-white p-4 mx-4 my-1 rounded-lg shadow-sm ${!item.isRead ? 'border-l-4 border-green-500 bg-blue-50' : ''}`}
        onPress={() => handleNotificationPress(item)}
      >
        <View className="w-10 h-10 rounded-full bg-gray-100 justify-center items-center mr-3">
          <Ionicons
            name={getNotificationIcon(item)}
            size={24}
            color={getNotificationColor(item)}
          />
        </View>

        <View className="flex-1">
          <Text className={`text-base font-semibold text-gray-800 ${!item.isRead ? 'font-bold' : ''}`}>
            {item.title}
          </Text>
          <Text className="text-sm text-gray-600 line-height-5 mb-2" numberOfLines={2}>
            {item.body}
          </Text>
          <Text className="text-xs text-gray-400">
            {formatDate(item.sentAt)}
          </Text>
        </View>

        {!item.isRead && <View className="w-2 h-2 rounded-full bg-green-500 ml-2" />}
      </TouchableOpacity>
    </Swipeable>
  );

  const markAllAsRead = async () => {
    try {
      const unreadNotifications = notifications.filter(n => !n.isRead);

      for (const notif of unreadNotifications) {
        await NotificationService.markNotificationAsRead(notif.notificationId, token);
      }
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true, readAt: new Date().toISOString() })));
      setUnreadCount(0);
      Alert.alert('Success', 'All notifications marked as read');
    } catch (error) {
      console.error('Error marking all as read:', error);
      Alert.alert('Error', 'Failed to mark all as read');
    }
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" color="#3CCF4E" />
        <Text className="mt-4 text-base text-gray-600">Loading notifications...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      <View className="flex-row justify-between items-center p-5 pt-16 border-b border-gray-100">
        <View>
          <Text className="text-2xl font-bold text-gray-800">Notifications</Text>
          {totalCount > 0 && (
            <Text className="text-sm text-gray-600 mt-1">
              {totalCount} total • {unreadCount} unread
            </Text>
          )}
        </View>
        {notifications.some(n => !n.isRead) && (
          <View className="flex-row items-center">
            {unreadCount > 0 && (
              <View className="mr-2 bg-red-500 rounded-full w-6 h-6 flex items-center justify-center">
                <Text className="text-white text-sm font-semibold">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </Text>
              </View>
            )}
            <TouchableOpacity
              className="px-3 py-1.5 bg-green-500 rounded-lg"
              onPress={markAllAsRead}
            >
              <Text className="text-white text-xs font-semibold">Mark all read</Text>
            </TouchableOpacity>
          </View>
        )}
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
            <View className="py-5 items-center">
              <ActivityIndicator size="small" color="#3CCF4E" />
            </View>
          ) : null
        }
        ListEmptyComponent={
          <View className="flex-1 justify-center items-center px-10">
            <Ionicons name="notifications-off" size={64} color="#BDC3C7" />
            <Text className="text-lg font-semibold text-gray-800 mt-4 text-center">
              No notifications yet
            </Text>
            <Text className="text-sm text-gray-600 mt-2 text-center leading-5">
              You'll see notifications about events and groups here
            </Text>
          </View>
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={notifications.length === 0 ? { flexGrow: 1, justifyContent: 'center' } : null}
      />
    </View>
  );
}

// Added styles for guest UI
const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  guestContainer: {
    padding: 20,
    paddingBottom: 40,
    alignItems: 'center',
    backgroundColor: 'white',
  },
  GuestImageWrapper: {
    marginBottom: 10,
    position: 'relative',
    alignSelf: 'center',
  },
  profileImage: {
    width: 150,
    height: 150,
    borderRadius: 75,
  },
  name: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 20,
  },
  infoContainer: {
    width: '100%',
    marginBottom: 15,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: 'green',
    marginBottom: 5,
  },
  infoText: {
    fontSize: 16,
    color: '#333',
    backgroundColor: '#eaeaea',
    padding: 10,
    borderRadius: 8,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 30,
    width: '100%',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#65DA84',
    paddingVertical: 10,
    width: '45%',
    borderRadius: 25,
  },
  editButtonText: {
    color: '#fff',
    fontSize: 16,
    marginLeft: 10,
    fontWeight: '500',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#333',
    paddingVertical: 10,
    width: '45%',
    borderRadius: 25,
    marginLeft: 10,
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 16,
    marginLeft: 10,
    fontWeight: '500',
  },
});