import React, { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage"; // Import AsyncStorage
import jwtDecode from "jwt-decode";

const AuthContext = createContext();

const checkTokenValidity = (token) => {
  try {
    const decodedToken = jwtDecode(token);
    const currentTime = Date.now() / 1000;
    return decodedToken.exp > currentTime;
  } catch (error) {
    return false;
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null); // User info
  const [token, setToken] = useState(null); // Auth token
  const navigation = useNavigation();

  useEffect(() => {
    const loadSession = async () => {
      const storedToken = await AsyncStorage.getItem("token");
      const storedUser = await AsyncStorage.getItem("user");

      if (storedToken && storedUser) {
        if (checkTokenValidity(storedToken)) {
          setUser(JSON.parse(storedUser)); 
          setToken(storedToken); 
        } else {
          // Token expired, Guest
          setUser(null);
          setToken(null);
          AsyncStorage.removeItem("token");
          AsyncStorage.removeItem("user");
        }
      } else {
        // Guest
        setUser(null);
        setToken(null);
      }
    };

    loadSession();
  }, []);

  const login = (newUser, newToken) => {
    setUser(newUser);
    setToken(newToken);
    AsyncStorage.setItem("token", newToken);
    AsyncStorage.setItem("user", JSON.stringify(newUser));
  };

  const logout = async () => {
    setUser(null);
    setToken(null);
    await AsyncStorage.removeItem("token");
    await AsyncStorage.removeItem("user");
  };

  const value = { user, token, login, logout };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
