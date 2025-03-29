import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
// import AsyncStorage from '@react-native-async-storage/async-storage';
import styles from "../../styles/LoginStyles";
import googleIcon from "../../assets/images/google.png";
import getApiBaseUrl from "../config/apiConfig";
import jwtDecode from "jwt-decode";
import { useAuth } from "../context/AuthContext"
const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isPasswordVisible, setPasswordVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const router = useRouter();
  const { login } = useAuth();

  const handleLogin = async () => {
    // Reset any previous error message
    setErrorMessage("");

    if (!email.trim() || !password.trim()) {
      setErrorMessage("Please enter both email and password.");
      return;
    }

    try {
      const apiUrl = getApiBaseUrl();
      const response = await fetch(`${apiUrl}/api/Auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      if (response.status === 200) {
        const data = await response.json();
        const token = data.token;
        console.log(data)
        // try {
        //   const decodedToken = jwtDecode(token);
        // } catch (error) {
        //   console.log("error");
        // }

        // const roleValue =
        //   decodedToken[
        //     "http://schemas.microsoft.com/ws/2008/06/identity/claims/role"
        //   ];

        const userData = {
          // id: decodedToken[
          //   "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"
          // ],
          // email: decodedToken.email,
          // name: decodedToken.name,
          // role: roleValue,
          // roles: Array.isArray(roleValue) ? roleValue : [roleValue],
          permissions: data.permissions,
        };

        login(userData, token);
        // await AsyncStorage.setItem('token', data.token);
        // Navigate to the index page inside your tabs folder
        //router.push('../(tabs)');
      } else {
        // If the response is not 200, get the error message
        const errorData = await response.json();
        setErrorMessage("Login failed");
      }
    } catch (error) {
      console.log(error)
      setErrorMessage("Login failed");
    }
  };

  const handleForgotPassword = () => {
    console.log("Forgot password pressed");
  };

  const handleGoogleLogin = () => {
    console.log("Login with Google pressed");
  };

  const handleSignupNavigation = () => {
    console.log("Navigate to Sign Up");
    router.push("/screens/Signup");
  };

  const togglePasswordVisibility = () => {
    setPasswordVisible(!isPasswordVisible);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Log in</Text>
      <Text style={styles.underlineTitle}>___________</Text>

      {errorMessage ? (
        <Text style={styles.errorText}>{errorMessage}</Text>
      ) : null}

      <Text style={styles.label}>Your Email</Text>
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
      />

      <Text style={styles.label}>Password</Text>
      <View style={styles.passwordContainer}>
        <TextInput
          style={[styles.input, { flex: 1 }]}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!isPasswordVisible}
        />
        <TouchableOpacity onPress={togglePasswordVisibility}>
          <Ionicons
            name={isPasswordVisible ? "eye" : "eye-off"}
            size={24}
            color="gray"
            style={styles.eyeIcon}
          />
        </TouchableOpacity>
      </View>

      <TouchableOpacity onPress={handleForgotPassword}>
        <Text style={styles.forgotPasswordText}>Forgot password?</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.continueButton} onPress={handleLogin}>
        <Text style={styles.continueButtonText}>Continue</Text>
      </TouchableOpacity>

      <Text style={styles.orText}>_________________ Or _________________</Text>

      <TouchableOpacity style={styles.googleButton} onPress={handleGoogleLogin}>
        <Image source={googleIcon} style={styles.googleIcon} />
        <Text style={styles.googleButtonText}>Login with Google</Text>
      </TouchableOpacity>

      <View style={styles.signupContainer}>
        <Text style={styles.signupText}>Don’t have an account?</Text>
        <TouchableOpacity onPress={handleSignupNavigation}>
          <Text style={styles.signupLink}> Sign up</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default Login;
