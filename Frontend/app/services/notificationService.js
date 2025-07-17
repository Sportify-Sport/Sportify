import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";
import { Platform, AppState } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import getApiBaseUrl from "../config/apiConfig";
import "react-native-get-random-values";
import { v4 as uuidv4 } from "uuid";

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

class NotificationService {
  constructor() {
    this.token = null;
    this.deviceId = null;
    this.lastTokenUpdate = null;
    this.notificationListener = null;
    this.responseListener = null;
    this.apiUrl = getApiBaseUrl();
    this.isInitialized = false;
    this.tokenRefreshInterval = null;
    this.appStateSubscription = null;
  }

  async getStableDeviceId() {
    try {
      // First, try to get stored device ID
      let storedDeviceId = await AsyncStorage.getItem("stableDeviceId");

      if (storedDeviceId) {
        this.deviceId = storedDeviceId;
        return storedDeviceId;
      }

      // Generate a new stable device ID
      let newDeviceId;

      if (Platform.OS === "ios") {
        // For iOS, use a combination of model and a UUID
        newDeviceId = `ios_${Device.modelId}_${uuidv4()}`;
      } else {
        // For Android, try to use androidId if available
        if (Constants.deviceId) {
          newDeviceId = `android_${Constants.deviceId}`;
        } else {
          newDeviceId = `android_${Device.modelId}_${uuidv4()}`;
        }
      }

      // Store it permanently
      await AsyncStorage.setItem("stableDeviceId", newDeviceId);
      this.deviceId = newDeviceId;

      console.log("📱 Generated stable device ID:", newDeviceId);
      return newDeviceId;
    } catch (error) {
      console.error("❌ Error getting stable device ID:", error);
      // Fallback to a simple UUID
      const fallbackId = `fallback_${uuidv4()}`;
      this.deviceId = fallbackId;
      return fallbackId;
    }
  }

  async initialize() {
    try {
      if (this.isInitialized) {
        return this.token;
      }

      console.log("🔔 Initializing push notifications...");

      // Get stable device ID first
      await this.getStableDeviceId();

      if (!Device.isDevice) {
        console.warn("⚠️ Push notifications only work on physical devices");
        return null;
      }

      // Request permissions
      const { status: existingStatus } =
        await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== "granted") {
        console.error("❌ Push notification permission denied");
        await AsyncStorage.setItem("notificationPermissionDenied", "true");
        return null;
      }

      // Get EAS project ID
      const projectId = Constants.expoConfig?.extra?.eas?.projectId;

      if (!projectId) {
        console.error('❌ EAS Project ID not found. Run "eas build:configure"');
        return null;
      }

      console.log("📱 EAS Project ID:", projectId);

      // Get push token
      try {
        const tokenData = await Notifications.getExpoPushTokenAsync({
          projectId: projectId,
        });

        this.token = tokenData.data;
        this.lastTokenUpdate = new Date().toISOString();
        this.isInitialized = true;

        // Store token locally
        await this.storeTokenLocally(this.token);

        // Setup listeners
        this.setupNotificationListeners();

        // Setup automatic token refresh
        this.setupTokenRefresh();

        console.log("✅ Push notifications initialized");
        console.log("📱 Token:", this.token);
        console.log("📱 Device ID:", this.deviceId);

        return this.token;
      } catch (error) {
        console.error("❌ Failed to get push token:", error);
        console.error(
          "💡 Make sure you're using EAS Development Build, not Expo Go"
        );
        return null;
      }
    } catch (error) {
      console.error("❌ Error initializing notifications:", error);
      return null;
    }
  }

  async registerTokenWithServer(token, authToken) {
    try {
      if (!token || !authToken) {
        console.warn("⚠️ Missing token or auth token");
        return false;
      }

      if (!this.deviceId) {
        await this.getStableDeviceId();
      }

      // Validate token format
      if (!token.startsWith("ExponentPushToken[") || !token.endsWith("]")) {
        console.warn("⚠️ Invalid Expo push token format");
        return false;
      }

      const deviceInfo = {
        pushToken: token,
        deviceId: this.deviceId,
        platform: Platform.OS,
      };

      console.log("📤 Registering push token with server...");

      const response = await fetch(
        `${this.apiUrl}/api/notification/register-token`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify(deviceInfo),
        }
      );

      const result = await response.json();

      if (result.success) {
        console.log("✅ Push token registered successfully");
        await AsyncStorage.setItem(
          "lastTokenRegistration",
          new Date().toISOString()
        );
        return true;
      } else {
        console.error("❌ Failed to register push token:", result.message);
        return false;
      }
    } catch (error) {
      console.error("❌ Error registering push token:", error);
      return false;
    }
  }

  async updateTokenIfNeeded(authToken) {
    try {
      if (!authToken || !this.isInitialized) return null;

      if (!this.deviceId) {
        await this.getStableDeviceId();
      }

      const lastRegistration = await AsyncStorage.getItem(
        "lastTokenRegistration"
      );
      const lastStoredToken = await AsyncStorage.getItem("pushToken");

      // Check if we need to update
      const shouldUpdate = this.shouldRefreshToken(
        lastRegistration,
        lastStoredToken
      );

      if (shouldUpdate) {
        console.log("🔄 Checking if token needs update...");

        const projectId = Constants.expoConfig?.extra?.eas?.projectId;

        try {
          const currentTokenData = await Notifications.getExpoPushTokenAsync({
            projectId: projectId,
          });
          const currentToken = currentTokenData?.data;

          if (currentToken && currentToken !== this.token) {
            // Token changed
            console.log("🔄 Token has changed, updating...");
            this.token = currentToken;
            await this.storeTokenLocally(currentToken);

            // Use update endpoint
            await this.updateTokenOnServer(currentToken, authToken);
          } else if (!lastRegistration) {
            // First time registration
            console.log("📤 First time token registration...");
            await this.registerTokenWithServer(this.token, authToken);
          } else {
            // Just update the last used time on server
            console.log("✅ Token unchanged, updating last used time...");
            await this.updateTokenOnServer(this.token, authToken);
          }
        } catch (error) {
          console.warn("⚠️ Failed to refresh token:", error);
        }
      }

      return this.token;
    } catch (error) {
      console.error("❌ Error updating token:", error);
      return null;
    }
  }

  async updateTokenOnServer(token, authToken) {
    try {
      if (!token || !authToken) {
        return false;
      }

      if (!this.deviceId) {
        await this.getStableDeviceId();
      }

      const deviceInfo = {
        pushToken: token,
        deviceId: this.deviceId,
        platform: Platform.OS,
      };

      console.log("📤 Updating push token on server...");

      const response = await fetch(
        `${this.apiUrl}/api/notification/update-push-token`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify(deviceInfo),
        }
      );

      const result = await response.json();

      if (result.success) {
        console.log("✅ Push token updated successfully");
        await AsyncStorage.setItem(
          "lastTokenRegistration",
          new Date().toISOString()
        );
        return true;
      } else {
        console.error("❌ Failed to update push token:", result.message);
        return false;
      }
    } catch (error) {
      console.error("❌ Error updating push token:", error);
      return false;
    }
  }

  shouldRefreshToken(lastRegistration, lastStoredToken) {
    if (!lastRegistration) return true;
    if (lastStoredToken !== this.token) return true;

    // Refresh every 12 hours
    const hoursSinceLastRegistration =
      (new Date() - new Date(lastRegistration)) / (1000 * 60 * 60);
    return hoursSinceLastRegistration > 12;
  }

  setupTokenRefresh() {
    // Listen for app state changes
    this.appStateSubscription = AppState.addEventListener(
      "change",
      async (nextAppState) => {
        if (nextAppState === "active") {
          // App came to foreground - check token
          const authToken = await AsyncStorage.getItem("token");
          if (authToken) {
            await this.updateTokenIfNeeded(authToken);
          }
        }
      }
    );

    // Also check periodically (every hour)
    this.tokenRefreshInterval = setInterval(async () => {
      const authToken = await AsyncStorage.getItem("token");
      if (authToken) {
        await this.updateTokenIfNeeded(authToken);
      }
    }, 60 * 60 * 1000); // 1 hour
  }

  setupNotificationListeners() {
    // Notification received while app is in foreground
    this.notificationListener = Notifications.addNotificationReceivedListener(
      (notification) => {
        console.log("📬 Notification received:", notification);

        // You can handle in-app notifications here
        // For example, show a custom alert or update UI
      }
    );

    // User interacted with notification
    this.responseListener =
      Notifications.addNotificationResponseReceivedListener((response) => {
        console.log("👆 Notification tapped:", response);

        const data = response.notification.request.content.data;
        this.handleNotificationTap(data);
      });
  }

  handleNotificationTap(data) {
    console.log("🔗 Handling notification tap:", data);

    // Handle navigation based on notification type
    // You'll need to import your navigation method here
    switch (data.type) {
      case "admin_message":
        if (data.eventId) {
          // Navigate to event
          console.log("Navigate to event:", data.eventId);
          // navigation.navigate('EventDetails', { eventId: data.eventId });
        } else if (data.groupId) {
          // Navigate to group
          console.log("Navigate to group:", data.groupId);
          // navigation.navigate('GroupDetails', { groupId: data.groupId });
        }
        break;

      case "event_created":
      case "event_admin_assigned":
        console.log("Navigate to event:", data.eventId);
        break;

      case "group_created":
      case "group_admin_assigned":
        console.log("Navigate to group:", data.groupId);
        break;

      case "join_request_response":
        if (data.approved) {
          console.log("Join request approved");
        } else {
          console.log("Join request rejected");
        }
        break;

      default:
        console.log("Unknown notification type:", data.type);
    }
  }

  async storeTokenLocally(token) {
    try {
      await AsyncStorage.setItem("pushToken", token);
      await AsyncStorage.setItem("lastTokenUpdate", new Date().toISOString());
    } catch (error) {
      console.error("❌ Error storing token locally:", error);
    }
  }

  async getStoredToken() {
    try {
      return await AsyncStorage.getItem("pushToken");
    } catch (error) {
      console.error("Error getting stored token:", error);
      return null;
    }
  }

  async sendAdminNotification(
    message,
    eventId = null,
    groupId = null,
    recipients = "all",
    authToken
  ) {
    try {
      const response = await fetch(
        `${this.apiUrl}/api/notification/send-admin-notification`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({
            message,
            eventId,
            groupId,
            recipients,
          }),
        }
      );

      const result = await response.json();
      return result;
    } catch (error) {
      console.error("Error sending admin notification:", error);
      return { success: false, message: "Network error" };
    }
  }

  async getNotificationHistory(authToken, pageNumber = 1, pageSize = 20) {
    try {
      const response = await fetch(
        `${this.apiUrl}/api/notification/history?pageNumber=${pageNumber}&pageSize=${pageSize}`,
        {
          headers: {
            'Authorization': `Bearer ${authToken}`,
          },
        }
      );

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error getting notification history:', error);
      return { success: false, notifications: [] };
    }
  }

  async deleteNotification(notificationId, authToken) {
    try {
      const response = await fetch(`${this.apiUrl}/api/notification/${notificationId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error deleting notification:', error);
      return { success: false };
    }
  }

  async markNotificationAsRead(notificationId, authToken) {
    try {
      const response = await fetch(
        `${this.apiUrl}/api/notification/mark-read/${notificationId}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      const result = await response.json();
      return result;
    } catch (error) {
      console.error("Error marking notification as read:", error);
      return { success: false };
    }
  }

  cleanup() {
    if (this.notificationListener) {
      Notifications.removeNotificationSubscription(this.notificationListener);
    }
    if (this.responseListener) {
      Notifications.removeNotificationSubscription(this.responseListener);
    }
    if (this.tokenRefreshInterval) {
      clearInterval(this.tokenRefreshInterval);
    }
    if (this.appStateSubscription) {
      this.appStateSubscription.remove();
    }
  }
}

export default new NotificationService();
