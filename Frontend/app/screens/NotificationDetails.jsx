import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";

function formatDate(dateString) {
  if (!dateString || isNaN(new Date(dateString).getTime())) {
    return "Not read yet";
  }
  const date = new Date(dateString);
  const now = new Date();
  const diff = now - date;
  const oneDay = 24 * 60 * 60 * 1000;
  const time = date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  if (diff < oneDay && now.getDate() === date.getDate()) {
    return `Today at ${time}`;
  }

  const yesterday = new Date(now - oneDay);
  if (
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getYear() === yesterday.getYear()
  ) {
    return `Yesterday at ${time}`;
  }

  return `${date.toLocaleDateString()} at ${time}`;
}

function getNotificationIcon(type) {
  switch (type) {
    case "admin_message":
      return "megaphone";
    case "event_created":
      return "calendar";
    case "event_deleted":
      return "calendar-outline";
    case "event_admin_assigned":
      return "shield-checkmark";
    case "group_created":
      return "people";
    case "group_deleted":
      return "people-outline";
    case "group_admin_assigned":
      return "shield-checkmark";
    case "join_request_response":
      return "checkmark-circle";
    case "join_request_approved":
      return "checkmark-circle";
    case "group_join_approved":
      return "checkmark-circle";
    case "group_join_rejected":
      return "close-circle";
    case "removed_from_event":
      return "exit";
    case "removed_from_group":
      return "exit";
    default:
      return "notifications";
  }
}

function getNotificationColor(type) {
  switch (type) {
    case "admin_message":
      return "#FF6B6B";
    case "event_created":
      return "#4ECDC4";
    case "event_deleted":
      return "#E74C3C";
    case "group_created":
      return "#45B7D1";
    case "group_deleted":
      return "#E74C3C";
    case "join_request_response":
      return "#96CEB4";
    case "join_request_approved":
      return "#96CEB4";
    case "group_join_approved":
      return "#96CEB4";
    case "group_join_rejected":
      return "#FF6B6B";
    case "removed_from_event":
      return "#E74C3C";
    case "removed_from_group":
      return "#E74C3C";
    default:
      return "#BDC3C7";
  }
}

export default function NotificationDetails() {
  const router = useRouter();
  const { notification: rawNotification } = useLocalSearchParams();
  const { token, NotificationService, setUnreadCount } = useAuth();
  const notification = JSON.parse(rawNotification || "{}");
  const {
    notificationId,
    title,
    body,
    sentAt,
    readAt: initialReadAt,
    notificationData,
    notificationType,
    isRead,
  } = notification;
  const [readAt, setReadAt] = useState(initialReadAt);

  useEffect(() => {
    const markAsReadOnFirstView = async () => {
      if (!isRead && token && !readAt) {
        try {
          const result = await NotificationService.markNotificationAsRead(
            notificationId,
            token
          );
          if (result.success) {
            setReadAt(new Date().toISOString());
            setUnreadCount((prev) => Math.max(0, prev - 1));
          }
        } catch (error) {
          console.error("Error marking notification as read:", error);
          Alert.alert("Error", "Failed to mark notification as read");
        }
      }
    };
    markAsReadOnFirstView();
  }, [isRead, token, readAt, notificationId]);

  const markAsRead = async () => {
    if (!isRead && token && !readAt) {
      try {
        const result = await NotificationService.markNotificationAsRead(
          notificationId,
          token
        );
        if (result.success) {
          setReadAt(new Date().toISOString());
          setUnreadCount((prev) => Math.max(0, prev - 1));
        } else {
          Alert.alert("Error", "Failed to mark notification as read");
        }
      } catch (error) {
        console.error("Error marking notification as read:", error);
        Alert.alert("Error", "Failed to mark notification as read");
      }
    }
  };

  let data = {};
  let type = notificationType;
  try {
    if (notificationData) {
      data = JSON.parse(notificationData);
      if (!type && data.type) {
        type = data.type;
      }
    }
  } catch { }

  const removalTypes = [
    "removed_from_event",
    "removed_from_group",
    "event_deleted",
    "group_deleted",
  ];
  const showButton = !removalTypes.includes(type);

  // Check existence of groupId and eventId
  const hasGroup = !!data.groupId;
  const hasEvent = !!data.eventId;

  // Handlers for buttons
  const handleGoToGroup = () => {
    if (!data.groupId) {
      Alert.alert("Error", "Missing Group ID");
      return;
    }
    router.push({
      pathname: "./GroupDetails",
      params: { groupId: data.groupId },
    });
  };

  const handleGoToEvent = () => {
    if (!data.eventId) {
      Alert.alert("Error", "Missing Event ID");
      return;
    }
    router.push({
      pathname: "./EventDetails",
      params: { eventId: data.eventId },
    });
  };

  const handleBackPress = async () => {
    await markAsRead(); // Mark as read when pressing back
    router.back();
  };

  const icon = getNotificationIcon(type);
  const color = getNotificationColor(type);

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
        <Ionicons name="arrow-back" size={28} color="#3CCF4E" />
        <Text style={styles.backText}>Back</Text>
      </TouchableOpacity>

      <View style={styles.iconRow}>
        <Ionicons name={icon} size={32} color={color} style={styles.icon} />
        <Text style={styles.title}>{title}</Text>
      </View>

      <View style={styles.messageBox}>
        {type === "admin_message" && (
          <Text style={styles.adminLabel}>Message from Admin:</Text>
        )}
        <Text style={styles.body}>{body}</Text>
      </View>

      <View style={styles.dates}>
        <Text style={styles.dateText}>Sent: {formatDate(sentAt)}</Text>
        <Text style={styles.dateText}>Read: {formatDate(readAt)}</Text>
      </View>

      {showButton && (
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          {hasGroup && (
            <TouchableOpacity
              style={[styles.goButton, { flex: 1 }]}
              onPress={handleGoToGroup}
            >
              <Text style={styles.goButtonText}>Go to Group</Text>
            </TouchableOpacity>
          )}

          {hasEvent && (
            <TouchableOpacity
              style={[styles.goButton, { flex: 1 }]}
              onPress={handleGoToEvent}
            >
              <Text style={styles.goButtonText}>Go to Event</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#fff",
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  backText: {
    marginLeft: 8,
    fontSize: 18,
    color: "#3CCF4E",
    fontWeight: "500",
  },
  iconRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  icon: {
    marginRight: 10,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#000",
  },
  messageBox: {
    backgroundColor: "#F8F9FF",
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  adminLabel: {
    fontSize: 14,
    color: "#000",
    fontWeight: "600",
    marginBottom: 8,
  },
  body: {
    fontSize: 16,
    color: "#555",
    lineHeight: 22,
  },
  dates: {
    marginBottom: 30,
  },
  dateText: {
    fontSize: 14,
    color: "#999",
    marginBottom: 4,
  },
  goButton: {
    backgroundColor: "#3CCF4E",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  goButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
