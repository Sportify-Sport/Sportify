import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Image, ActivityIndicator, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useAuth } from "../context/AuthContext";
import EmailVerificationModal from "../components/modals/EmailVerificationModal";
import styles from "../../styles/LoginStyles";
import googleIcon from "../../assets/images/google.png";
import guestIcon from "../../assets/images/guest-icon-design-vector.jpg";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isPasswordVisible, setPasswordVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showVerificationModal, setShowVerificationModal] = useState(false);

  const router = useRouter();
  const { login, continueAsGuest } = useAuth();

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert("Error", "Please enter both email and password.");
      return;
    }

    // Email validation
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
      Alert.alert("Error", "Please enter a valid email address.");
      return;
    }

    // Password validation
    if (password.length < 8 || password.length > 100) {
      Alert.alert("Error", "Password must be between 8 and 100 characters.");
      return;
    }

    // Attempt login
    setLoading(true);
    const result = await login(email, password);
    setLoading(false);

    if (result.success) {
      if (!result.isEmailVerified) {
        setShowVerificationModal(true);
      } else {
        router.replace("../(tabs)");
      }
    } else {
      const errorMessage = result.message || result.error || "An unknown error occurred.";
      Alert.alert("Login Failed", errorMessage);
    }
  };

  const handleForgotPassword = () => {
    router.push("/screens/ForgotPassword");
  };

  const handleGuestLogin = async () => {
    await continueAsGuest();
    router.replace('../(tabs)');
  };

  const handleSignupNavigation = () => {
    router.push("/screens/Signup");
  };

  const togglePasswordVisibility = () => {
    setPasswordVisible(!isPasswordVisible);
  };

  const handleVerificationComplete = () => {
    setShowVerificationModal(false);
    router.replace('../(tabs)');
  };

  const handleSkipVerification = () => {
    setShowVerificationModal(false);
    router.replace('../(tabs)');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Log in</Text>
      <Text style={styles.underlineTitle}>___________</Text>

      <Text style={styles.label}>Your Email</Text>
      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor="#9ca2adff"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <Text style={styles.label}>Password</Text>
      <View className="relative">
        <TextInput
          style={[styles.input, { paddingRight: 50 }]}
          placeholder="Password"
          placeholderTextColor="#9ca2adff"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!isPasswordVisible}
          autoCapitalize="none"
        />
        <TouchableOpacity
          onPress={togglePasswordVisibility}
          className="absolute right-4 top-0 bottom-0 justify-center items-center"
        >
          <Ionicons
            name={isPasswordVisible ? "eye" : "eye-off"}
            size={24}
            color="gray"
          />
        </TouchableOpacity>
      </View>

      <TouchableOpacity onPress={handleForgotPassword}>
        <Text style={styles.forgotPasswordText}>Forgot password?</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.continueButton, loading && { opacity: 0.5 }]}
        onPress={handleLogin}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text style={styles.continueButtonText}>Continue</Text>
        )}
      </TouchableOpacity>

      <Text style={styles.orText}>_________________ Or _________________</Text>

      <TouchableOpacity style={styles.guestButton} onPress={handleGuestLogin}>
        <Text style={styles.guestButtonText}>Continue as a guest</Text>
        <Image source={guestIcon} style={styles.guestIcon} />
      </TouchableOpacity>

      <View style={styles.signupContainer}>
        <Text style={styles.signupText}>Don't have an account?</Text>
        <TouchableOpacity onPress={handleSignupNavigation}>
          <Text style={styles.signupLink}> Sign up</Text>
        </TouchableOpacity>
      </View>

      <EmailVerificationModal
        visible={showVerificationModal}
        onClose={handleSkipVerification}
        onVerified={handleVerificationComplete}
      />
    </View>
  );
};

export default Login;
