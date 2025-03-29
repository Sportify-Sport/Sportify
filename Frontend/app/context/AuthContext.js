import React, { createContext, useContext, useState, useEffect } from "react";
// import AsyncStorage from "@react-native-async-storage/async-storage";
import checkTokenValidity from "../utils/authUtils";
import { Alert, Platform } from "react-native";
import * as SecureStore from "expo-secure-store";
import { useRouter } from "expo-router";

// Cross-platform storage
const Storage = {
  async getItem(key) {
    if (Platform.OS === "web") {
      return localStorage.getItem(key);
    } else {
      return await SecureStore.getItemAsync(key);
    }
  },

  async setItem(key, value) {
    if (Platform.OS === "web") {
      localStorage.setItem(key, value);
      return;
    } else {
      return await SecureStore.setItemAsync(key, value);
    }
  },

  async removeItem(key) {
    if (Platform.OS === "web") {
      localStorage.removeItem(key);
      return;
    } else {
      return await SecureStore.deleteItemAsync(key);
    }
  },
};

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null); // User info
  const [token, setToken] = useState(null); // Auth token
  const [logoutAlertShown, setLogoutAlertShown] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const loadSession = async () => {
      try {
        // const storedToken = await AsyncStorage.getItem("token");
        // const storedUser = await AsyncStorage.getItem("user");
        // const storedToken = await SecureStore.getItemAsync("token");
        // const storedUser = await SecureStore.getItemAsync("user");
        const storedToken = await Storage.getItem("token");
        const storedUser = await Storage.getItem("user");

        if (storedToken && storedUser) {
          // if (checkTokenValidity(storedToken)) {
          //   setUser(JSON.parse(storedUser));
          //   setToken(storedToken);
          //   setLogoutAlertShown(false);
          //   console.log(storedToken);
          //   console.log(storedUser);
          //   router.replace("../(tabs)");
          // } else {
          //   // Token expired, Guest
          //   logout();
          // }
          setUser(JSON.parse(storedUser));
          setToken(storedToken);
          setLogoutAlertShown(false);
          router.replace("../(tabs)");
        } else {
          // Guest
          setUser(null);
          setToken(null);
        }
      } catch (error) {
        console.log(error);
      }
    };

    loadSession();
  }, []);

  const login = (newUser, newToken) => {
    setUser(newUser);
    setToken(newToken);
    // AsyncStorage.setItem("token", newToken);
    // AsyncStorage.setItem("user", JSON.stringify(newUser));
    // SecureStore.setItemAsync("token", newToken);
    // SecureStore.setItemAsync("user", JSON.stringify(newUser));
    Storage.setItem("token", newToken);
    Storage.setItem("user", JSON.stringify(newUser));
    setLogoutAlertShown(false);
    router.replace("../(tabs)");
  };

  const logout = async () => {
    setUser(null);
    setToken(null);
    // await AsyncStorage.removeItem("token");
    // await AsyncStorage.removeItem("user");
    // await SecureStore.deleteItemAsync("token");
    // await SecureStore.deleteItemAsync("user");
    await Storage.removeItem("token");
    await Storage.removeItem("user");

    if (!logoutAlertShown) {
      setLogoutAlertShown(true);
      // Only show Alert on native platforms, not on web
      if (Platform.OS !== "web") {
        Alert.alert(
          "Session Expired",
          "Your session has expired. Please log in again."
        );
      } else {
        console.log("Session Expired. Please log in again.");
      }
    }
  };

  const value = { user, token, login, logout };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
