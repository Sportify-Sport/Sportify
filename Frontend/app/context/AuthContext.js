import React, { createContext, useState, useEffect, useContext } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { AppState } from "react-native";
import getApiBaseUrl from "../config/apiConfig";
import NotificationService from "../services/notificationService";

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [token, setToken] = useState(null);
  const [isGuest, setIsGuest] = useState(false);
  const router = useRouter();
  const apiUrl = getApiBaseUrl();

  useEffect(() => {
    checkAuthState();

    // Handle app state changes for notification token refresh
    const subscription = AppState.addEventListener(
      "change",
      handleAppStateChange
    );

    return () => {
      subscription?.remove();
      NotificationService.cleanup();
    };
  }, []);

  useEffect(() => {
    // Initialize notifications when user is authenticated and verified
    if (isAuthenticated && token && isEmailVerified) {
      initializeNotifications();
    }
  }, [isAuthenticated, token, isEmailVerified]);

  const handleAppStateChange = async (nextAppState) => {
    if (nextAppState === "active" && token && isAuthenticated) {
      // App came to foreground - update notification token
      await NotificationService.updateTokenIfNeeded(token);
    }
  };

  const initializeNotifications = async () => {
    try {
      console.log("🔔 Initializing notifications for user...");

      const pushToken = await NotificationService.initialize();
      if (pushToken && token) {
        const registered = await NotificationService.registerTokenWithServer(
          pushToken,
          token
        );

        if (registered) {
          console.log("✅ Notifications configured successfully");
        } else {
          console.warn("⚠️ Failed to register token with server");
        }
      }
    } catch (error) {
      console.error("❌ Error initializing notifications:", error);
    }
  };

  const checkAuthState = async () => {
    try {
      const storedToken = await AsyncStorage.getItem("token");
      const guestMode = await AsyncStorage.getItem("guestMode");

      if (guestMode === "true") {
        setIsGuest(true);
        setIsLoading(false);
        return;
      }

      if (storedToken) {
        // Decode JWT token to get user info
        const tokenParts = storedToken.split(".");
        if (tokenParts.length === 3) {
          const payload = JSON.parse(atob(tokenParts[1]));
          const currentTime = Date.now() / 1000;

          if (payload.exp < currentTime) {
            // Token expired, try to refresh
            const refreshToken = await AsyncStorage.getItem("refreshToken");
            if (refreshToken) {
              await refreshAccessToken(refreshToken);
            } else {
              await logout();
            }
          } else {
            setToken(storedToken);
            setUser({
              id: payload[
                "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"
              ],
              email: payload.email,
              name: payload.name,
              isEmailVerified: payload.IsEmailVerified === "true",
            });
            setIsEmailVerified(payload.IsEmailVerified === "true");
            setIsAuthenticated(true);
          }
        }
      }
    } catch (error) {
      console.error("Error checking auth state:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const response = await fetch(`${apiUrl}/api/Auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        const data = await response.json();
        await AsyncStorage.setItem("token", data.accessToken);
        await AsyncStorage.setItem("refreshToken", data.refreshToken);
        await AsyncStorage.removeItem("guestMode");

        // Decode token to get user info
        const tokenParts = data.accessToken.split(".");
        if (tokenParts.length === 3) {
          const payload = JSON.parse(atob(tokenParts[1]));
          const userData = {
            id: payload[
              "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"
            ],
            email: payload.email,
            name: payload.name,
            isEmailVerified: payload.IsEmailVerified === "true",
          };

          setUser(userData);
          setIsEmailVerified(userData.isEmailVerified);
          setIsAuthenticated(true);
          setIsGuest(false);
          setToken(data.accessToken);

          // Initialize notifications after successful login
          if (userData.isEmailVerified) {
            await initializeNotifications();
          }

          return { success: true, isEmailVerified: userData.isEmailVerified };
        }
      } else {
        const errorData = await response.json();
        return { success: false, error: errorData.message || "Login failed" };
      }
    } catch (error) {
      return { success: false, error: "Network error. Please try again." };
    }
  };

  const register = async (userData) => {
    try {
      const response = await fetch(`${apiUrl}/api/Auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      });

      if (response.ok) {
        const data = await response.json();
        await AsyncStorage.setItem("token", data.accessToken);
        await AsyncStorage.setItem("refreshToken", data.refreshToken);
        await AsyncStorage.removeItem("guestMode");

        // Decode token
        const tokenParts = data.accessToken.split(".");
        if (tokenParts.length === 3) {
          const payload = JSON.parse(atob(tokenParts[1]));
          const userInfo = {
            id: payload[
              "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"
            ],
            email: payload.email,
            name: payload.name,
            isEmailVerified: false,
          };

          setUser(userInfo);
          setIsEmailVerified(false);
          setIsAuthenticated(true);
          setIsGuest(false);
          setToken(data.accessToken);

          return { success: true };
        }
      } else {
        const errorData = await response.json();
        return {
          success: false,
          error: errorData.message || "Registration failed",
        };
      }
    } catch (error) {
      return { success: false, error: "Network error. Please try again." };
    }
  };

  const verifyEmail = async (code) => {
    try {
      const response = await fetch(`${apiUrl}/api/Auth/verify-email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ code }),
      });

      if (response.ok) {
        const data = await response.json();
        await AsyncStorage.setItem("token", data.tokens.accessToken);
        await AsyncStorage.setItem("refreshToken", data.tokens.refreshToken);

        setToken(data.tokens.accessToken);
        setIsEmailVerified(true);
        setUser((prev) => ({ ...prev, isEmailVerified: true }));

        // Initialize notifications after email verification
        await initializeNotifications();

        return { success: true };
      } else {
        const errorData = await response.json();
        return {
          success: false,
          error: errorData.message || "Invalid or expired code",
        };
      }
    } catch (error) {
      return { success: false, error: "Network error. Please try again." };
    }
  };

  const resendVerification = async () => {
    try {
      const response = await fetch(`${apiUrl}/api/Auth/resend-verification`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        return { success: true };
      } else {
        return { success: false, error: "Failed to resend verification" };
      }
    } catch (error) {
      return { success: false, error: "Network error" };
    }
  };

  const refreshAccessToken = async (refreshToken) => {
    try {
      const response = await fetch(`${apiUrl}/api/Auth/refresh-token`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ refreshToken }),
      });

      if (response.ok) {
        const data = await response.json();
        await AsyncStorage.setItem("token", data.accessToken);
        await AsyncStorage.setItem("refreshToken", data.refreshToken);

        setToken(data.accessToken);

        // Update user info from new token
        const tokenParts = data.accessToken.split(".");
        if (tokenParts.length === 3) {
          const payload = JSON.parse(atob(tokenParts[1]));
          setUser({
            id: payload[
              "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"
            ],
            email: payload.email,
            name: payload.name,
            isEmailVerified: payload.IsEmailVerified === "true",
          });
          setIsEmailVerified(payload.IsEmailVerified === "true");
        }

        return true;
      }
      return false;
    } catch (error) {
      console.error("Error refreshing token:", error);
      return false;
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem("token");
      await AsyncStorage.removeItem("refreshToken");
      await AsyncStorage.removeItem("guestMode");
      setUser(null);
      setIsAuthenticated(false);
      setIsEmailVerified(false);
      setIsGuest(false);
      setToken(null);

      // Cleanup notifications
      NotificationService.cleanup();

      // Clear notification-related storage
      await AsyncStorage.removeItem("pushToken");
      await AsyncStorage.removeItem("lastTokenRegistration");
      await AsyncStorage.removeItem("lastTokenUpdate");
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  const continueAsGuest = async () => {
    try {
      await AsyncStorage.setItem("guestMode", "true");
      await AsyncStorage.removeItem("token");
      await AsyncStorage.removeItem("refreshToken");
      setIsGuest(true);
      setIsAuthenticated(false);
      setUser(null);
      setIsEmailVerified(false);
      setToken(null);
    } catch (error) {
      console.error("Error setting guest mode:", error);
    }
  };

  const value = {
    user,
    isLoading,
    isAuthenticated,
    isEmailVerified,
    isGuest,
    token,
    login,
    register,
    logout,
    verifyEmail,
    resendVerification,
    continueAsGuest,
    NotificationService
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default {};

