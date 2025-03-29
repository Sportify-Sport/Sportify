// import AsyncStorage from "@react-native-async-storage/async-storage";
import { checkTokenValidity } from "../utils/authUtils";
import { Alert } from "react-native";
import { useAuth } from "../context/AuthContext";
import * as SecureStore from 'expo-secure-store';

export default useApi = () => {
  const { logout } = useAuth();

  const apiFetch = async (url, options = {}) => {
    // const token = await AsyncStorage.getItem("token");
    const token = await SecureStore.getItemAsync("token");

    // If the token doesn't exist or expired log the user out and stop the API call
    if (!token || !checkTokenValidity(token)) {
      logout();
      return null;
    }

    const headers = {
      ...options.headers,
      Authorization: `Bearer ${token}`,
    };

    try {
      const response = await fetch(url, { ...options, headers });

      // Unauthorized
      if (response.status === 401) {
        logout();
        return null;
      }

      // Forbidden
      if (response.status === 403) {
        Alert.alert(
          "Unauthorized",
          "You are not allowed to perform this action."
        );
        return null;
      }

      return response;
    } catch (error) {
      throw error;
    }
  };

  return { apiFetch };
};


// const { apiFetch } = useApi();
// apiFetch(url, options);